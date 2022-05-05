import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import {
  EditProfileErrors,
  EditProfileInput,
  EditProfileOutput,
} from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { MailService } from 'src/mail/mail.service';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { argsIsEmpty } from 'src/common/core.util';
import { utilError } from 'src/common/common.constants';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    // if error exist or invalid emailform, return error.
    // else return ok is true

    try {
      // check email of new user
      let errors: EditProfileErrors = {};

      await User.checkEmailIsValid(email).catch(returnedError => {
        if (returnedError?.error) throw returnedError.error;
        errors = { ...errors, ...returnedError };
      });

      await User.checkPasswordIsValid(password).catch(returnedError => {
        if (returnedError?.error) throw returnedError.error;
        errors = { ...errors, ...returnedError };
      });

      if (errors?.email || errors?.password) return { ok: false, errors };

      // create user
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );

      const verification = await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
      await this.mailService.sendVerificationEmail(
        user.email,
        verification.code,
      );
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        errors: { error: { name: error.name, message: error.message } },
      };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      // find the user with the email
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] },
      );
      if (!user) {
        return { ok: false, error: 'User not found' };
      }
      // check if the password is correct
      // make a JWT and give it to the user
      const isUserPassword = await user.checkPassword(password);
      if (!isUserPassword) {
        return { ok: false, error: 'Wrong Password' };
      }
      const token = this.jwtService.sign({ id: user.id });

      return { ok: true, token };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });
      return { ok: true, user };
    } catch (error) {
      return { ok: false, error: 'User Not Found' };
    }
  }

  async editProfile(
    userId: number,
    editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      // verify that all arguments in edit profile are missing
      if (argsIsEmpty(editProfileInput)) {
        throw utilError.argsIsEmptyError;
      }

      const { email, password } = editProfileInput;

      // const user = await this.users.findOneOrFail(
      //   { id: userId },
      //   password && {
      //     select: ['id', 'email', 'emailVerified', 'password'],
      //   },
      // );

      const user = password
        ? await this.users.findOneOrFail(
            { id: userId },
            { select: ['id', 'email', 'emailVerified', 'password'] },
          )
        : await this.users.findOneOrFail({ id: userId });

      let errors: EditProfileErrors = {};

      // if email, verify email is valid
      if (email) {
        // check currently in use email
        const isNotCurrentlyInUse = await user
          .isNotCurrentlyInUseEmail(email)
          .catch(returnedError => {
            if ('error' in returnedError) throw returnedError.error;
            errors = { ...errors, ...returnedError };
          });
        // check email is valid
        isNotCurrentlyInUse &&
          (await User.checkEmailIsValid(email).catch(returnedError => {
            if ('error' in returnedError) throw returnedError.error;
            errors = { ...errors, ...returnedError };
          }));
      }
      // if password, verify password is valid
      if (password) {
        // check currently in use password
        const isNotCurrentlyInuse = await user
          .isNotCurrentlyInUsePassword(password)
          .catch(returnedError => {
            if (returnedError?.error) throw returnedError.error;
            errors = { ...errors, ...returnedError };
          });
        // check password is valid
        isNotCurrentlyInuse &&
          (await User.checkPasswordIsValid(password).catch(returnedError => {
            if ('error' in returnedError) throw returnedError.error;
            errors = { ...errors, ...returnedError };
          }));
      }

      // if email or password not invalid, return invalid of error
      if (errors.email || errors.password) return { ok: false, errors };

      // if email and password is valid, edit profile
      if (email) {
        user.email = email;
        user.emailVerified = false;

        this.verifications.delete({ user: { id: user.id } });

        const verification = await this.verifications.save(
          this.verifications.create({ user }),
        );

        await this.mailService.sendVerificationEmail(email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        errors: {
          error: {
            name: error.name,
            message: error.message,
          },
        },
      };
    }
  }

  async verifyEmail(verifyCode: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code: verifyCode },
        {
          relations: ['user'],
        },
      );
      if (verification) {
        verification.user.emailVerified = true;
        await this.users.save(verification.user);
        await this.verifications.delete(verification.id);
        return { ok: true };
      }
      return { ok: false, error: 'not found verification' };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
