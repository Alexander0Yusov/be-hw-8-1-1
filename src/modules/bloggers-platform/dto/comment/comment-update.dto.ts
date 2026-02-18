import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CommentUpdateDto {
  @ApiProperty({
    description: 'Comment content',
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
