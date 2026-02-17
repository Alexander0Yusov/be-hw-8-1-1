import { Blog } from '../../domain/blog/blog.entity';
import { ApiProperty } from '@nestjs/swagger';

export class BlogViewDto {
  @ApiProperty({ description: 'Blog id', example: '1' })
  id: string;

  @ApiProperty({ description: 'Blog name', example: 'My Blog' })
  name: string;

  @ApiProperty({
    description: 'Blog description',
    example: 'Short description of the blog',
  })
  description: string;

  @ApiProperty({ description: 'Website URL', example: 'https://example.com' })
  websiteUrl: string;

  @ApiProperty({
    description: 'Creation date',
    type: String,
    format: 'date-time',
    example: '2026-02-17T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({ description: 'Is membership required', example: false })
  isMembership: boolean;

  static mapToView(blog: Blog): BlogViewDto {
    const dto = new BlogViewDto();

    dto.id = blog.id.toString();
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.createdAt = blog.createdAt;
    dto.isMembership = blog.isMembership;

    return dto;
  }
}
