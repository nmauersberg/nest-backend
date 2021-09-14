import { Controller, Request, Post, Get, UseGuards, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequestUser, SubmittedUser } from 'src/types/user.type';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService
  ) {}

  @Post('register')
  async register(@Request() req: { body: SubmittedUser }) {
    const response = await this.authService.register(req.body);
    return response;
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: RequestUser) {
    return this.authService.login(req.user);
  }

  @Get('verify/:userId/:token')
  async verifyEmail(@Param() params: { userId: string, token: string }) {
    const response = await this.authService.verifyEmail(params.userId, params.token);
    return response;
  }

  @Get('username-available/:username')
  async checkUsername(@Param() param: { username: string }) {
    return this.authService.usernameAvailable(param.username);
  }

  @Get('email-available/:email')
  async checkEmail(@Param() param: { email: string }) {
    return this.authService.emailAvailable(param.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('current')
  async getProfile(@Request() req: RequestUser) {
    const user = await this.authService.findUser(req.user._id);
    if (user) {
      return req.user;
    }
    return null;
  }
}