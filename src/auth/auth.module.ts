import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { PouchDBService } from '../pouchdb/pouchdb.service';
import { MailerService } from '../mailer/mailer.service';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants(),
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PouchDBService, MailerService, LocalStrategy, JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ApiKeyAuthGuard,
    },],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}