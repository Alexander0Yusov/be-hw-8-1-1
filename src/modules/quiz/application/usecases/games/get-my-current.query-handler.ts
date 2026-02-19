import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostConnectionViewDto } from '../../../dto/game-pair-quiz/post-connection-view.dto';
import { GamesQueryRepository } from '../../../infrastructure/query/games-query.repository';
import { GameStatuses } from '../../../dto/game-pair-quiz/answer-status';

export class GetMyCurrentQuery {
  constructor(public userId: string) {}
}

@QueryHandler(GetMyCurrentQuery)
export class GetMyCurrentHandler
  implements IQueryHandler<GetMyCurrentQuery, PostConnectionViewDto>
{
  constructor(private gamesQueryRepository: GamesQueryRepository) {}

  async execute({ userId }: GetMyCurrentQuery): Promise<PostConnectionViewDto> {
    const game =
      await this.gamesQueryRepository.findActiveOrPendingGameOrNotFoundFail(
        userId,
      );

    if (game.status === GameStatuses.Finished) {
      throw new NotFoundException('You dont have unfinished pair');
    } else {
      return game;
    }
  }
}
