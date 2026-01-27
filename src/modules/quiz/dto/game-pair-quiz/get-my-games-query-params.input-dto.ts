//dto для запроса списка юзеров с пагинацией, сортировкой, фильтрами
import { IsEnum } from 'class-validator';
import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { MyGamesSortField } from './my-games-sort-field';

//наследуемся от класса BaseQueryParams, где уже есть pageNumber, pageSize и т.п., чтобы не дублировать эти свойства
export class GetMyGamesQueryParams extends BaseQueryParams {
  @IsEnum(MyGamesSortField)
  sortBy: MyGamesSortField = MyGamesSortField.PairCreatedDate;
}
