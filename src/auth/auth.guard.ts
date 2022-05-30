import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { JwtService } from 'src/jwt/jwt.service';
import { UserRepository } from 'src/users/repositories/userRepository';
import { UserService } from 'src/users/users.service';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );
    // if not set role, it is public access
    if (!roles) return true;

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext?.token;
    if (!token) return false;

    const decoded = this.jwtService.verify(token.toString());
    if (!decoded.hasOwnProperty('id')) return false;

    const user = await this.userRepository.findById(+decoded['id']);
    // If the role is not allowed, access to the client is restricted by authGuard
    if (!user) return false;

    gqlContext.user = user;

    return roles.includes('Any') ? true : roles.includes(user.role);
  }
}
