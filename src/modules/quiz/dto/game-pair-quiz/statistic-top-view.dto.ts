import { StatisticViewDto } from './statistic-view.dto';

export class StatisticTopViewDto extends StatisticViewDto {
  player: {
    id: 'string';
    login: 'string';
  };
}
