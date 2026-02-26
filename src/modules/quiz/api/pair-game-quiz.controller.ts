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
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
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
import { GetMyGamesQueryParams } from '../dto/game-pair-quiz/get-my-games-query-params.input-dto';
import { GetTopStatisticQueryParams } from '../dto/game-pair-quiz/get-top-statistic-query-params.input-dto';
import { StatisticTopViewDto } from '../dto/game-pair-quiz/statistic-top-view.dto';
import { CheckUserDeadlineByIdAndFinalizeCommand } from '../application/usecases/games/check-user-deadline-by-id-and-finalize.usecase';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';

@ApiTags('Pair Game Quiz')
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect Or Create Pair' })
  @ApiResponse({ status: 200, description: 'Game returned', type: PostConnectionViewDto })
  @ApiResponse({
    status: 403,
    description: 'Current user is already in active pair',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Current user is already in active pair' } },
      example: { message: 'Current user is already in active pair' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Answer In Current Game' })
  @ApiResponse({ status: 200, description: 'Answer accepted', type: AnswerView })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    schema: {
      type: 'object',
      properties: {
        errorsMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Bad request' },
              field: { type: 'string', example: 'input' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Bad request', field: 'input' }],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Current Game' })
  @ApiResponse({ status: 200, description: 'Current game returned', type: PostConnectionViewDto })
  @ApiResponse({
    status: 404,
    description: 'Active game not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Active game not found' } },
      example: { message: 'Active game not found' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get My Statistic' })
  @ApiResponse({ status: 200, description: 'Statistic returned', type: StatisticViewDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
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
  @ApiOperation({ summary: 'Get Top Statistics' })
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Sort criteria' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiExtraModels(PaginatedViewDto, StatisticTopViewDto)
  @ApiResponse({
    status: 200,
    description: 'Top statistics returned',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedViewDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(StatisticTopViewDto) },
            },
          },
        },
      ],
    },
  })
  async getAllUsersStatistic(
    @Query()
    query: GetTopStatisticQueryParams,
  ): Promise<PaginatedViewDto<StatisticTopViewDto[]>> {
    return await this.playerProgressQueryRepository.getTopStatistic(query);
  }

  @Get('pairs/my')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get My Games' })
  @ApiExtraModels(PaginatedViewDto, PostConnectionViewDto)
  @ApiResponse({
    status: 200,
    description: 'Games returned',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedViewDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(PostConnectionViewDto) },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Game By Id' })
  @ApiParam({ name: 'id', type: String, description: 'Game id' })
  @ApiResponse({ status: 200, description: 'Game returned', type: PostConnectionViewDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid id format',
    schema: {
      type: 'object',
      properties: {
        errorsMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Invalid id format' },
              field: { type: 'string', example: 'id' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Invalid id format', field: 'id' }],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Game not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Game not found' } },
      example: { message: 'Game not found' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
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

