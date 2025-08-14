import 'reflect-metadata';
import { defineConfig } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { User } from './src/entities/User';

export default defineConfig({
  entities: [User],
  driver: SqliteDriver,
  dbName: './database.sqlite',
  debug: process.env.NODE_ENV === 'development',
  discovery: {
    warnWhenNoEntities: false,
  },
});