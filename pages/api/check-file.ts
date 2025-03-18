import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId, fileName } = req.query;

    if (!userId || !fileName) {
      return res.status(400).json({ message: 'User ID and file name are required' });
    }

    try {
      const client = await clientPromise;
      const db = client.db();

      // Check if file already exists
      const existingFile = await db.collection('users').findOne(
        { _id: new ObjectId(userId as string), 'files.fileName': fileName }
      );

      return res.status(200).json({ 
        exists: !!existingFile,
      });
    } catch (error) {
      console.error('Error checking file existence:', error);
      res.status(500).json({ message: 'Error checking file existence' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
