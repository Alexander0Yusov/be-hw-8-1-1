import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPostsQueryParams } from '../../../dto/post/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../../../dto/post/post-view.dto';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';
import { PostsQueryRepository } from '../../../infrastructure/query/posts-query.repository';
import { BlogsQueryRepository } from '../../../infrastructure/query/blogs-query.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

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
