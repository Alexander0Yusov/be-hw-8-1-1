import {
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
import { ApiResponse } from '@nestjs/swagger';
import { BlogInputDto } from '../dto/blog/blog-input.dto';
import { BlogViewDto } from '../dto/blog/blog-view.dto';
import { CreateBlogCommand } from '../application/usecases/blogs/create-blog.usecase';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../infrastructure/query/blogs-query.repository';
import { GetBlogsQueryParams } from '../dto/blog/get-blogs-query-params.input-dto';
import { BlogUpdateDto } from '../dto/blog/blog-update.dto';
import { UpdateBlogCommand } from '../application/usecases/blogs/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/blogs/delete-blog.usecase';
import { PostUpdateOnBlogRouteDto } from '../dto/post/post-update-on-blog-route.dto';
import { CreatePostCommand } from '../application/usecases/posts/create-post.usecase';
import { PostsQueryRepository } from '../infrastructure/query/posts-query.repository';
import { PostViewDto } from '../dto/post/post-view.dto';
import { GetPostsByBlogIdQuery } from '../application/usecases/posts/get-posts-by-blog-id.query-handler';
import { GetPostsQueryParams } from '../dto/post/get-posts-query-params.input-dto';
import { UpdatePostCommand } from '../application/usecases/posts/update-post.usecase';
import { DeletePostCommand } from '../application/usecases/posts/delete-post.usecase';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { ExtractUserFromRequest } from '../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';

@Controller('blogger/blogs')
export class BloggersController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,

    private blogsQueryRepository: BlogsQueryRepository,
    private postsQueryRepository: PostsQueryRepository,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createNewBlog(
    @Body() dto: BlogInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<BlogViewDto> {
    const blogId = await this.commandBus.execute(
      new CreateBlogCommand(dto, user.id),
    );

    return this.blogsQueryRepository.findByIdOrNotFoundFail(blogId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllByUserId(
    @Query() query: GetBlogsQueryParams,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const blogs = await this.blogsQueryRepository.getAll(
      query,
      Number(user.id),
    );

    return blogs;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateBlog(
    @Param('id') id: string,
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() body: BlogUpdateDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateBlogCommand(body, id, user.id));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteBlog(
    @Param('id') id: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteBlogCommand(id, user.id));
  }

  //
  @Post(':id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @Param('id') id: string,
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() dto: PostUpdateOnBlogRouteDto,
  ): Promise<PostViewDto> {
    const createdPostId = await this.commandBus.execute(
      new CreatePostCommand(dto, id, user.id),
    );

    return await this.postsQueryRepository.findByIdOrNotFoundFail(
      createdPostId,
    );
  }

  @Get(':id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllPostsForUser(
    @Param('id') id: string,
    @ExtractUserFromRequest() user: UserContextDto,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return await this.queryBus.execute(
      new GetPostsByBlogIdQuery(query, id, user.id),
    );
  }

  @Put(':id/posts/:postId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePost(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() body: PostUpdateOnBlogRouteDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdatePostCommand({ ...body, blogId: id }, postId, user.id),
    );
  }

  @Delete(':id/posts/:postId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deletePost(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new DeletePostCommand(id, postId, user.id));
  }
}
