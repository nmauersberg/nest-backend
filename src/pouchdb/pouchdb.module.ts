import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';
import { PouchDBService } from './pouchdb.service';
import { PouchDBController } from './pouchdb.controller';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants(),
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [PouchDBController],
  providers: [PouchDBService, JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ApiKeyAuthGuard,
    },],
  exports: [JwtModule],
})
export class PouchDBModule {}