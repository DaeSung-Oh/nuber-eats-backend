import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field(type => String)
  code: string;

  @OneToOne(type => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @BeforeInsert()
  createVerificationCode(): void {
    this.code = customAlphabet(
      `${this.getStringOfNumbers()}${this.getAlphabets()}`,
      6,
    )();
  }

  private getStringOfNumbers(): string {
    const numberLength = 10;
    const numberCharCodes = Array.from({ length: numberLength }).map(
      (_, index) => '0'.charCodeAt(0) + index,
    );
    return String.fromCharCode(...numberCharCodes);
  }
  private getAlphabets(): string {
    const alphabetLength = 26;
    const upperAlphabetCharCodes = Array.from({ length: alphabetLength }).map(
      (_, index) => 'A'.charCodeAt(0) + index,
    );
    const lowerAlphabetCharCodes = Array.from({ length: alphabetLength }).map(
      (_, index) => 'a'.charCodeAt(0) + index,
    );

    return `${String.fromCharCode(
      ...upperAlphabetCharCodes,
    )}${String.fromCharCode(...lowerAlphabetCharCodes)}`;
  }
}
