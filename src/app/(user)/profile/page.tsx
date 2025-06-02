"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import ProfilePicture from "@/../public/images/profilePicture.png";
import CameraIcon from "@/../public/icons/camera_icon.svg";
import userImage from "@/../public/images/user.png";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/useModal";
import GlobalAuthModal from "@/components/auth/GlobalAuthModal";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { useSession } from "next-auth/react";
import { getUserById } from "@/data/user";
import { editProfileImage, getUserAddressByUserId } from "@/services/user";
import axios from "axios";
import toast from "react-hot-toast";
import { useRole } from "@/hooks/useRole";
import { useLoading } from "@/context/LoadingContext";
import { useDispatch, useSelector } from "react-redux";
import { resetRefetch, selectShouldRefetch } from "@/redux/slices/refetchSlice";
import { t } from "@/utils/translate";

const Profile = () => {
  const [isDoctor] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState({});
  const { activeModal, openModal, closeModal } = useModal();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const [sheetData, setSheetData] = useState([]);
  const session = useSession();
  const role = session?.data?.user?.role;
  const { isPharmacyStaff } = useRole();
  const { showLoader, hideLoader } = useLoading();
  const shouldRefetch = useSelector(selectShouldRefetch);
  const dispatch = useDispatch();

  console.log(role);

  const fetchUserData = async () => {
    try {
      showLoader();
      const res = await getUserAddressByUserId();
      setData(res?.data?.user);
    } catch (error) {
      console.error(t("error_fetching_user_data"), error);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchUserData();
    if (shouldRefetch) {
      fetchUserData();
      dispatch(resetRefetch());
    }
  }, [shouldRefetch]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        let worksheets = workbook.SheetNames.map((sheetName) => {
          return {
            sheetName,
            data: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]),
          };
        });

        setSheetData(worksheets);
        console.log("json:\n", JSON.stringify(worksheets), "\n\n");
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const columns = [
    {
      title: t("segment"),
      dataIndex: "A",
      key: "Segment",
    },
    {
      title: t("country"),
      dataIndex: "B",
      key: "Country",
    },
    {
      title: t("product"),
      dataIndex: "C",
      key: "Product",
    },
    {
      title: t("units_sold"),
      dataIndex: "D",
      key: "Units Sold",
    },
    {
      title: t("manufacturing_price"),
      dataIndex: "E",
      key: "Manufacturing Price",
    },
    {
      title: t("sale_price"),
      dataIndex: "F",
      key: "Sale Price",
    },
  ];

  return (
    <>
      <div>
        {/* <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} /> */}

        {/* Display data table here if using Ant Design */}
        {sheetData.length > 0 && sheetData[0]?.data?.length > 0 && (
          <div>
            <h3>{sheetData[0].sheetName}</h3>
          </div>
        )}
      </div>
      <main className="min-h-[85vh] w-auto flex flex-col items-center gap-15">
        <section className=" min-w-[calc(97vw-20px)] mt-10 shadow-primary rounded-[18px] content-center sm:flex sm:flex-row  justify-between p-4">
          <div className=" sm:flex sm:flex-row gap-6 flex-col">
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src={userImage}
                alt={""}
                className="h-[10rem] w-auto object-cover"
              />
              <input
                type="file"
                ref={fileInputRef}
                // onChange={handleFileChange}
                className="hidden"
              />
              {/* <CameraIcon
                onClick={handleIconClick}
                className="sm:scale-75 cursor-pointer absolute sm:bottom-0.5 sm:right-0.5 bottom-2 right-2"
              /> */}
            </div>

            <div className="p-2 flex flex-col gap-2">
              <h2 className="text-[1.5rem] font-medium">
                {data.name} {role === "DOCTOR" ? t("doctor") : ""}
              </h2>
              <p className=" text-[1.1rem] font-medium">{data?.email}</p>
              <p className="text-[1.1rem] font-medium">{data?.phone}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              color="primary"
              className={"text-white rounded-full"}
              onClick={() => {
                setIsDialogOpen(true);
                openModal("editProfile");
              }}
            >
              {t("edit_profile")}
            </Button>
            {!isPharmacyStaff && (
              <Button
                color="primary"
                className={"text-white rounded-full"}
                onClick={() => router.push("/profile/viewOrders")}
              >
                {t("order_history")}
              </Button>
            )}
            {role === "DOCTOR" && (
              <Button
                color="primary"
                className={"text-white rounded-full"}
                onClick={() => {
                  setIsDialogOpen(true);
                  openModal("addPatient");
                }}
              >
                {t("add_patient")}
              </Button>
            )}
            <Button
              color="primary"
              className={"text-white rounded-full"}
              onClick={() => {
                setIsDialogOpen(true);
                openModal("editAddress");
              }}
            >
              {data?.deliveryAddress ? t("edit_address") : t("add_address")}
            </Button>
          </div>
        </section>
        {data?.deliveryAddress ? (
          <section className=" min-w-[calc(97vw-20px)] shadow-primary rounded-[18px] content-center flex justify-between p-6">
            <div className="flex flex-col gap-3 w-full">
              <div className="flex  justify-between">
                <h2 className="text-[1.5rem] font-medium">{t("address")}</h2>
              </div>
              <p className="text-[1.1rem]">
                {data?.deliveryAddress?.manualInstructions}
              </p>
              <p className="text-[1.1rem]">
                {data?.deliveryAddress?.addressLine}
              </p>
              <p className="text-[1.1rem]">
                <span>{data?.deliveryAddress?.municipality},</span>
                <span className="ml-1">{data?.deliveryAddress?.town}</span>
              </p>
              <p className="text-[1.1rem]">
                <span> {data?.deliveryAddress?.province},</span>
                <span className="ml-1">{data?.deliveryAddress?.country} </span>
              </p>
              <p className="text-[1.1rem]"></p>
            </div>
          </section>
        ) : (
          ""
        )}
      </main>
      {isDialogOpen && <GlobalAuthModal />}
    </>
  );
};

export default Profile;
