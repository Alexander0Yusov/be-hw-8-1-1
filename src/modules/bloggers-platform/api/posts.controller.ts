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
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { CommentViewDto } from '../dto/comment/comment-view.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CommentInputDto } from '../dto/comment/comment-input.dto';
import { CreateCommentCommand } from '../application/usecases/comments/create-comment.usecase';
import { ExtractUserFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.dto';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/bearer/jwt-auth.guard';
import { CommentsQueryRepository } from '../infrastructure/query/comments-query.repository';
import { LikeInputDto } from '../dto/like/like-input.dto';
import { UpdatePostLikeStatusCommand } from '../application/usecases/posts/update-post-like-status.usecase';
import { JwtOptionalAuthGuard } from 'src/modules/user-accounts/guards/bearer/jwt-optional-auth.guard';
import { BasicAuthGuard } from 'src/modules/user-accounts/guards/basic/basi-auth.guard';
import { CreatePostCommand } from '../application/usecases/posts/create-post.usecase';
import { ExtractUserIfExistsFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { LikesQueryRepository } from '../infrastructure/query/likes-query.repository';
import { postItemsGetsMyStatus } from '../application/mapers/post-items-gets-my-status';
import { GetCommentsQueryParams } from '../dto/comment/get-comments-query-params.input-dto';
import { commentItemsGetsMyStatus } from '../application/mapers/comment-items-gets-my-status';
import { GetPostQuery } from '../application/usecases/posts/get-post.query-handler';
import { SkipThrottle } from '@nestjs/throttler';

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
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBasicAuth()
  @ApiBody({ type: PostInputDto })
  @ApiResponse({ status: 201, description: 'Post created', type: PostViewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get post by id' })
  @ApiParam({
    name: 'id',
    description: 'Post id',
    required: true,
    type: String,
    example: '1',
  })
  @ApiResponse({ status: 200, description: 'Post found', type: PostViewDto })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getById(
    @Param('id') id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<PostViewDto> {
    return await this.queryBus.execute(new GetPostQuery(id, user?.id));
  }

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Get all posts' })
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
  @ApiOperation({
    summary: 'Create a comment for a post',
    description:
      'Creates a new comment on the specified post. Requires JWT authentication.',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the post to add a comment to',
    required: true,
    type: String,
    example: '1',
  })
  @ApiBody({
    type: CommentInputDto,
    description: 'Comment data containing the content text',
    examples: {
      example1: {
        value: {
          content: 'This is a great post! Very informative and well written.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully and returned',
    type: CommentViewDto,
    examples: {
      example1: {
        summary: 'Successfully created comment response',
        value: {
          id: '1',
          content: 'This is a great post! Very informative and well written.',
          commentatorInfo: {
            userId: '1',
            userLogin: 'john_doe',
          },
          createdAt: '2025-02-17T10:30:00.000Z',
          likesInfo: {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: 'None',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invalid comment data (content must be 20-300 characters)',
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized - JWT token is missing or invalid. Enter JWT Bearer token only',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found with the specified id',
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
  @ApiOperation({
    summary: 'Update like status for a post',
    description:
      'Updates the like or dislike status for the specified post. Requires JWT authentication. Returns 204 No Content on success.',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the post to update like status for',
    required: true,
    type: String,
    example: '1',
  })
  @ApiBody({
    type: LikeInputDto,
    description: 'Like status data',
    examples: {
      like: {
        summary: 'Like the post',
        value: {
          likeStatus: 'Like',
        },
      },
      dislike: {
        summary: 'Dislike the post',
        value: {
          likeStatus: 'Dislike',
        },
      },
      none: {
        summary: 'Remove like/dislike',
        value: {
          likeStatus: 'None',
        },
      },
    },
  })
  @ApiResponse({
    status: 204,
    description: 'Like status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid like status value',
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized - JWT token is missing or invalid. Enter JWT Bearer token only',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found with the specified id',
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
  @ApiOperation({
    summary: 'Get all comments for a post',
    description:
      'Retrieves a paginated list of all comments for the specified post. JWT authentication is optional.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the post to get comments for',
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
    description: 'Paginated list of comments for the post',
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
    description: 'Post not found with the specified id',
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
