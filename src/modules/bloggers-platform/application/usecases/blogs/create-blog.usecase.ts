import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogInputDto } from '../../../dto/blog/blog-input.dto';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';
import { Blog } from '../../../domain/blog/blog.entity';

export class CreateBlogCommand {
  constructor(
    public dto: BlogInputDto,
    public userId?: string,
  ) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, string>
{
  constructor(private blogsRepository: BlogsRepository) {}

  async execute({ dto, userId }: CreateBlogCommand): Promise<string> {
    const newBlog = Blog.createInstance(
      dto,
      userId ? Number(userId) : undefined,
    );

    const blog = await this.blogsRepository.save(newBlog);

    return String(blog.id);
  }
}
