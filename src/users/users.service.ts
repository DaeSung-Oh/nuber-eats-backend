import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';

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
    private readonly jwtService: JwtService,
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
      await this.users.save(this.users.create({ email, password, role }));
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
      const user = await this.users.findOne({ email });
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
}
