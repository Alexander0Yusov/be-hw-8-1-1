import { Session } from '../../domain/session/session.entity';
import { ApiProperty } from '@nestjs/swagger';

export class SessionViewDto {
  @ApiProperty({ example: '127.0.0.1' })
  ip: string;

  @ApiProperty({ example: 'Chrome on Windows' })
  title: string;

  @ApiProperty({ example: '2026-02-26T14:20:00.000Z' })
  lastActiveDate: string;

  @ApiProperty({ example: 'cbe6202a-0f56-45f7-82ad-33831b4f8220' })
  deviceId: string;

  static fromEntity(session: Session): SessionViewDto {
    const dto = new SessionViewDto();
    dto.ip = session.ip;
    dto.title = session.deviceName; // мапим deviceName → title
    dto.lastActiveDate = session.lastActiveDate.toISOString();
    dto.deviceId = session.deviceId;
    return dto;
  }
}
