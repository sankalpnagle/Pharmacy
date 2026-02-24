"use client";
import { motion } from "framer-motion";
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
import slide2 from "@/../public/images/slides/slide2.jpg";
import slide3 from "@/../public/images/slides/slide3.jpg";
import { useEffect, useState } from "react";
import { getAllProduct } from "@/services/productService";
import { getAllCategory } from "@/services/categoryService";
import { useLoading } from "@/context/LoadingContext";
import { t } from "@/utils/translate";
import Testimonials from "@/components/Testimonials";
import InfoBanner from "@/components/InfoBanner";
import Hero from "@/components/Hero";
import ProductCard from "@/components/home/ProductCard";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

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
      src: slide2.src,
    },
  },
  {
    image: {
      src: slide3.src,
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

  // Sample testimonials data
  const testimonials = [
    {
      name: "John Doe",
      message: "Great service and fast delivery! Highly recommend.",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      name: "Jane Smith",
      message: "The pharmacy staff were very helpful and friendly.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      name: "Carlos Perez",
      message: "Wide selection of products and easy ordering process.",
      avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    },
    {
      name: "Carlos Perez",
      message: "Wide selection of products and easy ordering process.",
      avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    },
  ];

  return (
    <div className="mx-auto px-4 min-w-[360px] sm:px-0 lg:px-0 py-6">
      {/* HERO */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mb-8 sm:mb-12"
      >
        <HeroSlider data={slideImages} />
      </motion.div>

      {/* BEST SELLING */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
      >
        {data.map((p) => (
          <motion.div variants={fadeUp}>
            <ProductCard product={p} />
          </motion.div>
        ))}
      </motion.div>

      {/* CATEGORIES */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mb-12 mt-14 sm:mb-16"
      >
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

        <motion.div
          variants={stagger}
          className="sm:flex sm:flex-wrap mt-10 justify-center grid grid-cols-2 gap-6"
        >
          {cateData.slice(0, 7).map((item, index) => (
            <motion.div key={index} variants={fadeUp}>
              <CategoryCard data={item} id={index} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* INFO BANNER */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="py-6"
      >
        <InfoBanner
          title="Your Trusted Online Pharmacy"
          description="Order medicines easily and securely..."
          image={slide2.src}
          buttonText="Shop Now"
          buttonLink="/category/products"
        />
      </motion.div>

      {/* TESTIMONIALS */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <Testimonials testimonials={testimonials} />
      </motion.div>
    </div>
  );
}
