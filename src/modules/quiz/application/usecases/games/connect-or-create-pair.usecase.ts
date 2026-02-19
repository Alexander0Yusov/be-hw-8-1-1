import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamesRepository } from '../../../infrastructure/games.repository';
import { Question } from '../../../domain/question/question.entity';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { GameStatuses } from '../../../dto/game-pair-quiz/answer-status';
import { Game } from '../../../domain/game/game.entity';

export class ConnectOrCreatePairCommand {
  constructor(public userId: string) {}
}

@CommandHandler(ConnectOrCreatePairCommand)
export class ConnectOrCreatePairUseCase
  implements ICommandHandler<ConnectOrCreatePairCommand, string>
{
  constructor(
    private gamesRepository: GamesRepository,

    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
  ) {}

  async execute({ userId }: ConnectOrCreatePairCommand): Promise<string> {
    // проверка на участие в активной игре или стояние в очереди
    if (await this.gamesRepository.findActiveOrPendingGame(Number(userId))) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Forbidden',
        extensions: [
          {
            field: 'game',
            message: 'User has an active game',
          },
        ],
      });
    }

    // проверка на наличие беспарных со статусом ожидания
    const gameWithPendingStatus =
      await this.gamesRepository.findByStatusOrNotFoundFail(
        GameStatuses.PendingSecondPlayer,
      );

    if (!gameWithPendingStatus) {
      // если не нашлась игра с существующим ждуном то даем ответ
      // о том что мы сами стали ждуном
      // создаем сущность игры

      const newGame = Game.createInstance(Number(userId));
      const createdGame = await this.gamesRepository.save(newGame);

      return createdGame.id.toString();
    }

    // если есть беспарный то пара закрывается и начинается игра
    // отправить время начала, выбрать 5 вопросов, поменять статус

    await gameWithPendingStatus.connectSecondPlayerAndStart(
      Number(userId),
      this.questionRepo,
    );

    const gameWithActiveStatus = await this.gamesRepository.save(
      gameWithPendingStatus,
    );

    return gameWithActiveStatus.id.toString();
  }
}
