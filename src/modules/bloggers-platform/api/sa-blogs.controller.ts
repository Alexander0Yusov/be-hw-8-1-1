import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/query/blogs-query.repository';
import {
  ApiBasicAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BlogInputDto } from '../dto/blog/blog-input.dto';
import { BlogViewDto } from '../dto/blog/blog-view.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/usecases/blogs/create-blog.usecase';
import { GetBlogsQueryParams } from '../dto/blog/get-blogs-query-params.input-dto';
import { BlogUpdateDto } from '../dto/blog/blog-update.dto';
import { UpdateBlogCommand } from '../application/usecases/blogs/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/blogs/delete-blog.usecase';
import { CreatePostCommand } from '../application/usecases/posts/create-post.usecase';
import { PostUpdateOnBlogRouteDto } from '../dto/post/post-update-on-blog-route.dto';
import { PostsQueryRepository } from '../infrastructure/query/posts-query.repository';
import { GetPostsQueryParams } from '../dto/post/get-posts-query-params.input-dto';
import { GetPostsByBlogIdQuery } from '../application/usecases/posts/get-posts-by-blog-id.query-handler';
import { UpdatePostCommand } from '../application/usecases/posts/update-post.usecase';
import { DeletePostCommand } from '../application/usecases/posts/delete-post.usecase';
import { SkipThrottle } from '@nestjs/throttler';
import { PostViewDto } from '../dto/post/post-view.dto';
import { UpdateBlogBindingWithUserCommand } from '../application/usecases/blogs/update-blog-binding-with-user.usecase';
import { BlogViewSaDto } from '../dto/blog/blog-view-sa.dto';
import { BasicAuthGuard } from '../../user-accounts/guards/basic/basi-auth.guard';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';

@Controller('sa/blogs')
@SkipThrottle()
@UseGuards(BasicAuthGuard)
@ApiBasicAuth()
@ApiTags('SA Blogs')
export class SaBlogsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostsQueryRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create blog (SA)' })
  @ApiResponse({ status: 201, description: 'Blog created', type: BlogViewDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async createBySa(@Body() dto: BlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.commandBus.execute(new CreateBlogCommand(dto));
    return this.blogsQueryRepository.findByIdOrNotFoundFail(blogId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all blogs (SA)' })
  @ApiResponse({ status: 200, description: 'Blogs returned' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async getAllBySa(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewSaDto[]>> {
    return await this.blogsQueryRepository.getAllForSa(query);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update blog by id (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'Blog id' })
  @ApiResponse({ status: 204, description: 'Blog updated' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async updateBlogBySa(
    @Param('id') id: string,
    @Body() body: BlogUpdateDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateBlogCommand(body, id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete blog by id (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'Blog id' })
  @ApiResponse({ status: 204, description: 'Blog deleted' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async deleteBySa(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteBlogCommand(id));
  }

  //
  @Post(':id/posts')
  @ApiOperation({ summary: 'Create post in blog (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'Blog id' })
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
  async createPostBySa(
    @Param('id') id: string,
    @Body() dto: PostUpdateOnBlogRouteDto,
  ): Promise<BlogViewDto | any> {
    const createdPostId = await this.commandBus.execute(
      new CreatePostCommand(
        {
          title: dto.title,
          shortDescription: dto.shortDescription,
          content: dto.content,
        },
        id,
      ),
    );

    return await this.postsQueryRepository.findByIdOrNotFoundFail(
      createdPostId,
    );
  }

  @Get(':id/posts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get posts of blog (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'Blog id' })
  @ApiResponse({ status: 200, description: 'Posts returned' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async getPostsByBlogIdBySa(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return await this.queryBus.execute(new GetPostsByBlogIdQuery(query, id));
  }

  @Put(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update post in blog (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'Blog id' })
  @ApiParam({ name: 'postId', type: String, description: 'Post id' })
  @ApiResponse({ status: 204, description: 'Post updated' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async updatePostByBlogIdBySa(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @Body() body: PostUpdateOnBlogRouteDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdatePostCommand({ ...body, blogId: id }, postId),
    );
  }

  @Delete(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete post in blog (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'Blog id' })
  @ApiParam({ name: 'postId', type: String, description: 'Post id' })
  @ApiResponse({ status: 204, description: 'Post deleted' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async deletePostByBlogIdBySa(
    @Param('id') id: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeletePostCommand(id, postId));
  }

  @Put(':id/bind-with-user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bind blog with user (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'Blog id' })
  @ApiParam({ name: 'userId', type: String, description: 'User id' })
  @ApiResponse({ status: 204, description: 'Binding updated' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async updateBlogBindingWithUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    const parsed = Number(userId);

    if (isNaN(parsed)) {
      throw new BadRequestException('Invalid id format');
    }

    await this.commandBus.execute(
      new UpdateBlogBindingWithUserCommand(id, userId),
    );
  }
}

