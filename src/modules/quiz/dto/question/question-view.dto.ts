import { Question } from '../../domain/question/question.entity';
import { ApiProperty } from '@nestjs/swagger';

export class QuestionViewDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Capital of Great Britain?' })
  body: string;

  @ApiProperty({ type: [String], example: ['London'] })
  correctAnswers: string[];

  @ApiProperty({ example: true })
  published: boolean;

  @ApiProperty({ example: '2026-02-26T14:10:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-26T14:12:00.000Z', nullable: true })
  updatedAt: Date | null;

  static mapToView(question: Question): QuestionViewDto {
    const dto = new QuestionViewDto();

    dto.id = question.id.toString();
    dto.body = question.body;
    dto.correctAnswers = question.correctAnswers;
    dto.published = question.publish;
    dto.createdAt = question.createdAt;
    dto.updatedAt = question.updatedAt;

    return dto;
  }
}
