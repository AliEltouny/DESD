"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

const StatsSection = () => {
  // Stats data (wrapped in useMemo)
  const stats = useMemo(() => [
    { label: "Active Students", value: 334, suffix: "+", prefix: "", color: "from-blue-500/90 to-blue-700/80" },
    { label: "Universities", value: 8, suffix: "+", prefix: "", color: "from-indigo-500/90 to-indigo-700/80" },
    { label: "Communities", value: 24, suffix: "+", prefix: "", color: "from-purple-500/90 to-purple-700/80" },
    { label: "Events per Month", value: 14, suffix: "+", prefix: "", color: "from-blue-600/90 to-purple-600/80" },
  ], []); // Empty dependency array means it's created only once

  // State to track if section is in view for animation
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null); // Typed the ref

  // Counter animation states
  const [counters, setCounters] = useState(stats.map(() => 0));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          // Optional: Unobserve after first intersection if animation only runs once
          // observer.unobserve(entries[0].target);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current; // Store ref value

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef); // Use stored value in cleanup
      }
    };
  }, []); // Empty dependency array is correct here

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
      intervals.forEach((interval) => {
        if (interval) clearInterval(interval);
      }); // Added check for interval existence
    };
  }, [isInView, stats]); // stats is now stable due to useMemo

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut"
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-gradient-to-r from-blue-900/90 to-purple-900/80 text-white relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-8 bg-white/5" style={{ backdropFilter: 'blur(40px)' }}></div>
      <div className="absolute bottom-0 left-0 w-full h-8 bg-white/5" style={{ backdropFilter: 'blur(40px)' }}></div>
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
            Uni Hub by the Numbers
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100 leading-relaxed">
            Join thousands of students already connecting and collaborating on
            our platform.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants} className="text-center">
              <div className="transform transition-all duration-300 hover:scale-105">
                <div className={`relative rounded-2xl bg-gradient-to-br ${stat.color} p-6 shadow-lg backdrop-blur-sm ring-1 ring-white/10`}>
                  <div className="absolute inset-0 bg-blue-500/5 rounded-2xl backdrop-blur-sm"></div>
                  <p className="relative text-5xl font-bold text-white flex justify-center items-center">
                    <span>{stat.prefix}</span>
                    <span className="tabular-nums">{counters[index]}</span>
                    <span>{stat.suffix}</span>
                  </p>
                  <p className="relative mt-2 text-lg font-medium text-blue-100">
                    {stat.label}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <motion.div variants={itemVariants} className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-white/10 transform transition-all duration-300 hover:translate-y-[-5px]">
            <h3 className="text-2xl font-bold text-white mb-4">
              Student Satisfaction
            </h3>
            <div className="flex items-center mt-4">
              <div className="w-full bg-blue-900/40 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-300 to-blue-500 h-3 rounded-full"
                  style={{ width: isInView ? "94%" : "0%", transition: "width 1.5s ease-out" }}
                ></div>
              </div>
              <span className="ml-3 text-white font-bold text-lg">94%</span>
            </div>
            <p className="mt-5 text-blue-100 text-lg">
              Students reporting improved university experience.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-white/10 transform transition-all duration-300 hover:translate-y-[-5px]">
            <h3 className="text-2xl font-bold text-white mb-4">
              Event Attendance
            </h3>
            <div className="flex items-center mt-4">
              <div className="w-full bg-blue-900/40 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-300 to-indigo-500 h-3 rounded-full"
                  style={{ width: isInView ? "78%" : "0%", transition: "width 1.5s ease-out" }}
                ></div>
              </div>
              <span className="ml-3 text-white font-bold text-lg">78%</span>
            </div>
            <p className="mt-5 text-blue-100 text-lg">
              Increase in student participation at campus events.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-white/10 transform transition-all duration-300 hover:translate-y-[-5px]">
            <h3 className="text-2xl font-bold text-white mb-4">
              Networking Success
            </h3>
            <div className="flex items-center mt-4">
              <div className="w-full bg-blue-900/40 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-300 to-purple-500 h-3 rounded-full"
                  style={{ width: isInView ? "85%" : "0%", transition: "width 1.5s ease-out" }}
                ></div>
              </div>
              <span className="ml-3 text-white font-bold text-lg">85%</span>
            </div>
            <p className="mt-5 text-blue-100 text-lg">
              Students making valuable connections for their careers.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
