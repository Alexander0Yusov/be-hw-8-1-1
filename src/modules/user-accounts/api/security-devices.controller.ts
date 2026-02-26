import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RefreshJwtAuthGuard } from '../guards/bearer-refresh/refresh-jwt-auth.guard';
import { Device } from '../guards/decorators/param/extract-user-from-cookie.decorator';
import { DeviceContextDto } from '../guards/dto/device-context.dto';
import { GetAllSessionsQuery } from '../application/usecases/sessions/get-all-sessions.query-handler';
import { SessionViewDto } from '../dto/session/session-view.dto';
import { TerminateAllExcludeCurrentSessionCommand } from '../application/usecases/sessions/terminate-all-exclude-current-session.usecase';
import { TerminateByIdCommand } from '../application/usecases/sessions/terminate-by-id-session.usecase';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@SkipThrottle()
@ApiTags('Security Devices')
@Controller('security')
export class SecurityDevicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('devices')
  @UseGuards(RefreshJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active sessions/devices' })
  @ApiResponse({ status: 200, description: 'Sessions returned', type: [SessionViewDto] })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async getDevices(
    @Device() deviceContext: DeviceContextDto,
  ): Promise<SessionViewDto[]> {
    return await this.queryBus.execute(
      new GetAllSessionsQuery({ id: deviceContext.id }),
    );
  }

  @Delete('devices')
  @UseGuards(RefreshJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate all sessions except current one' })
  @ApiResponse({ status: 204, description: 'Sessions terminated' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async deleteDevicesExcludeCurrent(
    @Device() deviceContext: DeviceContextDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new TerminateAllExcludeCurrentSessionCommand({
        id: deviceContext.id,
        deviceId: deviceContext.deviceId,
      }),
    );
  }

  @Delete('devices/:id')
  @UseGuards(RefreshJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate session by device id' })
  @ApiParam({ name: 'id', type: String, description: 'Device id' })
  @ApiResponse({ status: 204, description: 'Session terminated' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async deleteDeviceById(
    @Param('id') id: string,
    @Device() deviceContext: DeviceContextDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new TerminateByIdCommand({
        id: deviceContext.id,
        deviceId: id,
      }),
    );
  }
}

