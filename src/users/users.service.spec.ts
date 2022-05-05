import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { utilError } from 'src/common/common.constants';
import * as coreUtil from 'src/common/core.util';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { userFieldErrors } from './users.constant';
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

  const mockedCheckEmailIsValid = jest.spyOn(User, 'checkEmailIsValid');
  const mockedCheckPasswordIsValid = jest.spyOn(User, 'checkPasswordIsValid');

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

    mockedCheckEmailIsValid.mockClear();
    mockedCheckPasswordIsValid.mockClear();

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
      error: new Error('fail on exception'),
    };

    it('should fail invalid email format or exists email', async () => {
      mockedCheckEmailIsValid.mockRejectedValue(mockedInvalidEmailError);
      mockedCheckPasswordIsValid.mockResolvedValue(true);

      const { ok, errors } = await service.createAccount(createAccoutArgs);

      expect(User.checkEmailIsValid).toHaveBeenCalledTimes(1);
      expect(User.checkEmailIsValid).toHaveBeenCalledWith(
        createAccoutArgs.email,
      );

      expect(ok).toBe(false);
      expect(errors.email).toMatchObject(mockedInvalidEmailError.email);
      expect(errors.password).toBeUndefined();
      expect(errors.error).toBeUndefined();
    });

    it('should fali invalid password format', async () => {
      mockedCheckEmailIsValid.mockResolvedValue(true);
      mockedCheckPasswordIsValid.mockRejectedValue(mockedInvalidPasswordError);

      const { ok, errors } = await service.createAccount(createAccoutArgs);

      expect(User.checkEmailIsValid).toHaveBeenCalledTimes(1);
      expect(User.checkEmailIsValid).toHaveBeenCalledWith(
        createAccoutArgs.email,
      );

      expect(User.checkPasswordIsValid).toHaveBeenCalledTimes(1);
      expect(User.checkPasswordIsValid).toHaveBeenCalledWith(
        createAccoutArgs.password,
      );

      expect(ok).toBe(false);
      expect(errors.password).toMatchObject(
        mockedInvalidPasswordError.password,
      );
      expect(errors.email).toBeUndefined();
      expect(errors.error).toBeUndefined();
    });

    it('should create a new user', async () => {
      const mockedVerification = {
        code: 'testCode456',
      };

      mockedCheckEmailIsValid.mockResolvedValue(true);
      mockedCheckPasswordIsValid.mockResolvedValue(true);

      usersRepository.create.mockReturnValue(createAccoutArgs);
      verificationsRepository.create.mockReturnValue({
        user: createAccoutArgs,
      });
      usersRepository.save.mockResolvedValue(createAccoutArgs);
      verificationsRepository.save.mockResolvedValue(mockedVerification);

      const { ok, errors } = await service.createAccount(createAccoutArgs);

      expect(User.checkEmailIsValid).toHaveBeenCalledTimes(1);
      expect(User.checkEmailIsValid).toHaveBeenCalledWith(
        createAccoutArgs.email,
      );

      expect(User.checkPasswordIsValid).toHaveBeenCalledTimes(1);
      expect(User.checkPasswordIsValid).toHaveBeenCalledWith(
        createAccoutArgs.password,
      );

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
        createAccoutArgs.email,
        mockedVerification.code,
      );

      expect(ok).toBe(true);
      expect(errors).toBeUndefined();
    });

    it('should fail on Exception', async () => {
      mockedCheckEmailIsValid.mockRejectedValue(mockedSystemError);
      const { ok, errors } = await service.createAccount(createAccoutArgs);

      expect(User.checkEmailIsValid).toHaveBeenCalledTimes(1);
      expect(User.checkEmailIsValid).toHaveBeenCalledWith(
        createAccoutArgs.email,
      );

      expect(ok).toBe(false);
      expect(errors.error.message).toBe(mockedSystemError.error.message);
      expect(errors.email).toBeUndefined();
      expect(errors.password).toBeUndefined();
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
    // const mockedArgIsEmpty = jest.fn();
    // jest.mock('src/common/core.util', () => {
    //   return {
    //     argsIsEmpty: mockedArgIsEmpty,
    //   };
    // });

    const mockedArgIsEmpty = jest.spyOn(coreUtil, 'argsIsEmpty');

    const mockedNotFoundUserError = new Error('not found user');
    const mockedSystemError = new Error('fail on exception');
    const mockedInValidEmailError = {
      email: {
        name: 'invalid',
        message: 'invalid Email',
      },
    };
    const mockedInValidPasswordError = {
      password: {
        name: 'invalid',
        message: 'invalid password',
      },
    };

    beforeEach(() => {
      mockedArgIsEmpty.mockClear();
    });

    it('should fail args is empty', async () => {
      const editProfileArgs = { userId: 1, input: { email: '' } };

      mockedArgIsEmpty.mockReturnValue(true);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(coreUtil.argsIsEmpty).toHaveBeenCalledTimes(1);
      expect(coreUtil.argsIsEmpty).toHaveBeenCalledWith(editProfileArgs.input);

      expect(ok).toBe(false);
      expect(errors?.email).toBeUndefined();
      expect(errors?.password).toBeUndefined();
      expect(errors.error).toMatchObject(utilError.argsIsEmptyError);
    });

    it('should fail not found user', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'notFoundUser@test.com' },
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockRejectedValue(mockedNotFoundUserError);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(coreUtil.argsIsEmpty).toHaveBeenCalledTimes(1);
      expect(coreUtil.argsIsEmpty).toHaveBeenCalledWith(editProfileArgs.input);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        id: editProfileArgs.userId,
      });

      expect(ok).toBe(false);
      expect(errors?.email).toBeUndefined();
      expect(errors?.password).toBeUndefined();
      expect(errors.error).toMatchObject<Error>({ ...mockedNotFoundUserError });
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
        isNotCurrentlyInUseEmail: jest.fn(() => Promise.resolve(true)),
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);
      mockedCheckEmailIsValid.mockRejectedValue(mockedInValidEmailError);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(coreUtil.argsIsEmpty).toHaveBeenCalledTimes(1);
      expect(coreUtil.argsIsEmpty).toHaveBeenCalledWith(editProfileArgs.input);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        id: editProfileArgs.userId,
      });

      expect(mockedUser.isNotCurrentlyInUseEmail).toHaveBeenCalledTimes(1);
      expect(mockedUser.isNotCurrentlyInUseEmail).toHaveBeenCalledWith(
        editProfileArgs.input.email,
      );

      expect(User.checkEmailIsValid).toHaveBeenCalledTimes(1);
      expect(User.checkEmailIsValid).toHaveBeenCalledWith(
        editProfileArgs.input.email,
      );

      expect(ok).toBe(false);
      expect(errors.email).toMatchObject(mockedInValidEmailError.email);
      expect(errors?.password).toBeUndefined();
      expect(errors?.error).toBeUndefined();
    });

    it('should fail email is currently in use', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'oldUser@test.com' },
      };

      const mockedUser = {
        id: editProfileArgs.userId,
        email: editProfileArgs.input.email,
        emailVerified: true,
        isNotCurrentlyInUseEmail: jest.fn(() =>
          Promise.reject({ email: userFieldErrors.email.currentlyInUseError }),
        ),
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(coreUtil.argsIsEmpty).toHaveBeenCalledTimes(1);
      expect(coreUtil.argsIsEmpty).toHaveBeenCalledWith(editProfileArgs.input);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        id: editProfileArgs.userId,
      });

      expect(mockedUser.isNotCurrentlyInUseEmail).toHaveBeenCalledTimes(1);
      expect(mockedUser.isNotCurrentlyInUseEmail).toHaveBeenCalledWith(
        editProfileArgs.input.email,
      );

      expect(ok).toBe(false);
      expect(errors.email).toMatchObject(
        userFieldErrors.email.currentlyInUseError,
      );
      expect(errors?.password).toBeUndefined();
      expect(errors?.error).toBeUndefined();
    });

    it('should fail password is invalid', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'Password.invalid' },
      };

      const mockedUser = {
        id: editProfileArgs.userId,
        email: 'testUser@gmail.com',
        emailVerified: true,
        password: editProfileArgs.input.password,
        isNotCurrentlyInUsePassword: jest.fn(() => Promise.resolve(true)),
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);
      mockedCheckPasswordIsValid.mockRejectedValue(mockedInValidPasswordError);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(coreUtil.argsIsEmpty).toHaveBeenCalledTimes(1);
      expect(coreUtil.argsIsEmpty).toHaveBeenCalledWith(editProfileArgs.input);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith(
        { id: editProfileArgs.userId },
        { select: ['id', 'email', 'emailVerified', 'password'] },
      );

      expect(mockedUser.isNotCurrentlyInUsePassword).toHaveBeenCalledTimes(1);
      expect(mockedUser.isNotCurrentlyInUsePassword).toHaveBeenCalledWith(
        editProfileArgs.input.password,
      );

      expect(User.checkPasswordIsValid).toHaveBeenCalledTimes(1);
      expect(User.checkPasswordIsValid).toHaveBeenCalledWith(
        editProfileArgs.input.password,
      );

      expect(ok).toBe(false);
      expect(errors.password).toMatchObject(
        mockedInValidPasswordError.password,
      );
      expect(errors?.email).toBeUndefined();
      expect(errors?.error).toBeUndefined();
    });

    it('should fail password is currently in use', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'oldPassword' },
      };

      const mockedUser = {
        id: editProfileArgs.userId,
        email: 'testUser@gmail.com',
        emailVerified: true,
        password: editProfileArgs.input.password,
        isNotCurrentlyInUsePassword: jest.fn(() =>
          Promise.reject({
            password: userFieldErrors.password.currentlyInUseError,
          }),
        ),
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(coreUtil.argsIsEmpty).toHaveBeenCalledTimes(1);
      expect(coreUtil.argsIsEmpty).toHaveBeenCalledWith(editProfileArgs.input);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith(
        { id: editProfileArgs.userId },
        { select: ['id', 'email', 'emailVerified', 'password'] },
      );

      expect(mockedUser.isNotCurrentlyInUsePassword).toHaveBeenCalledTimes(1);
      expect(mockedUser.isNotCurrentlyInUsePassword).toHaveBeenCalledWith(
        editProfileArgs.input.password,
      );

      expect(ok).toBe(false);
      expect(errors.password).toMatchObject(
        userFieldErrors.password.currentlyInUseError,
      );
      expect(errors?.email).toBeUndefined();
      expect(errors?.error).toBeUndefined();
    });

    it('should change email', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'new@gmail.com' },
      };

      const mockedOldUser = {
        id: editProfileArgs.userId,
        email: 'oldUser@gmail.com',
        emailVerified: true,
        isNotCurrentlyInUseEmail: jest.fn(() => Promise.resolve(true)),
      };
      const newVerification = {
        code: 'newCode',
      };
      const mockedNewUser = {
        ...mockedOldUser,
        email: editProfileArgs.input.email,
        emailVerified: false,
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedOldUser);
      mockedCheckEmailIsValid.mockResolvedValue(true);

      verificationsRepository.create.mockReturnValue(newVerification);
      verificationsRepository.save.mockResolvedValue(newVerification);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(coreUtil.argsIsEmpty).toHaveBeenCalledTimes(1);
      expect(coreUtil.argsIsEmpty).toHaveBeenCalledWith(editProfileArgs.input);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        id: editProfileArgs.userId,
      });

      expect(mockedOldUser.isNotCurrentlyInUseEmail).toHaveBeenCalledTimes(1);
      expect(mockedOldUser.isNotCurrentlyInUseEmail).toHaveBeenCalledWith(
        editProfileArgs.input.email,
      );

      expect(User.checkEmailIsValid).toHaveBeenCalledTimes(1);
      expect(User.checkEmailIsValid).toHaveBeenCalledWith(
        editProfileArgs.input.email,
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

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(mockedNewUser);

      expect(ok).toBe(true);
      expect(errors).toBeUndefined();
    });

    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'newPassword' },
      };

      const mockedOldUser = {
        id: editProfileArgs.userId,
        email: 'testUser@gmail.com',
        emailVerified: true,
        password: 'oldPassword',
        isNotCurrentlyInUsePassword: jest.fn(() => Promise.resolve(true)),
      };

      const mockedNewUser = {
        ...mockedOldUser,
        password: editProfileArgs.input.password,
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockResolvedValue(mockedOldUser);
      mockedCheckPasswordIsValid.mockResolvedValue(true);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(coreUtil.argsIsEmpty).toHaveBeenCalledTimes(1);
      expect(coreUtil.argsIsEmpty).toHaveBeenCalledWith(editProfileArgs.input);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith(
        {
          id: editProfileArgs.userId,
        },
        { select: ['id', 'email', 'emailVerified', 'password'] },
      );

      expect(mockedOldUser.isNotCurrentlyInUsePassword).toHaveBeenCalledTimes(
        1,
      );
      expect(mockedOldUser.isNotCurrentlyInUsePassword).toHaveBeenCalledWith(
        editProfileArgs.input.password,
      );

      expect(User.checkPasswordIsValid).toHaveBeenCalledTimes(1);
      expect(User.checkPasswordIsValid).toHaveBeenCalledWith(
        editProfileArgs.input.password,
      );

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(mockedNewUser);

      expect(ok).toBe(true);
      expect(errors).toBeUndefined();
    });

    it('should fail on Exception', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { email: 'newEmail@gmail.com' },
      };

      mockedArgIsEmpty.mockReturnValue(false);
      usersRepository.findOneOrFail.mockRejectedValue(mockedSystemError);

      const { ok, errors } = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(coreUtil.argsIsEmpty).toHaveBeenCalledTimes(1);
      expect(coreUtil.argsIsEmpty).toHaveBeenCalledWith(editProfileArgs.input);

      expect(usersRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOneOrFail).toHaveBeenCalledWith({
        id: editProfileArgs.userId,
      });

      expect(ok).toBe(false);
      expect(errors.error).toMatchObject<Error>({ ...mockedSystemError });
      expect(errors?.email).toBeUndefined();
      expect(errors?.password).toBeUndefined();
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
