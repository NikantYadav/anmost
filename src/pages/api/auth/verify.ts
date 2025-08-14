import 'reflect-metadata';
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { getEM } from '../../../lib/db';
import { User } from '../../../entities/User.entity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const em = await getEM();
    const user = await em.findOne(User, { id: decoded.userId });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}