import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentViewDto } from '../../../dto/comment/comment-view.dto';
import { CommentsQueryRepository } from '../../../infrastructure/query/comments-query.repository';
import { LikesRepository } from '../../../infrastructure/likes.repository';

export class GetCommentCommand {
  constructor(
    public commentId: string,
    public userId?: string,
  ) {}
}

@CommandHandler(GetCommentCommand)
export class GetCommentUseCase
  implements ICommandHandler<GetCommentCommand, CommentViewDto>
{
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private likesRepository: LikesRepository,
  ) {}

  async execute({
    commentId,
    userId,
  }: GetCommentCommand): Promise<CommentViewDto> {
    const comment =
      await this.commentsQueryRepository.findByIdOrNotFoundFail(commentId);

    if (userId) {
      const like = await this.likesRepository.findByCommentIdByAuthorId(
        commentId,
        userId,
      );

      if (like) {
        comment.likesInfo.myStatus = like.status;
        return comment;
      }
    }

    return comment;
  }
}
