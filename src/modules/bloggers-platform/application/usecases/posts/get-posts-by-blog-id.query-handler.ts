import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { GetPostsQueryParams } from 'src/modules/bloggers-platform/dto/post/get-posts-query-params.input-dto';
import { PostViewDto } from 'src/modules/bloggers-platform/dto/post/post-view.dto';
import { BlogsRepository } from 'src/modules/bloggers-platform/infrastructure/blogs.repository';
import { BlogsQueryRepository } from 'src/modules/bloggers-platform/infrastructure/query/blogs-query.repository';
import { PostsQueryRepository } from 'src/modules/bloggers-platform/infrastructure/query/posts-query.repository';

export class GetPostsByBlogIdQuery {
  constructor(
    public dto: GetPostsQueryParams,
    public id?: string,
    public userId?: string,
  ) {}
}

@QueryHandler(GetPostsByBlogIdQuery)
export class GetPostsByBlogIdHandler
  implements
    IQueryHandler<GetPostsByBlogIdQuery, PaginatedViewDto<PostViewDto[]>>
{
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async execute({
    dto,
    id,
    userId,
  }: GetPostsByBlogIdQuery): Promise<PaginatedViewDto<PostViewDto[]>> {
    if (id && userId) {
      const blog = await this.blogsRepository.findOrNotFoundFail(id);

      if (blog.userId !== Number(userId)) {
        throw new DomainException({
          code: DomainExceptionCode.Forbidden,
          message: 'Blog was created by another user',
        });
      }

      return await this.postsQueryRepository.getAll(dto, id);
    }

    if (id) {
      await this.blogsQueryRepository.findByIdOrNotFoundFail(id);
      return await this.postsQueryRepository.getAll(dto, id);
    }

    return await this.postsQueryRepository.getAll(dto);
  }
}
