import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { getConnection } from 'typeorm';
import * as mailer from 'nodemailer';

jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn(),
  };
});

console.log('nodemailer : ', mailer);

const GRAPHQL_ENDPOINT = '/graphql';

describe('UserModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    await app.close();
  });

  describe('createAccount', () => {
    const EMAIL = 'ods1988@naver.com';

    it('should create account', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input: {
              email: "${EMAIL}",
              password: "12345",
              role: Owner
            }) {
              ok
              error
            }
          }
          `,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.createAccount.ok).toBeTruthy();
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    /*it('should fail if account already exists', () => {
      return;
    });
    */
  });
  it.todo('userProfile');
  it.todo('login');
  it.todo('me');
  it.todo('verifiyEmail');
  it.todo('editProfile');
});
