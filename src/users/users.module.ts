import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

import { Client, DeliveryMan, Owner, User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UserRepository } from './repositories/userRepository';
import { UserResolver } from './users.resolver';
import { UserService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserRepository,
      Owner,
      DeliveryMan,
      Client,
      UserRepository,
      Verification,
    ]),
  ],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UsersModule {}
