import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request as Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserInputDto } from '../dto/user/user-input.dto';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { MeViewDto } from '../dto/user/user-view.dto';
import { UpdateUserDto } from '../dto/user/create-user-domain.dto';
import { PasswordRecoveryDto } from '../dto/user/password-recovery.dto';
import { ConfirmationCodeDto } from '../dto/user/confirmation-code.dto';
import type { Request, Response } from 'express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateTokensPairCommand } from '../application/usecases/auth/create-tokens-pair.usecase';
import { CreateSessionCommand } from '../application/usecases/sessions/create-session.usecase';
import { RefreshJwtAuthGuard } from '../guards/bearer-refresh/refresh-jwt-auth.guard';
import { DeviceContextDto } from '../guards/dto/device-context.dto';
import { Device } from '../guards/decorators/param/extract-user-from-cookie.decorator';
import { RevokingSessionCommand } from '../application/usecases/sessions/revoking-session.usecase';
import { Throttle } from '@nestjs/throttler';
import { UpdateSessionCommand } from '../application/usecases/sessions/update-session.usecase';
import { AuthRegisterCommand } from '../application/usecases/auth/auth-register.usecase';
import { AuthEmailConfirmationCommand } from '../application/usecases/auth/auth-email-confirmation.usecase';
import { AuthEmailResendConfirmationCommand } from '../application/usecases/auth/auth-email-resend-confirmation.usecase';
import { AuthSendRecoveryPasswordCodeCommand } from '../application/usecases/auth/auth-send-recovery-password-code.usecase';
import { AuthNewPasswordApplyingCommand } from '../application/usecases/auth/auth-new-password-applying.usecase';
import { GetMeQuery } from '../application/usecases/auth/get-me.query-handler';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post('registration')
  @Throttle({ default: {} })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: UserInputDto })
  @ApiResponse({ status: 204, description: 'Registration accepted' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        errorsMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Validation error' },
              field: { type: 'string', example: 'email' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Validation error', field: 'email' }],
      },
    },
  })
  async registration(@Body() body: UserInputDto): Promise<void> {
    await this.commandBus.execute(new AuthRegisterCommand(body));
  }

  @Post('login')
  @Throttle({ default: {} })
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login and receive access token' })
  @ApiResponse({
    status: 200,
    description: 'Authenticated',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
      required: ['accessToken'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async login(
    @ExtractUserFromRequest() user: UserContextDto,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const ip = req.ip as string; // || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const deviceName = req.get('user-agent') || 'Unknown device';

    const { accessToken, refreshToken } = await this.commandBus.execute(
      new CreateTokensPairCommand({ userId: user.id }),
    );

    await this.commandBus.execute(
      new CreateSessionCommand({ refreshToken, ip, deviceName }),
    );

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // true в проде, false в dev при http (+/-)
    });

    return { accessToken };
  }

  @Post('refresh-token')
  @UseGuards(RefreshJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({
    status: 200,
    description: 'Token pair refreshed',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
      required: ['accessToken'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async refreshToken(
    @Device() deviceContext: DeviceContextDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await this.commandBus.execute(
      new CreateTokensPairCommand({
        userId: deviceContext.id,
        deviceId: deviceContext.deviceId,
      }),
    );

    await this.commandBus.execute(new UpdateSessionCommand({ refreshToken }));

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // true в проде, false в dev при http (+/-)
    });

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 204, description: 'Logged out' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async logout(@Device() deviceContext: DeviceContextDto): Promise<void> {
    await this.commandBus.execute(
      new RevokingSessionCommand({ deviceId: deviceContext.deviceId }),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user', type: MeViewDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return await this.queryBus.execute(new GetMeQuery({ id: user.id }));
    // return await this.authQueryRepository.me(user.id);
  }

  @Post('password-recovery')
  @Throttle({ default: {} })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send password recovery email' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 204, description: 'Recovery email requested' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        errorsMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Validation error' },
              field: { type: 'string', example: 'email' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Validation error', field: 'email' }],
      },
    },
  })
  async passwordRecovery(@Body() body: UpdateUserDto) {
    await this.commandBus.execute(
      new AuthSendRecoveryPasswordCodeCommand(body),
    );
  }

  @Post('new-password')
  @Throttle({ default: {} })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set a new password by recovery code' })
  @ApiBody({ type: PasswordRecoveryDto })
  @ApiResponse({ status: 204, description: 'Password changed' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        errorsMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Validation error' },
              field: { type: 'string', example: 'email' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Validation error', field: 'email' }],
      },
    },
  })
  async newPassword(@Body() body: PasswordRecoveryDto) {
    await this.commandBus.execute(new AuthNewPasswordApplyingCommand(body));
  }

  @Post('registration-confirmation')
  @Throttle({ default: {} })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirm registration email' })
  @ApiBody({ type: ConfirmationCodeDto })
  @ApiResponse({ status: 204, description: 'Email confirmed' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired confirmation code',
    schema: {
      type: 'object',
      properties: {
        errorsMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Invalid or expired confirmation code' },
              field: { type: 'string', example: 'code' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Invalid or expired confirmation code', field: 'code' }],
      },
    },
  })
  async registrationConfirmation(@Body() body: ConfirmationCodeDto) {
    await this.commandBus.execute(new AuthEmailConfirmationCommand(body));
  }

  @Post('registration-email-resending')
  @Throttle({ default: {} })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Resend registration confirmation email' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 204, description: 'Confirmation email resent' })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        errorsMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Validation error' },
              field: { type: 'string', example: 'email' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Validation error', field: 'email' }],
      },
    },
  })
  async registrationEmailResending(@Body() body: UpdateUserDto) {
    await this.commandBus.execute(new AuthEmailResendConfirmationCommand(body));
    //поубирать устаревшие сервисы везде !!
  }
}

