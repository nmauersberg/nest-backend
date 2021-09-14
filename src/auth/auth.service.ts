import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { saltHashPassword, genRandomString } from './tokenizer';
import { JwtService } from '@nestjs/jwt';
import { PouchDBService } from '../pouchdb/pouchdb.service';
import { Tools } from '../lib/tools.service';
import { User, SubmittedUser, SubmittedProviderData } from '../types/user.type';
import { MailerService } from '../mailer/mailer.service';
import { CloudinaryAsset } from 'src/types/cloudinary.type';
const tools = new Tools;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly pouchDBService: PouchDBService,
    private readonly mailerService: MailerService
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user =
      await this.usersService.findOneByUsername(identifier) ||
      await this.usersService.findOneByEmail(identifier);
    if (user && JSON.stringify(user.password) === JSON.stringify(saltHashPassword(pass, user.password.salt))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async findUser(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (user) {
      return true;
    }
    return null;
  }

  async usernameAvailable(username: string) {
    const user = await this.usersService.findOneByUsername(username);
    if (user) {
      return false;
    }
    return true;
  }

  async emailAvailable(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      return false;
    }
    return true;
  }

  login(user: { username: string, _id: string }) {
    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id: user._id,
        username: user.username
      }
    };
  }

  async register(user: SubmittedUser) {
    const usernameAvailable = await this.usernameAvailable(user.username);
    const emailAvailable = await this.emailAvailable(user.email);
    if (!usernameAvailable) {
      return {
        message: 'username not available!'
      }
    }
    if (!emailAvailable) {
      return {
        message: 'email not available!'
      }
    }
    const randomString = tools.genRandomString(25);
    const createdAt = (new Date()).toISOString();
    const newUser = {
      email: user.email,
      username: user.username,
      role: user.role,
      password: saltHashPassword(user.password, genRandomString()),
      newsletterConsent: {
        active: user.newsletterConsent || false,
        timestamp: createdAt
      },
      emailVerified: {
        active: false,
        timestamp: null
      }
    }
    const newUserId = `${createdAt}-${randomString}`;
    await this.pouchDBService.createDatabase('_users');
    await this.pouchDBService.postDoc('_users', newUserId, newUser);

    const verificationToken = tools.genRandomString(25);
    const verificationId = `${createdAt}-${verificationToken}`;
    const verificationElement = {
      userId: newUserId,
      token: verificationToken
    }

    await this.pouchDBService.createDatabase('__veriToken');
    await this.pouchDBService.postDoc('__veriToken', verificationId, verificationElement);

    this.mailerService.sendActivationLink(newUser, newUserId, verificationToken);
    return {
      message: 'user created!'
    }
  }

  async verifyEmail(userId: string, token: string) {
    const verificationItems = await this.pouchDBService.fetch('__veriToken');
    const verificationElement = verificationItems.find(veriItem => veriItem.userId === userId && veriItem.token === token);
    if (verificationElement) {
      verificationElement.verified = true;
      verificationElement.timestamp = new Date().toISOString();
      this.pouchDBService.putDoc('__veriToken', verificationElement._id, verificationElement);
      const userToUpdate: any = await this.pouchDBService.getDoc('_users', userId);
      userToUpdate.emailVerified = {
        active: true,
        timestamp: new Date().toISOString()
      }
      this.pouchDBService.putDoc('_users', userId, userToUpdate);
      return {
        message: 'email verified!'
      }
    }
    return {
      message: 'error verifying email!'
    }
  }

  async saveAsset(userId: string, asset: CloudinaryAsset) {
    const result = await this.pouchDBService.postDoc('_assets', `${userId}-${asset.asset_id}`, asset);
    if (!result.ok) {
      throw new Error("Asset could not be saved!");
    }
    return result;
  }
}