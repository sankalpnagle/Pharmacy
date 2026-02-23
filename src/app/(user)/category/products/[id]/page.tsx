"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import image from "@/../public/images/medicine/img-6.png";
import { FaShoppingCart } from "react-icons/fa";
import { FiMinus, FiPlus } from "react-icons/fi";
import { productById } from "@/services/productService";
import { useParams, useRouter } from "next/navigation";
import img from "@/../public/images/cart/product.jpg";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/slices/cartSlice";
import { t } from "@/utils/translate";

const ProductById = () => {
  const { id } = useParams();
  const [product, setProduct] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch();
  const [totalWeight, setTotalWeight] = useState(product?.weight);

  const fetchProduct = async () => {
    const res = await productById(id);
    setSelectedQuantity(1);
    setProduct(res?.data?.product);
    console.log(res);
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  const increaseQuantity = () => {
    setSelectedQuantity((prevQty) => {
      const newQty = prevQty + 1;
      setTotalWeight(parseFloat((newQty * product?.weight).toFixed(2)));
      return newQty;
    });
  };

  const decreaseQuantity = () => {
    setSelectedQuantity((prevQty) => {
      const newQty = prevQty > 1 ? prevQty - 1 : 1;
      setTotalWeight(parseFloat((newQty * product?.weight).toFixed(2)));
      return newQty;
    });
  };
  const handleCart = () => {
    dispatch(
      addToCart({
        ...product,
        quantity: selectedQuantity,
        totalWeight: totalWeight ? totalWeight : product?.weight,
      })
    );

    router.push("/cart");
  };

  function formatStatus(status?: string) {
    if (!status) return ""; // or return 'Unknown', 'N/A', etc.

    return status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <>
      <div className="grid grid-cols-7 ">
        <div className="sm:col-span-2 col-span-7 flex items-center sm:h-[430px] h-36 w-auto p-4 border-[1.5px] rounded-lg overflow-hidden border-primary mt-10">
          <Image
            src={product?.imageUrl || img}
            className="w-2/3 mx-auto bg-cover"
            alt=""
            width={100}
            height={100}
          />
        </div>
        <div className="sm:col-span-5  col-span-7  sm:mx-12 mx-3 mt-10">
          <h1 className="text-xl font-semibold">{product?.name}</h1>
          <div className="flex justify-between items-center mt-5">
            <div>
              <h1 className="text-xl font-semibold text-primary">
                $ {product?.price}
              </h1>
              {/* <p className="text-[#00000080] text-sm">Inclusive of all taxes</p> */}
              <span className="text-sm text-primary font-semibold">
                {formatStatus(t(product?.availability))}
              </span>
              {product?.requiresPrescription && (
                <p className="text-sm">
                  {t("this_product_requires_prescription")}
                </p>
              )}
            </div>
            <div className="hidden sm:block">
              {product && (
                <button
                  onClick={handleCart}
                  disabled={product?.availability === "OUT_OF_STOCK"}
                  className={`px-6 rounded-full py-2 flex items-center cursor-pointer gap-x-2 font-semibold text-white
    ${
      product?.availability === "OUT_OF_STOCK"
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-primary"
    }`}
                >
                  <FaShoppingCart className="scale-75" /> {t("add_to_cart")}
                </button>
              )}
            </div>
            <div className="block sm:hidden">
              <h1 className="font-semibold text-xl">{t("quantity")}</h1>

              <div className="flex -ml-2 items-center gap-3 mt-3">
                <button onClick={decreaseQuantity}>
                  <FiMinus className="scale-[0.65]" />
                </button>
                <span className=" px-5 py-1 border-2 rounded-xl border-primary bg-primary/10 text-primary text-xl font-semibold">
                  {selectedQuantity}
                </span>
                <button onClick={increaseQuantity}>
                  <FiPlus className="scale-[0.65]" />
                </button>
              </div>
            </div>
          </div>
          <hr className="w-[90%] my-4 mx-auto" />
          <div>
            <h1 className="font-semibold text-xl">{t("details")}</h1>
            <p className=" mt-4">{product?.details}</p>
            <p className=" my-2">{product?.description}</p>
            <p className=" mb-4">
              <span className="font-semibold">{t("weight")}:</span>{" "}
              {product?.weight} (lb)
            </p>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-xl">{t("quantity")}</h1>

              <div className="flex -ml-2 items-center gap-3 mt-3">
                <button onClick={decreaseQuantity}>
                  <FiMinus className="scale-[0.65]" />
                </button>
                <span className=" px-5 py-1 border-2 rounded-xl border-primary bg-primary/10 text-primary text-xl font-semibold">
                  {selectedQuantity}
                </span>
                <button onClick={increaseQuantity}>
                  <FiPlus className="scale-[0.65]" />
                </button>
              </div>
            </div>
            <div className="mt-5">
              <span className="font-semibold text-lg">
                {t("total_weight")}:
              </span>
              <span className=" ml-2 ">
                {totalWeight ? totalWeight : product?.weight} (lb)
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="sm:hidden block mx-auto w-4/6 mt-7">
        {product && (
          <button
            onClick={handleCart}
            disabled={product?.availability === "OUT_OF_STOCK"}
            className={`px-6 rounded-full py-2 w-full flex justify-center items-center cursor-pointer gap-x-2 font-semibold text-white
    ${
      product?.availability === "OUT_OF_STOCK"
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-primary"
    }`}
          >
            <FaShoppingCart className="scale-75" /> {t("add_to_cart")}
          </button>
        )}
      </div>
    </>
  );
};

export default ProductById;
