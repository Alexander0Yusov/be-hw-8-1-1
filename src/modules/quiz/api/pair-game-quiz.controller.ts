import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from 'src/modules/user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from 'src/modules/user-accounts/guards/dto/user-context.dto';
import { PostConnectionViewDto } from '../dto/game-pair-quiz/post-connection-view.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GamesQueryRepository } from '../infrastructure/query/games-query.repository';
import { AnswerInputDto } from '../dto/answer/answer-input.dto';
import { AnswerView } from '../dto/answer/answer-view';
import { MakeAnswerCommand } from '../application/usecases/answers/make-answer.usecase';
import { AnswersQueryRepository } from '../infrastructure/query/answers-query.repository';
import { GetMyCurrentQuery } from '../application/usecases/games/get-my-current.query-handler';
import { GetGameByIdQuery } from '../application/usecases/games/get-current-game-by-id.query-handler';
import { StatisticViewDto } from '../dto/game-pair-quiz/statistic-view.dto';
import { PlayerProgressQueryRepository } from '../infrastructure/query/player-progress-query.repository';
import { ConnectOrCreatePairCommand } from '../application/usecases/games/connect-or-create-pair.usecase';
import { PaginatedViewDto } from 'src/core/dto/base.paginated.view-dto';
import { GetMyGamesQueryParams } from '../dto/game-pair-quiz/get-my-games-query-params.input-dto';
import { GetTopStatisticQueryParams } from '../dto/game-pair-quiz/get-top-statistic-query-params.input-dto';
import { StatisticTopViewDto } from '../dto/game-pair-quiz/statistic-top-view.dto';
import { CheckUserDeadlineByIdAndFinalizeCommand } from '../application/usecases/games/check-user-deadline-by-id-and-finalize.usecase';

@Controller('pair-game-quiz')
export class PairGameQuizController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,

    private answersQueryRepository: AnswersQueryRepository,
    private gamesQueryRepository: GamesQueryRepository,
    private playerProgressQueryRepository: PlayerProgressQueryRepository,
  ) {}

  @Post('pairs/connection')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async connectOrCreatePair(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<PostConnectionViewDto | null> {
    const gameId = await this.commandBus.execute(
      new ConnectOrCreatePairCommand(user.id),
    );

    const game = await this.gamesQueryRepository.findByIdOrNotFoundFail(gameId);

    return game;
  }

  @Post('pairs/my-current/answers')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async postAnswer(
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() body: AnswerInputDto,
  ): Promise<AnswerView> {
    const answerId = await this.commandBus.execute(
      new MakeAnswerCommand(body, user.id),
    );

    const answer =
      await this.answersQueryRepository.findByIdOrNotFoundFail(answerId);

    return answer;
  }

  @Get('pairs/my-current')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrent(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<PostConnectionViewDto> {
    await this.commandBus.execute(
      new CheckUserDeadlineByIdAndFinalizeCommand(user.id),
    );

    return await this.queryBus.execute(new GetMyCurrentQuery(user.id));
  }

  @Get('users/my-statistic')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyStatistic(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<StatisticViewDto> {
    await this.commandBus.execute(
      new CheckUserDeadlineByIdAndFinalizeCommand(user.id),
    );

    return await this.playerProgressQueryRepository.getStatisticByUserId(
      user.id,
    );
  }

  @Get('users/top')
  @HttpCode(HttpStatus.OK)
  async getAllUsersStatistic(
    @Query()
    query: GetTopStatisticQueryParams,
  ): Promise<PaginatedViewDto<StatisticTopViewDto[]>> {
    return await this.playerProgressQueryRepository.getTopStatistic(query);
  }

  @Get('pairs/my')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query() query: GetMyGamesQueryParams,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<PaginatedViewDto<PostConnectionViewDto[]>> {
    await this.commandBus.execute(
      new CheckUserDeadlineByIdAndFinalizeCommand(user.id),
    );

    return await this.gamesQueryRepository.getMyAll(query, user.id);
  }

  // роут с параметром должен быть вконце иначе в него будет попадать все подряд
  @Get('pairs/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentById(
    @Param('id') id: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<PostConnectionViewDto> {
    const parsed = Number(id);

    if (isNaN(parsed)) {
      throw new BadRequestException('Invalid id format');
    }

    await this.commandBus.execute(
      new CheckUserDeadlineByIdAndFinalizeCommand(user.id),
    );

    return await this.queryBus.execute(new GetGameByIdQuery(id, user.id));
  }
}
