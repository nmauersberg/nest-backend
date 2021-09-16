import { Injectable } from '@nestjs/common';
import { PouchDBService } from '../pouchdb/pouchdb.service';
import { User } from '../types/user.type';

@Injectable()
export class UsersService {
  constructor(private readonly pouchDBService: PouchDBService) {}

  async findOneByUsername(username: string): Promise<User | undefined> {
    const users = await this.pouchDBService.fetch('_users');
    return users.find(user => user.username === username);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    const users = await this.pouchDBService.fetch('_users');
    return users.find(user => user.email === email);
  }

  async findOneById(userId: string): Promise<User | undefined> {
    const users = await this.pouchDBService.fetch('_users');
    return users.find(user => user._id === userId);
  }
}
