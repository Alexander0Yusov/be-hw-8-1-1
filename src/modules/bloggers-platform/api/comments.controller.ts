import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CommentUpdateDto } from '../dto/comment/comment-update.dto';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateCommentCommand } from '../application/usecases/comments/update-comment.usecase';
import { LikeInputDto } from '../dto/like/like-input.dto';
import { UpdateCommentLikeStatusCommand } from '../application/usecases/comments/update-comment-like-status.usecase';
import { DeleteCommentCommand } from '../application/usecases/comments/delete-comment.usecase';
import { GetCommentCommand } from '../application/usecases/comments/get-comment.usecase';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { JwtOptionalAuthGuard } from '../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';

import { CommentViewDto } from '../dto/comment/comment-view.dto';

@ApiTags('Comments')
@Controller('comments')
@SkipThrottle()
export class CommentsController {
  constructor(private commandBus: CommandBus) {}

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update Comment' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Comment id',
    required: true,
    type: String,
    example: '1',
  })
  @ApiBody({
    type: CommentUpdateDto,
    description: 'Comment payload',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Comment updated',
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
    description: 'Comment not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Comment not found' } },
      example: { message: 'Comment not found' },
    },
  })
  async updateComment(
    @Param('id') id: string,
    @Body() body: CommentUpdateDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateCommentCommand(body, id, user.id));
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update like status for a comment' })
  @ApiParam({ name: 'id', type: String, description: 'Comment id' })
  @ApiBody({ type: LikeInputDto })
  @ApiResponse({ status: 204, description: 'Like status updated' })
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
              field: { type: 'string', example: 'email' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Validation error', field: 'email' }],
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
    description: 'Comment not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Comment not found' } },
      example: { message: 'Comment not found' },
    },
  })
  async updateCommentLikeStatus(
    @Param('id') id: string,
    @Body() like: LikeInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateCommentLikeStatusCommand(like, id, user.id),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete comment by id' })
  @ApiParam({ name: 'id', type: String, description: 'Comment id' })
  @ApiResponse({ status: 204, description: 'Comment deleted' })
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
    description: 'Comment not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Comment not found' } },
      example: { message: 'Comment not found' },
    },
  })
  async deleteComment(
    @Param('id') id: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteCommentCommand(id, user.id));
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  @ApiOperation({ summary: 'Get comment by id' })
  @ApiParam({ name: 'id', type: String, description: 'Comment id' })
  @ApiResponse({ status: 200, description: 'Comment found', type: CommentViewDto })
  @ApiResponse({
    status: 404,
    description: 'Comment not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Comment not found' } },
      example: { message: 'Comment not found' },
    },
  })
  async getComment(
    @Param('id') id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<void> {
    return await this.commandBus.execute(new GetCommentCommand(id, user?.id));
  }
}

// создать шину, зарегать, создать команду, обработчик

