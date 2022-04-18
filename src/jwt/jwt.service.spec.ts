import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'TOKEN'),
  };
});

const TEST_PRIVATE_KEY = 'private.testing';

describe('JWT Service', () => {
  let service: JwtService;
  const jwtModuleOptions = {
    privateKey: TEST_PRIVATE_KEY,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: CONFIG_OPTIONS, useValue: jwtModuleOptions },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should return a signed token', () => {
      const signArgs = {
        id: 1,
      };

      const token = service.sign(signArgs);

      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(
        signArgs,
        jwtModuleOptions.privateKey,
      );

      expect(token).toBe('TOKEN');
    });
  });
});
