import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthServiceClient } from './auth-service.client';
import { JwtAuthGuard } from './Jwt.Auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecretKey',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [JwtStrategy,JwtAuthGuard, AuthServiceClient],
  exports: [JwtModule, JwtAuthGuard, AuthServiceClient],
})
export class AuthModule {}
