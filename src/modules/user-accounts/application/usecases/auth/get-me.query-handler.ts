import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserContextDto } from '../../../guards/dto/user-context.dto';
import { MeViewDto } from '../../../dto/user/user-view.dto';
import { UsersQueryRepository } from '../../../infrastructure/query/users-query.repository';

export class GetMeQuery {
  constructor(public dto: UserContextDto) {}
}

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery, MeViewDto> {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute({ dto }: GetMeQuery): Promise<MeViewDto> {
    return await this.usersQueryRepository.findMeByIdOrNotFindFail(
      Number(dto.id),
    );
  }
}
