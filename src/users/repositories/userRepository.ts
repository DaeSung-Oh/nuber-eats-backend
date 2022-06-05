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
        // 현재 user의 이메일과 같은지 검사 (edit)
        const existUser = await this.findOne({ email });
        if (email === existUser.email) throw new CurrentlyInUseEmailError();
      }
      // 이메일이 유효한 format인지 검사
      if (!/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(email))
        throw new InvalidEmailFormatError();
      // 다른 유저의 email과 같은지 검사 (create & edit)
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
    try {
      if (user) {
        // 현재 user가 사용중인 password인지 검사 (edit)
        const existUser = await this.findOne(user, { select: ['password'] });
        if (existUser && (await existUser.checkPassword(existUser.password)))
          throw new CurrentlyInUsePasswordError();
      }
      // 유효한 password 길이인지 검사
      if (!/^.{8,16}$/.test(password)) throw new InvalidPasswordLengthError();
      // 특수문자가 최소1개이상 포함된 password인지 검사
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
