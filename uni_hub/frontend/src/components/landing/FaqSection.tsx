"use client";

import React, { useState } from "react";

const FaqSection = () => {
  const faqs = [
    {
      question: "What is Uni Hub?",
      answer:
        "Uni Hub is a platform designed specifically for university students to connect with their academic community, join interest-based groups, discover campus events, and access resources that enhance their university experience.",
    },
    {
      question: "How do I create an account?",
      answer:
        "Creating an account is simple. Click the 'Sign Up' button, enter your university email address, create a password, and complete your profile with basic information about your academic interests and university affiliation.",
    },
    {
      question: "Is Uni Hub available at my university?",
      answer:
        "Uni Hub is currently available at over 120 universities across the country. You can check if your university is supported by entering your university email during registration. We're constantly expanding our network to include more institutions.",
    },
    {
      question: "How do communities work?",
      answer:
        "Communities are interest-based groups created by students or university departments. You can join existing communities related to your courses, hobbies, or professional interests, or create your own community to connect with like-minded peers.",
    },
    {
      question: "Can I create and promote events?",
      answer:
        "Absolutely! Any registered user can create events that will be visible to their communities or the entire university. The events feature allows you to set dates, locations, add descriptions, and track attendance.",
    },
    {
      question: "Is Uni Hub free to use?",
      answer:
        "Yes, Uni Hub is completely free for all university students. We believe in providing equal access to resources and connections that enhance your educational experience.",
    },
    {
      question: "How is my data protected?",
      answer:
        "We take privacy seriously. Your data is encrypted and stored securely, and we never share personal information with third parties without your consent. You have full control over your profile visibility and what information you share within communities.",
    },
  ];

  // State to track which FAQ is open
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Toggle FAQ open/close
  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
            FAQ
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Find answers to common questions about Uni Hub
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-gray-200 rounded-xl bg-white shadow overflow-hidden">
          {faqs.map((faq, index) => (
            <div key={index} className="group">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                aria-expanded={openIndex === index}
              >
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {faq.question}
                </h3>
                <span className="ml-6 flex-shrink-0">
                  <svg
                    className={`h-6 w-6 transform ${
                      openIndex === index ? "rotate-180" : "rotate-0"
                    } text-blue-500 transition-transform duration-200 ease-in-out`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openIndex === index ? "max-h-96 py-5" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-2">
                  <p className="text-base text-gray-600">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">Still have questions?</p>
          <a
            href="#"
            className="mt-2 inline-block text-blue-600 hover:text-blue-800 font-medium"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
