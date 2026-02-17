import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';

@Injectable()
export class BasicAuthGuard extends AuthGuard('basic') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('🔥 BasicAuthGuard activated');
    return super.canActivate(context);
  }

  // extend signature to get access to ExecutionContext when available
  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info?: any,
    status?: any,
    context?: ExecutionContext,
  ): TUser {
    if (err || !user) {
      try {
        if (context) {
          const response = context.switchToHttp().getResponse();
          if (response && typeof response.setHeader === 'function') {
            response.setHeader('WWW-Authenticate', 'Basic realm="API"');
          }
        }
      } catch (e) {
        // ignore any errors while setting header
      }

      throw (
        err ||
        new DomainException({
          code: DomainExceptionCode.Unauthorized,
          message: 'Invalid login or password',
        })
      );
    }

    return user as TUser;
  }
}
