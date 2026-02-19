import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../../infrastructure/games.repository';
import { AnswersRepository } from '../../../infrastructure/answers.repository';
import { PlayerProgressRepository } from '../../../infrastructure/player-progress.repository';
import { Answer } from '../../../domain/answer/answer.entity';
import { AnswerStatuses } from '../../../dto/game-pair-quiz/answer-status';

export class CheckUserDeadlineByIdAndFinalizeCommand {
  constructor(public userId: string) {}
}

@CommandHandler(CheckUserDeadlineByIdAndFinalizeCommand)
export class CheckUserDeadlineByIdAndFinalizeUseCase
  implements ICommandHandler<CheckUserDeadlineByIdAndFinalizeCommand, void>
{
  constructor(
    private gamesRepository: GamesRepository,

    private answersRepository: AnswersRepository,

    private playerProgressRepository: PlayerProgressRepository,
  ) {}

  async execute({
    userId,
  }: CheckUserDeadlineByIdAndFinalizeCommand): Promise<void> {
    const activeGame = await this.gamesRepository.findActiveGame(
      Number(userId),
    );

    if (!activeGame) {
      return;
    }

    const firstPlayerProgress = activeGame.firstPlayerProgress;
    const secondPlayerProgress = activeGame.secondPlayerProgress;

    const [finishedPlayer, waitingPlayer] =
      firstPlayerProgress.answers.length === activeGame.gameQuestions.length
        ? [firstPlayerProgress, secondPlayerProgress]
        : [secondPlayerProgress, firstPlayerProgress];

    // находим время последнего ответа окончившего
    const lastAnswerTime = finishedPlayer.answers.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0].createdAt;

    // проверяем дедлайн
    const deadline = new Date(lastAnswerTime.getTime() + 10_000);

    if (new Date() >= deadline) {
      activeGame.finish();
      await this.gamesRepository.save(activeGame);

      const answersArr = waitingPlayer.answers;
      const gameQuestionsArr = activeGame.gameQuestions.sort(
        (a, b) =>
          a.question.createdAt.getTime() - b.question.createdAt.getTime(),
      );

      // ищем неотвеченные вопросы у waitingPlayer
      const QuestionsWithoutAnswers = gameQuestionsArr.filter(
        (gq) => !answersArr.map((item) => item.gameQuestionId).includes(gq.id),
      );

      for (const q of QuestionsWithoutAnswers) {
        const newAnswer = Answer.createInstance(
          'Lorem',
          AnswerStatuses.Incorrect,
          q.id,
          waitingPlayer.id,
        );

        const answer = await this.answersRepository.save(newAnswer);
        waitingPlayer.answers.push(answer);
      }

      // бонус за правильный ответ
      const hasCorrect = finishedPlayer.answers.some(
        (a) => a.status === AnswerStatuses.Correct,
      );

      if (hasCorrect) {
        finishedPlayer.incrementScore();
      }

      // назначаем статусы
      if (finishedPlayer.score > waitingPlayer.score) {
        finishedPlayer.makeWin();
        waitingPlayer.makeLoss();
      } else if (finishedPlayer.score < waitingPlayer.score) {
        finishedPlayer.makeLoss();
        waitingPlayer.makeWin();
      } else {
        finishedPlayer.makeDraw();
        waitingPlayer.makeDraw();
      }

      await this.playerProgressRepository.save(finishedPlayer);
      await this.playerProgressRepository.save(waitingPlayer);
    }
  }
}
