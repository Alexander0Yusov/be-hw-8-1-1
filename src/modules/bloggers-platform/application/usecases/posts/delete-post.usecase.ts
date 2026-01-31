import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { BlogsRepository } from 'src/modules/bloggers-platform/infrastructure/blogs.repository';
import { PostsRepository } from 'src/modules/bloggers-platform/infrastructure/posts.repository';
import { BlogsQueryRepository } from 'src/modules/bloggers-platform/infrastructure/query/blogs-query.repository';

export class DeletePostCommand {
  constructor(
    public blogId: string,
    public postId: string,
    public userId?: string,
  ) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase
  implements ICommandHandler<DeletePostCommand, void>
{
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
  ) {}

  async execute({ blogId, postId, userId }: DeletePostCommand): Promise<void> {
    const blog = await this.blogsRepository.findOrNotFoundFail(blogId);
    const post = await this.postsRepository.findOrNotFoundFail(postId);

    if (blog.userId !== Number(userId) && post.blogId === blog.id) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Post belongs to another user',
      });
    }

    await this.postsRepository.deleteOrNotFoundFail(postId);
  }
}
