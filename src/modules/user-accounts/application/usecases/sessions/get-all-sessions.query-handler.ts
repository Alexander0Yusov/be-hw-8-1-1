import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserContextDto } from '../../../guards/dto/user-context.dto';
import { SessionViewDto } from '../../../dto/session/session-view.dto';
import { SessionsQueryRepository } from '../../../infrastructure/query/sessions-query.repository';

export class GetAllSessionsQuery {
  constructor(public dto: UserContextDto) {}
}

@QueryHandler(GetAllSessionsQuery)
export class GetAllSessionsHandler
  implements IQueryHandler<GetAllSessionsQuery, SessionViewDto[]>
{
  constructor(
    private readonly sessionsQueryRepository: SessionsQueryRepository,
  ) {}

  async execute({ dto }: GetAllSessionsQuery): Promise<SessionViewDto[]> {
    return await this.sessionsQueryRepository.findManyForCurrentUser(
      Number(dto.id),
    );
  }
}
