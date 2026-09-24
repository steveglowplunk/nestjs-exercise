import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { User } from '../typeorm/entities/User.js';
import { Profile } from '../typeorm/entities/Profile.js';
import { Post } from '../typeorm/entities/Post.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile, Post])],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
