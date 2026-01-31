import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogViewDto } from '../../dto/blog/blog-view.dto';
import { GetBlogsQueryParams } from '../../dto/blog/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../../domain/blog/blog.entity';
import { BlogViewSaDto } from '../../dto/blog/blog-view-sa.dto';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,

    @InjectRepository(Blog)
    private readonly blogRepo: Repository<Blog>,
  ) {}

  async findByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blog = await this.blogRepo.findOne({ where: { id: Number(id) } });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return BlogViewDto.mapToView(blog);
  }

  async getAll(
    query: GetBlogsQueryParams,
    userId?: number,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const qb = this.blogRepo.createQueryBuilder('b');

    // --- Фильтр по userId (если передан) ---
    if (userId) {
      qb.where('b.userId = :userId', { userId });
    }

    // --- Поиск ---
    if (query.searchNameTerm) {
      qb.andWhere('b.name ILIKE :name', {
        name: `%${query.searchNameTerm}%`,
      });
    }

    // --- Маппинг сортировки ---
    const sortFieldMap: Record<string, string> = {
      name: 'b.name',
      createdAt: 'b.createdAt',
    };

    const sortBy = sortFieldMap[query.sortBy] ?? 'b.createdAt';

    // --- COLLATE "C" для строк ---
    const stringFields = ['b.name'];
    const sortField = stringFields.includes(sortBy)
      ? `${sortBy} COLLATE "C"`
      : sortBy;

    // --- Пагинация ---
    qb.orderBy(sortField, query.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .skip(query.calculateSkip())
      .take(query.pageSize);

    // --- Выполняем запрос + считаем totalCount ---
    const [blogs, totalCount] = await qb.getManyAndCount();

    const items = blogs.map(BlogViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getAllForSa(
    query: GetBlogsQueryParams,
    userId?: number,
  ): Promise<PaginatedViewDto<BlogViewSaDto[]>> {
    const qb = this.blogRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.user', 'u');

    // --- Фильтр по userId (если передан) ---
    if (userId) {
      qb.where('b.userId = :userId', { userId });
    }

    // --- Поиск ---
    if (query.searchNameTerm) {
      qb.andWhere('b.name ILIKE :name', {
        name: `%${query.searchNameTerm}%`,
      });
    }

    // после добавления .leftJoinAndSelect('b.user', 'u') пришлось выполнить:
    // 1. Отказ от динамической строки в orderBy: Мы перестали передавать сырое
    //  выражение с SQL-логикой (COLLATE) напрямую в метод сортировки.
    // 2. Использование addSelect для алиаса: Мы создали "виртуальную" колонку
    // через qb.addSelect('b.name COLLATE "C"', 'sort_name'). Это "обмануло" TypeORM:
    // - Теперь sort_name — это не колонка из метаданных сущности, а вручную определенное поле.
    // - TypeORM перестал искать его в описании сущности Blog и просто вставил алиас в SQL.
    // 3. Разделение логики (If/Else): Нам пришлось явно разделять сортировку по строкам
    // (где нужен COLLATE) и по датам. Раньше вы пытались сделать это универсально через
    // одну переменную, но TypeORM 0.3.x требует более явного разделения, когда замешаны
    // связи (Joins).

    // 1. Сначала определяем направление
    const direction = query.sortDirection.toUpperCase() as 'ASC' | 'DESC';

    // 2. Используем условие вместо формирования строки заранее
    if (query.sortBy === 'name') {
      // Используем addSelect для создания виртуального поля
      // Это изолирует COLLATE от основного механизма метаданных
      qb.addSelect('b.name COLLATE "C"', 'sort_name');
      qb.orderBy('sort_name', direction);
    } else {
      // Стандартная сортировка по дате (без COLLATE)
      // Обязательно используем 'b.createdAt', чтобы не было неоднозначности
      qb.orderBy('b.createdAt', direction);
    }

    // --- Пагинация ---
    qb.skip(query.calculateSkip()).take(query.pageSize);

    // --- Выполняем запрос + считаем totalCount ---
    const [blogs, totalCount] = await qb.getManyAndCount();

    const items = blogs.map(BlogViewSaDto.mapToSaView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
