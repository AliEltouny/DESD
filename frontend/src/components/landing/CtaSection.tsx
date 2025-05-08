"use client";

import React from "react";
import Link from "next/link";

const CtaSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="lg:max-w-3xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to transform your university experience?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              Join thousands of students already using Uni Hub to connect,
              collaborate, and make the most of their university journey. Sign
              up today and start building your network.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign Up Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 border border-white text-lg font-medium rounded-md text-white bg-transparent hover:bg-white/10 transition-all duration-300"
              >
                Log In
              </Link>
            </div>
            <p className="mt-4 text-sm text-blue-100">
              No credit card required • Free for all university students
            </p>
          </div>
          <div className="mt-10 lg:mt-0 lg:ml-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 lg:p-8 shadow-2xl border border-white/20 relative">
              <div className="absolute -top-4 -right-4 bg-amber-400 text-amber-800 rounded-full px-4 py-1 text-sm font-bold transform rotate-12">
                Join Today!
              </div>
              <h3 className="text-xl font-bold mb-4">Uni Hub Offers:</h3>
              <ul className="space-y-3 text-blue-100">
                {[
                  "Easy profile creation",
                  "Access to university communities",
                  "Campus event discovery",
                  "Resource sharing",
                  "Networking opportunities",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-400 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                      style={{
                        backgroundColor:
                          i === 0
                            ? "#3b82f6"
                            : i === 1
                            ? "#10b981"
                            : i === 2
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    />
                  ))}
                </div>
                <span className="ml-3 text-sm text-blue-100">
                  Join 5,000+ students
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
