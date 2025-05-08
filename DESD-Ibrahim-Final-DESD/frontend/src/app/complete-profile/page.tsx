'use client';

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import '@/firebase'; 


const CompleteProfilePage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail') || '';
    const fullName = localStorage.getItem('userName') || '';
    const [first, last = ''] = fullName.split(' ');

    setEmail(storedEmail);
    setDisplayName(fullName);
    setFirstName(first);
    setLastName(last);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = getAuth().currentUser;
      if (!user) {
        alert('User not logged in. Please sign in again.');
        return;
      }

      const firebaseToken = await user.getIdToken();

      const response = await fetch('http://localhost:8000/api/firebase-register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          email,
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dob,
          academic_year: academicYear,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        document.cookie = `accessToken=${data.access}; path=/`;
        document.cookie = `refreshToken=${data.refresh}; path=/`;

        alert('✅ Profile completed! Redirecting...');
        window.location.href = '/dashboard';
      } else {
        console.error('❌ Server error:', data);
        alert(data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error('❌ Submit failed:', err);
      alert('Request failed.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-xl shadow-md">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        Complete Your Profile
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 p-2 rounded"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 p-2 rounded"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            type="date"
            className="mt-1 block w-full border border-gray-300 p-2 rounded"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Academic Year</label>
          <select
            className="mt-1 block w-full border border-gray-300 p-2 rounded"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            required
          >
            <option value="">Select Year</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>

          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Submit & Continue
        </button>
      </form>
    </div>
  );
};

export default CompleteProfilePage;
