import { ApiProperty } from '@nestjs/swagger';

export class StatisticViewDto {
  @ApiProperty({ example: 17 })
  sumScore: number;

  @ApiProperty({ example: 2.83 })
  avgScores: number;

  @ApiProperty({ example: 6 })
  gamesCount: number;

  @ApiProperty({ example: 3 })
  winsCount: number;

  @ApiProperty({ example: 2 })
  lossesCount: number;

  @ApiProperty({ example: 1 })
  drawsCount: number;
}
