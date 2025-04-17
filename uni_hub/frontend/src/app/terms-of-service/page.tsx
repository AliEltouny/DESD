"use client";

import React from "react";
import Link from "next/link";

const TermsOfServicePage = () => {
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
            Terms of Service
          </h1>

          <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="mb-6 text-gray-800">
                Welcome to Uni Hub. These Terms of Service govern your use of
                our website and services. By accessing or using Uni Hub, you
                agree to be bound by these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Using Uni Hub
              </h2>
              <p className="mb-6 text-gray-800">
                Uni Hub provides a platform for university students to connect,
                collaborate, and discover events. You must use our services in
                accordance with these terms and our community guidelines.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. User Accounts
              </h2>
              <p className="mb-6 text-gray-800">
                To use Uni Hub, you must create an account using your university
                email. You are responsible for maintaining the security of your
                account and for all activities that occur under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Content
              </h2>
              <p className="mb-6 text-gray-800">
                You retain ownership of content you create and share on Uni Hub.
                By posting content, you grant us a license to use this content
                in connection with our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Community Guidelines
              </h2>
              <p className="mb-6 text-gray-800">
                We expect all users to engage respectfully and constructively
                with other members of the university community. Harassment, hate
                speech, and explicit content are not permitted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Changes to Terms
              </h2>
              <p className="mb-6 text-gray-800">
                We may modify these terms at any time. We&apos;ll notify you of
                significant changes by email or through the platform.
              </p>
            </section>

            <section className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Contact
              </h2>
              <p className="mb-6 text-gray-800">
                If you have any questions about these Terms, please contact us
                at{" "}
                <a
                  href="mailto:support@unihub.com"
                  className="text-blue-600 font-medium hover:text-blue-800 underline"
                >
                  support@unihub.com
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

export default TermsOfServicePage;
