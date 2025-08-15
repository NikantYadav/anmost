import 'reflect-metadata';
import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { User } from './User';

@Entity()
export class Environment {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'json' })
  variables!: { key: string; value: string; enabled: boolean }[];

  @ManyToOne(() => User)
  user!: User;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}