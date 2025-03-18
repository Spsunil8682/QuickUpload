export interface Folder {
    _id?: string;
    userId: string;
    folderName: string;
    subFolders: SubFolder[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface SubFolder {
    name: string;
    files: FileInfo[];
  }
  
  export interface FileInfo {
    fileName: string;
    fileUrl: string;
    uploadedAt: Date;
  }