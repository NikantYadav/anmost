import { NextApiRequest, NextApiResponse } from 'next';
import { withORM } from '../../../lib/db';
import { History } from '../../../entities/History';
import { User } from '../../../entities/User.entity';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return await withORM(async (em) => {
      return em.findOne(User, { id: decoded.userId });
    });
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { id } = req.query;
  const historyId = parseInt(id as string);

  if (req.method === 'DELETE') {
    try {
      const deleted = await withORM(async (em) => {
        const historyItem = await em.findOne(History, { id: historyId, user });
        
        if (!historyItem) {
          return false;
        }

        await em.removeAndFlush(historyItem);
        return true;
      });

      if (!deleted) {
        return res.status(404).json({ error: 'History item not found' });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting history item:', error);
      res.status(500).json({ error: 'Failed to delete history item' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}