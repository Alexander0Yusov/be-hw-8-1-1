import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { AllStatisticsSortField } from 'src/modules/quiz/dto/game-pair-quiz/get-top-statistic-query-params.input-dto';
import { SortDirection } from '../dto/base.query-params.input-dto';

const ALLOWED_SORT_FIELDS = Object.values(AllStatisticsSortField);
const ALLOWED_SORT_DIRECTIONS = Object.values(SortDirection);

@Injectable()
export class SortValidationTransformationPipe implements PipeTransform {
  transform(value: any) {
    if (!value.sort) return value;

    const sortParams = Array.isArray(value.sort) ? value.sort : [value.sort];

    value.sort = sortParams.map((param: string) => {
      const [field, direction] = param.split(' ');

      if (!ALLOWED_SORT_FIELDS.includes(field as AllStatisticsSortField)) {
        throw new BadRequestException(`Недопустимое поле сортировки: ${field}`);
      }

      if (!ALLOWED_SORT_DIRECTIONS.includes(direction as SortDirection)) {
        throw new BadRequestException(
          `Недопустимое направление сортировки: ${direction}`,
        );
      }

      return {
        field: field as AllStatisticsSortField,
        direction: direction as SortDirection,
      };
    });

    return value;
  }
}
