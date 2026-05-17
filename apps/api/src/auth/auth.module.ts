import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessTokenGuard } from './guards/access-token.guard';
import { NotificationLogRepository } from './notifications/notification-log.repository';
import { NotificationLog, NotificationLogSchema } from './notifications/notification-log.schema';
import { NotificationLogService } from './notifications/notification-log.service';
import { OtpChallenge, OtpChallengeSchema } from './otp/otp-challenge.schema';
import { PasswordResetService } from './password-reset/password-reset.service';
import { OtpChallengeRepository } from './otp/otp.repository';
import { OtpChallengeService } from './otp/otp.service';
import { SessionRepository } from './sessions/session.repository';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';
import { Session, SessionSchema } from './sessions/session.schema';
import { SessionService } from './sessions/session.service';
import { MockSmsProvider } from './sms/mock-sms.provider';
import { SMS_PROVIDER } from './sms/sms-provider.interface';
import { SmsService } from './sms/sms.service';
import { UserRepository } from './users/user.repository';
import { User, UserSchema } from './users/user.schema';
import { UserService } from './users/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: OtpChallenge.name, schema: OtpChallengeSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordResetService,
    AccessTokenGuard,
    AccessTokenService,
    RefreshTokenService,
    UserRepository,
    UserService,
    SessionRepository,
    SessionService,
    OtpChallengeRepository,
    OtpChallengeService,
    NotificationLogRepository,
    NotificationLogService,
    MockSmsProvider,
    {
      provide: SMS_PROVIDER,
      useExisting: MockSmsProvider,
    },
    SmsService,
  ],
  exports: [
    AuthService,
    PasswordResetService,
    AccessTokenGuard,
    AccessTokenService,
    RefreshTokenService,
    UserRepository,
    UserService,
    SessionRepository,
    SessionService,
    OtpChallengeRepository,
    OtpChallengeService,
    NotificationLogRepository,
    NotificationLogService,
    SmsService,
  ],
})
export class AuthModule {}
