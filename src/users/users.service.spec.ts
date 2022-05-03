import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UserService } from './users.service';
import * as coreUtil from 'src/common/core.util';

type mockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  findOneOrFail: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'testToken'),
  verify: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let mailService: MailService;
  let jwtService: JwtService;
  let usersRepository: mockRepository<User>;
  let verificationsRepository: mockRepository<Verification>;

  let mockedStaticEmailIsValid: jest.Mock;
  let mockedStaticPasswordIsValid: jest.Mock;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();

    mockedStaticEmailIsValid = jest.fn();
    mockedStaticPasswordIsValid = jest.fn();

    User.checkEmailIsValid = mockedStaticEmailIsValid;
    User.checkPasswordIsValid = mockedStaticPasswordIsValid;

    service = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccoutArgs = {
      email: 'testAccount@gmail.com',
      password: 'testPassword123',
      role: UserRole.Owner,
    };

    const mockedInvalidEmailError = {
      email: {
        name: 'invalid email',
        message: 'This email invalid',
      },
    };
    const mockedInvalidPasswordError = {
      password: {
        name: 'invalid password',
        message: 'This password invalid',
      },
    };
    const mockedSystemError = {
      error: {
        name: 'Error',
        message: 'fail on exception',
      },
    };

    it('should fail invalid email format or exists email', async () => {
      mockedStaticEmailIsValid.mockRejectedValue(mockedInvalidEmailError);
      mockedStaticPasswordIsValid.mockResolvedValue(true);

      const { ok, errors } = await service.createAccount(createAccoutArgs);
      expect(ok).toBe(false);
      expect(errors.email).toMatchObject(mockedInvalidEmailError.email);
    });

    it('should fali invalid password format', async () => {
      mockedStaticEmailIsValid.mockResolvedValue(true);
      mockedStaticPasswordIsValid.mockRejectedValue(mockedInvalidPasswordError);

      const { ok, errors } = await service.createAccount(createAccoutArgs);

      expect(ok).toBe(false);
      expect(errors.password).toMatchObject(
        mockedInvalidPasswordError.password,
      );
    });

    it('should create a new user', async () => {
      mockedStaticEmailIsValid.mockResolvedValue(true);
      mockedStaticPasswordIsValid.mockResolvedValue(true);

      usersRepository.create.mockReturnValue(createAccoutArgs);

      verificationsRepository.create.mockReturnValue({
        user: createAccoutArgs,
      });
      usersRepository.save.mockResolvedValue(createAccoutArgs);
      verificationsRepository.save.mockResolvedValue({
        code: 'testCode456',
      });

      const { ok, errors } = await service.createAccount(createAccoutArgs);

      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccoutArgs);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccoutArgs);

      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: createAccoutArgs,
      });

      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith({
        user: createAccoutArgs,
      });

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );

      expect(ok).toBe(true);
      expect(errors).toBeUndefined();
    });

    it('should fail on Exception', async () => {
      mockedStaticEmailIsValid.mockRejectedValue(mockedSystemError);
      const { ok, errors } = await service.createAccount(createAccoutArgs);
      expect(ok).toBe(false);
      expect(errors.error.message).toBe(mockedSystemError.error.message);
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'testAccount@gmail.com',
      password: 'testPassword123',
    };

    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      const result = await service.login(loginArgs);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toMatchObject({ ok: false, error: 'User not found' });
    });

    it('should fail if the password is wrong', async () => {
      const mockedUser = {
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };

      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockedUser.checkPassword).toHaveBeenCalledWith(expect.any(String));
      expect(result).toMatchObject({ ok: false, error: 'Wrong Password' });
    });

    it('should return token if password correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };

      //mockJwtService().sign = jest.fn(() => 'testToken');

      usersRepository.findOne.mockResolvedValue(mockedUser);

      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({ id: expect.any(Number) });
      expect(result).toMatchObject({ ok: true, token: 'testToken' });
    });

    it('should fail on Exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toMatchObject({ ok: false, error: expect.any(Error) });
    });
  });

  describe('findById', () => {
    it('should find an existing user', async () => {
      const findByIdArgs = {
        id: 1,
      };

      usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith(findByIdArgs);
      expect(result).toMatchObject({ ok: true, user: findByIdArgs });
    });

    it('should fail if not found user', async () => {
      const findByIdArgs = {
        id: 1,
      };

      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith(findByIdArgs);
      expect(result).toMatchObject({ ok: false, error: 'User Not Found' });
    });
  });

  describe('editProfile', () => {
    const mockedArgIsEmpty = jest.fn();
    beforeEach(() => {
      jest.mock('src/common/core.util', () => {
        return {
          argsIsEmpty: mockedArgIsEmpty,
        };
      });
    });

    it('should fail args is empty', async () => {
      const editProfileArgs = { userId: 1, input: { email: '' } };

      mockedArgIsEmpty.mockReturnValue(true);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors?.email).toBeUndefined();
      expect(errors?.password).toBeUndefined();
      expect(errors.error).toMatchObject({
        name: 'invalid form',
        message: 'This is not a valid input form',
      });
    });

    it('should fail not found user', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'oldUser@test.com' },
      };

      usersRepository.findOneOrFail.mockRejectedValue(
        new Error('not found user'),
      );

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors.email).toBeUndefined();
      expect(errors.password).toBeUndefined();
      expect(errors.error.message).toBe('not found user');
    });

    it('should fail email is invalid(format, exist)', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'oldUser@test.com' },
      };

      const mockedUser = {
        id: editProfileArgs.userId,
        email: editProfileArgs.input.email,
        emailVerified: true,
        isCurrentlyUseEmail: jest.fn(() => Promise.resolve(false)),
      };

      const mockedInvalidEmailError = {
        email: {
          name: 'invalid',
          message: 'invalid Email',
        },
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);
      mockedStaticEmailIsValid.mockRejectedValue(mockedInvalidEmailError);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors.email).toMatchObject(mockedInvalidEmailError.email);
    });

    it('should fail email is currently in use', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'oldUser@test.com' },
      };

      const mockedEmailError = {
        email: {
          name: 'currently in use',
          message: 'This email currently in use',
        },
      };

      const mockedUser = {
        id: editProfileArgs.userId,
        email: editProfileArgs.input.email,
        emailVerified: true,
        isCurrentlyUseEmail: jest.fn(() => Promise.reject(mockedEmailError)),
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);
      mockedStaticEmailIsValid.mockResolvedValue(true);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors.email).toMatchObject(mockedEmailError.email);
    });

    it('should fail password is invalid', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'oldPassword' },
      };

      const mockedInvalidPasswordError = {
        password: { name: 'invalid', message: 'password is invalid' },
      };

      const mockedUser = {
        id: editProfileArgs.userId,
        email: 'testUser@gmail.com',
        emailVerified: true,
        password: 'Password.invalid',
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);
      mockedStaticPasswordIsValid.mockRejectedValue(mockedInvalidPasswordError);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors.password).toMatchObject(
        mockedInvalidPasswordError.password,
      );
    });

    it('should fail password is currently in use', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'oldPassword' },
      };

      const mockedPasswordError = {
        password: {
          name: 'currently in use',
          message: 'This password currently in use',
        },
      };

      const mockedUser = {
        id: editProfileArgs.userId,
        email: 'testUser@gmail.com',
        emailVerified: true,
        password: editProfileArgs.input.password,
        isCurrentlyUsePassword: jest.fn(() =>
          Promise.reject(mockedPasswordError),
        ),
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);
      mockedStaticPasswordIsValid.mockResolvedValue(true);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors.password).toMatchObject(mockedPasswordError.password);
    });

    it('should change email', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'new@gmail.com' },
      };

      const mockedUserFunction = {
        isCurrentlyUseEmail: jest.fn(() => Promise.resolve(false)),
      };

      const mockedOldUser = {
        id: editProfileArgs.userId,
        email: 'oldUser@gmail.com',
        emailVerified: true,
        ...mockedUserFunction,
      };
      const newVerification = {
        code: 'newCode',
      };
      const mockedNewUser = {
        id: mockedOldUser.id,
        email: editProfileArgs.input.email,
        emailVerified: false,
        ...mockedUserFunction,
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedOldUser);
      mockedStaticEmailIsValid.mockResolvedValue(true);

      verificationsRepository.create.mockReturnValue(newVerification);
      verificationsRepository.save.mockResolvedValue(newVerification);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith(
        {
          id: editProfileArgs.userId,
        },
        undefined,
      );

      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.delete).toBeCalledWith({
        user: { id: mockedOldUser.id },
      });

      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: {
          ...mockedNewUser,
        },
      });

      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith(
        newVerification,
      );

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockedNewUser.email,
        newVerification.code,
      );

      expect(ok).toBe(true);
      expect(errors).toBeUndefined();
    });

    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'newPassword' },
      };

      const mockedUser = {
        id: editProfileArgs.userId,
        email: 'testUser@gmail.com',
        emailVerified: true,
        password: 'Password.old',
        isCurrentlyUsePassword: jest.fn(() => Promise.resolve(false)),
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);
      mockedStaticPasswordIsValid.mockResolvedValue(true);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith(
        {
          id: editProfileArgs.userId,
        },
        { select: ['id', 'email', 'emailVerified', 'password'] },
      );

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({
        ...mockedUser,
        password: editProfileArgs.input.password,
      });

      expect(ok).toBe(true);
    });

    it('should fail on Exception', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'newEmail@gmail.com' },
      };

      usersRepository.findOneOrFail.mockRejectedValue(
        new Error('fail on exception'),
      );

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors.error).toMatchObject({
        name: 'Error',
        message: 'fail on exception',
      });
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailArgs = {
      code: 'verificationCode',
    };

    const mockedUser = {
      id: 1,
      email: 'MockUser@gmail.com',
      emailVerified: false,
    };

    const mockedVerification = {
      id: 2,
      code: verifyEmailArgs.code,
      user: mockedUser,
    };

    it('should verify email and delete verification', async () => {
      verificationsRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await service.verifyEmail(verifyEmailArgs.code);

      expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.findOne).toHaveBeenCalledWith(
        verifyEmailArgs,
        { relations: ['user'] },
      );

      expect(mockedUser.emailVerified).toBe(true);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(
        mockedVerification.user,
      );

      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );

      expect(result).toMatchObject({ ok: true });
    });

    it('should fail on verification not found', async () => {
      verificationsRepository.findOne.mockResolvedValue(undefined);

      const result = await service.verifyEmail(verifyEmailArgs.code);

      expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.findOne).toHaveBeenCalledWith(
        verifyEmailArgs,
        { relations: ['user'] },
      );

      expect(result).toMatchObject({
        ok: false,
        error: 'not found verification',
      });
    });

    it('should fail on Exception', async () => {
      verificationsRepository.findOne.mockRejectedValue(new Error());

      const result = await service.verifyEmail(verifyEmailArgs.code);

      expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.findOne).toHaveBeenCalledWith(
        verifyEmailArgs,
        { relations: ['user'] },
      );

      expect(result).toMatchObject({ ok: false, error: expect.any(Error) });
    });
  });
});
