import { SchemaFactory } from '@nestjs/mongoose';
import { JobLog, JOB_STATUSES, JobLogSchema } from './job-log.schema';

describe('JobLog schema', () => {
  describe('field definitions', () => {
    it('has queueName as required field', () => {
      const path = JobLogSchema.path('queueName') as unknown as { isRequired: boolean };
      expect(path.isRequired).toBe(true);
    });

    it('has jobName as required field', () => {
      const path = JobLogSchema.path('jobName') as unknown as { isRequired: boolean };
      expect(path.isRequired).toBe(true);
    });

    it('has bullJobId as optional field', () => {
      const path = JobLogSchema.path('bullJobId') as unknown as { isRequired: boolean | undefined };
      expect(path.isRequired).toBeFalsy();
    });

    it('has status as required field with enum', () => {
      const path = JobLogSchema.path('status') as unknown as {
        isRequired: boolean;
        enumValues: string[];
      };
      expect(path.isRequired).toBe(true);
      expect(path.enumValues).toEqual(expect.arrayContaining(JOB_STATUSES));
    });

    it('status enum contains all expected values', () => {
      expect(JOB_STATUSES).toContain('queued');
      expect(JOB_STATUSES).toContain('processing');
      expect(JOB_STATUSES).toContain('completed');
      expect(JOB_STATUSES).toContain('failed');
      expect(JOB_STATUSES).toContain('retrying');
    });

    it('has attempts as required field', () => {
      const path = JobLogSchema.path('attempts') as unknown as { isRequired: boolean };
      expect(path.isRequired).toBe(true);
    });

    it('has maxAttempts as required field', () => {
      const path = JobLogSchema.path('maxAttempts') as unknown as { isRequired: boolean };
      expect(path.isRequired).toBe(true);
    });

    it('has payloadSummary as optional Object field', () => {
      const path = JobLogSchema.path('payloadSummary');
      expect(path).toBeDefined();
    });

    it('has error as optional field', () => {
      const path = JobLogSchema.path('error') as unknown as { isRequired: boolean | undefined };
      expect(path.isRequired).toBeFalsy();
    });

    it('has startedAt as optional field', () => {
      const path = JobLogSchema.path('startedAt') as unknown as { isRequired: boolean | undefined };
      expect(path.isRequired).toBeFalsy();
    });

    it('has completedAt as optional field', () => {
      const path = JobLogSchema.path('completedAt') as unknown as {
        isRequired: boolean | undefined;
      };
      expect(path.isRequired).toBeFalsy();
    });
  });

  describe('indexes', () => {
    it('has 5 custom indexes defined', () => {
      const indexes = JobLogSchema.indexes();
      expect(indexes.length).toBeGreaterThanOrEqual(5);
    });

    it('has queueName + createdAt index', () => {
      const indexes = JobLogSchema.indexes();
      const hasIndex = indexes.some(
        ([fields]) => typeof fields === 'object' && 'queueName' in fields && 'createdAt' in fields,
      );
      expect(hasIndex).toBe(true);
    });

    it('has jobName + createdAt index', () => {
      const indexes = JobLogSchema.indexes();
      const hasIndex = indexes.some(
        ([fields]) => typeof fields === 'object' && 'jobName' in fields && 'createdAt' in fields,
      );
      expect(hasIndex).toBe(true);
    });

    it('has status + createdAt index', () => {
      const indexes = JobLogSchema.indexes();
      const hasIndex = indexes.some(
        ([fields]) => typeof fields === 'object' && 'status' in fields && 'createdAt' in fields,
      );
      expect(hasIndex).toBe(true);
    });

    it('has sparse bullJobId index', () => {
      const indexes = JobLogSchema.indexes();
      const hasIndex = indexes.some(
        ([fields, opts]) =>
          typeof fields === 'object' &&
          'bullJobId' in fields &&
          (opts as Record<string, unknown>).sparse === true,
      );
      expect(hasIndex).toBe(true);
    });

    it('has createdAt index', () => {
      const indexes = JobLogSchema.indexes();
      const hasIndex = indexes.some(
        ([fields]) =>
          typeof fields === 'object' &&
          Object.keys(fields as object).length === 1 &&
          'createdAt' in (fields as object),
      );
      expect(hasIndex).toBe(true);
    });
  });

  describe('timestamps', () => {
    it('schema has timestamps enabled with both createdAt and updatedAt', () => {
      const schema = SchemaFactory.createForClass(JobLog);
      expect(schema.get('timestamps')).toEqual(
        expect.objectContaining({ createdAt: true, updatedAt: true }),
      );
    });
  });
});
