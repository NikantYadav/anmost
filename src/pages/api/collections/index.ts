import { NextApiRequest, NextApiResponse } from 'next';
import { withORM } from '../../../lib/db';
import { Collection } from '../../../entities/Collection';
import { Request } from '../../../entities/Collection';
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
      const collections = await withORM(async (em) => {
        return em.find(Collection, { user }, { populate: ['requests'] });
      });

      const formattedCollections = collections.map(collection => ({
        id: collection.id.toString(),
        name: collection.name,
        requests: collection.requests.getItems().map(request => ({
          id: request.id.toString(),
          name: request.name,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          bodyType: request.bodyType
        }))
      }));

      res.json(formattedCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      res.status(500).json({ error: 'Failed to fetch collections' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, requests = [] } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Collection name is required' });
      }

      // Check if collection with same name already exists for this user
      const existingCollection = await withORM(async (em) => {
        return em.findOne(Collection, { name, user });
      });

      if (existingCollection) {
        return res.status(409).json({ error: `Collection "${name}" already exists` });
      }

      const collection = await withORM(async (em) => {
        const newCollection = em.create(Collection, {
          name: name as string,
          user,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await em.persistAndFlush(newCollection);

        // Add requests if provided
        for (const requestData of requests) {
          const request = em.create(Request, {
            ...requestData,
            collection: newCollection
          });
          em.persist(request);
        }

        await em.flush();
        await em.populate(newCollection, ['requests']);
        return newCollection;
      });

      const formattedCollection = {
        id: collection.id.toString(),
        name: collection.name,
        requests: collection.requests.getItems().map(request => ({
          id: request.id.toString(),
          name: request.name,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          bodyType: request.bodyType
        }))
      };

      res.status(201).json(formattedCollection);
    } catch (error: Error | unknown) {
      console.error('Error creating collection:', error);
      
      const errorMessage = error instanceof Error ? error.message : '';
      
      // Handle unique constraint violation
      if (errorMessage && errorMessage.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: `Collection "${name}" already exists` });
      }
      
      res.status(500).json({ error: 'Failed to create collection' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}