import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { MailService } from 'src/mail/mail.service';

export interface UserServiceResponse {
  ok: boolean;
  error?: string;
}

export interface UserLoginServiceResponse extends UserServiceResponse {
  token?: string;
}

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
  }: CreateAccountInput): Promise<UserServiceResponse> {
    // if error exist, return error message(string).
    // else return undefined (not return value)

    // check new user
    // create user
    try {
      const exist = await this.users.findOne({ email });
      if (exist) {
        return { ok: false, error: 'There is a user with that email already' };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Couldn`t create account' };
    }
  }

  async login({
    email,
    password,
  }: LoginInput): Promise<UserLoginServiceResponse> {
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

  async findById(id: number): Promise<User> {
    return this.users.findOne({ id });
  }

  async editProfile(
    userId: number,
    editProfileInput: EditProfileInput,
  ): Promise<User> {
    const user = await this.users.findOne({ id: userId });
    if (editProfileInput.email) {
      await this.verifications.save(this.verifications.create({ user }));
    }
    return this.users.save({ ...user, ...editProfileInput });
  }

  async verifyEmail(verifyCode: string): Promise<boolean> {
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
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}
