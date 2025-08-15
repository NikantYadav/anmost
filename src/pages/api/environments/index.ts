import { NextApiRequest, NextApiResponse } from 'next';
import { withORM } from '../../../lib/db';
import { Environment } from '../../../entities/Environment';
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
      const environments = await withORM(async (em) => {
        return em.find(Environment, { user });
      });

      const formattedEnvironments = environments.map(env => ({
        id: env.id.toString(),
        name: env.name,
        variables: env.variables
      }));

      res.json(formattedEnvironments);
    } catch (error) {
      console.error('Error fetching environments:', error);
      res.status(500).json({ error: 'Failed to fetch environments' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, variables = [] } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Environment name is required' });
      }

      const environment = await withORM(async (em) => {
        const newEnvironment = em.create(Environment, {
          name: name as string,
          variables: variables as { key: string; value: string; enabled: boolean }[],
          user,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await em.persistAndFlush(newEnvironment);
        return newEnvironment;
      });

      const formattedEnvironment = {
        id: environment.id.toString(),
        name: environment.name,
        variables: environment.variables
      };

      res.status(201).json(formattedEnvironment);
    } catch (error) {
      console.error('Error creating environment:', error);
      res.status(500).json({ error: 'Failed to create environment' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}