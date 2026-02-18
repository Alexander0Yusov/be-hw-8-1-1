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
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CommentUpdateDto } from '../dto/comment/comment-update.dto';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateCommentCommand } from '../application/usecases/comments/update-comment.usecase';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/bearer/jwt-auth.guard';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.dto';
import { ExtractUserFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { LikeInputDto } from '../dto/like/like-input.dto';
import { UpdateCommentLikeStatusCommand } from '../application/usecases/comments/update-comment-like-status.usecase';
import { DeleteCommentCommand } from '../application/usecases/comments/delete-comment.usecase';
import { JwtOptionalAuthGuard } from 'src/modules/user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { GetCommentCommand } from '../application/usecases/comments/get-comment.usecase';
import { SkipThrottle } from '@nestjs/throttler';
import e from 'express';

@Controller('comments')
@SkipThrottle()
export class CommentsController {
  constructor(private commandBus: CommandBus) {}

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update comment by id',
    description:
      'Updates the comment. Requires JWT authentication. Returns 204 No Content on success.',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the comment to update its content.',
    required: true,
    type: String,
    example: '1',
  })
  @ApiBody({
    type: CommentUpdateDto,
    description: 'The comment data',
    examples: {
      example1: {
        summary: 'Comment content',
        value: {
          content: 'This is a great post! Very informative and well written.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Comment updated successfully - no content',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input value',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Comment not found for the provided id',
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteComment(
    @Param('id') id: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteCommentCommand(id, user.id));
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getComment(
    @Param('id') id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<void> {
    return await this.commandBus.execute(new GetCommentCommand(id, user?.id));
  }
}

// создать шину, зарегать, создать команду, обработчик
