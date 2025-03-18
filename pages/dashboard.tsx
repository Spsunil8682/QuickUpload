
"use client"; // Marks the component as client-side
import React, { useRef, useState } from "react";
import axios, { AxiosError } from "axios";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { Upload, Download, File as FileIcon, Folder, User } from "lucide-react";

interface FileState {
  file: File | null;
  folder?: FileList | null;
  preview?: string;
  uploadProgress: number;
  type: "file" | "folder";
}


export default function FileUploadDownload() {
  const { user ,isLoading  } = useAuth();
  const router = useRouter();
  useEffect(() => {
    // const token = localStorage.getItem("token");
    if (!isLoading  && !user) {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, [user, isLoading ,router]);
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    folder: null,
    uploadProgress: 0,
    type: "file",
  });

  // const [folderName, setFolderName] = useState<string>("");
  const [Loading, setLoading] = useState({
    upload: false,
    download: false,
  });
  const folderInputRef = useRef<HTMLInputElement>(null);

  //  fetch data function
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ["image/jpeg", "image/png"];

      if (!allowedTypes.includes(selectedFile.type)) {
        alert("Only JPG and PNG files are allowed.");
        e.target.value = "";
        return;
      }

      setFileState({
        file: selectedFile,
        folder: null,
        uploadProgress: 0,
        type: "file",
      });
    }
  };
  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      setFileState({
        file: null,
        folder: e.target.files,
        uploadProgress: 0,
        type: "folder",
      });
    }
    // e.target.value = '';
  };

  const handleUpload = async () => {
    if ((!fileState.file && !fileState.folder) || Loading.upload) {
      return;
    }

    setLoading((prev) => ({ ...prev, upload: true }));
    const formData = new FormData();
    // formData.append('file', fileState.file);

    try {
      formData.append("userId", user?._id || "");
      console.log("user id", user?._id);
      // formData.append("userId", user.id);
      if (fileState.type === "file" && fileState.file) {

        // Check if file already exists before uploading
      try {
        const checkResponse = await axios.get(`/api/check-file?userId=${user?._id}&fileName=${fileState.file.name}`);
        
        if (checkResponse.data.exists) {
          alert("File already exists");
          setFileState({
            file: null,
            folder: null,
            uploadProgress: 0,
            type: "file",
          });
          setLoading((prev) => ({ ...prev, upload: false }));
          return;
        }
      } catch (error) {
        console.error("Error checking file existence:", error);
        // Continue with upload if the check fails
      }
        
        // Single file upload to S3
        formData.append("file", fileState.file);
        const response = await axios.post("/api/upload-file", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setFileState((prev) => ({ ...prev, uploadProgress: progress }));
          },
        });

        if (response.data.success) {
          alert("File uploaded successfully!");
          console.log("File URL:", response.data.url);
        }
      } else if (fileState.type === "folder" && fileState.folder) {

        // extract folder name from the first filles webkitrelativePath
        const firstFile = fileState.folder[0];
        const extractedFolderName = firstFile.webkitRelativePath.split("/")[0];
        console.log("Folder name:", extractedFolderName);
        console.log("firstFile",firstFile);


        try {
          const checkResponse = await axios.get(`/api/check-folder?userId=${user?._id}&folderName=${extractedFolderName}`);
          
          if (checkResponse.data.exists) {
            alert("A folder with this name already exists. Please rename the folder and try again.");
            setFileState({
              file: null,
              folder: null,
              uploadProgress: 0,
              type: "file",
            });
            setLoading((prev) => ({ ...prev, upload: false }));
            return;
          }
        } catch (error) {
          console.error("Error checking folder existence:", error);
          // Continue with upload if the check fails
        }
        // Folder upload to S3 with multiple files
        Array.from(fileState.folder).forEach((file) => {
          formData.append("files", file, file.webkitRelativePath || file.name);
        });

        formData.append("folderName",extractedFolderName );

        const response = await axios.post("/api/upload-folder", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setFileState((prev) => ({ ...prev, uploadProgress: progress }));
          },
        });

        if (response.data.success) {
          alert(
            `Folder uploaded successfully! ${response.data.urls?.length} files uploaded.`
          );
          console.log("Uploaded File URLs:", response.data.urls);
        }
      }

      setFileState({
        file: null,
        folder: null,
        uploadProgress: 0,
        type: "file",
      });
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || "Upload failed"
          : "An unexpected error occurred";
      alert(errorMessage);
    } finally {
      setLoading((prev) => ({ ...prev, upload: false }));
    }
  };

  const handleDownload = async () => {
    setLoading((prev) => ({ ...prev, download: true }));

    try {
      const response = await axios.get("/api/download", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "dowanloaded_file");
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || "Download failed"
          : "An unexpected error occurred";
      alert(errorMessage);
    } finally {
      setLoading((prev) => ({ ...prev, download: false }));
    }
  };
  const triggerFolderInput = () => {
    folderInputRef.current?.click();
  };

  // navigate to profile page
  const navigateToProfile = () => {
    router.push("/Profile");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={navigateToProfile}
            className="flex items-center p-2 rounded-full hover:bg-gray-200"
          >
            <User className="w-6 h-6 text-gray-600" />
          </button>
          {/* <User className="w-6 h-6 text-gray-600" /> */}
          <span className="text-gray-700 font-medium">
            {user?.name || "John Doe"}
          </span>
        </div>
      </div>
      {/* </div> */}

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
            File and Folder Upload
          </h1>

          <div className="mb-8 space-y-6">
            <div className="flex gap-4">
              <label
                className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={() =>
                  setFileState((prev) => ({ ...prev, type: "file" }))
                }
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileIcon className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Upload File</span>
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png"
                />
              </label>

              <label
                className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={triggerFolderInput}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Folder className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Upload Folder</span>
                  </p>
                </div>
                <input
                  type="file"

                  className="hidden"
                  onChange={handleFolderChange}
                  webkitdirectory="true"

                  multiple
                  // directory
                />
              </label>
            </div>

            {fileState.file && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <FileIcon className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-blue-700 font-medium">
                  {fileState.file.name}
                </span>
                <span className="text-xs text-blue-500">
                  ({(fileState.file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}

            {fileState.folder && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Folder className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700 font-medium">
                  {fileState.folder.length} file(s) selected
                </span>
              </div>
            )}

            {fileState.uploadProgress > 0 && fileState.uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${fileState.uploadProgress}%` }}
                />
              </div>
            )}

            <button
              // disabled={Loading.upload}
              onClick={handleUpload}
              disabled={
                (!fileState.file && !fileState.folder) || Loading.upload
              }
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium
                ${
                  (!fileState.file && !fileState.folder) || Loading.upload
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                } 
                transition-colors`}
            >
              <Upload className="w-5 h-5" />
              {Loading.upload
                ? `Uploading ${fileState.uploadProgress}%`
                : `Upload ${fileState.type === "file" ? "File" : "Folder"}`}
            </button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* dowanload button  yaha se start*/}
          <button
            onClick={handleDownload}
            disabled={Loading.download}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium
              ${
                Loading.download
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 active:bg-green-700"
              } 
              transition-colors`}
          >
            <Download className="w-5 h-5" />
            {Loading.download ? "Downloading..." : "Download File"}
          </button>
        </div>
      </div>
    </div>
  );
}
