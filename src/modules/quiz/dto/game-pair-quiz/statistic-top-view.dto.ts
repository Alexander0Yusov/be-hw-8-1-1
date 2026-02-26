import { ApiProperty } from '@nestjs/swagger';
import { StatisticViewDto } from './statistic-view.dto';

class PlayerStatisticViewDto {
  @ApiProperty({ example: '42' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  login: string;
}

export class StatisticTopViewDto extends StatisticViewDto {
  @ApiProperty({ type: PlayerStatisticViewDto })
  player: PlayerStatisticViewDto;
}
