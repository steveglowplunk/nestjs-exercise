import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../typeorm/entities/User.js';
import { Profile } from '../typeorm/entities/Profile.js';
import { Post } from '../typeorm/entities/Post.js';
import { CreateUserData, UpdateUserData, CreateUserProfileData, CreateUserPostData } from '../utils/types.js';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Profile) private profileRepository: Repository<Profile>,
        @InjectRepository(Post) private postRepository: Repository<Post>
    ) { }

    async fetchAllUsers() {
        const users = await this.userRepository.find({
            relations: { profile: true, posts: true },
        });
        return users;
    }

    createUser(userDetails: CreateUserData) {
        const newUser = this.userRepository.create({ ...userDetails, createdAt: new Date() });
        return this.saveUser(newUser);
    }

    async updateUser(id: number, userDetails: UpdateUserData) {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.saveUser({ ...user, ...userDetails });
    }

    async deleteUser(id: number) {
        const result = await this.userRepository.delete(id);
        if (!result.affected) {
            throw new NotFoundException('User not found');
        }
    }

    private async saveUser(user: User) {
        try {
            return await this.userRepository.save(user);
        } catch (error) {
            if (this.isUsernameConflict(error)) {
                throw new ConflictException('Username already exists');
            }
            throw error;
        }
    }

    private isUsernameConflict(error: unknown) {
        if (!(error instanceof QueryFailedError) || error.driverError?.code !== 'ER_DUP_ENTRY') {
            return false;
        }
        const { indices, uniques } = this.userRepository.metadata;
        const usernameKeys = [...indices.filter((index) => index.isUnique), ...uniques]
            .filter(({ columns }) => columns.length === 1 && columns[0].propertyName === 'username')
            .map(({ name }) => name);
        const message: string = error.driverError.sqlMessage ?? error.message;
        return usernameKeys.some((key) => message.includes(`'${key}'`) || message.includes(`.${key}'`));
    }

    async createUserProfile(id: number, createUserProfileDetails: CreateUserProfileData) {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const newProfile = this.profileRepository.create(createUserProfileDetails);
        const savedProfile = await this.profileRepository.save(newProfile);
        user.profile = savedProfile;
        return await this.userRepository.save(user);
    }

    async createUserPost(id: number, createUserPostDetails: CreateUserPostData) {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const newPost = this.postRepository.create({...createUserPostDetails, user});
        return await this.postRepository.save(newPost);
    }
}
