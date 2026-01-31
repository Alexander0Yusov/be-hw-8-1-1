import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { BlogsRepository } from 'src/modules/bloggers-platform/infrastructure/blogs.repository';
import { UsersQueryRepository } from 'src/modules/user-accounts/infrastructure/query/users-query.repository';

export class UpdateBlogBindingWithUserCommand {
  constructor(
    public id: string,
    public userId: string,
  ) {}
}

@CommandHandler(UpdateBlogBindingWithUserCommand)
export class UpdateBlogBindingWithUserUseCase
  implements ICommandHandler<UpdateBlogBindingWithUserCommand, void>
{
  constructor(
    private blogsRepository: BlogsRepository,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  async execute({
    id,
    userId,
  }: UpdateBlogBindingWithUserCommand): Promise<void> {
    const blog = await this.blogsRepository.findOrNotFoundFail(id);

    await this.usersQueryRepository.findUserByIdOrNotFindFail(Number(userId));

    if (!blog.userId) {
      blog.bindingWithUser(Number(userId));
      await this.blogsRepository.save(blog);
    } else {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Blog already binded',
      });
    }
  }
}
