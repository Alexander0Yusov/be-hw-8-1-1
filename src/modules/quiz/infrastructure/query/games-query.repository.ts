import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../../domain/game/game.entity';
import { GameStatuses } from '../../dto/game-pair-quiz/answer-status';
import { PostConnectionViewDto } from '../../dto/game-pair-quiz/post-connection-view.dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetMyGamesQueryParams } from '../../dto/game-pair-quiz/get-my-games-query-params.input-dto';
import { MyGamesSortField } from '../../dto/game-pair-quiz/my-games-sort-field';

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
  ) {}

  async findByIdOrNotFoundFail(id: string): Promise<PostConnectionViewDto> {
    const game = await this.gameRepo.findOne({
      where: { id: Number(id) },
      relations: [
        'firstPlayerProgress',
        'firstPlayerProgress.user',
        'firstPlayerProgress.answers',
        'firstPlayerProgress.answers.gameQuestion',
        'firstPlayerProgress.answers.gameQuestion.question',

        'secondPlayerProgress',
        'secondPlayerProgress.user',
        'secondPlayerProgress.answers',
        'secondPlayerProgress.answers.gameQuestion',
        'secondPlayerProgress.answers.gameQuestion.question',

        'gameQuestions',
        'gameQuestions.question',
      ],
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return PostConnectionViewDto.mapFrom(game);
  }

  async findActiveOrPendingGameOrNotFoundFail(
    userId: string,
  ): Promise<PostConnectionViewDto> {
    const activeGame = await this.gameRepo
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.firstPlayerProgress', 'fpp')
      .leftJoinAndSelect('fpp.user', 'fppUser')
      .leftJoinAndSelect('fpp.answers', 'fppAnswers')
      .leftJoinAndSelect('fppAnswers.gameQuestion', 'fppAnswerGameQuestion')
      .leftJoinAndSelect('fppAnswerGameQuestion.question', 'fppAnswerQuestion')
      .leftJoinAndSelect('game.secondPlayerProgress', 'spp')
      .leftJoinAndSelect('spp.user', 'sppUser')
      .leftJoinAndSelect('spp.answers', 'sppAnswers')
      .leftJoinAndSelect('sppAnswers.gameQuestion', 'sppAnswerGameQuestion')
      .leftJoinAndSelect('sppAnswerGameQuestion.question', 'sppAnswerQuestion')
      .leftJoinAndSelect('game.gameQuestions', 'gameQuestions')
      .leftJoinAndSelect('gameQuestions.question', 'questions')
      .where('(fpp.userId = :userId OR spp.userId = :userId)', { userId })
      .andWhere('game.status IN (:...statuses)', {
        statuses: [GameStatuses.Active, GameStatuses.PendingSecondPlayer],
      })
      .getOne();

    if (!activeGame) {
      throw new NotFoundException('Game not found');
    }

    return PostConnectionViewDto.mapFrom(activeGame);
  }

  async getMyAll(
    query: GetMyGamesQueryParams,
    userId: string,
  ): Promise<PaginatedViewDto<PostConnectionViewDto[]>> {
    const qb = this.gameRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.firstPlayerProgress', 'fp')
      .leftJoinAndSelect('g.secondPlayerProgress', 'sp')
      .leftJoinAndSelect('fp.user', 'fpUser')
      .leftJoinAndSelect('sp.user', 'spUser')
      .leftJoinAndSelect('fp.answers', 'fpAnswers')
      .leftJoinAndSelect('sp.answers', 'spAnswers')
      .leftJoinAndSelect('fpAnswers.gameQuestion', 'fpAnswerQuestion')
      .leftJoinAndSelect('spAnswers.gameQuestion', 'spAnswerQuestion')
      .leftJoinAndSelect('g.gameQuestions', 'gq')
      .leftJoinAndSelect('gq.question', 'q');

    // --- Фильтрация по userId ---
    qb.where('fp.userId = :userId OR sp.userId = :userId', {
      userId: Number(userId),
    });

    // --- Фильтрация только Finished и Active ---
    qb.where('(fp.userId = :userId OR sp.userId = :userId)', {
      userId,
    }).andWhere('g.status IN (:...statuses)', {
      statuses: [GameStatuses.Finished, GameStatuses.Active],
    });

    // --- Маппинг сортировки через enum ---
    const sortFieldMap: Record<MyGamesSortField, string> = {
      [MyGamesSortField.PairCreatedDate]: 'g.createdAt',
      [MyGamesSortField.StartGameDate]: 'g.startGameDate',
      [MyGamesSortField.FinishGameDate]: 'g.finishGameDate',
      [MyGamesSortField.Status]: 'g.status',
    };

    const sortField = sortFieldMap[query.sortBy];

    if (query.sortBy === MyGamesSortField.Status) {
      // сначала сортируем по статусу, потом внутри Finished по дате
      qb.orderBy(
        'g.status',
        query.sortDirection.toUpperCase() as 'ASC' | 'DESC',
      ).addOrderBy('g.createdAt', 'DESC');
    } else {
      qb.orderBy(
        sortField,
        query.sortDirection.toUpperCase() as 'ASC' | 'DESC',
      );
    }

    // qb.orderBy(sortField, query.sortDirection.toUpperCase() as 'ASC' | 'DESC')
    qb.skip(query.calculateSkip()).take(query.pageSize);

    // --- Выполняем запрос + считаем totalCount ---
    const [games, totalCount] = await qb.getManyAndCount();

    const items = games.map(PostConnectionViewDto.mapFrom);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
