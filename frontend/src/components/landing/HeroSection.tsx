"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80 z-0"></div>

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
                <span className="block">Connect, Collaborate,</span>
                <span className="block text-blue-400">
                  Thrive at University
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-100 max-w-3xl">
                Uni Hub brings together students, resources, and opportunities
                in one place. Build meaningful connections, discover events, and
                make the most of your university experience.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Join for Free
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-100 bg-gray-800/60 hover:bg-gray-800/80 transition-all duration-300"
                >
                  See How It Works
                </Link>
              </div>
            </motion.div>
          </div>
          <div className="hidden lg:block lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 mt-10">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold">U</span>
                    </div>
                    <span className="ml-3 font-semibold text-gray-800">
                      Uni Hub
                    </span>
                  </div>
                  <div className="bg-green-400 rounded-full h-2 w-2"></div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <h3 className="font-semibold text-gray-800">
                      Latest Campus Event
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tech Meetup - Tomorrow at 6 PM
                    </p>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-3">
                    <h3 className="font-semibold text-gray-800">
                      New Communities
                    </h3>
                    <p className="text-sm text-gray-600">
                      Photography Club, Debate Society
                    </p>
                  </div>

                  <div className="bg-blue-100 rounded-lg p-3">
                    <h3 className="font-semibold text-blue-800">
                      Connect with 5,000+ students
                    </h3>
                    <div className="flex mt-2">
                      <div className="w-8 h-8 rounded-full bg-blue-400 -ml-0"></div>
                      <div className="w-8 h-8 rounded-full bg-green-400 -ml-2"></div>
                      <div className="w-8 h-8 rounded-full bg-yellow-400 -ml-2"></div>
                      <div className="w-8 h-8 rounded-full bg-red-400 -ml-2"></div>
                      <div className="w-8 h-8 rounded-full bg-purple-400 -ml-2 flex items-center justify-center">
                        <span className="text-xs text-white font-bold">+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none transform z-20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block h-[60px] w-full"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            className="fill-white"
          ></path>
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            className="fill-white"
          ></path>
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            className="fill-white"
          ></path>
        </svg>
      </div>
    </div>
  );
};

export default HeroSection;
