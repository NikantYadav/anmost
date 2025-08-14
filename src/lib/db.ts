import 'reflect-metadata';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { User } from '../entities/User.entity';

let orm: MikroORM | null = null;

export async function getORM() {
  if (orm) {
    return orm;
  }

  try {
    orm = await MikroORM.init({
      entities: [User],
      driver: SqliteDriver,
      dbName: './database.sqlite',
      debug: process.env.NODE_ENV === 'development',
      allowGlobalContext: true,
    });

    // Create schema if it doesn't exist
    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();

    return orm;
  } catch (error) {
    console.error('Failed to initialize ORM:', error);
    throw error;
  }
}

export async function getEM(): Promise<EntityManager> {
  const orm = await getORM();
  return orm.em.fork();
}

export async function withORM<T>(callback: (em: EntityManager) => Promise<T>): Promise<T> {
  const em = await getEM();
  return callback(em);
}