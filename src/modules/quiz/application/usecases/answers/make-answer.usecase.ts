import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnswerInputDto } from '../../../dto/answer/answer-input.dto';
import { GamesRepository } from '../../../infrastructure/games.repository';
import { AnswersRepository } from '../../../infrastructure/answers.repository';
import { PlayerProgressRepository } from '../../../infrastructure/player-progress.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { AnswerStatuses } from '../../../dto/game-pair-quiz/answer-status';
import { Answer } from '../../../domain/answer/answer.entity';

export class MakeAnswerCommand {
  constructor(
    public dto: AnswerInputDto,
    public userId: string,
  ) {}
}

@CommandHandler(MakeAnswerCommand)
export class MakeAnswerUseCase
  implements ICommandHandler<MakeAnswerCommand, string | null>
{
  constructor(
    private gamesRepository: GamesRepository,
    private answersRepository: AnswersRepository,
    private playerProgressRepository: PlayerProgressRepository,
  ) {}

  async execute({ dto, userId }: MakeAnswerCommand): Promise<string | null> {
    // находим активную игру
    const game = await this.gamesRepository.findActiveGame(Number(userId));

    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Forbidden',
        extensions: [{ field: 'game', message: 'User is not in the game' }],
      });
    }

    // заранее имеем оба прогресса
    const currentPlayerProgress =
      game.firstPlayerProgress.userId === Number(userId)
        ? game.firstPlayerProgress
        : game.secondPlayerProgress;

    const otherPlayerProgress =
      game.firstPlayerProgress.userId !== Number(userId)
        ? game.firstPlayerProgress
        : game.secondPlayerProgress;

    // имеем массивы вопросов и ответов
    const answersArr = currentPlayerProgress.answers;
    const gameQuestionsArr = game.gameQuestions.sort(
      (a, b) => a.question.createdAt.getTime() - b.question.createdAt.getTime(),
    );

    // ищем первый неотвеченный вопрос
    const firstQuestionWithoutAnswer = gameQuestionsArr.find(
      (gq) => !answersArr.map((item) => item.gameQuestionId).includes(gq.id),
    );

    if (!firstQuestionWithoutAnswer) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Forbidden',
        extensions: [
          {
            field: 'answer',
            message: 'User answered all questions',
          },
        ],
      });
    }

    // сличаем ответ
    const answerStatus = firstQuestionWithoutAnswer.question.correctAnswers
      .map((q) => q.trim().toLowerCase())
      .includes(dto.answer.trim().toLowerCase())
      ? AnswerStatuses.Correct
      : AnswerStatuses.Incorrect;

    // создаем сущность ответа
    // вписываем ответ со статусом и сохраняем сущность
    const newAnswer = Answer.createInstance(
      dto.answer,
      answerStatus,
      firstQuestionWithoutAnswer.id,
      currentPlayerProgress.id,
    );

    const answer = await this.answersRepository.save(newAnswer);

    currentPlayerProgress.answers.push(answer);

    // прибавляем 1 очко в прогрессе
    if (answerStatus === AnswerStatuses.Correct) {
      currentPlayerProgress.incrementScore();
      await this.playerProgressRepository.save(currentPlayerProgress);
    }

    // если этот ответ стал последним для обоих
    // то меняем статус игры и статусы прогрессов
    if (
      otherPlayerProgress.answers.length === game.gameQuestions.length &&
      currentPlayerProgress.answers.length === game.gameQuestions.length
    ) {
      const hasCorrect = otherPlayerProgress.answers.some(
        (a) => a.status === AnswerStatuses.Correct,
      );

      if (hasCorrect) {
        // если другой игрок имеет как минимум 1 балл и
        // справился раньше, то ему присуждается бонус+1
        otherPlayerProgress.incrementScore();
      }

      if (otherPlayerProgress.score > currentPlayerProgress.score) {
        otherPlayerProgress.makeWin();
        currentPlayerProgress.makeLoss();
      } else if (otherPlayerProgress.score < currentPlayerProgress.score) {
        otherPlayerProgress.makeLoss();
        currentPlayerProgress.makeWin();
      } else {
        otherPlayerProgress.makeDraw();
        currentPlayerProgress.makeDraw();
      }

      await this.playerProgressRepository.save(otherPlayerProgress);
      await this.playerProgressRepository.save(currentPlayerProgress);

      game.finish();
      await this.gamesRepository.save(game);
    }

    return answer.id.toString();
  }
}
