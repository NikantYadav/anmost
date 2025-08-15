import 'reflect-metadata';
import { defineConfig } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { User } from './src/entities/User';
import { Collection, Request } from './src/entities/Collection';
import { Environment } from './src/entities/Environment';
import { History } from './src/entities/History';

export default defineConfig({
  entities: [User, Collection, Request, Environment, History],
  driver: SqliteDriver,
  dbName: './database.sqlite',
  debug: process.env.NODE_ENV === 'development',
  discovery: {
    warnWhenNoEntities: false,
  },
});