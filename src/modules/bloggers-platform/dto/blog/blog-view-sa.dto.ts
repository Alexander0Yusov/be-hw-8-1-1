import { Blog } from '../../domain/blog/blog.entity';
import { BlogViewDto } from './blog-view.dto';

type BlogOwnerInfo = {
  userId: string | null;
  userLogin: string | null;
};

export class BlogViewSaDto extends BlogViewDto {
  blogOwnerInfo: BlogOwnerInfo;

  static mapToSaView(blog: Blog): BlogViewSaDto {
    const dto = new BlogViewSaDto();

    dto.id = blog.id.toString();
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.createdAt = blog.createdAt;
    dto.isMembership = blog.isMembership;

    dto.blogOwnerInfo = {
      userId: blog.user?.id.toString() || null,
      userLogin: blog.user?.login || null,
    };

    return dto;
  }
}
