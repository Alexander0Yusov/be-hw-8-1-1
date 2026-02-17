import { LikeStatus } from '../../domain/like/like.entity';
import { CommentDbDto } from './comment-db.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CommentatorInfo {
  @ApiProperty({
    description: 'User ID',
    type: String,
    example: '1',
  })
  userId: string;

  @ApiProperty({
    description: 'User login',
    type: String,
    example: 'john_doe',
  })
  userLogin: string;
}

export class LikesInfo {
  @ApiProperty({
    description: 'Number of likes',
    type: Number,
    example: 0,
  })
  likesCount: number;

  @ApiProperty({
    description: 'Number of dislikes',
    type: Number,
    example: 0,
  })
  dislikesCount: number;

  @ApiProperty({
    description: 'Current user like status',
    enum: ['Like', 'Dislike', 'None'],
    example: 'None',
  })
  myStatus: LikeStatus;
}

export class CommentViewDto {
  @ApiProperty({
    description: 'Comment ID',
    type: String,
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: 'Comment content text',
    type: String,
    example: 'This is a great post! Very informative and well written.',
  })
  content: string;

  @ApiProperty({
    description: 'Information about the comment author',
    type: CommentatorInfo,
  })
  commentatorInfo: CommentatorInfo;

  @ApiProperty({
    description: 'Comment creation date in ISO format',
    type: String,
    format: 'date-time',
    example: '2025-02-17T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Likes and dislikes information',
    type: LikesInfo,
  })
  likesInfo: LikesInfo;

  static mapToView(
    comment: CommentDbDto & {
      login: string;
      likesCount: number;
      dislikesCount: number;
    },
    myStatus: LikeStatus = LikeStatus.None,
  ): CommentViewDto {
    return {
      id: comment.id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId.toString(),
        userLogin: comment.login,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: myStatus,
      },
    };
  }
}
