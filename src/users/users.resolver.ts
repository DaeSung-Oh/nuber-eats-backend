import { Resolver, Query, Args, Mutation, ObjectType } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
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
import { GqlUser, User } from './entities/user.entity';
import { UserService } from './users.service';

@Resolver(of => User)
export class UserResolver {
  constructor(
    private readonly usersService: UserService,
    private readonly mailService: MailService,
  ) {}

  @Mutation(returns => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccoutInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return this.usersService.createAccount(createAccoutInput);
  }

  @Mutation(returns => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.usersService.login(loginInput);
  }

  @Query(returns => GqlUser)
  @Role(['Any'])
  me(@AuthUser() authUser: User) {
    console.log('authUser: ', authUser);
    return authUser;
  }

  @Query(returns => UserProfileOutput)
  @Role(['Any'])
  async userProfile(
    @Args() userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutput> {
    const { userId } = userProfileInput;
    return await this.usersService.findById(userId);
  }

  @Mutation(returns => EditProfileOutput)
  @Role(['Any'])
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return await this.usersService.editProfile(authUser.id, editProfileInput);
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
}
