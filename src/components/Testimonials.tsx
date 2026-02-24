"use client";
import React from "react";

interface Testimonial {
  name: string;
  message: string;
  avatar?: string;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
}

const Testimonials: React.FC<TestimonialsProps> = ({ testimonials }) => {
  return (
    <section className="py-8 px-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6"></h2>
      <div className="grid gap-6 md:grid-cols-2">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center"
          >
            {t.avatar && (
              <img
                src={t.avatar}
                alt={t.name}
                className="w-16 h-16 rounded-full mb-4 object-cover"
              />
            )}
            <p className="text-gray-700 italic mb-2">"{t.message}"</p>
            <span className="font-semibold text-primary">- {t.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
