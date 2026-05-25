import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsEvent, AnalyticsEventSchema } from './analytics-event.schema';
import { AnalyticsEventRepository } from './analytics-event.repository';
import { AnalyticsRedactor } from './analytics-redactor';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AnalyticsEvent.name, schema: AnalyticsEventSchema }]),
  ],
  providers: [AnalyticsEventRepository, AnalyticsRedactor, AnalyticsService],
  exports: [AnalyticsService, AnalyticsEventRepository],
})
export class AnalyticsModule {}
