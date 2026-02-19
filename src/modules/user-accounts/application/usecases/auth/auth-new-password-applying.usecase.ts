import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CryptoService } from '../../crupto.service';
import { PasswordRecoveryDto } from '../../../dto/user/password-recovery.dto';
import { UsersRepository } from '../../../infrastructure/users.repository';

export class AuthNewPasswordApplyingCommand {
  constructor(public dto: PasswordRecoveryDto) {}
}

@CommandHandler(AuthNewPasswordApplyingCommand)
export class AuthNewPasswordApplyingUseCase
  implements ICommandHandler<AuthNewPasswordApplyingCommand, void>
{
  constructor(
    private cryptoService: CryptoService,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    dto: { newPassword, recoveryCode },
  }: AuthNewPasswordApplyingCommand): Promise<void> {
    const user =
      await this.usersRepository.getUserAndPasswordConfirmationDataOrNotFounFail(
        recoveryCode,
      );

    const password_hash =
      await this.cryptoService.createPasswordHash(newPassword);

    user.setNewPasswordHash(password_hash);

    await this.usersRepository.save(user);
  }
}
