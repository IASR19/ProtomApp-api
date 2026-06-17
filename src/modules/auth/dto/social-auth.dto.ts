import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ example: 'google-id-token-from-client' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class AppleLoginDto {
  @ApiProperty({ example: 'apple-id-token-from-client' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
export class VerifyEmailQueryDto {
  @ApiProperty({ example: 'some-uuid-token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
