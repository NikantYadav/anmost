import 'reflect-metadata';
import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection as MikroCollection, Unique } from '@mikro-orm/core';
import { User } from './User';

@Entity()
@Unique({ properties: ['name', 'user'] })
export class Collection {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => User)
  user!: User;

  @OneToMany(() => Request, request => request.collection, { orphanRemoval: true })
  requests = new MikroCollection<Request>(this);

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}

@Entity()
export class Request {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  name!: string;

  @Property()
  method!: string;

  @Property()
  url!: string;

  @Property({ type: 'json' })
  headers!: { key: string; value: string; enabled: boolean }[];

  @Property({ type: 'text' })
  body!: string;

  @Property()
  bodyType!: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';

  @ManyToOne(() => Collection)
  collection!: Collection;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}