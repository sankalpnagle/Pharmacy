"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "./css/style.css";
import { Pagination, Autoplay } from "swiper/modules";
import Image from "next/image";

interface SlideImage {
  image: {
    src: string;
  };
}

interface HeroSliderProps {
  data: SlideImage[];
}

export default function HeroSlider({ data }: HeroSliderProps) {
  return (
    <div className="relative w-full overflow-hidden">
      <Swiper
        modules={[Pagination, Autoplay]}
        centeredSlides
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        className="heroSwiper"
      >
        {data.map((img, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-[220px] sm:h-[320px] md:h-[420px] lg:h-[520px]">
              
              {/* IMAGE */}
              <Image
                src={img.image.src}
                alt={`Slide ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover scale-100 group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
              />

              {/* GRADIENT OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}