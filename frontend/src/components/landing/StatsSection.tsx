"use client";

import React, { useState, useEffect, useRef } from "react";

const StatsSection = () => {
  // Stats data
  const stats = [
    { label: "Active Students", value: 5000, suffix: "+ ", prefix: "" },
    { label: "Universities", value: 120, suffix: "+", prefix: "" },
    { label: "Communities", value: 350, suffix: "+", prefix: "" },
    { label: "Events per Month", value: 200, suffix: "+", prefix: "" },
  ];

  // State to track if section is in view for animation
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef(null);

  // Counter animation states
  const [counters, setCounters] = useState(stats.map(() => 0));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Animate counters when in view
  useEffect(() => {
    if (!isInView) return;

    const intervals = stats.map((stat, index) => {
      const duration = 2000; // ms
      const steps = 30;
      const stepValue = stat.value / steps;
      let currentStep = 0;

      return setInterval(() => {
        if (currentStep < steps) {
          setCounters((prevCounters) => {
            const newCounters = [...prevCounters];
            newCounters[index] = Math.ceil(stepValue * (currentStep + 1));
            return newCounters;
          });
          currentStep++;
        } else {
          clearInterval(intervals[index]);
        }
      }, duration / steps);
    });

    return () => {
      intervals.forEach((interval) => clearInterval(interval));
    };
  }, [isInView, stats]);

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Uni Hub by the Numbers
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-blue-100">
            Join thousands of students already connecting and collaborating on
            our platform.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-blue-300/30"></div>
                </div>
                <div className="relative bg-blue-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <p className="text-5xl font-bold text-white flex justify-center items-center">
                    <span>{stat.prefix}</span>
                    <span>{counters[index]}</span>
                    <span>{stat.suffix}</span>
                  </p>
                  <p className="mt-2 text-lg font-medium text-blue-100">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-2">
              Student Satisfaction
            </h3>
            <div className="flex items-center mt-2">
              <div className="w-full bg-blue-200/20 rounded-full h-2.5">
                <div
                  className="bg-white h-2.5 rounded-full"
                  style={{ width: "94%" }}
                ></div>
              </div>
              <span className="ml-2 text-white font-bold">94%</span>
            </div>
            <p className="mt-4 text-blue-100">
              Students reporting improved university experience.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-2">
              Event Attendance
            </h3>
            <div className="flex items-center mt-2">
              <div className="w-full bg-blue-200/20 rounded-full h-2.5">
                <div
                  className="bg-white h-2.5 rounded-full"
                  style={{ width: "78%" }}
                ></div>
              </div>
              <span className="ml-2 text-white font-bold">78%</span>
            </div>
            <p className="mt-4 text-blue-100">
              Increase in student participation at campus events.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-2">
              Networking Success
            </h3>
            <div className="flex items-center mt-2">
              <div className="w-full bg-blue-200/20 rounded-full h-2.5">
                <div
                  className="bg-white h-2.5 rounded-full"
                  style={{ width: "85%" }}
                ></div>
              </div>
              <span className="ml-2 text-white font-bold">85%</span>
            </div>
            <p className="mt-4 text-blue-100">
              Students making valuable connections for their careers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
