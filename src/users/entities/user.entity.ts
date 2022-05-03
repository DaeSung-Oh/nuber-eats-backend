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

  async isCurrentlyUseEmail(email: string): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        if (email === this.email) {
          reject({
            email: {
              name: 'currently in use',
              message: 'This email currently in use',
            },
          });
        }
        resolve(false);
      });
    } catch (error) {
      throw 'email' in error
        ? error
        : { error: { name: error.name, message: error.message } };
    }
  }

  static async checkEmailIsValid(email: string): Promise<boolean> {
    const isInvalidEmail = new Promise((resolve, reject) => {
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

    const isExistEmail = new Promise(async (resolve, reject) => {
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
      await Promise.all([isInvalidEmail, isExistEmail]);
      return true;
    } catch (error) {
      throw error?.email
        ? error
        : { error: { name: error.name, message: error.message } };
    }
  }

  async isCurrentlyUsePassword(password: string) {
    try {
      return new Promise(async (resolve, reject) => {
        if (await this.checkPassword(password)) {
          reject({
            password: {
              name: 'currently in use',
              message: 'This password currently in use',
            },
          });
        }
        resolve(false);
      });
    } catch (error) {
      throw 'password' in error
        ? error
        : { error: { name: error.name, message: error.message } };
    }
  }

  /*
    [Naver 비밀번호 정책]
    * 안전하고 강력한 비밀번호 만들기 *
    1) 8~16자의 영문 대소문자, 숫자, 특수문자만 가능합니다.
    (사용 가능한 특수문자 33자 : ! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ ＼ ] ^ _ ` { | } ~ \)
    2) 영문, 숫자, 특수문자를 혼용하시면 보다 안전한 비밀번호를 만들 수 있습니다.
    3) 학번, 전화번호 혹은 연속된 숫자 및 문자, 사전에 포함된 단어 등 타인이 쉽게 알아낼 수 있는 비밀번호 사용은 위험합니다.
    4) 타 사이트와 동일한 비밀번호를 사용하거나, 이전에 사용했던 비밀번호의 재사용은 안전하지 않을 수 있습니다.
    5) 비밀번호는 비밀번호 안전도에 따라 3~6개월에 한 번씩 주기적으로 바꿔 사용하시는 것이 안전합니다.
    6) 무엇보다 네이버만의 안전한 비밀번호를 사용하는 것이 가장 중요합니다.
    *사용할 수 없는 비밀번호*
    1) 공백은 비밀번호로 사용할 수 없습니다.
    2) 숫자만으로 이루어진 비밀번호는 사용할 수 없습니다.
    3) 동일한 문자를 많이 포함한 경우 사용할 수 없습니다.
    4) 아이디, 생일 등의 개인 정보로만 이루어진 비밀번호는 사용할 수 없습니다.
    5) 보호조치 된 아이디의 경우 도용 피해가 발생한 당시의 비밀번호는 안전하지 않으므로 사용할 수 없습니다.
    6) 비밀번호 변경 시 현재 사용 중인 비밀번호의 재사용은 불가능하며, 기존과는 다른 비밀번호로 변경하셔야 합니다.
  */
  static async checkPasswordIsValid(password: string): Promise<boolean> {
    const isValidPasswordLength = new Promise((resolve, reject) => {
      if (!/^.{8,16}$/.test(password)) {
        reject({
          password: {
            name: 'invalid password length',
            message:
              'Password must be at least 8 characters, no more than 16 characters',
          },
        });
      }
      resolve('not currently in use password');
    }).catch(error => {
      throw error;
    });

    const isValidCharacter = new Promise((resolve, reject) => {
      if (!/[!"#$%&'()*+,-./:;<=>?@^_`{|}~\[\]\\]{1,}/g.test(password)) {
        reject({
          password: {
            name: 'special characters not included',
            message: `At least one special character must be used`,
          },
        });
      }
      resolve('contains at least one special character');
    }).catch(error => {
      throw error;
    });

    try {
      await Promise.all([isValidPasswordLength, isValidCharacter]);
      return true;
    } catch (error) {
      throw 'password' in error
        ? error
        : { error: { name: error.name, message: error.message } };
    }
  }
}
