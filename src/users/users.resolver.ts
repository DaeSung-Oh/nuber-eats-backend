import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  SendEmailInput,
  SendEmailOutput,
  SendVerificationEmailInput,
} from 'src/mail/dtos/send-email.dto';
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
  @Query(returns => UserProfileOutput)
  async userProfile(
    @Args() userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutput> {
    const { userId } = userProfileInput;
    return await this.usersService.findById(userId);
  }

  @UseGuards(AuthGuard)
  @Mutation(returns => EditProfileOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return await this.usersService.editProfile(authUser.id, editProfileInput);
  }

  @Mutation(returns => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccoutInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return await this.usersService.createAccount(createAccoutInput);
  }

  @Mutation(returns => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return await this.usersService.login(loginInput);
  }

  @Mutation(returns => VerifyEmailOutput)
  async verifyEmail(
    @Args('input') { code }: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return await this.usersService.verifyEmail(code);
  }

  @Mutation(returns => SendEmailOutput)
  sendEmail(@Args('input') { to, templateName, emailVars }: SendEmailInput) {
    return this.mailService.sendEmail(to, templateName, emailVars);
  }

  @Mutation(returns => SendEmailOutput)
  sendVerficationEmail(
    @Args('input') { email, code }: SendVerificationEmailInput,
  ): Promise<SendEmailOutput> {
    return this.mailService.sendVerificationEmail(email, code);
  }

  @Mutation(returns => SendEmailOutput)
  sendGmail(@Args('input') { to, templateName }: SendEmailInput) {
    return this.mailService.sendByGmail(to, templateName);
  }
}
