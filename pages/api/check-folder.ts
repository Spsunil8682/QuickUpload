import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId, folderName } = req.query;

    if (!userId || !folderName) {
      return res.status(400).json({ message: 'User ID and folder name are required' });
    }

    try {
      const client = await clientPromise;
      const db = client.db();

      // Check if folder already exists
      const existingFolder = await db.collection('users').findOne(
        { _id: new ObjectId(userId as string), 'folders.name': folderName }
      );

      return res.status(200).json({ 
        exists: !!existingFolder,
      });
    } catch (error) {
      console.error('Error checking folder existence:', error);
      res.status(500).json({ message: 'Error checking folder existence' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}