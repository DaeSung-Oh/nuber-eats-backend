import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { getConnection, Repository } from 'typeorm';
import * as mailer from 'nodemailer';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

const GRAPHQL_ENDPOINT = '/graphql';

const testUser = {
  email: 'ods1988@naver.com',
  password: 'testPassword@',
  role: 'Owner',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('x-jwt', jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    await app.close();
  });

  describe('createAccount', () => {
    const INVALID_EMAIL_FORMAT = 'invalidMail';
    const LESSTHAN_PASSWORD = '1234!';
    const MORETHAN_PASSWORD = '12345678912345678@';
    const NOTCONTAIN_SPECIAL_PASSWORD = '12345678';

    it('should fail if invalid email format', () => {
      return publicTest(`
      mutation {
        createAccount(input: {
          email: "${INVALID_EMAIL_FORMAT}",
          password: "${testUser.password}",
          role: ${testUser.role}
        }) {
          ok
          errors {
            email {
              message
            }
          }
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                createAccount: { ok, errors },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(errors.email.message).toBe(
            'This email is not in the format of the email',
          );
        });
    });

    describe('should fali if invalid password format', () => {
      it('should fail if password less than 8 characters', () => {
        return publicTest(`
        mutation {
          createAccount(input: {
            email: "${testUser.email}",
            password: "${LESSTHAN_PASSWORD}",
            role: ${testUser.role}
          }) {
            ok
            errors {
              password {
                message
              }
            }
          }
        }
        `)
          .expect(200)
          .expect(res => {
            const {
              body: {
                data: {
                  createAccount: { ok, errors },
                },
              },
            } = res;
            expect(ok).toBe(false);
            expect(errors.password.message).toBe(
              'Password must be at least 8 characters, no more than 16 characters',
            );
          });
      });

      it('should fail if password more than 16 characters', () => {
        return publicTest(`
        mutation {
          createAccount(input: {
            email: "${testUser.email}",
            password: "${MORETHAN_PASSWORD}",
            role: ${testUser.role}
          }) {
            ok
            errors {
              password {
                message
              }
            }
          }
        }
        `)
          .expect(200)
          .expect(res => {
            const {
              body: {
                data: {
                  createAccount: { ok, errors },
                },
              },
            } = res;
            expect(ok).toBe(false);
            expect(errors.password.message).toBe(
              'Password must be at least 8 characters, no more than 16 characters',
            );
          });
      });

      it('should fail if password does not contain special characters', () => {
        return publicTest(`
        mutation {
          createAccount(input: {
            email:"${testUser.email}",
            password: "${NOTCONTAIN_SPECIAL_PASSWORD}",
            role: ${testUser.role}
          }) {
            ok
            errors {
              password {
                message
              }
            }
          }
        }
        `)
          .expect(200)
          .expect(res => {
            const {
              body: {
                data: {
                  createAccount: { ok, errors },
                },
              },
            } = res;
            expect(ok).toBe(false);
            expect(errors.password.message).toBe(
              'At least one special character must be used',
            );
          });
      });
    });

    it('should create account', () => {
      return publicTest(`
      mutation {
        createAccount(input: {
          email: "${testUser.email}",
          password: "${testUser.password}",
          role: ${testUser.role}
        }) {
          ok
          errors {
            email {
              message
            }
            password {
              message
            }
            error {
              message
            }
          }
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                createAccount: { ok, errors },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(errors).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      return publicTest(`
      mutation {
        createAccount(input: {
          email: "${testUser.email}",
          password: "${testUser.password}",
          role: ${testUser.role}
        }) {
          ok
          errors {
            email {
              message
            }
          }
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                createAccount: { ok, errors },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(errors.email.message).toBe('This email already exists');
        });
    });
  });

  describe('login', () => {
    it('should login', () => {
      return publicTest(`
      mutation {
        login(input:{
          email: "${testUser.email}",
          password: "${testUser.password}"
        }) {
          ok
          token
          error
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                login: { ok, error, token },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(token).toEqual(expect.any(String));
          jwtToken = token;
        });
    });

    it('should fail login', () => {
      return publicTest(`
      mutation {
        login(input:{
          email: "${testUser.email}",
          password: "1231564"
        }) {
          ok
          token
          error
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                login: { ok, error, token },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('Wrong Password');
          expect(token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await userRepository.find();
      userId = user.id;
    });

    it('should see user`s profile', () => {
      return privateTest(`
      {
        userProfile(userId:${userId}) {
          ok
          error
          user {
            id
          }
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;

          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it('should not see user`s profile', () => {
      return privateTest(`
      {
        userProfile(userId:666) {
          ok
          error
          user {
            id
          }
        }
      }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;

          expect(ok).toBe(false);
          expect(error).toBe('User Not Found');
          expect(user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(`
      {
        me {
          email
        }
      }
    `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;

          expect(email).toBe(testUser.email);
        });
    });

    it('should not allow logouted user', () => {
      return publicTest(`
      {
        me {
          email
        }
      }
    `)
        .expect(200)
        .expect(res => {
          const {
            body: { errors, data },
          } = res;

          const [error] = errors;

          expect(error.message).toBe('Forbidden resource');
          expect(data).toBe(null);
        });
    });
  });

  describe('edit profile', () => {
    const NEW_EMAIL = 'dsnaver88@gmail.com';
    const NEW_PASSWORD = 'newPassword@';
    const INVALID_EMAIL_FORMAT = 'invalidMail';
    const LESSTHAN_PASSWORD = '1234!';
    const MORETHAN_PASSWORD = '12345678912345678@';
    const NOTCONTAIN_SPECIAL_PASSWORD = '12345678';

    let user: User;
    let verification: Verification;
    beforeEach(async () => {
      const [findUser] = await userRepository.find({
        select: ['id', 'email', 'emailVerified', 'password'],
      });
      user = findUser;

      const [findVerification] = await verificationRepository.find({
        relations: ['user'],
      });
      verification = findVerification;
    });

    describe('should fail if args(email, password) is empty', () => {
      it.todo('should fail if email is empty');
      it.todo('should fail if password is empty');
      it.todo('should fail if email and password is empty');
    });

    it('should fail if invalid email format', () => {
      return privateTest(`
        mutation {
          editProfile(input:{
            email: "${INVALID_EMAIL_FORMAT}"
          }) {
            ok
            errors {
              email {
                message
              }
            }
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, errors },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(errors.email.message).toBe(
            'This email is not in the format of the email',
          );
        });
    });

    it('should fail if email currently in use', () => {
      return privateTest(`
        mutation {
          editProfile(input: {
            email: "${testUser.email}"
          }) {
            ok
            errors {
              email {
                message
              }
            }
          }
        } 
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, errors },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(errors.email.message).toBe('This email currently in use');
        });
    });

    it('should fail password currently in use', () => {
      return privateTest(`
        mutation {
          editProfile(input: {
            password: "${testUser.password}"
          }) {
            ok
            errors {
              password {
                message
              }
            }
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, errors },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(errors.password).toMatchObject({
            name: 'currently in use',
            message: 'This password currently in use',
          });
          expect(errors.email).toBe(null);
          expect(errors.error).toBe(null);
        });
    });

    describe('should fail if invalid password format', () => {
      it('should fail if password less than 8 characters', () => {
        return privateTest(`
          mutation {
            editProfile(input: {
              password: "${LESSTHAN_PASSWORD}"
            }) {
              ok
              errors {
                password {
                  message
                }
              }
            }
          }
        `)
          .expect(200)
          .expect(res => {
            const {
              body: {
                data: {
                  editProfile: { ok, errors },
                },
              },
            } = res;
            expect(ok).toBe(false);
            expect(errors.password.message).toBe(
              'Password must be at least 8 characters, no more than 16 characters',
            );
          });
      });

      it('should fail if password more than 16 characters', () => {
        return privateTest(`
          mutation {
            editProfile(input: {
              password: "${MORETHAN_PASSWORD}"
            }) {
              ok
              errors {
                password {
                  message
                }
              }
            }
          }
        `)
          .expect(200)
          .expect(res => {
            const {
              body: {
                data: {
                  editProfile: { ok, errors },
                },
              },
            } = res;
            expect(ok).toBe(false);
            expect(errors.password.message).toBe(
              'Password must be at least 8 characters, no more than 16 characters',
            );
          });
      });

      it('should fail if password does not contain special characters', () => {
        return privateTest(`
          mutation {
            editProfile(input: {
              password: "${NOTCONTAIN_SPECIAL_PASSWORD}"
            }) {
              ok
              errors {
                password {
                  message
                }
              }
            }
          }
        `)
          .expect(200)
          .expect(res => {
            const {
              body: {
                data: {
                  editProfile: { ok, errors },
                },
              },
            } = res;
            expect(ok).toBe(false);
            expect(errors.password.message).toBe(
              'At least one special character must be used',
            );
          });
      });
    });

    it('should fail email and password currently in use', () => {
      return privateTest(`
        mutation {
          editProfile(input: {
            email: "${testUser.email}",
            password: "${testUser.password}"
          }) {
            ok
            errors {
              email {
                message
              }
              password {
                message
              }
            }
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, errors },
              },
            },
          } = res;

          expect(ok).toBe(false);
          expect(errors.email.message).toBe('This email currently in use');
          expect(errors.password.message).toBe(
            'This password currently in use',
          );
        });
    });

    it('should fail not allowed user', () => {
      return publicTest(`
        mutation {
          editProfile(input: {
            email: "${testUser.email}"
          }) {
            ok
            errors {
              email {
                name
                message
              }
              password {
                name
                message
              }
              error {
                name
                message
              }
            }
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: { errors, data },
          } = res;

          const [error] = errors;

          expect(error.message).toBe('Forbidden resource');
          expect(data).toBe(null);
        });
    });

    describe('edit email', () => {
      it('should change email', () => {
        return privateTest(`
        mutation {
          editProfile(input: {
            email: "${NEW_EMAIL}",
          }) {
            ok
            errors {
              email {
                name
                message
              }
              password {
                name
                message
              }
              error {
                name
                message
              }
            }
          }
        }
        `)
          .expect(200)
          .expect(res => {
            const {
              body: {
                data: {
                  editProfile: { ok, errors },
                },
              },
            } = res;

            expect(ok).toBe(true);
            expect(errors).toBe(null);
          });
      });

      describe('Then', () => {
        afterAll(async () => {
          await userRepository.update(
            { id: user.id },
            { email: testUser.email },
          );
        });

        it('user email changed new email', () => {
          expect(user.email).toBe(NEW_EMAIL);
        });
        it('not changed password', async () => {
          const notChangedPassword = await user.checkPassword(
            testUser.password,
          );
          expect(notChangedPassword).toBe(true);
        });
        it('The user field of verification depends on the user model', async () => {
          expect(verification.user.id).toBe(user.id);
        });
      });
    });

    describe('edit password', () => {
      it('should change password', async () => {
        return privateTest(`
        mutation {
          editProfile(input: {
            password: "${NEW_PASSWORD}"
          }) {
            ok
            errors {
              email {
                name
                message
              }
              password {
                name
                message
              }
              error {
                name
                message
              }
            }
          }
        }
        `)
          .expect(200)
          .expect(res => {
            const {
              body: {
                data: {
                  editProfile: { ok, errors },
                },
              },
            } = res;

            expect(ok).toBe(true);
            expect(errors).toBe(null);
          });
      });

      describe('Then', () => {
        afterAll(async () => {
          user.password = testUser.password;
          await userRepository.save(user);
        });

        it('password changed new password', async () => {
          const changedNewPassword = await user.checkPassword(NEW_PASSWORD);
          expect(changedNewPassword).toBe(true);
        });
        it('not changed email', () => {
          expect(user.email).toBe(testUser.email);
        });
      });
    });
  });

  describe('verfiy email', () => {
    let user: User;
    let verification: Verification;
    beforeEach(async () => {
      const [findUser] = await userRepository.find();
      user = findUser;

      const [findVerification] = await verificationRepository.find({
        relations: ['user'],
      });
      verification = findVerification;
    });

    it('should fail verify email on incorrect verification code', () => {
      return publicTest(`
        mutation {
          verifyEmail(input: {
            code: "notVerifyCode"
          }) {
            ok
            error
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;

          expect(ok).toBe(false);
          expect(error).toBe('not found verification');
        });
    });

    it('should verify email on correct verification code', () => {
      return publicTest(`
        mutation {
          verifyEmail(input:{
            code: "${verification.code}"
          }) {
            ok
            error
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;

          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    describe('Then', () => {
      it('user email verified', () => {
        expect(user.emailVerified).toBe(true);
      });
      it('verification deleted', () => {
        expect(verification).toBe(undefined);
      });
    });
  });
});
