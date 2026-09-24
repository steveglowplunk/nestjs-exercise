import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { vi } from 'vitest';
import { User } from '../typeorm/entities/User.js';
import { Profile } from '../typeorm/entities/Profile.js';
import { Post } from '../typeorm/entities/Post.js';
import { UsersService } from './users.service.js';

const USERNAME_INDEX = 'IDX_fe0bb3f6520ee0469504521e71';

const duplicateEntryError = (key: string) => {
  const sqlMessage = `Duplicate entry 'taken' for key 'users.${key}'`;
  return new QueryFailedError('UPDATE users', [], Object.assign(new Error(sqlMessage), { code: 'ER_DUP_ENTRY', sqlMessage }));
};

describe('UsersService', () => {
  let service: UsersService;
  const userRepositoryMock = {
    create: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    metadata: {
      indices: [{ name: USERNAME_INDEX, isUnique: true, columns: [{ propertyName: 'username' }] }],
      uniques: [],
    },
  };

  const postRepositoryMock = {
    create: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepositoryMock },
        { provide: getRepositoryToken(Profile), useValue: {} },
        { provide: getRepositoryToken(Post), useValue: postRepositoryMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updates only supplied fields and returns the saved user', async () => {
    const user = { id: 1, username: 'old', password: 'secret' };
    const updatedUser = { ...user, username: 'new' };
    userRepositoryMock.findOneBy.mockResolvedValueOnce(user);
    userRepositoryMock.save.mockResolvedValueOnce(updatedUser);

    await expect(service.updateUser(1, { username: 'new' })).resolves.toEqual(updatedUser);
    expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(userRepositoryMock.save).toHaveBeenCalledWith(updatedUser);
  });

  it('rejects updates for users that do not exist', async () => {
    userRepositoryMock.findOneBy.mockResolvedValueOnce(null);

    await expect(service.updateUser(99, { username: 'new' })).rejects.toThrow('User not found');
    expect(userRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('deletes a user by ID', async () => {
    userRepositoryMock.delete.mockResolvedValueOnce({ affected: 1 });

    await expect(service.deleteUser(1)).resolves.toBeUndefined();
    expect(userRepositoryMock.delete).toHaveBeenCalledWith(1);
  });

  it('rejects deletion of users that do not exist', async () => {
    userRepositoryMock.delete.mockResolvedValueOnce({ affected: 0 });

    await expect(service.deleteUser(99)).rejects.toThrow(NotFoundException);
    expect(userRepositoryMock.delete).toHaveBeenCalledWith(99);
  });

  it('returns a conflict when updating to an existing username', async () => {
    userRepositoryMock.findOneBy.mockResolvedValueOnce({ id: 1, username: 'old' });
    userRepositoryMock.save.mockRejectedValueOnce(duplicateEntryError(USERNAME_INDEX));

    await expect(service.updateUser(1, { username: 'taken' })).rejects.toThrow(ConflictException);
  });

  it('returns a conflict when creating a user with an existing username', async () => {
    userRepositoryMock.create.mockReturnValueOnce({ username: 'taken', password: 'secret' });
    userRepositoryMock.save.mockRejectedValueOnce(duplicateEntryError(USERNAME_INDEX));

    await expect(service.createUser({ username: 'taken', password: 'secret' })).rejects.toThrow(ConflictException);
  });

  it('does not report duplicates on other unique keys as username conflicts', async () => {
    const error = duplicateEntryError('IDX_some_other_unique_column');
    userRepositoryMock.findOneBy.mockResolvedValueOnce({ id: 1, username: 'old' });
    userRepositoryMock.save.mockRejectedValueOnce(error);

    await expect(service.updateUser(1, { username: 'new' })).rejects.toBe(error);
  });

  it('preserves unrelated database failures', async () => {
    const error = new QueryFailedError('UPDATE users', [], Object.assign(new Error('Connection lost'), { code: 'PROTOCOL_CONNECTION_LOST' }));
    userRepositoryMock.findOneBy.mockResolvedValueOnce({ id: 1, username: 'old' });
    userRepositoryMock.save.mockRejectedValueOnce(error);

    await expect(service.updateUser(1, { username: 'new' })).rejects.toBe(error);
  });

  it('creates a post for a user whose posts relation is not loaded', async () => {
    const user = { id: 1, username: 'old', password: 'secret' };
    const details = { title: 'Hello', content: 'World' };
    const post = { ...details, user };
    const savedPost = { id: 2, ...post };
    userRepositoryMock.findOneBy.mockResolvedValueOnce(user);
    postRepositoryMock.create.mockReturnValueOnce(post);
    postRepositoryMock.save.mockResolvedValueOnce(savedPost);

    await expect(service.createUserPost(1, details)).resolves.toEqual(savedPost);
    expect(postRepositoryMock.create).toHaveBeenCalledWith({ ...details, user });
    expect(userRepositoryMock.save).not.toHaveBeenCalled();
  });
});
