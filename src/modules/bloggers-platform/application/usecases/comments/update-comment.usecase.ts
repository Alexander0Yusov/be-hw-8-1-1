import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentUpdateDto } from '../../../dto/comment/comment-update.dto';
import { CommentsRepository } from '../../../infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateCommentCommand {
  constructor(
    public dto: CommentUpdateDto,
    public commentId: string,
    public userId: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand, void>
{
  constructor(private commentsRepository: CommentsRepository) {}

  async execute({
    dto,
    commentId,
    userId,
  }: UpdateCommentCommand): Promise<void> {
    const comment = await this.commentsRepository.findById(commentId);

    if (comment.userId === Number(userId)) {
      comment.update(dto);
      await this.commentsRepository.save(comment);
    } else {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Comment was created by another user',
      });
    }
  }
}
