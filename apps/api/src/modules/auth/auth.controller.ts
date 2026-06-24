import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, CreateOrganizationDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(200)
  async login(@Req() req: Request) {
    return this.authService.login(req.user as { id: string; email: string; name: string | null });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@Req() req: Request) {
    const user = req.user as { sessionId: string };
    await this.authService.logout(user.sessionId);
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const user = req.user as { id: string; email: string; name: string | null };
    const organizations = await this.authService.getOrganizations(user.id);
    return { user: { id: user.id, email: user.email, name: user.name }, organizations };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Redirect handled by passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.login(
      req.user as { id: string; email: string; name: string | null },
    );
    const webUrl = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
    const params = new URLSearchParams({
      token: result.tokens.accessToken,
    });
    res.redirect(`${webUrl}/auth/callback?${params.toString()}`);
  }

  @Get('providers')
  providers() {
    return {
      google: this.authService.isGoogleOAuthEnabled(),
      email: true,
    };
  }

  @Post('organizations')
  @UseGuards(JwtAuthGuard)
  async createOrganization(
    @Req() req: Request,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.authService.createOrganization(
      (req.user as { id: string }).id,
      dto.name,
    );
  }
}
