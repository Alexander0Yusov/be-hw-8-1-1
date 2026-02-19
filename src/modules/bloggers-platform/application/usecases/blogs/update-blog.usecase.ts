import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogInputDto } from '../../../dto/blog/blog-input.dto';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateBlogCommand {
  constructor(
    public dto: BlogInputDto,
    public id: string,
    public userId?: string,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase
  implements ICommandHandler<UpdateBlogCommand, void>
{
  constructor(private blogsRepository: BlogsRepository) {}

  async execute({ dto, id, userId }: UpdateBlogCommand): Promise<void> {
    const blog = await this.blogsRepository.findOrNotFoundFail(id);

    if (blog.userId === Number(userId)) {
      blog.update(dto);
      await this.blogsRepository.save(blog);
    } else {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Blog was created by another user',
      });
    }
  }
}
