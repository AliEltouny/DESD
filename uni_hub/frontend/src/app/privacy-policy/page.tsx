"use client";

import React from "react";
import Link from "next/link";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 md:p-10 rounded-lg shadow-md">
          <Link
            href="/register"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium"
          >
            <svg
              className="w-4 h-4 mr-1"
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
            Back to registration
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Information We Collect
              </h2>
              <p className="mb-6 text-gray-800">
                Uni Hub collects information that you provide directly, such as
                when you create an account, join communities, or interact with
                other users. This includes your name, email address, university
                affiliation, and profile information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. How We Use Your Information
              </h2>
              <p className="mb-4 text-gray-800">
                We use your information to provide, personalize, and improve our
                services. This includes:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-800">
                <li>Creating and managing your account</li>
                <li>Connecting you with university communities and events</li>
                <li>Sending you important notifications</li>
                <li>Ensuring security and preventing fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Information Sharing
              </h2>
              <p className="mb-4 text-gray-800">
                We do not sell your personal information. We may share certain
                information:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-800">
                <li>
                  With other users as part of normal platform functionality
                </li>
                <li>With service providers who help us operate the platform</li>
                <li>If required by law or to protect rights and safety</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Data Security
              </h2>
              <p className="mb-6 text-gray-800">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Your Rights
              </h2>
              <p className="mb-6 text-gray-800">
                Depending on your location, you may have rights regarding your
                personal data, including rights to access, correct, delete, or
                restrict use of your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Changes to This Policy
              </h2>
              <p className="mb-6 text-gray-800">
                We may update this Privacy Policy from time to time. We will
                notify you of significant changes through the platform or by
                email.
              </p>
            </section>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Contact Us
              </h2>
              <p className="mb-6 text-gray-800">
                If you have questions about this Privacy Policy, please contact
                us at{" "}
                <a
                  href="mailto:privacy@unihub.com"
                  className="text-blue-600 font-medium hover:text-blue-800 underline"
                >
                  privacy@unihub.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
