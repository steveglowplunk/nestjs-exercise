import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dtos/CreateUser.dto.js';
import { UpdateUserDto } from './dtos/UpdateUser.dto.js';
import { CreateUserProfileDto } from './dtos/CreateUserProfile.dto.js';
import { CreateUserPostDto } from './dtos/CreateUserPost.dto.js';

@Controller('users')
export class UsersController {
    constructor(private userService: UsersService) { }

    @Get()
    getAllUsers() {
        return this.userService.fetchAllUsers();
    }

    @Post()
    createUser(@Body() createUserDto: CreateUserDto) {
        const { confirmPassword, ...userDetails } = createUserDto;

        if (createUserDto.password !== confirmPassword) {
            throw new BadRequestException('Passwords do not match!!!');
        }

        return this.userService.createUser(userDetails);
    }

    @Patch(':id')
    updateUserById(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        if (!updateUserDto) {
            throw new BadRequestException('Request body is required');
        }

        const { confirmPassword, ...userDetails } = updateUserDto;

        if (updateUserDto.password !== undefined && updateUserDto.password !== confirmPassword) {
            throw new BadRequestException('Passwords do not match!!!');
        }

        return this.userService.updateUser(id, userDetails);
    }

    @Delete(':id')
    @HttpCode(204)
    deleteUserById(@Param('id', ParseIntPipe) id: number) {
        return this.userService.deleteUser(id);
    }

    @Post(':id/profiles')
    createUserProfile(
        @Param('id', ParseIntPipe) id: number,
        @Body() createUserProfileDto: CreateUserProfileDto) {
        return this.userService.createUserProfile(id, createUserProfileDto);
    }

    @Post(':id/posts')
    createUserPost(
        @Param('id', ParseIntPipe) id: number,
        @Body() createUserPostDto: CreateUserPostDto
    ) {
        return this.userService.createUserPost(id, createUserPostDto);
    }
}