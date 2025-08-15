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

  const { id } = req.query;
  const environmentId = parseInt(id as string);

  if (req.method === 'PUT') {
    try {
      const { name, variables = [] } = req.body;

      const environment = await withORM(async (em) => {
        const existingEnvironment = await em.findOne(Environment, { id: environmentId, user });
        
        if (!existingEnvironment) {
          return null;
        }

        existingEnvironment.name = name;
        existingEnvironment.variables = variables;

        await em.flush();
        return existingEnvironment;
      });

      if (!environment) {
        return res.status(404).json({ error: 'Environment not found' });
      }

      const formattedEnvironment = {
        id: environment.id.toString(),
        name: environment.name,
        variables: environment.variables
      };

      res.json(formattedEnvironment);
    } catch (error) {
      console.error('Error updating environment:', error);
      res.status(500).json({ error: 'Failed to update environment' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const deleted = await withORM(async (em) => {
        const environment = await em.findOne(Environment, { id: environmentId, user });
        
        if (!environment) {
          return false;
        }

        await em.removeAndFlush(environment);
        return true;
      });

      if (!deleted) {
        return res.status(404).json({ error: 'Environment not found' });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting environment:', error);
      res.status(500).json({ error: 'Failed to delete environment' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}