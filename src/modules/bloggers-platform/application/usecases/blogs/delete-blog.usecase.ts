import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { BlogsRepository } from 'src/modules/bloggers-platform/infrastructure/blogs.repository';

export class DeleteBlogCommand {
  constructor(
    public id: string,
    public userId?: string,
  ) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase
  implements ICommandHandler<DeleteBlogCommand, void>
{
  constructor(private blogsRepository: BlogsRepository) {}

  async execute({ id, userId }: DeleteBlogCommand): Promise<void> {
    const blog = await this.blogsRepository.findOrNotFoundFail(id);

    if (blog.userId === Number(userId)) {
      await this.blogsRepository.deleteOrNotFoundFail(id);
    } else {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Blog was created by another user',
      });
    }
  }
}
