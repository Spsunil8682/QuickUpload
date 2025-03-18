
export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  isVerified: boolean;
  createdAt: string;
  files: {
    fileName: string;
    url: string;
    uploadedAt: string;
  }[];
  folders: {
    name: string;
    files: {
      fileName: string;
      url: string;
    }[];
    createdAt: string;
  }[];
}
  export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
  }