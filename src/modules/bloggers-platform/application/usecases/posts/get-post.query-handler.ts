import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import { PostViewDto } from '../../../dto/post/post-view.dto';
import { PostsQueryRepository } from '../../../infrastructure/query/posts-query.repository';
import { LikesRepository } from '../../../infrastructure/likes.repository';

export class GetPostQuery {
  constructor(
    public postId: string,
    public userId?: string,
  ) {}
}

@QueryHandler(GetPostQuery)
export class GetPostHandler
  implements IQueryHandler<GetPostQuery, PostViewDto>
{
  constructor(
    private postsQueryRepository: PostsQueryRepository,
    private likesRepository: LikesRepository,
  ) {}

  async execute({ postId, userId }: GetPostQuery): Promise<PostViewDto> {
    // делаем квери запрос на комментарий и лайк. затем лепим вью обьект
    const post = await this.postsQueryRepository.findByIdOrNotFoundFail(postId);

    if (userId) {
      const like = await this.likesRepository.findByPostIdByAuthorId(
        postId,
        userId,
      );

      // если юзер авторизован и ставил лайк, то подмешиваем в объект статус
      if (like) {
        post.extendedLikesInfo.myStatus = like.status;
      }
    }

    return post;
  }
}
