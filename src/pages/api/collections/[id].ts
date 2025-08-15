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

  const { id } = req.query;
  const collectionId = parseInt(id as string);

  if (req.method === 'PUT') {
    try {
      const { name, requests = [] } = req.body;

      const collection = await withORM(async (em) => {
        const existingCollection = await em.findOne(Collection, { id: collectionId, user }, { populate: ['requests'] });
        
        if (!existingCollection) {
          return null;
        }

        // Check if another collection with the same name exists (excluding current one)
        if (existingCollection.name !== name) {
          const duplicateCollection = await em.findOne(Collection, { name, user });
          if (duplicateCollection && duplicateCollection.id !== collectionId) {
            throw new Error(`Collection "${name}" already exists`);
          }
        }

        existingCollection.name = name;

        // Check for duplicate request names
        const requestNames = requests.map(r => r.name);
        const uniqueNames = new Set(requestNames);
        if (requestNames.length !== uniqueNames.size) {
          throw new Error('Duplicate request names are not allowed within the same collection');
        }

        // Remove existing requests (orphanRemoval will handle deletion)
        existingCollection.requests.removeAll();

        // Add new requests
        for (const requestData of requests) {
          const request = em.create(Request, {
            ...requestData,
            collection: existingCollection
          });
          existingCollection.requests.add(request);
        }

        await em.flush();
        await em.populate(existingCollection, ['requests']);
        return existingCollection;
      });

      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

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

      res.json(formattedCollection);
    } catch (error: any) {
      console.error('Error updating collection:', error);
      
      // Handle duplicate request names
      if (error.message && error.message.includes('Duplicate request names')) {
        return res.status(400).json({ error: error.message });
      }
      
      // Handle duplicate collection name error
      if (error.message && error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      
      // Handle unique constraint violation
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: `Collection "${name}" already exists` });
      }
      
      res.status(500).json({ error: 'Failed to update collection' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const deleted = await withORM(async (em) => {
        const collection = await em.findOne(Collection, { id: collectionId, user });
        
        if (!collection) {
          return false;
        }

        await em.removeAndFlush(collection);
        return true;
      });

      if (!deleted) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting collection:', error);
      res.status(500).json({ error: 'Failed to delete collection' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}