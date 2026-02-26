import { Answer } from '../../domain/answer/answer.entity';
import { ApiProperty } from '@nestjs/swagger';
import { AnswerStatuses } from '../game-pair-quiz/answer-status';

export class AnswerView {
  @ApiProperty({ example: '1' })
  questionId: string;

  @ApiProperty({ enum: AnswerStatuses, example: AnswerStatuses.Correct })
  answerStatus: AnswerStatuses;

  @ApiProperty({ example: '2026-02-26T14:20:00.000Z' })
  addedAt: string;

  static mapToView(dto: Answer): AnswerView {
    return {
      questionId: dto.gameQuestionId.toString(),
      answerStatus: dto.status,
      addedAt: dto.createdAt.toISOString(),
    };
  }
}
