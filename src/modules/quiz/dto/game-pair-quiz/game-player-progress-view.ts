import { AnswerView } from '../answer/answer-view';
import { ApiProperty } from '@nestjs/swagger';
import { PlayerView } from './player-view';

export class GamePlayerProgressView {
  @ApiProperty({ type: [AnswerView] })
  answers: AnswerView[];

  @ApiProperty({ type: PlayerView })
  player: PlayerView;

  @ApiProperty({ example: 3 })
  score: number;
}
