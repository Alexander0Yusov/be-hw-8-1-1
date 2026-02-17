import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CommentInputDto {
  @ApiProperty({
    description: 'Comment content text',
    type: String,
    minLength: 20,
    maxLength: 300,
    example: 'This is a great post! Very informative and well written.',
  })
  @IsString()
  @IsNotEmpty()
  @Length(20, 300)
  content: string;
}
