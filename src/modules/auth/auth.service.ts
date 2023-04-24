import { User } from '@/models/user.entity';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  jwtVerifyToken(token: string) {
    try {
      const currentUser = this.jwtService.verify(token);
      if (currentUser) {
        return currentUser as User;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
