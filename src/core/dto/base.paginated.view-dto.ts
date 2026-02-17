// базовый класс view модели для запросов за списком с пагинацией
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedViewDto<T> {
  @ApiProperty({ description: 'List of items' })
  items: T;

  @ApiProperty({ description: 'Total count of items', example: 0 })
  totalCount: number;

  @ApiProperty({ description: 'Total pages count', example: 0 })
  pagesCount: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size', example: 10 })
  pageSize: number;

  // статический метод-утилита для мапинга
  public static mapToView<T>(data: {
    items: T;
    page: number;
    size: number;
    totalCount: number;
  }): PaginatedViewDto<T> {
    return {
      totalCount: data.totalCount,
      pagesCount: Math.ceil(data.totalCount / data.size),
      page: data.page,
      pageSize: data.size,
      items: data.items,
    } as PaginatedViewDto<T>;
  }
}
