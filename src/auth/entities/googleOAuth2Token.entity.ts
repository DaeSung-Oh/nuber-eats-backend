import { IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class GoogleOAuth2Token extends CoreEntity {
  @Column()
  @IsString()
  access_token: string;

  @Column()
  @IsString()
  refresh_token: string;
}
