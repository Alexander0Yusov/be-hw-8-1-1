import { Game } from '../../domain/game/game.entity';
import { PlayerProgress } from '../../domain/player-progress/player-progress.entity';
import { ApiProperty } from '@nestjs/swagger';
import { GameStatuses } from './answer-status';
import { GamePlayerProgressView } from './game-player-progress-view';

class QuestionShortViewDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Capital of Great Britain?' })
  body: string;
}

export class PostConnectionViewDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ type: GamePlayerProgressView })
  firstPlayerProgress: GamePlayerProgressView;

  @ApiProperty({ type: GamePlayerProgressView, nullable: true })
  secondPlayerProgress: null | GamePlayerProgressView;

  @ApiProperty({ type: [QuestionShortViewDto], nullable: true })
  questions: { id: string; body: string }[] | null;

  @ApiProperty({
    enum: GameStatuses,
    example: GameStatuses.Active,
  })
  status: GameStatuses;

  @ApiProperty({ example: '2026-02-26T14:10:00.000Z' })
  pairCreatedDate: Date;

  @ApiProperty({ example: '2026-02-26T14:11:00.000Z', nullable: true })
  startGameDate: Date | null;

  @ApiProperty({ example: null, nullable: true })
  finishGameDate: Date | null;

  static mapFrom(game: Game): PostConnectionViewDto {
    return {
      id: game.id.toString(),
      status: game.status,
      pairCreatedDate: game.createdAt,
      startGameDate: game.startGameDate ? game.startGameDate : null,
      finishGameDate: game.finishGameDate, // теперь берём из сущности
      firstPlayerProgress: PostConnectionViewDto.mapProgress(
        game.firstPlayerProgress,
      ),
      secondPlayerProgress: game.secondPlayerProgress
        ? PostConnectionViewDto.mapProgress(game.secondPlayerProgress)
        : null,
      questions:
        game.gameQuestions && game.gameQuestions.length > 0
          ? game.gameQuestions
              .sort((a, b) => a.question.id - b.question.id)
              .map((gq) => ({
                id: gq.id.toString(),
                body: gq.question.body,
              }))
          : null,
    };
  }

  private static mapProgress(pp: PlayerProgress): GamePlayerProgressView {
    return {
      player: { id: pp.user.id.toString(), login: pp.user.login }, // теперь используем поле score напрямую
      score: pp.score,
      answers: pp.answers
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((a) => ({
          questionId: a.gameQuestion.id.toString(),
          answerStatus: a.status,
          addedAt: a.createdAt.toISOString(),
        })),
    };
  }
}
