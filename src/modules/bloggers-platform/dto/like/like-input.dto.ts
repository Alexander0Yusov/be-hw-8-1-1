import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LikeStatus } from '../../domain/like/like.entity';

export class LikeInputDto {
  @ApiProperty({
    description: 'Like status for a post or comment',
    enum: ['Like', 'Dislike', 'None'],
    example: 'Like',
  })
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus.None;
}
