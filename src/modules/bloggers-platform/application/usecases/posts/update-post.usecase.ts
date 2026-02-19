import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostUpdateDto } from '../../../dto/post/post-update.dto';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';
import { PostsRepository } from '../../../infrastructure/posts.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

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
