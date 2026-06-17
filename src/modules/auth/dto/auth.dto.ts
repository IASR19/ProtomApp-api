import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'itamar@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '••••••••' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({ example: 'Itamar Ribeiro' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ required: false })
  needsProfileSetup?: boolean;

  @ApiProperty()
  user: {
    id: string;
    name: string;
    email: string;
    plan: string;
  };
}

export class SetPasswordDto {
  @ApiProperty({ example: 'NovaSenh@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Itamar Ribeiro', required: false })
  @IsString()
  @IsNotEmpty()
  name?: string;
}
