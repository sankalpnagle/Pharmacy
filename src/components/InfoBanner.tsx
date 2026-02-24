"use client";
import React from "react";

interface InfoBannerProps {
  title: string;
  description: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
}

const InfoBanner: React.FC<InfoBannerProps> = ({
  title,
  description,
  image,
  buttonText,
  buttonLink,
}) => {
  return (
    <section className="flex flex-col md:flex-row items-center border-l-2 border-l-primary/90 bg-white rounded-xl shadow-md  overflow-hidden my-12 max-w-7xl mx-auto min-h-[420px]">
      <div className="flex-1 p-8 md:p-16">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
          {title}
        </h2>
        <p className="text-gray-700 text-lg md:text-xl mb-8">{description}</p>
        {buttonText && buttonLink && (
          <a
            href={buttonLink}
            className="inline-block bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary/90 transition text-lg"
          >
            {buttonText}
          </a>
        )}
      </div>
      <div className="flex-1 w-full h-80 md:h-[420px] relative">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover md:rounded-r-xl"
        />
      </div>
    </section>
  );
};

export default InfoBanner;
