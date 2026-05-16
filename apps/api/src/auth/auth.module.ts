import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionRepository } from './sessions/session.repository';
import { Session, SessionSchema } from './sessions/session.schema';
import { SessionService } from './sessions/session.service';
import { UserRepository } from './users/user.repository';
import { User, UserSchema } from './users/user.schema';
import { UserService } from './users/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  providers: [UserRepository, UserService, SessionRepository, SessionService],
  exports: [UserRepository, UserService, SessionRepository, SessionService],
})
export class AuthModule {}
