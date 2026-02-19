import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeInputDto } from '../../../dto/like/like-input.dto';
import { CommentsRepository } from '../../../infrastructure/comments.repository';
import { LikesRepository } from '../../../infrastructure/likes.repository';
import { ParentEntityType } from '../../../domain/like/like.entity';

export class UpdateCommentLikeStatusCommand {
  constructor(
    public dto: LikeInputDto,
    public parentId: string,
    public userId: string,
  ) {}
}

@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusUseCase
  implements ICommandHandler<UpdateCommentLikeStatusCommand, void>
{
  constructor(
    private commentsRepository: CommentsRepository,
    private likesRepository: LikesRepository,
  ) {}

  async execute({
    dto,
    parentId,
    userId,
  }: UpdateCommentLikeStatusCommand): Promise<void> {
    // надо проверить что коммент существует
    await this.commentsRepository.findById(parentId);

    await this.likesRepository.createOrUpdate(
      parentId,
      userId,
      ParentEntityType.Comment,
      dto.likeStatus,
    );
  }
}
