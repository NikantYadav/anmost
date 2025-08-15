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

  if (req.method === 'GET') {
    try {
      const history = await withORM(async (em) => {
        return em.find(History, { user }, { orderBy: { createdAt: 'DESC' }, limit: 100 });
      });

      const formattedHistory = history.map(item => ({
        id: item.id.toString(),
        method: item.method,
        url: item.url,
        status: item.status,
        duration: item.duration,
        timestamp: item.createdAt.getTime()
      }));

      res.json(formattedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  } else if (req.method === 'POST') {
    try {
      const { method, url, status, duration } = req.body;

      if (!method || !url) {
        return res.status(400).json({ error: 'Method and URL are required' });
      }

      const historyItem = await withORM(async (em) => {
        const newHistoryItem = em.create(History, {
          method,
          url,
          status,
          duration,
          user
        });

        await em.persistAndFlush(newHistoryItem);
        return newHistoryItem;
      });

      const formattedHistoryItem = {
        id: historyItem.id.toString(),
        method: historyItem.method,
        url: historyItem.url,
        status: historyItem.status,
        duration: historyItem.duration,
        timestamp: historyItem.createdAt.getTime()
      };

      res.status(201).json(formattedHistoryItem);
    } catch (error) {
      console.error('Error creating history item:', error);
      res.status(500).json({ error: 'Failed to create history item' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await withORM(async (em) => {
        await em.nativeDelete(History, { user });
      });

      res.status(204).end();
    } catch (error) {
      console.error('Error clearing history:', error);
      res.status(500).json({ error: 'Failed to clear history' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}