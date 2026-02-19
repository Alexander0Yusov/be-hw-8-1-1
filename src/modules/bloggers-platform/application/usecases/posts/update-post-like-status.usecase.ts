import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeInputDto } from '../../../dto/like/like-input.dto';
import { PostsRepository } from '../../../infrastructure/posts.repository';
import { LikesRepository } from '../../../infrastructure/likes.repository';
import { ParentEntityType } from '../../../domain/like/like.entity';

export class UpdatePostLikeStatusCommand {
  constructor(
    public dto: LikeInputDto,
    public parentId: string,
    public userId: string,
  ) {}
}

@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatepostLikeStatusUseCase
  implements ICommandHandler<UpdatePostLikeStatusCommand, void>
{
  constructor(
    private postsRepository: PostsRepository,
    private likesRepository: LikesRepository,
  ) {}

  async execute({
    dto,
    parentId,
    userId,
  }: UpdatePostLikeStatusCommand): Promise<void> {
    await this.postsRepository.findOrNotFoundFail(parentId);

    // создание/обновление записи в коллекции лайков
    await this.likesRepository.createOrUpdate(
      parentId,
      userId,
      ParentEntityType.Post,
      dto.likeStatus,
    );
  }
}
