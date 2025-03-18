/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const { userId, folderName, files } = req.body;

    if (!userId || !folderName || !files) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId, folderName, and files are required' 
      });
    }

    // Group files by their subfolder path
    const subFolders = files.reduce((acc: any, file: { fileName: string; url: string }) => {
      const pathParts = file.fileName.split('/');
      const subFolderName = pathParts.length > 1 ? pathParts[0] : '';
      
      if (!acc[subFolderName]) {
        acc[subFolderName] = [];
      }
      
      acc[subFolderName].push({
        fileName: pathParts[pathParts.length - 1],
        fileUrl: file.url,
        uploadedAt: new Date()
      });
      
      return acc;
    }, {});

    // Create folder document
    const folderDoc = {
      userId,
      folderName,
      subFolders: Object.entries(subFolders).map(([name, files]) => ({
        name,
        files
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('folders').insertOne(folderDoc);

    return res.status(200).json({
      success: true,
      message: 'Folder information stored successfully',
      folderId: result.insertedId
    });
  } catch (error) {
    console.error('Store folder error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}