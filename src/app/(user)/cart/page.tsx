"use client";
import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiMinus, FiPlus, FiTrash2, FiMapPin, FiSend, FiFile } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  clearCart,
  removeFromCart,
  updateCartItems,
  updateQuantity,
} from "@/redux/slices/cartSlice";
import { getUserAddressByUserId } from "@/services/user";
import { placeOrder } from "@/services/order";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useModal } from "@/hooks/useModal";
import GlobalAuthModal from "@/components/auth/GlobalAuthModal";
import { RootState } from "@/redux/store";
import { CartItem } from "@/types/cart";
import { resetPatient } from "@/redux/slices/patientSlice";
import { useRole } from "@/hooks/useRole";
import { getAllProduct } from "@/services/productService";
import { resetRefetch, selectShouldRefetch } from "@/redux/slices/refetchSlice";
import { t } from "@/utils/translate";

const CartPage = () => {
  const [isClient, setIsClient] = useState(false); // Initialize as false for SSR
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItems: CartItem[] = useSelector(
    (state: RootState) => state.cart.items as CartItem[]
  );
  const { isDoctor, isUser } = useRole();
  const [userData, setUserData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalItemWeight, setTotalItemWeight] = useState(0);
  const { activeModal, openModal, closeModal } = useModal();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const shouldRefetch = useSelector(selectShouldRefetch);
  const session = useSession();
  const user = session?.data;
  const patientData = useSelector(
    (state: RootState) => state.patient.PatientData
  );
  const [loading, setLoading] = useState(false);
  const [productAvailability, setProductAvailability] = useState<{
    [key: string]: { inStock: boolean; availableQuantity: number };
  }>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [cartItemIds, setCartItemIds] = useState<string[]>([]);

  const hasPrescriptionItems = cartItems.some(
    (item: CartItem) => item.requiresPrescription
  );

  useEffect(() => {
    setIsClient(true); // Set to true after component mounts
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error(t("please_upload_an_image_file"));
        e.target.value = "";
        return;
      }

      setPrescriptionFile(file);
      setFileName(file.name);
    },
    []
  );

  const fetchUserData = useCallback(async () => {
    if (user) {
      try {
        const res = await getUserAddressByUserId();
        setUserData(res?.data?.user);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error(t("failed_to_load_user_data"));
      }
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (shouldRefetch) {
      fetchUserData();
      dispatch(resetRefetch());
    }
  }, [shouldRefetch, fetchUserData]);

  const increaseQuantity = useCallback(
    (id: string) => {
      const item = cartItems.find((item: CartItem) => item.id === id);
      if (item) {
        const newQuantity = item.quantity + 1;
        dispatch(
          updateQuantity({ id, quantity: newQuantity, weight: item.weight })
        );
      }
    },
    [cartItems, dispatch]
  );

  const decreaseQuantity = useCallback(
    (id: string) => {
      const item = cartItems.find((item: CartItem) => item.id === id);
      if (item && item.quantity > 1) {
        const newQuantity = item.quantity - 1;
        dispatch(
          updateQuantity({ id, quantity: newQuantity, weight: item.weight })
        );
      }
    },
    [cartItems, dispatch]
  );

  const handleRemoveFromCart = useCallback(
    (id: string) => {
      dispatch(removeFromCart(id));
    },
    [dispatch]
  );

  const calculateDeliveryCost = useCallback(
    (province?: string, totalWeight?: number): number | string => {
      const isHavana = province?.toLowerCase() === "la habana";
      const baseCost = isHavana ? 5 : 7;
      const weight = totalWeight ?? 0;

      if (weight <= 5) {
        return baseCost;
      }

      const extraWeight = weight - 5;
      const extraCost = extraWeight * 2;
      const totalCost = baseCost + extraCost;

      return Number.isInteger(totalCost) ? totalCost : totalCost.toFixed(2); // returns a string like "13.50"
    },
    []
  );

  const handlePlaceOrder = useCallback(async () => {
    if (!user) {
      toast.error(t("please_login_first"));
      return;
    }

    // Check for out of stock items
    const outOfStockItems = cartItems.filter((item) => {
      const availability = productAvailability[item.id];
      // Consider items out of stock if we don't have availability info or they're explicitly out of stock
      return !availability || availability.inStock === false;
    });

    if (outOfStockItems.length > 0) {
      toast.error(t("cannot_place_order_some_items_are_out_of_stock"));
      return;
    }

    setLoading(true);

    // Role-based validation
    if (user?.user?.role === "DOCTOR") {
      if (!patientData) {
        toast.error(t("please_select_a_patient_first"));
        setIsDialogOpen(true);
        openModal("addPatient");
        setLoading(false);
        return;
      }
      if (!patientData?.address?.id) {
        toast.error(t("please_select_a_patient_and_their_address"));
        setIsDialogOpen(true);
        openModal("addPatient");
        setLoading(false);
        return;
      }
    }

    if (user?.user?.role === "USER" && !userData?.deliveryAddress?.id) {
      toast.error(t("please_add_a_delivery_address"));
      setIsDialogOpen(true);
      openModal("editAddress");
      setLoading(false);
      return;
    }

    if (hasPrescriptionItems && !prescriptionFile) {
      toast.error(t("please_upload_a_prescription"));
      setLoading(false);
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.error(t("your_cart_is_empty"));
      setLoading(false);
      return;
    }

    // Prepare order data
    const orderItems = cartItems.map((item: CartItem) => ({
      productId: item.id,
      quantity: item.quantity,
      weight: item.weight,
    }));

    const formData = new FormData();
    if (patientData) {
      formData.append("patientId", patientData.id);
    }

    // Set delivery address based on role
    if (user?.user?.role === "DOCTOR" && patientData?.address?.id) {
      formData.append("deliveryAddressId", patientData.address.id);
    } else if (user?.user?.role === "USER" && userData?.deliveryAddress?.id) {
      formData.append("deliveryAddressId", userData.deliveryAddress.id);
    } else if (
      user?.user?.role === "PHARMACY_STAFF" &&
      patientData?.address?.id
    ) {
      formData.append("deliveryAddressId", patientData.address.id);
    }

    formData.append("items", JSON.stringify(orderItems));
    if (prescriptionFile) {
      formData.append("prescription", prescriptionFile);
    }

    try {
      const response = await placeOrder(formData);
      dispatch(clearCart());
      dispatch(resetPatient());

      if (response?.data?.orderCode) {
        router.push(`/cart/afterPlacingOrder?code=${response.data.orderCode}`);
      } else {
        router.push("/cart/afterPlacingOrder");
      }
    } catch (error: any) {
      console.error("Failed to place order:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to place order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    user,
    patientData,
    userData,
    hasPrescriptionItems,
    prescriptionFile,
    cartItems,
    dispatch,
    router,
    openModal,
    productAvailability,
  ]);

  console.log(cartItems, "cartItems");

  const total = cartItems.reduce(
    (sum: number, product: CartItem) => sum + product.price * product.quantity,
    0
  );

  useEffect(() => {
    const totalWeight = cartItems.reduce(
      (sum, item) => sum + item.weight * item.quantity, // Calculate from base weight
      0
    );
    setTotalItemWeight(totalWeight);
  }, [cartItems]);

  useEffect(() => {
    const newCartItemIds = cartItems.map((item) => item.id);
    if (JSON.stringify(newCartItemIds) !== JSON.stringify(cartItemIds)) {
      setCartItemIds(newCartItemIds);
    }
  }, [cartItems]);

  useEffect(() => {
    const checkProductAvailability = async () => {
      if (cartItemIds.length === 0) return;

      setIsCheckingAvailability(true);
      try {
        const response = await getAllProduct();
        const allProducts = response.data.products;

        const availabilityMap: {
          [key: string]: { inStock: boolean; availableQuantity: number };
        } = {};

        let updatedCartItems = [...cartItems];

        cartItems.forEach((cartItem, index) => {
          // Check for null or undefined product ID
          if (!cartItem.id) {
            availabilityMap[cartItem.id || "invalid"] = {
              inStock: false,
              availableQuantity: 0,
            };
            return;
          }

          // Normalize cart item name
          const normalizedCartItemName = cartItem.name
            .toLowerCase()
            .replace(/\s/g, "");

          // Find product by ID first
          let product = allProducts.find((p: any) => p.id === cartItem.id);

          // Fallback to name matching if ID not found
          if (!product) {
            product = allProducts.find(
              (p: any) =>
                p.name.toLowerCase().replace(/\s/g, "") ===
                normalizedCartItemName
            );
          }

          // Mark as out of stock if:
          // 1. No product found
          // 2. Product ID is null
          // 3. Names don't match
          if (!product) {
            availabilityMap[cartItem.id] = {
              inStock: false,
              availableQuantity: 0,
            };
            return;
          }

          // Verify name match
          const normalizedProductName = product.name
            .toLowerCase()
            .replace(/\s/g, "");
          const namesMatch = normalizedProductName === normalizedCartItemName;

          // Additional check for null/undefined product ID from API
          const validProductId =
            product.id !== null && product.id !== undefined;

          availabilityMap[cartItem.id] = {
            inStock:
              validProductId &&
              namesMatch &&
              product.availability === "IN_STOCK",
            availableQuantity:
              validProductId && namesMatch ? product.quantity || 0 : 0,
          };

          // Only update if we have valid product ID and matching names
          if (validProductId && namesMatch) {
            const priceDiffers =
              Number(cartItem.price) !== Number(product.price);
            const weightDiffers =
              Number(cartItem.weight) !== Number(product.weight);
            const imageDiffers = cartItem.imageUrl !== product.imageUrl;
            const requiresPrescriptionDiffers =
              cartItem.requiresPrescription !== product.requiresPrescription;

            if (
              priceDiffers ||
              weightDiffers ||
              imageDiffers ||
              requiresPrescriptionDiffers
            ) {
              updatedCartItems[index] = {
                ...updatedCartItems[index],
                id: product.id, // Ensure we're using the correct ID
                price: Number(product.price),
                weight: Number(product.weight),
                imageUrl: product.imageUrl,
                requiresPrescription: product.requiresPrescription,
                quantity: updatedCartItems[index].quantity,
                name: product.name,
              };

              if (priceDiffers) {
                toast.success(`Updated ${product.name}`);
              }
            }
          }
        });

        if (JSON.stringify(updatedCartItems) !== JSON.stringify(cartItems)) {
          dispatch(updateCartItems(updatedCartItems));
        }

        setProductAvailability(availabilityMap);
      } catch (error) {
        console.error("Failed to check availability:", error);
        toast.error("Failed to check product availability");
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkProductAvailability();
  }, [cartItemIds, dispatch]);

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-96">
        <h1 className="text-xl font-medium text-primary">
          {t("loading_cart")}
        </h1>
      </div>
    );
  }

  return (
    <>
      {cartItems.length > 0 ? (
        <div className="flex flex-col w-full md:flex-row gap-8 mt-10">
          <div className="w-full">
            <div className="space-y-4">
              {isCheckingAvailability && (
                <div className="text-center py-2">
                  <span className="text-primary">
                    {t("checking_product_availability")}
                  </span>
                </div>
              )}
              {cartItems.map((product: CartItem) => {
                const availability = productAvailability[product.id];
                // Consider product out of stock if we don't have availability info or it's explicitly out of stock
                const isOutOfStock =
                  !availability || availability.inStock === false;

                return (
                  <div
                    key={product.id}
                    className={`rounded-[18px] flex gap-2 border-2 ${
                      isOutOfStock
                        ? "border-gray-200 bg-gray-100"
                        : "border-primary/50"
                    } p-2`}
                  >
                    <img
                      src={product.imageUrl}
                      alt={""}
                      className="object-contain sm:w-[120px] sm:h-[120px] w-24 h-24 "
                    />
                    <div className="border-l border-[#000000]/50 px-5 flex-1">
                      <h1 className="font-medium text-[1.2rem] overflow-ellipsis">
                        {product.name}
                      </h1>
                      <div
                        className={`text-sm font-medium ${
                          isOutOfStock ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {isOutOfStock ? t("out_of_stock") : t("in_stock")}
                      </div>
                      <div className="sm:flex justify-between items-center mt-2">
                        <h2 className="font-semibold text-2xl text-primary">
                          $
                          {Number(product.price)
                            ? product.price
                            : product.price.toFixed(2)}
                        </h2>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => decreaseQuantity(product.id)}
                            aria-label="Decrease quantity"
                          >
                            <FiMinus className="scale-75" />
                          </button>
                          <div className="h-fit w-fit px-3 border-2 rounded-xl border-primary bg-primary/10 text-primary text-2xl font-semibold">
                            {product.quantity}
                          </div>
                          <button
                            onClick={() => increaseQuantity(product.id)}
                            aria-label="Increase quantity"
                          >
                            <FiPlus className="scale-75" />
                          </button>
                          <button
                            onClick={() => handleRemoveFromCart(product.id)}
                            className="ml-2"
                            aria-label="Remove item"
                          >
                            <FiTrash2 className="scale-75" />
                          </button>
                        </div>
                      </div>
                      <div className="flex sm:gap-x-10  gap-x-1.5 text-sm text-slate-700">
                        <h1>
                          {t("weight_per_unit")}: {product?.weight} (lb)
                        </h1>
                        <h1>
                          {t("total_weight")}:
                          <span className="text-primary ml-1 font-semibold">
                            {Number.isInteger(totalItemWeight)
                              ? totalItemWeight
                              : totalItemWeight.toFixed(2)}{" "}
                            (lb)
                          </span>
                        </h1>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex w-full md:w-6/12 flex-col items-start">
            {user?.user?.role === "DOCTOR" && (
              <Button
                type="button"
                onClick={() => {
                  setIsDialogOpen(true);
                  openModal("addPatient");
                }}
                className="bg-[#10847E] h-12 text-white text-[18px] w-[200px] mb-2 rounded-full"
              >
                {t("choose_patient")}
              </Button>
            )}
            <div className="border-2 w-full border-primary/50 rounded-[18px] p-4">
              <h2 className="mb-4 font-medium">
                {t("cart_total")}:
                <span className="text-xl ml-1.5 font-semibold">
                  ${Number.isInteger(total) ? total : total.toFixed(2)}
                </span>
              </h2>
              <h2 className="mb-4 font-medium">
                {t("total_weight")}:
                <span className="text-xl font-semibold ml-1.5">
                  {Number.isInteger(totalItemWeight)
                    ? totalItemWeight
                    : totalItemWeight.toFixed(2)}
                  (lb)
                </span>
              </h2>
              {hasPrescriptionItems && (
                <div className="flex items-center justify-start border-2 border-dashed border-primary/50 rounded-xl p-3 px-5 gap-2 m-4">
                  <button
                    onClick={handleClick}
                    className="flex gap-x-2 items-center"
                    aria-label="Upload prescription"
                  >
                    <FiFile className="scale-75" />
                    <span className="text-primary font-medium">
                      {fileName ? (
                        <p className="truncate w-32 min-w-44">{fileName}</p>
                      ) : (
                        t("upload_prescription")
                      )}
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                      accept="image/*"
                    />
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {user?.user?.role === "DOCTOR" && (
                  <div className="flex flex-col">
                    <h1 className="font-semibold text-lg text-primary">
                      {t("doctor_details")}
                    </h1>
                    <span className="font-semibold">{userData?.name}</span>
                    <span>{userData?.email}</span>
                    <span>{userData?.phone}</span>
                    {userData?.deliveryAddress && (
                      <div className="my-2">
                        <h1 className="font-medium">{t("doctor_address")}</h1>
                        <p>
                          {userData.deliveryAddress.manualInstructions && (
                            <span>
                              {userData.deliveryAddress.manualInstructions}{" "}
                            </span>
                          )}
                          <span>{userData.deliveryAddress.addressLine} </span>
                        </p>
                        <p>
                          <span>{userData.deliveryAddress.town} </span>
                          <span>{userData.deliveryAddress.municipality} </span>
                          <span>{userData.deliveryAddress?.province} </span>
                          <span>{userData.deliveryAddress.country} </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {patientData && (
                  <div className="flex flex-col">
                    <h1 className="font-semibold text-lg text-primary">
                      {t("patient_details")}
                    </h1>
                    <span className="font-semibold">{patientData.name}</span>
                    <span>{patientData.email}</span>
                    <span>{patientData.phone}</span>
                  </div>
                )}

                {user?.user?.role === "DOCTOR" ? (
                  <>
                    {patientData?.address?.id ? (
                      <div className="my-2">
                        <h1 className="font-medium">{t("patient_address")}</h1>
                        <p>
                          {patientData.address.manualInstructions && (
                            <span>
                              {patientData.address.manualInstructions}{" "}
                            </span>
                          )}
                          <span>{patientData.address.addressLine} </span>
                        </p>
                        <p>
                          <span>{patientData.address?.town} </span>
                          <span>{patientData.address?.municipality} </span>
                          <span>{patientData.address?.province} </span>
                          <span>{patientData.address?.country} </span>
                        </p>
                      </div>
                    ) : (
                      <div className="my-2">
                        <p className="text-red-500">
                          {t("please_add_patient")}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <div>
                      <p className="font-semibold">{userData?.name}</p>
                      <p>{userData?.email}</p>
                      <p>{userData?.phone}</p>
                    </div>

                    {userData?.deliveryAddress && isUser ? (
                      <div className="my-2">
                        <h1 className="font-medium">{t("delivery_address")}</h1>
                        <p>
                          {userData.deliveryAddress.manualInstructions && (
                            <span>
                              {userData.deliveryAddress.manualInstructions}{" "}
                            </span>
                          )}
                          <span>{userData.deliveryAddress.addressLine} </span>
                        </p>
                        <p>
                          <span>{userData.deliveryAddress?.town} </span>
                          <span>{userData.deliveryAddress?.municipality} </span>
                          <span>{userData.deliveryAddress?.province} </span>
                          <span>{userData.deliveryAddress?.country} </span>
                        </p>
                      </div>
                    ) : (
                      <div className="my-2">
                        {user && (
                          <p className="text-red-500">
                            {t("please_add_a_delivery_address")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {user && (
                  <div className="border-2 border-primary p-5 border-dashed rounded-xl my-4">
                    <div className="flex justify-between font-medium text-lg">
                      <span>{t("sub_total")}:</span>
                      <span className="font-bold">
                        ${Number.isInteger(total) ? total : total.toFixed(2)}
                      </span>
                    </div>
                    {((userData?.deliveryAddress && isUser) ||
                      (patientData?.address && isDoctor)) && (
                      <>
                        <div className="flex justify-between font-medium text-lg">
                          <span>{t("delivery_charge")}:</span>
                          <span className="font-bold">
                            $
                            {isDoctor && patientData
                              ? calculateDeliveryCost(
                                  patientData?.address?.province,
                                  totalItemWeight
                                )
                              : isUser && userData
                              ? calculateDeliveryCost(
                                  userData?.deliveryAddress?.province,
                                  totalItemWeight
                                )
                              : "0"}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium text-lg">
                          <span>{t("total")}:</span>
                          <span className="font-bold">
                            $
                            {total +
                              Number(
                                calculateDeliveryCost(
                                  user?.user?.role === "DOCTOR"
                                    ? patientData?.address?.province
                                    : userData?.deliveryAddress?.province,
                                  totalItemWeight
                                )
                              )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div className="flex justify-between">
                  <div className="flex gap-4">
                    {!userData?.deliveryAddress?.id && (
                      <div
                        className="flex w-fit cursor-pointer h-12 items-center border-2 px-5 py-0.5 gap-2 font-medium bg-[#10847E1A] text-primary rounded-full"
                        onClick={() => {
                          if (!user) {
                            toast.error("Please login first");
                            return;
                          }
                          setIsDialogOpen(true);
                          openModal("editAddress");
                        }}
                        aria-label="Add address"
                      >
                        <FiMapPin className="scale-75" />
                        {t("add_address")}
                      </div>
                    )}

                    <button
                      className={`flex w-fit cursor-pointer h-12 items-center border-2 px-5 py-0.5 gap-2 font-medium bg-[#10847E] text-white rounded-full ${
                        loading ? "opacity-60 pointer-events-none" : ""
                      }`}
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      aria-label="Place order"
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 mr-2 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            ></path>
                          </svg>
                          {t("placing_order")}
                        </>
                      ) : (
                        <>
                          <FiSend className="" />
                          {t("place_order")}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-96">
          <h1 className="text-xl font-medium text-primary">
            {t("your_cart_is_empty")}
          </h1>
        </div>
      )}
      {isDialogOpen && <GlobalAuthModal />}
    </>
  );
};

export default CartPage;
