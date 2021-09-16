import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PouchDBModule } from './pouchdb/pouchdb.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, UsersModule, PouchDBModule],
  controllers: [],
  providers: [],
})

export class AppModule {};
