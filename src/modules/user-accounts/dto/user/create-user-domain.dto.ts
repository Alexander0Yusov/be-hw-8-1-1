import { IsEmail, IsString } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';

export class CreateUserDomainDto {
  login: string;
  passwordHash: string;
  email: string;
}

export class UpdateUserDto {
  @IsString()
  @IsEmail()
  // @Matches(emailConstraints.match)
  @Trim()
  email: string;
}
