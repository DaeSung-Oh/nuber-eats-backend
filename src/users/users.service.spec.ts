import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UserService } from './users.service';

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

    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'testUsers@gmail.com',
      });
      const result = await service.createAccount(createAccoutArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    it('should create a new user', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccoutArgs);

      verificationsRepository.create.mockReturnValue({
        user: createAccoutArgs,
      });
      usersRepository.save.mockResolvedValue(createAccoutArgs);
      verificationsRepository.save.mockResolvedValue({
        code: 'testCode456',
      });

      const result = await service.createAccount(createAccoutArgs);

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

      expect(result).toMatchObject({ ok: true });
    });

    it('should fail on Exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccoutArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'Couldn`t create account',
      });
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
    it('should fail args is empty', async () => {
      const editProfileArgs = { userId: 1, input: {} };

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors.email).toBeUndefined();
      expect(errors.password).toBeUndefined();
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

    it('should fail email is invalid(form, currently in use, exist)', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'oldUser@test.com' },
      };

      const mockedUser = {
        checkEmailIsValid: jest.fn(() =>
          Promise.reject({
            email: { name: 'invalid', message: 'email is invalid' },
          }),
        ),
      };

      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors.email).toMatchObject({
        name: 'invalid',
        message: 'email is invalid',
      });
    });

    it('should fail password is invalid', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'oldPassword' },
      };

      const mockedUser = {
        checkPasswordIsValid: jest.fn(() =>
          Promise.reject({
            password: { name: 'invalid', message: 'password is invalid' },
          }),
        ),
      };

      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors.password).toMatchObject({
        name: 'invalid',
        message: 'password is invalid',
      });
    });

    it('should change email', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'new@gmail.com' },
      };

      const mockedUserFunction = {
        checkEmailIsValid: jest.fn(() => Promise.resolve(true)),
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

      usersRepository.findOneOrFail.mockResolvedValue(mockedOldUser);

      verificationsRepository.create.mockReturnValue(newVerification);
      verificationsRepository.save.mockResolvedValue(newVerification);

      const result = await service.editProfile(
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
        user: { id: mockedNewUser.id },
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

      expect(result).toMatchObject({ ok: true });
    });

    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'newPassword' },
      };

      const mockedUserFunction = {
        checkPasswordIsValid: jest.fn(() => Promise.resolve(true)),
      };

      const mockedUser = {
        id: editProfileArgs.userId,
        email: 'testUser@test.com',
        emailVerified: true,
        password: 'oldPassword',
        ...mockedUserFunction,
      };

      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);

      const result = await service.editProfile(
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

      expect(result).toMatchObject({ ok: true });
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

    it('should fail on Exception, if error name is null, name seted systemError', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'newEmail@gmail.com' },
      };

      const mockedError = new Error('fail on exception');
      mockedError.name = null;

      usersRepository.findOneOrFail.mockRejectedValue(mockedError);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(ok).toBe(false);
      expect(errors.error).toMatchObject({
        name: 'systemError',
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
