import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../../constants/auth-tokens.inject-constants';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';
import { JwtRefreshPayload } from '../../../dto/session/jwt-refresh-payload.dto';

export class UpdateSessionCommand {
  constructor(public dto: { refreshToken: string }) {}
}

@CommandHandler(UpdateSessionCommand)
export class UpdateSessionUseCase
  implements ICommandHandler<UpdateSessionCommand, void>
{
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,

    private sessionsRepository: SessionsRepository,
  ) {}

  async execute({ dto }: UpdateSessionCommand): Promise<void> {
    const { deviceId, iat, exp } = (await this.refreshTokenContext.decode(
      dto.refreshToken,
    )) as unknown as JwtRefreshPayload;

    await this.sessionsRepository.updateExpAndIatTimesOrNotFoundFail(
      deviceId,
      new Date(exp * 1000),
      new Date(iat * 1000),
    );
  }
}
