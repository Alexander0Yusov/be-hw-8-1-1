import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { BlogViewDto } from '../dto/blog/blog-view.dto';
import { BlogsQueryRepository } from '../infrastructure/query/blogs-query.repository';
import { GetBlogsQueryParams } from '../dto/blog/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../dto/post/post-view.dto';
import { PostsQueryRepository } from '../infrastructure/query/posts-query.repository';
import { GetPostsQueryParams } from '../dto/post/get-posts-query-params.input-dto';
import { SkipThrottle } from '@nestjs/throttler';
import { LikesQueryRepository } from '../infrastructure/query/likes-query.repository';
import { postItemsGetsMyStatus } from '../application/mapers/post-items-gets-my-status';
import { JwtOptionalAuthGuard } from '../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { ExtractUserIfExistsFromRequest } from '../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';

@ApiTags('Blogs')
@Controller('blogs')
@SkipThrottle()
export class BlogsController {
  constructor(
    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostsQueryRepository,
    private likesQueryRepository: LikesQueryRepository,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get Blog By Id' })
  @ApiParam({ name: 'id', description: 'Blog id', required: true })
  @ApiResponse({ status: 200, description: 'Blog found', type: BlogViewDto })
  @ApiResponse({
    status: 404,
    description: 'Blog not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Blog not found' } },
      example: { message: 'Blog not found' },
    },
  })
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.findByIdOrNotFoundFail(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get Blogs' })
  @ApiExtraModels(PaginatedViewDto, BlogViewDto)
  @ApiQuery({
    name: 'searchNameTerm',
    required: false,
    description:
      'Search term for blog Name: Name should contains this term in any position',
    type: String,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Default value : createdAt',
    example: 'createdAt',
    type: String,
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    description: 'Default value : desc. Available values : asc, desc',
    example: 'desc',
    type: String,
  })
  @ApiQuery({
    name: 'pageNumber',
    required: false,
    description: 'pageNumber is number of portions that should be returned',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'pageSize is portions size that should be returned',
    example: 10,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of blogs',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedViewDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(BlogViewDto) },
            },
          },
        },
      ],
    },
  })
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const blogs = await this.blogsQueryRepository.getAll(query);
    return blogs;
  }

  @Get(':id/posts')
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Get Blog Posts' })
  @ApiParam({
    name: 'id',
    description: 'Blog id',
    required: true,
    type: String,
    example: '1',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
    example: 'createdAt',
    type: String,
    schema: { default: 'createdAt' },
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    description: 'Sort direction: asc or desc',
    example: 'desc',
    type: String,
    schema: { default: 'desc' },
  })
  @ApiQuery({
    name: 'pageNumber',
    required: false,
    description: 'Page number (1-based)',
    example: 1,
    type: Number,
    schema: { default: 1 },
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of items per page',
    example: 10,
    type: Number,
    schema: { default: 10 },
  })
  @ApiExtraModels(PaginatedViewDto, PostViewDto)
  @ApiResponse({
    status: 200,
    description: 'Posts returned',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedViewDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(PostViewDto) },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Blog not found',
  })
  async getPostsForBlog(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const posts = await this.postsQueryRepository.getAll(query, id);

    if (user?.id) {
      const postIds = posts.items.map((post) => Number(post.id));

      const likes = await this.likesQueryRepository.getMyLikesForPostsIds(
        postIds,
        user.id,
      );

      const updatedItems = postItemsGetsMyStatus(posts.items, likes);
      posts.items = updatedItems;
    }

    return posts;
  }
}

