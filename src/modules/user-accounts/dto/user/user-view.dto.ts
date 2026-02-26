import { ApiProperty, OmitType } from '@nestjs/swagger';
import { User } from '../../domain/user/user.entity';

export class UserViewDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  login: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '2026-02-26T14:10:00.000Z' })
  createdAt: Date;

  static mapToView(user: User) {
    const dto = new UserViewDto();

    dto.id = String(user.id);
    dto.email = user.email;
    dto.login = user.login;
    dto.createdAt = user.createdAt;

    return dto;
  }
}

//https://docs.nestjs.com/openapi/mapped-types
export class MeViewDto extends OmitType(UserViewDto, [
  'createdAt',
  'id',
] as const) {
  @ApiProperty({ example: '1' })
  userId: string;

  static mapToView(user: User): MeViewDto {
    const dto = new MeViewDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user.id.toString();

    return dto;
  }
}
