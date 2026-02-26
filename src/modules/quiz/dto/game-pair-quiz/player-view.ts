import { ApiProperty } from '@nestjs/swagger';

export class PlayerView {
  @ApiProperty({ example: '42' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  login: string;
}
