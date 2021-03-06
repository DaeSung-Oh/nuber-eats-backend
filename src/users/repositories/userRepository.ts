import {
  FIND_MANY_OPTIONS_KEYS,
  FIND_ONE_OPTIONS_KEYS,
} from 'src/common/common.constants';
import {
  FindConditions,
  FindOneOptions,
  FindManyOptions,
} from 'src/common/common.repository.interface';
import {
  NonFunctionalFieldNames,
  NonFunctionalFields,
} from 'src/common/core.interface';
import { isEmptyObject, isOfType } from 'src/common/core.util';
import { CoreError } from 'src/errors';
import { AlreadyExistError } from 'src/errors/AlreadyExistErrors';
import {
  CurrentlyInUseEmailError,
  CurrentlyInUsePasswordError,
} from 'src/errors/CurrentlyInUseErrors';
import {
  InvalidEmailFormatError,
  InvalidPasswordLengthError,
  PasswordNotContainSpecialError,
} from 'src/errors/InvalidFormatErrors';
import { RequiredUserFieldError } from 'src/errors/RequiredErrors';
import {
  AbstractRepository,
  Brackets,
  Connection,
  EntityRepository,
  FindCondition,
  getConnection,
  getRepository,
  Repository,
} from 'typeorm';
import {
  CreateAccountErrors,
  CreateAccountInput,
} from '../dtos/create-account.dto';
import { EditProfileErrors, EditProfileInput } from '../dtos/edit-profile.dto';
import {
  Client,
  DeliveryMan,
  Owner,
  User,
  UserRole,
} from '../entities/user.entity';
import { Verification } from '../entities/verification.entity';
import {
  CREATE_ACCOUNT_INPUT_KEYS,
  USER_ENTITY_KEYS,
} from '../users.constants';

export type UserEntity = NonFunctionalFields<
  User & Client & Owner & DeliveryMan
>;
export type UserEntityFieldNames = NonFunctionalFieldNames<UserEntity>;

//
@EntityRepository(User)
export abstract class UserRepository extends AbstractRepository<User> {
  private readonly connection: Connection;
  private readonly verifications: Repository<Verification>;

  constructor() {
    super();
    this.connection = getConnection();
    this.verifications = getRepository(Verification);
  }

  async save(user: UserEntity) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!user.role) throw new RequiredUserFieldError(['role']);

      const newUser = await queryRunner.manager.save(
        queryRunner.manager.create(user.role, user),
      );

      await queryRunner.commitTransaction();

      return newUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async saveWithVerification(
    user: CreateAccountInput,
  ): Promise<[User, Verification]> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newUser = await queryRunner.manager.save(
        user.role,
        queryRunner.manager.create(user.role, { ...user }) as User,
      );
      console.log('saveWithVerification Created User: ', { newUser });
      const newVerification = await queryRunner.manager.save(
        queryRunner.manager.create(Verification, { user: newUser }),
      );

      await queryRunner.commitTransaction();

      return [newUser as any, newVerification];
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /* 
    [typeORM] findOne(overloading)

    findOne(id?: string | number | Date | ObjectID, options?: FindOneOptions<Entity>): Promise<Entity | undefined>;
    findOne(options?: FindOneOptions<Entity>): Promise<Entity | undefined>;
    findOne(conditions?: FindConditions<Entity>, options?: FindOneOptions<Entity>): Promise<Entity | undefined>;
  */
  async findOne(
    id?: string | number,
    options?: FindOneOptions<UserEntity>,
  ): Promise<User>;
  async findOne(options?: FindOneOptions<UserEntity>): Promise<User>;
  async findOne(
    conditions?: FindConditions<UserEntity>,
    options?: FindOneOptions<UserEntity>,
  ): Promise<User>;
  async findOne(arg1?: unknown, arg2?: unknown): Promise<User> {
    try {
      const qb = this.repository.createQueryBuilder('user');

      let id: string | number | undefined = undefined;
      let conditions: FindCondition<UserEntity> = {};
      let options: FindOneOptions<UserEntity> = {};

      if (arguments.length === 0) return await qb.getOne();
      // findOne(options?:FindOneOptions<UserEntity>)
      if (
        arguments.length === 1 &&
        isOfType<FindOneOptions<UserEntity>>(arg1, FIND_ONE_OPTIONS_KEYS)
      ) {
        options = { ...options, ...arg1 };
      }

      // findOne(id?: string | number, options?: FindOneOptions<UserEntity>)
      if (typeof arg1 === 'string' || typeof arg1 === 'number') {
        id = +arg1;
        if (
          arg2 &&
          isOfType<FindOneOptions<UserEntity>>(arg2, FIND_ONE_OPTIONS_KEYS)
        )
          options = {
            ...options,
            ...arg2,
          };
        // generate WHERE : WHERE (options.where...) AND id
        options?.where &&
          qb.where(
            new Brackets(qb => {
              Object.entries(options.where).forEach(([field, value]) => {
                qb.andWhere(`user.${field} = :${field}`, { [field]: value });
              });
            }),
          );

        id && qb.andWhere('user.id = :userId', { userId: id });
      }

      // findOne(conditions?: FindOneCondition<UserEntity>, options?: FindOneOptions<UserEntity>)
      if (isOfType<FindConditions<UserEntity>>(arg1, USER_ENTITY_KEYS)) {
        conditions = {
          ...conditions,
          ...(arg1 && { ...arg1 }),
        };

        options = {
          ...options,
          ...(arg2 &&
            isOfType<FindOneOptions<UserEntity>>(
              arg2,
              FIND_ONE_OPTIONS_KEYS,
            ) && { ...arg2 }),
        };

        // generate WHERE : WHERE conditions
        qb.where(
          new Brackets(qb => {
            Object.entries(conditions).forEach(([field, value]) => {
              qb.andWhere(`user.${field} = :${field}`, { [field]: value });
            });
          }),
        );
      }

      const { select, relations } = options;

      // generate relations
      relations &&
        relations.forEach(relatedField => {
          qb.leftJoinAndSelect(`user.${relatedField}`, `${relatedField}`);
        });
      // generate select
      select &&
        select.forEach((selectedField, index) => {
          index === 0
            ? qb.select(`user.${selectedField}`)
            : qb.addSelect(`user.${selectedField}`);
        });

      return await qb.getOne();
    } catch (error) {
      throw error;
    }
  }

  async findById(id: number): Promise<User> {
    try {
      const qb = this.repository.createQueryBuilder('user');

      qb.leftJoinAndSelect(
        'user.orders',
        'orders',
        `user.role IN (:...allowedOrderRoles)`,
        { allowedOrderRoles: [UserRole.Client, UserRole.Owner] },
      )
        .leftJoinAndSelect(
          'user.restaurants',
          'restaurants',
          'user.role = :ownerRole',
          { ownerRole: UserRole.Owner },
        )
        .leftJoinAndSelect(
          'user.deliveryOrders',
          'deliveryOrders',
          'user.role = :deliveryManRole',
          { deliveryManRole: UserRole.DeliveryMan },
        );

      qb.where('user.id = :userId', { userId: id });

      return await qb.getOne();
    } catch (error) {
      throw error;
    }
  }

  /* 
    [typeORM] find(overloading)

    find(options?: FindManyOptions<Entity>): Promise<Entity[]>;
    find(conditions?: FindConditions<Entity>): Promise<Entity[]>;
  */
  async find(options?: FindManyOptions<UserEntity>): Promise<User[]>;
  async find(conditions?: FindConditions<UserEntity>): Promise<User[]>;
  async find(
    arg?: FindManyOptions<UserEntity> | FindConditions<UserEntity>,
  ): Promise<User[]> {
    try {
      let options: FindManyOptions<UserEntity> = {};
      let conditions: FindConditions<UserEntity> = {};

      const qb = this.repository.createQueryBuilder('user');

      if (arguments.length === 0 || isEmptyObject(arg as any))
        return await qb.getMany();

      if (isOfType<FindManyOptions<UserEntity>>(arg, FIND_MANY_OPTIONS_KEYS)) {
        options = {
          ...options,
          ...arg,
        };

        const { where, select, relations, skip, take } = options;

        // generate where
        qb.where(
          new Brackets(qb => {
            Object.entries(where).forEach(([field, value]) => {
              qb.andWhere(`user.${field} = :${field}`, { [field]: value });
            });
          }),
        );

        // generate relations
        relations &&
          relations.forEach(relatedField => {
            qb.leftJoinAndSelect(`user.${relatedField}`, `${relatedField}`);
          });

        // generate select
        select &&
          select.forEach((selectedField, index) => {
            index === 0
              ? qb.select(`user.${selectedField}`)
              : qb.addSelect(`user.${selectedField}`);
          });

        // set take, skip
        qb.take(take ?? 10);
        qb.skip(skip ?? 0);
      } else {
        conditions = {
          ...conditions,
          ...arg,
        };

        // generate where
        qb.where(
          new Brackets(qb => {
            Object.entries(conditions).forEach(([field, value]) => {
              qb.andWhere(`user.${field} = :${field}`, { [field]: value });
            });
          }),
        );
      }

      return await qb.getMany();
    } catch (error) {
      throw error;
    }
  }

  /*
    [typeORM] findByIds(overloading)
    
    findByIds(ids: any[], options?: FindManyOptions<Entity>): Promise<Entity[]>;
    findByIds(ids: any[], conditions?: FindConditions<Entity>): Promise<Entity[]>;
  */
  async findByIds(
    ids: any[],
    options?: FindManyOptions<UserEntity>,
  ): Promise<User[]>;
  async findByIds(
    ids: any[],
    conditions?: FindConditions<UserEntity>,
  ): Promise<User[]>;
  async findByIds(
    ids: any[],
    arg?: FindManyOptions<UserEntity> | FindConditions<UserEntity>,
  ): Promise<User[]> {
    try {
      // ids: [] => return []
      // where And user.id IN [ids] || conditions And user.id IN [ids]
      if (ids.length === 0) return [] as User[];

      let options: FindManyOptions<UserEntity> = {};
      let conditions: FindConditions<UserEntity> = {};

      const qb = this.repository.createQueryBuilder('user');

      if (arg) {
        if (
          isOfType<FindManyOptions<UserEntity>>(arg, FIND_MANY_OPTIONS_KEYS)
        ) {
          options = {
            ...options,
            ...arg,
          };

          const { where, select, relations, skip, take } = options;

          // generate where
          where &&
            qb.where(
              new Brackets(qb => {
                Object.entries(where).forEach(([field, value]) =>
                  qb.andWhere(`user.${field} = :${field}`, { [field]: value }),
                );
              }),
            );
          qb.andWhere(`user.id IN (:...ids)`, { ids });

          // generate relations
          relations &&
            relations.forEach(relatedField => {
              qb.leftJoinAndSelect(`user.${relatedField}`, `${relatedField}`);
            });

          // generate select
          select &&
            select.forEach((selectedField, index) => {
              index === 0
                ? qb.select(`user.${selectedField}`)
                : qb.addSelect(`user.${selectedField}`);
            });

          // set take, skip
          qb.take(take ?? 10);
          qb.skip(skip ?? 0);
        } else {
          conditions = {
            ...conditions,
            ...arg,
          };

          // generate where
          conditions &&
            qb.where(
              new Brackets(qb => {
                Object.entries(conditions).forEach(([field, value]) => {
                  qb.andWhere(`user.${field} = :${field}`, { [field]: value });
                });
              }),
            );
          qb.andWhere(`user.id IN (:...ids)`, { ids });
        }
      }

      return await qb.getMany();
    } catch (error) {
      throw error;
    }
  }

  // validation
  async validateEmail(email: string): Promise<boolean | CoreError>;
  async validateEmail(email: string, user?: User): Promise<boolean | CoreError>;
  async validateEmail(
    email: string,
    user?: User,
  ): Promise<boolean | CoreError> {
    try {
      if (user) {
        // ?????? user??? ???????????? ????????? ?????? (edit)
        const existUser = await this.findOne({ email });
        if (email === existUser.email) throw new CurrentlyInUseEmailError();
      }
      // ???????????? ????????? format?????? ??????
      if (!/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(email))
        throw new InvalidEmailFormatError();
      // ?????? ????????? email??? ????????? ?????? (create & edit)
      if (await this.findOne({ email }))
        throw new AlreadyExistError<UserEntity>('email');
      return true;
    } catch (error) {
      return error?.type && error.type === 'Email'
        ? error
        : { name: error.name, message: error.message, stack: error?.stack };
    }
  }

  async validatePassword(password: string): Promise<boolean | CoreError>;
  async validatePassword(
    password: string,
    user?: User,
  ): Promise<boolean | CoreError>;
  async validatePassword(
    password: string,
    user?: User,
  ): Promise<boolean | CoreError> {
    /*
    [Naver ???????????? ??????]
    * ???????????? ????????? ???????????? ????????? *
    1) 8~16?????? ?????? ????????????, ??????, ??????????????? ???????????????.
    (?????? ????????? ???????????? 33??? : ! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ ??? ] ^ _ ` { | } ~ \)
    2) ??????, ??????, ??????????????? ??????????????? ?????? ????????? ??????????????? ?????? ??? ????????????.
    3) ??????, ???????????? ?????? ????????? ?????? ??? ??????, ????????? ????????? ?????? ??? ????????? ?????? ????????? ??? ?????? ???????????? ????????? ???????????????.
    4) ??? ???????????? ????????? ??????????????? ???????????????, ????????? ???????????? ??????????????? ???????????? ???????????? ?????? ??? ????????????.
    5) ??????????????? ???????????? ???????????? ?????? 3~6????????? ??? ?????? ??????????????? ?????? ??????????????? ?????? ???????????????.
    6) ???????????? ??????????????? ????????? ??????????????? ???????????? ?????? ?????? ???????????????.
    *????????? ??? ?????? ????????????*
    1) ????????? ??????????????? ????????? ??? ????????????.
    2) ??????????????? ???????????? ??????????????? ????????? ??? ????????????.
    3) ????????? ????????? ?????? ????????? ?????? ????????? ??? ????????????.
    4) ?????????, ?????? ?????? ?????? ???????????? ???????????? ??????????????? ????????? ??? ????????????.
    5) ???????????? ??? ???????????? ?????? ?????? ????????? ????????? ????????? ??????????????? ???????????? ???????????? ????????? ??? ????????????.
    6) ???????????? ?????? ??? ?????? ?????? ?????? ??????????????? ???????????? ???????????????, ???????????? ?????? ??????????????? ??????????????? ?????????.
  */
    try {
      if (user) {
        // ?????? user??? ???????????? password?????? ?????? (edit)
        const existUser = await this.findOne(user, { select: ['password'] });
        if (existUser && (await existUser.checkPassword(existUser.password)))
          throw new CurrentlyInUsePasswordError();
      }
      // ????????? password ???????????? ??????
      if (!/^.{8,16}$/.test(password)) throw new InvalidPasswordLengthError();
      // ??????????????? ??????1????????? ????????? password?????? ??????
      if (!/[!"#$%&'()*+,-./:;<=>?@^_`{|}~\[\]\\]{1,}/g.test(password))
        throw new PasswordNotContainSpecialError();
      return true;
    } catch (error) {
      return error?.type && error?.type === 'Password'
        ? error
        : { name: error.name, message: error.message, stack: error?.stack };
    }
  }

  async validateUser({
    email,
    password,
  }: CreateAccountInput): Promise<boolean | CreateAccountErrors>;
  async validateUser(
    { email, password }: EditProfileInput,
    user: User,
  ): Promise<boolean | EditProfileErrors>;
  async validateUser(
    validateInput: CreateAccountInput | EditProfileInput,
    user?: User,
  ): Promise<boolean | CreateAccountErrors | EditProfileErrors> {
    try {
      type ValidateResultType = boolean | CoreError | undefined;

      let [validateEmailResult, validatePasswordResult] =
        Array.from<ValidateResultType>({ length: 2 });
      let errors: CreateAccountErrors | EditProfileErrors = {};

      if (
        isOfType<CreateAccountInput>(validateInput, CREATE_ACCOUNT_INPUT_KEYS)
      ) {
        // validate createAccount user
        const { email, password, role } = validateInput;
        console.log('validateUserInput: ', { email, password, role });

        validateEmailResult = await this.validateEmail(email);
        validatePasswordResult = await this.validatePassword(password);
      } else {
        // validate editProfile user
        const { email, password } = validateInput;
        console.log('validateUserInput: ', { email, password });

        if (email) validateEmailResult = await this.validateEmail(email, user);
        if (password)
          validatePasswordResult = await this.validatePassword(password, user);
      }

      errors = {
        ...errors,
        ...(validateEmailResult !== true && {
          email: validateEmailResult as CoreError,
        }),
        ...(validatePasswordResult !== true && {
          password: validatePasswordResult as CoreError,
        }),
      };

      console.log('validateUserErrors: ', errors);

      return Object.keys(errors).length === 0 ? true : errors;
    } catch (error) {
      return {
        systemErrors: [
          {
            name: error.name,
            message: error.message,
            stack: error?.stack,
          },
        ],
      };
    }
  }
}
