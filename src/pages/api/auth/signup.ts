import 'reflect-metadata';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getEM } from '../../../lib/db';
import { User } from '../../../entities/User.entity';
import { hashPassword, generateToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const em = await getEM();
    
    // Check if user already exists
    const existingUser = await em.findOne(User, { email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const hashedPassword = await hashPassword(password);
    const user = em.create(User, {
      email,
      password: hashedPassword,
      name,
    });

    await em.persistAndFlush(user);

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}