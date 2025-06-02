"use client";
import BestSellCard from "@/components/home/BestSellCard";
import Navbar from "@/components/Navbar";
import bestsell1 from "@/../public/images/medicine/med-1.png";
import bestsell2 from "@/../public/images/medicine/med-1.png";
import bestsell3 from "@/../public/images/medicine/med-1.png";
import bestsell4 from "@/../public/images/medicine/med-1.png";
import CategoryCard from "@/components/home/CategoryCard";
import { useRouter } from "next/navigation";
import HeroSlider from "@/components/home/HeroSlider";
import slide1 from "@/../public/images/slides/slide1.png";
import { useEffect, useState } from "react";
import { getAllProduct } from "@/services/productService";
import { getAllCategory } from "@/services/categoryService";
import { useLoading } from "@/context/LoadingContext";
import { t } from "@/utils/translate";

const bestSell = [
  {
    title: "cough syrup",
    image: bestsell1,
    price: "324",
    new: false,
  },
  {
    title: "cough syrup",
    image: bestsell2,
    price: "324",
    new: true,
  },
  {
    title: "cough syrup",
    image: bestsell3,
    price: "324",
    new: false,
  },
  {
    title: "cough syrup",
    image: bestsell4,
    price: "324",
    new: true,
  },
  {
    title: "cough syrup",
    image: bestsell4,
    price: "324",
    new: true,
  },
  {
    title: "cough syrup",
    image: bestsell4,
    price: "324",
    new: false,
  },
  {
    title: "cough syrup",
    image: bestsell4,
    price: "324",
    new: true,
  },
  {
    title: "cough syrup",
    image: bestsell4,
    price: "324",
    new: true,
  },
];
const category = [
  {
    title: "cough syrup",
    category: "Mush Have",
    image: bestsell1,
    price: "324",
    new: false,
  },
  {
    title: "cough syrup",
    category: "Heart care ",
    image: bestsell2,
    price: "324",
    new: true,
  },
  {
    title: "cough syrup",
    category: "Mush Have",
    image: bestsell3,
    price: "324",
    new: false,
  },
  {
    title: "cough syrup",
    category: "Sexual wellness",
    image: bestsell4,
    price: "324",
    new: true,
  },
  {
    title: "cough syrup",
    category: "Mush Have",
    image: bestsell4,
    price: "324",
    new: true,
  },
  {
    title: "cough syrup",
    category: "Mush Have",
    image: bestsell4,
    price: "324",
    new: false,
  },
  {
    title: "cough syrup",
    category: "Sports nutrition",
    image: bestsell4,
    price: "324",
    new: true,
  },
  {
    title: "cough syrup",
    category: "Mush Have",
    image: bestsell4,
    price: "324",
    new: true,
  },
];

interface SlideImage {
  image: {
    src: string;
  };
}

const slideImages: SlideImage[] = [
  {
    image: {
      src: slide1.src,
    },
  },
  {
    image: {
      src: slide1.src,
    },
  },
  {
    image: {
      src: slide1.src,
    },
  },
  {
    image: {
      src: slide1.src,
    },
  },
  {
    image: {
      src: slide1.src,
    },
  },
  {
    image: {
      src: slide1.src,
    },
  },
];

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [cateData, setCateData] = useState([]);
  const { showLoader, hideLoader } = useLoading();

  const fetchAllProduct = async () => {
    try {
      const res = await getAllProduct();
      setData(res.data?.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchAllCategory = async () => {
    try {
      const res = await getAllCategory();
      setCateData(res.data?.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      showLoader();
      try {
        await Promise.all([fetchAllProduct(), fetchAllCategory()]);
      } finally {
        hideLoader();
      }
    };
    fetchData();
  }, []);

  return (
    <div className=" mx-auto px-4 min-w-[360px] sm:px-0 lg:px-0 py-6">
      {/* Hero Slider Section */}
      <div className="mb-8 sm:mb-12">
        <HeroSlider data={slideImages} />
      </div>

      {/* Best Selling Products Section */}
      {/* <div className="mb-12 sm:mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6">
          <h1 className="text-primary font-semibold text-xl sm:text-2xl mb-2 sm:mb-0">
            {t("best_selling_products")}
          </h1>
          <button
            onClick={() => router.push("/category/products")}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {t("see_more")}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:px-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {data?.slice(0, 5).map((item, index) => (
            <BestSellCard key={index} data={item} id={index} />
          ))}
        </div>
      </div> */}

      {/* Categories Section */}
      <div className="mb-12 sm:mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6">
          <h1 className="text-primary font-semibold text-xl sm:text-2xl mb-2 sm:mb-0">
            {t("shop_by_categories")}
          </h1>
          <button
            onClick={() => router.push("/category")}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {t("see_more")}
          </button>
        </div>
        <div className="sm:flex sm:flex-wrap grid grid-cols-2 gap-6">
          {cateData.slice(0, 7).map((item, index) => (
            <CategoryCard key={index} data={item} id={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
