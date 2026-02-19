import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../users/create-user.usecase';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import { UserInputDto } from '../../../dto/user/user-input.dto';
import { EmailService } from '../../../../mailer/email.service';
import { UsersRepository } from '../../../infrastructure/users.repository';

export class AuthRegisterCommand {
  constructor(public dto: UserInputDto) {}
}

@CommandHandler(AuthRegisterCommand)
export class AuthRegisterUseCase
  implements ICommandHandler<AuthRegisterCommand>
{
  constructor(
    private commandBus: CommandBus,
    private readonly emailService: EmailService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({
    dto: { login, password, email },
  }: AuthRegisterCommand): Promise<void> {
    await this.commandBus.execute(
      new CreateUserCommand({ login, password, email }),
    );

    // этот код дублируется в повт отправке письма и его лучше вынести в сервис?
    const confirmCode = uuidv4() as string;
    const expirationDate = addDays(new Date(), 2); // to env

    const user =
      await this.usersRepository.findByLoginOrEmailOrNotFoundFail(email);

    user.setEmailConfirmationCode(confirmCode, expirationDate);

    await this.usersRepository.save(user);

    this.emailService
      .sendConfirmationEmail(email, confirmCode)
      .catch(console.error);
  }
}
