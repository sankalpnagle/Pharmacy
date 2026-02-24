"use client";
import React from "react";

interface HeroProps {
  title: string;
  subtitle?: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
}

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  image,
  buttonText,
  buttonLink,
}) => {
  return (
    <section className="relative flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-primary to-blue-400 rounded-2xl shadow-xl overflow-hidden py-12 px-6 md:px-16 mb-12 max-w-7xl mx-auto">
      <div className="flex-1 z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white text-lg md:text-2xl mb-6">{subtitle}</p>
        )}
        {buttonText && buttonLink && (
          <a
            href={buttonLink}
            className="inline-block bg-white text-primary font-semibold px-8 py-3 rounded-lg hover:bg-primary hover:text-white transition text-lg"
          >
            {buttonText}
          </a>
        )}
      </div>
      <div className="flex-1 w-full h-72 md:h-[420px] relative z-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover rounded-xl shadow-lg"
        />
      </div>
    </section>
  );
};

export default Hero;
