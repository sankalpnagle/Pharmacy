"use client";
import React, { useRef, useState } from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

import "./css/style.css";

// import required modules
import { Pagination, Autoplay } from "swiper/modules";

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
    <div className="relative">
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        className="mySwiper"
        breakpoints={{
          // when window width is >= 320px
          320: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          // when window width is >= 480px
          480: {
            slidesPerView: 1,
            spaceBetween: 30,
          },
          // when window width is >= 640px
          640: {
            slidesPerView: 1,
            spaceBetween: 40,
          },
        }}
      >
        {data.map((img, index) => (
          <SwiperSlide key={index}>
            <div className="relative h-[300px] md:h-[400px] lg:h-[500px] w-full">
              <img
                src={img.image.src}
                alt={`Slide ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover rounded-lg"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
