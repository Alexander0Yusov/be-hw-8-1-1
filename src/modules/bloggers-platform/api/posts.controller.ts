import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBasicAuth,
  ApiBearerAuth,
  ApiTags,
  ApiQuery,
  ApiExtraModels,
  getSchemaPath,
  ApiParam,
} from '@nestjs/swagger';
import { PostsQueryRepository } from '../infrastructure/query/posts-query.repository';
import { PostInputDto } from '../dto/post/post-iput.dto';
import { PostViewDto } from '../dto/post/post-view.dto';
import { GetPostsQueryParams } from '../dto/post/get-posts-query-params.input-dto';
import { CommentViewDto } from '../dto/comment/comment-view.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CommentInputDto } from '../dto/comment/comment-input.dto';
import { CreateCommentCommand } from '../application/usecases/comments/create-comment.usecase';
import { CommentsQueryRepository } from '../infrastructure/query/comments-query.repository';
import { LikeInputDto } from '../dto/like/like-input.dto';
import { UpdatePostLikeStatusCommand } from '../application/usecases/posts/update-post-like-status.usecase';
import { CreatePostCommand } from '../application/usecases/posts/create-post.usecase';
import { LikesQueryRepository } from '../infrastructure/query/likes-query.repository';
import { postItemsGetsMyStatus } from '../application/mapers/post-items-gets-my-status';
import { GetCommentsQueryParams } from '../dto/comment/get-comments-query-params.input-dto';
import { commentItemsGetsMyStatus } from '../application/mapers/comment-items-gets-my-status';
import { GetPostQuery } from '../application/usecases/posts/get-post.query-handler';
import { SkipThrottle } from '@nestjs/throttler';
import { BasicAuthGuard } from '../../user-accounts/guards/basic/basi-auth.guard';
import { JwtOptionalAuthGuard } from '../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { ExtractUserIfExistsFromRequest } from '../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';

@ApiTags('Posts')
@Controller('posts')
@SkipThrottle()
export class PostsController {
  constructor(
    private postsQueryRepository: PostsQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
    private likesQueryRepository: LikesQueryRepository,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Create Post' })
  @ApiBasicAuth()
  @ApiBody({ type: PostInputDto })
  @ApiResponse({ status: 201, description: 'Post created', type: PostViewDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async create(@Body() dto: PostInputDto): Promise<PostViewDto> {
    const postId = await this.commandBus.execute(
      new CreatePostCommand(
        {
          title: dto.title,
          shortDescription: dto.shortDescription,
          content: dto.content,
        },
        dto.blogId,
      ),
    );
    return await this.postsQueryRepository.findByIdOrNotFoundFail(postId);
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Get Post By Id' })
  @ApiParam({
    name: 'id',
    description: 'Post id',
    required: true,
    type: String,
    example: '1',
  })
  @ApiResponse({ status: 200, description: 'Post found', type: PostViewDto })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Post not found' } },
      example: { message: 'Post not found' },
    },
  })
  async getById(
    @Param('id') id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PostViewDto> {
    return await this.queryBus.execute(new GetPostQuery(id, user?.id));
  }

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Get Posts' })
  @ApiExtraModels(PaginatedViewDto, PostViewDto)
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
    example: 'createdAt',
    type: String,
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    description: 'asc or desc',
    example: 'desc',
    type: String,
  })
  @ApiQuery({
    name: 'pageNumber',
    required: false,
    description: 'Page number',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Page size',
    example: 10,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of posts',
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
  async getAll(
    @Query() query: GetPostsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const posts = await this.postsQueryRepository.getAll(query);

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

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Comment For Post' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Post id',
    required: true,
    type: String,
    example: '1',
  })
  @ApiBody({
    type: CommentInputDto,
    description: 'Comment payload',
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created',
    type: CommentViewDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        errorsMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Validation error' },
              field: { type: 'string', example: 'content' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Validation error', field: 'content' }],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Post not found' } },
      example: { message: 'Post not found' },
    },
  })
  async createCommentForCurrentPost(
    @Param('id') id: string,
    @Body() body: CommentInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<CommentViewDto> {
    const commentId = await this.commandBus.execute(
      new CreateCommentCommand(body, id, user.id),
    );

    const ff =
      await this.commentsQueryRepository.findByIdOrNotFoundFail(commentId);

    return ff;
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update Post Like Status' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Post id',
    required: true,
    type: String,
    example: '1',
  })
  @ApiBody({
    type: LikeInputDto,
    description: 'Like status payload',
  })
  @ApiResponse({
    status: 204,
    description: 'Like status updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        errorsMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Validation error' },
              field: { type: 'string', example: 'likeStatus' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Validation error', field: 'likeStatus' }],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Post not found' } },
      example: { message: 'Post not found' },
    },
  })
  async updateLikeStatusForCurrentPost(
    @Param('id') id: string,
    @Body() body: LikeInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdatePostLikeStatusCommand(body, id, user.id),
    );
  }

  @Get(':id/comments')
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Get Post Comments' })
  @ApiParam({
    name: 'id',
    description: 'Post id',
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
  @ApiExtraModels(PaginatedViewDto, CommentViewDto)
  @ApiResponse({
    status: 200,
    description: 'Comments returned',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedViewDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(CommentViewDto) },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Post not found' } },
      example: { message: 'Post not found' },
    },
  })
  async getCommentsByPostId(
    @Param('id') id: string,
    @Query() query: GetCommentsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    await this.postsQueryRepository.findByIdOrNotFoundFail(id);

    const comments = await this.commentsQueryRepository.findManyByPostId(
      id,
      query,
    );

    if (user?.id) {
      const commentIds = comments.items.map((comment) => Number(comment.id));
      const likes = await this.likesQueryRepository.getMyLikesForCommentsIds(
        commentIds,
        user.id,
      );

      const updatedItems = commentItemsGetsMyStatus(comments.items, likes);
      comments.items = updatedItems;
    }

    return comments;
  }
}

