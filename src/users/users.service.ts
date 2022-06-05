import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, getConnection, Repository } from 'typeorm';
import {
  CreateAccountErrors,
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User, UserRole } from './entities/user.entity';
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
import { UserRepository } from './repositories/userRepository';
import {
  UserNotFoundError,
  VerificationNotFoundError,
} from 'src/errors/NotFoundErrors';
import { WrongPasswordError } from 'src/errors/WrongPasswordError';

// eslint-disable-next-line
const chalk = require('chalk');

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly connection: Connection,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      // check email, password of new user
      const validateUserResult = await this.userRepository.validateUser({
        email,
        password,
        role,
      });

      if (validateUserResult !== true)
        return { ok: false, errors: validateUserResult as CreateAccountErrors };

      await this.connection.transaction(async manager => {
        try {
          // create and save User
          const user = await manager.save(
            manager.create(role, { email, password, role }),
          );
          // create and save Verification
          const verification = await manager.save(
            Verification,
            manager.create(Verification, { user }),
          );
          // send email to Created User
          const sendEmailResult = await this.mailService.sendVerificationEmail(
            email,
            verification.code,
          );

          console.log(chalk.white.bgYellow('SendEmailResult'));
          console.log(chalk.yellow(sendEmailResult.res_string));
        } catch (error) {
          throw error;
        }
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        errors: {
          systemErrors: [
            { name: error?.name, message: error?.message, stack: error?.stack },
          ],
        },
      };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      // find the user with the email
      const user = await this.userRepository.findOne(
        { email },
        { select: ['id', 'password'] },
      );

      if (!user) {
        return { ok: false, error: new UserNotFoundError().message };
      }
      // check if the password is correct
      // make a JWT and give it to the user
      const isUserPassword = await user.checkPassword(password);
      if (!isUserPassword) {
        return { ok: false, error: new WrongPasswordError().message };
      }
      const token = this.jwtService.sign({ id: user.id });

      return { ok: true, token };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) throw new UserNotFoundError();

      return { ok: true, user };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async editProfile(
    userId: number,
    editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const { email, password } = editProfileInput;

      const user = await this.userRepository.findOne(userId);
      if (!user) throw new UserNotFoundError();

      const validateResult = await this.userRepository.validateUser(
        editProfileInput,
        user,
      );
      if (validateResult !== true)
        return { ok: false, errors: validateResult as EditProfileErrors };

      // DB transaction
      const queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // delete existing verification (1:1 relationship constraints),
        // save new verification
        await queryRunner.manager.delete(Verification, {
          user: { id: userId },
        });
        user.emailVerified = false;
        const verification = await queryRunner.manager.save(Verification, {
          user,
        });

        // user save
        await queryRunner.manager.save(user.role, {
          ...user,
          ...(email && { email }),
          ...(password && { password }),
        });

        // send email to user for verification
        await this.mailService.sendVerificationEmail(email, verification.code);

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        errors: {
          systemErrors: [
            {
              ...(error?.type && { type: error.type }),
              name: error?.name,
              message: error?.message,
              stack: error?.stack,
            },
          ],
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
      return { ok: false, error: new VerificationNotFoundError() };
    } catch (error) {
      return {
        ok: false,
        error: { name: error.name, message: error.message, stack: error.stack },
      };
    }
  }
}
