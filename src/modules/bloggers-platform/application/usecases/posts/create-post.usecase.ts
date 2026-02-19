import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../../infrastructure/posts.repository';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';
import { Post } from '../../../domain/post/post.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class PostCreateForBlogDto {
  title: string;
  shortDescription: string;
  content: string;
}

export class CreatePostCommand {
  constructor(
    public dto: PostCreateForBlogDto,
    public blogId: string,
    public userId?: string,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase
  implements ICommandHandler<CreatePostCommand, string>
{
  constructor(
    private postsRepository: PostsRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute({ dto, blogId, userId }: CreatePostCommand): Promise<string> {
    const blog = await this.blogsRepository.findOrNotFoundFail(blogId);

    if (blog.userId === Number(userId)) {
      const newPost = Post.createInstance({ ...dto, blogId });

      const post = await this.postsRepository.save(newPost);

      return String(post.id);
    }

    throw new DomainException({
      code: DomainExceptionCode.Forbidden,
      message: 'Blog was created by another user',
    });
  }
}
