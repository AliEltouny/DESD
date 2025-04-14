"use client";

import React from "react";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Create your profile",
      description:
        "Sign up and create your personalized academic profile with your interests, major, and university information.",
    },
    {
      number: "02",
      title: "Join communities",
      description:
        "Connect with peers by joining communities related to your courses, interests, and student activities.",
    },
    {
      number: "03",
      title: "Discover events",
      description:
        "Find and participate in campus events, workshops, and activities that match your interests and goals.",
    },
    {
      number: "04",
      title: "Network and grow",
      description:
        "Build your professional network, collaborate on projects, and enhance your university experience.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-16">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
            How It Works
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple steps to get started
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Getting connected with your university community has never been
            easier.
          </p>
        </div>

        <div className="relative">
          {/* Connection line between steps */}
          <div
            className="hidden lg:block absolute left-1/2 top-0 -ml-px h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          ></div>

          <div className="space-y-16">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="lg:flex items-center">
                  <div
                    className={`lg:w-1/2 ${
                      index % 2 === 0 ? "lg:pr-12" : "lg:order-last lg:pl-12"
                    }`}
                  >
                    <div
                      className={`p-6 bg-white rounded-lg shadow-lg border-t-4 ${
                        index === 0
                          ? "border-blue-500"
                          : index === 1
                          ? "border-purple-500"
                          : index === 2
                          ? "border-teal-500"
                          : "border-amber-500"
                      }`}
                    >
                      <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-800 font-bold text-xl">
                        {step.number}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-gray-700 text-base leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className="hidden lg:block lg:w-1/2">
                    <div
                      className={`flex ${
                        index % 2 === 0 ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div className="relative flex items-center justify-center w-20 h-20">
                        <div className="absolute w-10 h-10 bg-blue-100 rounded-full"></div>
                        <div className="z-10 w-5 h-5 bg-blue-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <a
            href="/register"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Get Started Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
