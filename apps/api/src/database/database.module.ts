import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getDatabaseConfig } from './database.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => getDatabaseConfig(),
    }),
  ],
})
export class DatabaseModule {}
