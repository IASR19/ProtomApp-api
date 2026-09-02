import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'ID token JWT ou access token emitido pelo Google Identity Services',
  })
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
