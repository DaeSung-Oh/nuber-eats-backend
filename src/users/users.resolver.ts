import { UseGuards } from '@nestjs/common';
import {
  Resolver,
  Query,
  Args,
  Mutation,
  Field,
  ObjectType,
} from '@nestjs/graphql';
import { boolean } from 'joi';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { MailService } from 'src/mail/mail.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { UserService } from './users.service';

@Resolver(of => User)
export class UserResolver {
  constructor(
    private readonly usersService: UserService,
    private readonly mailService: MailService,
  ) {}

  @UseGuards(AuthGuard)
  @Query(returns => User)
  me(@AuthUser() authUser: User) {
    return authUser;
  }

  @UseGuards(AuthGuard)
  @Query(returns => User)
  async userProfile(
    @Args() userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutput> {
    try {
      const { userId } = userProfileInput;
      const user = await this.usersService.findById(userId);
      if (!user) throw Error();
      return { ok: true, user };
    } catch (e) {
      return {
        ok: false,
        error: 'User Not Found',
      };
    }
  }

  @UseGuards(AuthGuard)
  @Mutation(returns => EditProfileOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      await this.usersService.editProfile(authUser.id, editProfileInput);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  @Mutation(returns => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccoutInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      return this.usersService.createAccount(createAccoutInput);
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  @Mutation(returns => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      return await this.usersService.login(loginInput);
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  @Mutation(returns => VerifyEmailOutput)
  async verifyEmail(
    @Args('input') { code }: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    try {
      const isVerify = await this.usersService.verifyEmail(code);
      if (!isVerify) {
        return {
          ok: false,
          error: 'not Verify',
        };
      }
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  @Mutation(returns => VerifyEmailOutput)
  sendEmail(@Args('input') to: string) {
    return this.mailService.sendEmail(to);
  }
}
