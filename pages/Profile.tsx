import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { User } from "../types/user";
import Image from "next/image";
import { useRouter } from "next/router";

const Profile = () => {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/user-profile", {
          params: { userId: user?._id },
        });
        setUserData(response.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching user data"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with User Details */}
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {userData?.name}
              </h1>
              <div className="mt-2 flex items-center space-x-4 text-gray-600">
                <span>{userData?.email}</span>
                <span>•</span>
                <div className="flex items-center">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      userData?.isVerified ? "bg-green-500" : "bg-yellow-500"
                    } mr-2`}
                  />
                  <span>
                    {userData?.isVerified ? "Verified" : "Pending Verification"}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Member since:{" "}
                {userData &&
                  new Date(userData.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            aria-label="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-log-out"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="mt-8 space-y-6">
          {/* Folders */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">Folders</h2>
            {userData?.folders && userData.folders.length > 0 ? (
              <div className="space-y-4">
                {userData.folders.map((folder, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">{folder.name}</h3>
                    {/* Image Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
                      {folder.files.map((file, fileIndex) => (
                        <div key={fileIndex} className="relative group">
                          <div className="relative w-full h-40 bg-gray-200 object-contain rounded-lg overflow-hidden transform group-hover:scale-105 transition duration-300">
                            {file.url.match(/\.(jpeg|jpg|gif|png|svg)$/) ? (
                              <Image
                                src={file.url}
                                alt={file.fileName}
                                layout="fill"
                                objectFit="contain"
                                className="rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-sm">
                                No Preview
                              </div>
                            )}
                          </div>

                          {/* File Name Below Image */}
                          <p className="text-sm text-gray-700 mt-2 truncate">
                            {file.fileName}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No folders yet</p>
            )}
          </div>

          {/* Files with Thumbnails */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">Files</h2>
            {userData?.files && userData.files.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userData.files.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden transform group-hover:scale-105 transition duration-300">
                      {file.url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                        <Image
                          src={file.url}
                          alt={file.fileName}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-sm">
                          No Preview
                        </div>
                      )}
                    </div>
                    {/* File Name Below Image */}
                    <p className="text-sm text-gray-700 mt-2 truncate">
                      {file.fileName}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No files yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
