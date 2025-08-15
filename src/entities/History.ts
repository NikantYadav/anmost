import 'reflect-metadata';
import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { User } from './User';

@Entity()
export class History {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  method!: string;

  @Property()
  url!: string;

  @Property({ nullable: true })
  status?: number;

  @Property({ nullable: true })
  duration?: number;

  @ManyToOne(() => User)
  user!: User;

  @Property()
  createdAt = new Date();
}