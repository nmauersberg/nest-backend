import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PouchDBService } from '../pouchdb/pouchdb.service';

@Module({
  providers: [UsersService, PouchDBService],
  exports: [UsersService],
})
export class UsersModule { }
