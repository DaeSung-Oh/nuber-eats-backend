import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { Client, DeliveryMan, Owner, User } from './users/entities/user.entity';
import { CommonModule } from './common/common.module';
import { JwtModule } from './jwt/jwt.module';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { AuthModule } from './auth/auth.module';
import { Verification } from './users/entities/verification.entity';
import { MailModule } from './mail/mail.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { Category } from './restaurants/entities/category.entity';
import { Menu } from './restaurants/entities/menu.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderMenu } from './orders/entities/orderMenu.entity';
import { OrderMenuRepository } from './orders/repositories/orderMenuRepository';
import { RestaurantRepository } from './restaurants/repositories/restaurantRepository';
import { MenuRepository } from './restaurants/repositories/menuRepository';
import { Context } from 'apollo-server-core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        TOKEN_KEY: Joi.string().required(),
        TOKEN_SECRET_KEY: Joi.string().required(),
        GMAIL_API_KEY: Joi.string().required(),
        GMAIL_OAUTH_USER: Joi.string().required(),
        GMAIL_CLIENT_ID: Joi.string().required(),
        GMAIL_CLIENT_SECRET_KEY: Joi.string().required(),
        GMAIL_OAUTH_REFRESH_TOKEN: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: process.env.NODE_ENV !== 'prod',
      logging:
        process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
      entities: [
        User,
        DeliveryMan,
        Owner,
        Client,
        Verification,
        Restaurant,
        RestaurantRepository,
        Category,
        Menu,
        MenuRepository,
        Order,
        OrderMenu,
        OrderMenuRepository,
      ],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      subscriptions: {
        'subscriptions-transport-ws': {
          onConnect: connectionParams => {
            const authToken = connectionParams[process.env.TOKEN_KEY];
            if (!authToken) {
              throw new Error('Token is not valid');
            }
            const token = authToken;
            return { token };
          },
        },
      },
      context: ({ req }) => {
        return {
          token: req.headers[process.env.TOKEN_KEY],
        };
      },
    }),
    JwtModule.forRoot({
      privateKey: process.env.TOKEN_SECRET_KEY,
    }),
    MailModule.forRoot({
      apiKey: process.env.GMAIL_API_KEY,
      oAuthUser: process.env.GMAIL_OAUTH_USER,
      refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
      gmailClientID: process.env.GMAIL_CLIENT_ID,
      gmailSecretKey: process.env.GMAIL_CLIENT_SECRET_KEY,
    }),
    UsersModule,
    CommonModule,
    AuthModule,
    RestaurantsModule,
    OrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(JwtMiddleware).forRoutes({
//       path: '/graphql',
//       method: RequestMethod.POST,
//     });
//   }
// }
