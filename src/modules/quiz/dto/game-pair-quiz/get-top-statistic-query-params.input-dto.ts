import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import {
  BaseQueryParams,
  SortDirection,
} from '../../../../core/dto/base.query-params.input-dto';
import { Transform, Type } from 'class-transformer';

// Определяем enum для полей сортировки
export enum AllStatisticsSortField {
  AvgScores = 'avgScores',
  SumScore = 'sumScore',
  WinsCount = 'winsCount',
  LossesCount = 'lossesCount',
}

export class SortParam {
  @IsEnum(AllStatisticsSortField)
  field: AllStatisticsSortField;

  @IsEnum(SortDirection)
  direction: SortDirection;
}

export class GetTopStatisticQueryParams extends BaseQueryParams {
  @IsOptional()
  @Transform(({ value }) => {
    const params = Array.isArray(value) ? value : [value];

    return params.map((param) => {
      if (typeof param !== 'string') return param;

      const [field, direction] = param.split(' ');

      // !!! решает проблему пустых объектов при маппинге !!!
      // Создаем объект и ПРИНУДИТЕЛЬНО типизируем его
      const obj = new SortParam();
      obj.field = field as AllStatisticsSortField;
      obj.direction = direction as SortDirection;
      return obj;
    });
  })
  @ValidateNested({ each: true })
  @Type(() => SortParam) // Оставляем для валидатора
  @IsArray()
  sort?: SortParam[];
}
