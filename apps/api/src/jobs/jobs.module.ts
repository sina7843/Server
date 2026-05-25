import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import type { BullMQConfig } from '../config/redis.config';
import { BULLMQ_CONFIG } from '../config/redis.config';
import { JobLog, JobLogSchema } from './job-log.schema';
import { JobLogRepository } from './job-log.repository';
import { JobPayloadRedactor } from './job-payload-redactor';
import { JobLogService } from './job-log.service';
import { QueueNames } from './queue-registry';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: JobLog.name, schema: JobLogSchema }]),
    BullModule.forRootAsync({
      inject: [BULLMQ_CONFIG],
      useFactory: (config: BullMQConfig) => ({
        connection: {
          host: config.redis.host,
          port: config.redis.port,
          ...(config.redis.password !== undefined ? { password: config.redis.password } : {}),
          db: config.redis.db,
        },
        prefix: config.prefix,
      }),
    }),
    BullModule.registerQueue(
      { name: QueueNames.SMS },
      { name: QueueNames.MEDIA },
      { name: QueueNames.MAINTENANCE },
      { name: QueueNames.SEARCH },
    ),
  ],
  providers: [JobLogRepository, JobPayloadRedactor, JobLogService],
  exports: [JobLogRepository, JobLogService, BullModule],
})
export class JobsModule {}
