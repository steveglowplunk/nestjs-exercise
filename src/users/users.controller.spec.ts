import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';
import { UsersController } from './users.controller.js';
import { CreateUserDto } from './dtos/CreateUser.dto.js';
import { UpdateUserDto } from './dtos/UpdateUser.dto.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    fetchAllUsers: vi.fn().mockResolvedValue([]),
    createUser: vi.fn().mockResolvedValue({}),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a user with matching passwords', async () => {
    const createUserDto: CreateUserDto = {
      username: 'test',
      password: 'test',
      confirmPassword: 'test',
    };
    const createdUser = { id: 1, username: 'test' };
    usersServiceMock.createUser.mockResolvedValueOnce(createdUser);

    await expect(controller.createUser(createUserDto)).resolves.toEqual(createdUser);
    expect(usersServiceMock.createUser).toHaveBeenCalledWith({
      username: 'test',
      password: 'test',
    });
  });

  it('should reject mismatched passwords without creating a user', () => {
    const createUserDto: CreateUserDto = {
      username: 'test',
      password: 'test',
      confirmPassword: 'different',
    };

    expect(() => controller.createUser(createUserDto)).toThrow('Passwords do not match');
    expect(usersServiceMock.createUser).not.toHaveBeenCalled();
  });

  it('should pass the user ID and update details to the service', async () => {
    const updateUserDto: UpdateUserDto = {
      username: 'test',
      password: 'test',
      confirmPassword: 'test',
    };

    await controller.updateUserById(1, updateUserDto);

    expect(usersServiceMock.updateUser).toHaveBeenCalledWith(1, {
      username: 'test',
      password: 'test',
    });
  });

  it('should update a supplied field via PATCH', async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    try {
      usersServiceMock.updateUser.mockResolvedValueOnce({ id: 1, username: 'new' });
      await request(app.getHttpServer()).patch('/users/1').send({ username: 'new' }).expect(200, { id: 1, username: 'new' });
      expect(usersServiceMock.updateUser).toHaveBeenCalledWith(1, { username: 'new' });
    } finally {
      await app.close();
    }
  });

  it('should return 400 for a PATCH request without a body', async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer()).patch('/users/1').expect(400);
      expect(usersServiceMock.updateUser).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('should reject mismatched passwords without updating a user', () => {
    const updateUserDto: UpdateUserDto = {
      password: 'test',
      confirmPassword: 'different',
    };

    expect(() => controller.updateUserById(1, updateUserDto)).toThrow('Passwords do not match');
    expect(usersServiceMock.updateUser).not.toHaveBeenCalled();
  });

  it('should delete a user by ID via DELETE', async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    try {
      usersServiceMock.deleteUser.mockResolvedValueOnce(undefined);
      await request(app.getHttpServer()).delete('/users/1').expect(204);
      expect(usersServiceMock.deleteUser).toHaveBeenCalledWith(1);
      await request(app.getHttpServer()).delete('/users/not-an-id').expect(400);
      expect(usersServiceMock.deleteUser).toHaveBeenCalledOnce();
    } finally {
      await app.close();
    }
  });

  it('should return 404 when deleting a missing user', async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    try {
      usersServiceMock.deleteUser.mockRejectedValueOnce(new NotFoundException('User not found'));
      await request(app.getHttpServer()).delete('/users/99').expect(404);
    } finally {
      await app.close();
    }
  });

  it('should return all users from the service', async () => {
    const users = [{ id: 1, username: 'test' }];
    usersServiceMock.fetchAllUsers.mockResolvedValueOnce(users);

    await expect(controller.getAllUsers()).resolves.toEqual(users);
    expect(usersServiceMock.fetchAllUsers).toHaveBeenCalledOnce();
  });
});
