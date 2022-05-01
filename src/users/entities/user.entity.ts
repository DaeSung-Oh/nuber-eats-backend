import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  getRepository,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { validEmail } from '../profile.interface';

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Delivery = 'Delivery',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field(type => String)
  @IsString()
  email: string;

  @Column({ select: false })
  @Field(type => String)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(type => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(type => Boolean)
  @IsBoolean()
  emailVerified: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    try {
      if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async checkPassword(inputPassword: string): Promise<boolean> {
    try {
      const isUserPassword = await bcrypt.compare(inputPassword, this.password);
      return isUserPassword;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async checkEmailIsValid(email: string): Promise<boolean> {
    const currentlyInUseEmail = new Promise((resolve, reject) => {
      if (email === this.email) {
        reject({
          email: {
            name: 'currently in use',
            message: 'This email currently in use',
          },
        });
      }
      resolve('not currently in use email');
    }).catch(error => {
      throw error;
    });

    const invalidEmail = new Promise((resolve, reject) => {
      if (!validEmail.test(email)) {
        reject({
          email: {
            name: 'invalid email form',
            message: 'This email is not in the format of the email',
          },
        });
      }
      resolve('valid email form');
    }).catch(error => {
      throw error;
    });

    const existEmail = new Promise(async (resolve, reject) => {
      const repository = getRepository<User>(User);
      const existUser = await repository.findOne({ email });
      if (existUser) {
        reject({
          email: {
            name: 'already exist',
            message: 'This email already exists',
          },
        });
        return;
      }
      resolve('not exist email');
    }).catch(error => {
      throw error;
    });

    try {
      await Promise.all([invalidEmail, currentlyInUseEmail, existEmail]);
      return true;
    } catch (error) {
      throw 'email' in error
        ? error
        : { error: { name: error.name, message: error.message } };
    }
  }

  async checkPasswordIsValid(password: string): Promise<boolean> {
    const checkPassword = new Promise(async (resolve, reject) => {
      if (await this.checkPassword(password)) {
        reject({
          password: {
            name: 'currently in use',
            message: 'This password currently in use',
          },
        });
      }
      resolve('not currently in use password');
    }).catch(error => {
      throw error;
    });

    try {
      await Promise.all([checkPassword]);
      return true;
    } catch (error) {
      throw 'password' in error
        ? error
        : { error: { name: error.name, message: error.message } };
    }
  }
}
