import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../../../core/decorators/transform/trim';

export class PostInputDto {
  @ApiProperty({
    description: 'Post title',
    example: 'My first post',
    maxLength: 30,
  })
  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(30)
  title: string;

  @ApiProperty({
    description: 'Short description',
    example: 'Short summary',
    maxLength: 100,
  })
  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(100)
  shortDescription: string;

  @ApiProperty({
    description: 'Full content',
    example: 'Post content goes here',
    maxLength: 1000,
  })
  @IsString()
  @Trim()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @ApiProperty({ description: 'Associated blog id', example: '1' })
  @IsString()
  @Trim()
  @IsNotEmpty()
  blogId: string;
}
