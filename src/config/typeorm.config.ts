import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import 'dotenv/config';
import { User } from '../typeorm/entities/User.js';
import { Profile } from '../typeorm/entities/Profile.js';
import { Post } from '../typeorm/entities/Post.js';

const config: TypeOrmModuleOptions = {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'my_lab_db',
    entities: [User, Profile, Post],
    synchronize: true,
};
export const typeOrmConfig = config;
