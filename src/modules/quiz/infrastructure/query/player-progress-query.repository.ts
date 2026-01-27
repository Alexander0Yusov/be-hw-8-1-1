import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PlayerProgress,
  VictoryStatus,
} from '../../domain/player-progress/player-progress.entity';
import { GameStatuses } from '../../dto/game-pair-quiz/answer-status';
import { StatisticViewDto } from '../../dto/game-pair-quiz/statistic-view.dto';
import { GetTopStatisticQueryParams } from '../../dto/game-pair-quiz/get-top-statistic-query-params.input-dto';
import { StatisticTopViewDto } from '../../dto/game-pair-quiz/statistic-top-view.dto';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';

@Injectable()
export class PlayerProgressQueryRepository {
  constructor(
    @InjectRepository(PlayerProgress)
    private readonly playerProgressQueryRepo: Repository<PlayerProgress>,
  ) {}

  async getStatisticByUserId(userId: string) {
    const stats = await this.playerProgressQueryRepo
      .createQueryBuilder('pp')
      .where('pp.userId = :userId', { userId: Number(userId) })
      .andWhere('pp.victoryStatus IS NOT NULL')
      .select([
        'CAST(COALESCE(SUM(pp.score), 0) AS INTEGER) as "sumScore"',
        'CAST(COALESCE(AVG(pp.score), 0) AS FLOAT) as "avgScores"',
        'CAST(COUNT(pp.id) AS INTEGER) as "gamesCount"',
        `CAST(COALESCE(SUM(CASE WHEN pp.victoryStatus = :win THEN 1 ELSE 0 END), 0) AS INTEGER) as "winsCount"`,
        `CAST(COALESCE(SUM(CASE WHEN pp.victoryStatus = :loss THEN 1 ELSE 0 END), 0) AS INTEGER) as "lossesCount"`,
        `CAST(COALESCE(SUM(CASE WHEN pp.victoryStatus = :draw THEN 1 ELSE 0 END), 0) AS INTEGER) as "drawsCount"`,
      ])
      .setParameters({
        win: VictoryStatus.Win,
        loss: VictoryStatus.Loss,
        draw: VictoryStatus.Draw,
      })
      .getRawOne();

    if (!stats || stats.gamesCount === 0) {
      return {
        sumScore: 0,
        avgScores: 0,
        gamesCount: 0,
        winsCount: 0,
        lossesCount: 0,
        drawsCount: 0,
      };
    }

    stats.avgScores = Math.round(stats.avgScores * 100) / 100;

    return stats;
  }

  async getTopStatistic(
    query: GetTopStatisticQueryParams,
  ): Promise<PaginatedViewDto<StatisticTopViewDto[]>> {
    const qb = this.playerProgressQueryRepo.createQueryBuilder('p');

    // 1. Формируем выборку с агрегацией всех полей для статистики
    qb.select('p.userId', 'id')
      .addSelect('u.login', 'login')
      .addSelect('SUM(p.score)', 'sumScore')
      .addSelect('CAST(AVG(p.score) AS FLOAT)', 'avgScores')
      .addSelect('CAST(COUNT(p.id) AS INT)', 'gamesCount')
      .addSelect(
        `CAST(SUM(CASE WHEN p.victoryStatus = '${VictoryStatus.Win}' THEN 1 ELSE 0 END) AS INT)`,
        'winsCount',
      )
      .addSelect(
        `CAST(SUM(CASE WHEN p.victoryStatus = '${VictoryStatus.Loss}' THEN 1 ELSE 0 END) AS INT)`,
        'lossesCount',
      )
      .addSelect(
        `CAST(SUM(CASE WHEN p.victoryStatus = '${VictoryStatus.Draw}' THEN 1 ELSE 0 END) AS INT)`,
        'drawsCount',
      )
      .leftJoin('p.user', 'u')
      .groupBy('p.userId')
      .addGroupBy('u.login');

    // 2. Динамическая сортировка по массиву параметров
    if (query.sort && query.sort.length > 0) {
      query.sort.forEach((sortItem, index) => {
        const direction = sortItem.direction.toUpperCase() as 'ASC' | 'DESC';
        // Используем кавычки вокруг названия поля, так как это алиасы из select
        if (index === 0) {
          qb.orderBy(`"${sortItem.field}"`, direction);
        } else {
          qb.addOrderBy(`"${sortItem.field}"`, direction);
        }
      });
    } else {
      // Дефолтная сортировка, если параметры не переданы
      qb.orderBy('"avgScores"', 'DESC').addOrderBy('"sumScore"', 'DESC');
    }

    // 3. Пагинация
    const skip = query.calculateSkip();
    const rawItems = await qb.offset(skip).limit(query.pageSize).getRawMany();

    // 4. Считаем общее количество уникальных игроков для пагинации
    const totalCountResult = await this.playerProgressQueryRepo
      .createQueryBuilder('p')
      .select('COUNT(DISTINCT p.userId)', 'count')
      .getRawOne();

    const totalCount = parseInt(totalCountResult?.count || '0', 10);

    // 5. Маппинг данных в массив StatisticTopViewDto
    // Явное указание типа поможет избежать ошибок несоответствия полей
    const items: StatisticTopViewDto[] = rawItems.map((item) => ({
      sumScore: Number(item.sumScore),
      avgScores: Math.round(Number(item.avgScores) * 100) / 100, // Округление до 2 знаков
      winsCount: Number(item.winsCount),
      lossesCount: Number(item.lossesCount),
      drawsCount: Number(item.drawsCount),
      gamesCount: Number(item.gamesCount),
      player: {
        id: item.id.toString(),
        login: item.login,
      },
    }));

    // 6. Возвращаем результат через стандартный маппер пагинации
    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
