"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getMediaUrl } from "@/services/api/apiClient";
import { testimonialApi } from "@/services/api/landing/testimonialApi";
import { Testimonial } from "@/types/testimonial";

// Fallback mock data
const mockTestimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ibrahim Mohamed",
    role: "Computer Science Student",
    university: "University of West of England",
    content: "Uni Hub has completely transformed how I connect with other students. The communities feature helped me find study partners and join events I would have missed otherwise.",
    image: "/placeholders/testimonials/student1.jpg"
  },
  {
    id: 2,
    name: "Ibrahim Mohamed",
    role: "Computer Science Student",
    university: "University of West of England",
    content: "As an international student, Uni Hub made it so much easier to get involved with university life. I found my research group and closest friends through the platform.",
    image: "/placeholders/testimonials/student2.jpg"
  },
  {
    id: 3,
    name: "Ibrahim Mohamed",
    role: "Computer Science Student",
    university: "University of West of England",
    content: "The event calendar saved me so many times! I was able to keep track of all my club meetings and academic deadlines in one place. Highly recommend to all students.",
    image: "/placeholders/testimonials/student3.jpg"
  },
];

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch testimonials from API
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setIsLoading(true);
        
        const response = await testimonialApi.getTestimonials(3); // Limit to 3
        // Directly use the response array
        if (response && response.length > 0) {
          // Process testimonials (remove complex image pre-processing)
          const processedTestimonials = response.map(
            (testimonial: Testimonial) => {
              // Simplify: return testimonial data directly
              return testimonial;
            }
          );

          console.log("Raw testimonials:", processedTestimonials);
          setTestimonials(processedTestimonials);
          console.log("Using real testimonials from backend");
        } else {
          // Use mock data as fallback
          console.log("No testimonials returned from API, using mock data");
          const processedMockTestimonials = mockTestimonials.map(testimonial => ({
            ...testimonial,
            isMock: true // Add a flag to identify mock testimonials
          }));
          setTestimonials(processedMockTestimonials);
          console.log("Using mock data as fallback");
        }
      } catch (err: unknown) {
        console.error("Failed to fetch testimonials:", err);
        // Use mock data as fallback on error
        const processedMockTestimonials = mockTestimonials.map(testimonial => ({
          ...testimonial,
          isMock: true // Add a flag to identify mock testimonials
        }));
        setTestimonials(processedMockTestimonials);
        console.log("Using mock data as fallback on error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Auto-switch testimonials only if we have more than one
  useEffect(() => {
    if (testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  // If no testimonials and not loading, don't render the section
  if (!isLoading && testimonials.length === 0) {
    return null;
  }

  return (
    <section
      id="testimonials"
      className="py-20 bg-white relative overflow-hidden"
    >
      {/* Background design elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-5">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-purple-600"></div>
        <div className="absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-teal-600"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
            Testimonials
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            What Our Users Say
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Hear from students who have transformed their university experience
            with Uni Hub.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="relative">
            {/* Testimonial Cards */}
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
                      <div className="flex items-center mb-6">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-blue-500 relative">
                          <Image
                            src={testimonial.isMock ? (testimonial.image ?? '/placeholders/avatar.png') : getMediaUrl(testimonial.image ?? null)}
                            alt={`${testimonial.name} profile`}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {testimonial.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {testimonial.role}
                          </p>
                          <p className="text-sm text-blue-600">
                            {testimonial.university}
                          </p>
                        </div>
                      </div>
                      <p className="text-lg text-gray-700 italic">
                        &quot;{testimonial.content || "Uni Hub has been a great platform for connecting with my fellow students!"}&quot;
                      </p>
                      <div className="mt-6 flex items-center">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className="w-5 h-5 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls - Only show if we have multiple testimonials */}
            {testimonials.length > 1 && (
              <>
                <div className="flex justify-center mt-8 space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                        activeIndex === index ? "bg-blue-600" : "bg-gray-300"
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="flex justify-center mt-4 space-x-4">
                  <button
                    onClick={() =>
                      setActiveIndex(
                        (activeIndex - 1 + testimonials.length) %
                          testimonials.length
                      )
                    }
                    className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                    aria-label="Previous testimonial"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setActiveIndex((activeIndex + 1) % testimonials.length)
                    }
                    className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                    aria-label="Next testimonial"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
