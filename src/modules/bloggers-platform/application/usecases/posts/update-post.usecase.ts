import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { PostUpdateDto } from 'src/modules/bloggers-platform/dto/post/post-update.dto';
import { BlogsRepository } from 'src/modules/bloggers-platform/infrastructure/blogs.repository';
import { PostsRepository } from 'src/modules/bloggers-platform/infrastructure/posts.repository';

export class UpdatePostCommand {
  constructor(
    public dto: PostUpdateDto,
    public postId: string,
    public userId?: string,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase
  implements ICommandHandler<UpdatePostCommand, void>
{
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
  ) {}

  async execute({ dto, postId, userId }: UpdatePostCommand): Promise<void> {
    const blog = await this.blogsRepository.findOrNotFoundFail(dto.blogId);
    const post = await this.postsRepository.findOrNotFoundFail(postId);

    if (blog.userId !== Number(userId) && post.blogId === blog.id) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Post belongs to another user',
      });
    }

    post.update(dto);

    await this.postsRepository.save(post);
  }
}
