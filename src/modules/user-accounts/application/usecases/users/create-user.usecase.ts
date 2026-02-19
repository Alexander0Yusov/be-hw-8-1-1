import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CryptoService } from '../../crupto.service';
import { UserInputDto } from '../../../dto/user/user-input.dto';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { User } from '../../../domain/user/user.entity';

export class CreateUserCommand {
  constructor(public dto: UserInputDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, number>
{
  constructor(
    private cryptoService: CryptoService,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    dto: { login, password, email },
  }: CreateUserCommand): Promise<number> {
    const existsLogin = await this.usersRepository.findByLoginOrEmail(login);

    if (existsLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email or login already exists',
        extensions: [{ message: 'Login already exists', field: 'login' }],
      });
    }

    const existsEmail = await this.usersRepository.findByLoginOrEmail(email);

    if (existsEmail) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email or login already exists',
        extensions: [{ message: 'Email already exists', field: 'email' }],
      });
    }

    const passwordHash = await this.cryptoService.createPasswordHash(password);

    const user = User.createInstance({ login, passwordHash, email });

    await this.usersRepository.save(user);

    return user.id;
  }
}
