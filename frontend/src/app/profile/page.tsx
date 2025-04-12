'use client';

import React, { useEffect, useState } from 'react';
import axios from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { parseCookies } from 'nookies';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture: string;
  date_of_birth: string;
  academic_year: string;
  phone_number: string;
  nationality: string;
  join_date: string;
  interests: string;
}

const countryOptions = [
  'Pakistan', 'India', 'United Kingdom', 'United States', 'Canada',
  'Germany', 'France', 'Saudi Arabia', 'UAE', 'Bangladesh',
  'China', 'Australia', 'Egypt', 'Other',
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [nationality, setNationality] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [passwords, setPasswords] = useState({ old: '', new: '' });
  const router = useRouter();

  useEffect(() => {
    const cookies = parseCookies();
    const token = cookies.accessToken;

    if (!token) {
      router.push('/login');
      return;
    }

    axios.get('/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setProfile(res.data);
        setBio(res.data.bio);
        setInterests(res.data.interests);
        setNationality(res.data.nationality);
      })
      .catch(err => {
        console.error("❌ Profile fetch error:", err.response?.data || err.message);
        router.push('/login');
      });
  }, []);

  const handleUpdate = async () => {
    const cookies = parseCookies();
    const token = cookies.accessToken;

    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('interests', interests);
    formData.append('nationality', nationality);
    if (selectedFile) formData.append('profile_picture', selectedFile);

    console.log("🧪 Sending data to update:", { bio, interests, nationality, selectedFile });

    try {
      await axios.patch('/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Profile updated!');
    } catch (error: any) {
      console.error("❌ Update error:", error.response?.data || error.message);
      toast.error('Update failed');
    }
  };

  const handlePasswordChange = async () => {
    const cookies = parseCookies();
    const token = cookies.accessToken;

    try {
      await axios.post('/change-password', {
        old_password: passwords.old,
        new_password: passwords.new,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Password changed successfully!');
      setPasswords({ old: '', new: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    }
  };

  if (!profile) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="text-center mt-10 text-lg">Loading profile...</div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto px-6 py-10 bg-white shadow-xl rounded-2xl mt-10 space-y-8">
        <div className="text-center">
          <img
            src={profile.profile_picture}
            alt="Profile"
            className="w-28 h-28 rounded-full mx-auto object-cover shadow"
          />
          <h2 className="text-2xl font-semibold mt-4">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-gray-600 text-sm">@{profile.username}</p>
          <p className="text-gray-500 text-sm">{profile.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium text-sm text-gray-700 mb-1">Bio:</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block font-medium text-sm text-gray-700 mb-1">Interests:</label>
            <textarea
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block font-medium text-sm text-gray-700 mb-1">Phone:</label>
            <input
              type="text"
              value={profile.phone_number}
              disabled
              className="w-full border rounded-lg p-2 bg-gray-100 text-sm"
            />
          </div>
          <div>
            <label className="block font-medium text-sm text-gray-700 mb-1">Nationality:</label>
            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            >
              {countryOptions.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-sm text-gray-700 mb-1">Date of Birth:</label>
            <input
              type="text"
              value={profile.date_of_birth}
              disabled
              className="w-full border rounded-lg p-2 bg-gray-100 text-sm"
            />
          </div>
          <div>
            <label className="block font-medium text-sm text-gray-700 mb-1">Academic Year:</label>
            <input
              type="text"
              value={profile.academic_year}
              disabled
              className="w-full border rounded-lg p-2 bg-gray-100 text-sm"
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block font-medium text-sm text-gray-700 mb-1">Profile Picture:</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleUpdate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          Save Changes
        </button>

        <hr />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
          <input
            type="password"
            placeholder="Old Password"
            value={passwords.old}
            onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
            className="w-full border rounded-lg p-2 text-sm"
          />
          <input
            type="password"
            placeholder="New Password"
            value={passwords.new}
            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            className="w-full border rounded-lg p-2 text-sm"
          />
          <button
            onClick={handlePasswordChange}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition"
          >
            Update Password
          </button>
        </div>

        <hr />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Communities You're In</h3>
          <p className="text-gray-500 text-sm">Coming soon...</p>

          <h3 className="text-lg font-semibold text-gray-800 mt-4">Events You've Joined</h3>
          <p className="text-gray-500 text-sm">Coming soon...</p>
        </div>

        <div className="text-center mt-8">
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition"
            onClick={() => {
              document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              localStorage.removeItem('user');
              router.push('/login');
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}