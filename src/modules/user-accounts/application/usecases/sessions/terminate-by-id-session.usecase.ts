import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceContextDto } from '../../../guards/dto/device-context.dto';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class TerminateByIdCommand {
  constructor(public dto: DeviceContextDto) {}
}

@CommandHandler(TerminateByIdCommand)
export class TerminateByIdUseCase
  implements ICommandHandler<TerminateByIdCommand, void>
{
  constructor(private sessionsRepository: SessionsRepository) {}

  async execute({ dto }: TerminateByIdCommand): Promise<void> {
    const session = await this.sessionsRepository.findByDeviceIdOrNotFoundFail(
      dto.deviceId,
    );

    if (session.userId !== Number(dto.id)) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Forbidden error',
      });
    }

    await this.sessionsRepository.deleteByDeviceIdAndUserId(
      Number(dto.id),
      dto.deviceId,
    );
  }
}
