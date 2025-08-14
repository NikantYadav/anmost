import 'reflect-metadata';
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ unique: true })
  email!: string;

  @Property()
  password!: string;

  @Property()
  name!: string;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}