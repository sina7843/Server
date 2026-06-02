import { TournamentMatchSchema } from './tournament-match.schema';

describe('TournamentMatch schema — field definitions', () => {
  it('includes tournamentId field', () => {
    expect(TournamentMatchSchema.path('tournamentId')).toBeDefined();
  });

  it('includes round field', () => {
    expect(TournamentMatchSchema.path('round')).toBeDefined();
  });

  it('includes matchNumber field', () => {
    expect(TournamentMatchSchema.path('matchNumber')).toBeDefined();
  });

  it('includes status field', () => {
    expect(TournamentMatchSchema.path('status')).toBeDefined();
  });

  it('includes participant1Id field', () => {
    expect(TournamentMatchSchema.path('participant1Id')).toBeDefined();
  });

  it('includes participant2Id field', () => {
    expect(TournamentMatchSchema.path('participant2Id')).toBeDefined();
  });

  it('includes winnerId field', () => {
    expect(TournamentMatchSchema.path('winnerId')).toBeDefined();
  });

  it('includes scheduledAt field', () => {
    expect(TournamentMatchSchema.path('scheduledAt')).toBeDefined();
  });

  it('includes completedAt field', () => {
    expect(TournamentMatchSchema.path('completedAt')).toBeDefined();
  });

  it('includes notes field', () => {
    expect(TournamentMatchSchema.path('notes')).toBeDefined();
  });

  it('includes generatedAt field', () => {
    expect(TournamentMatchSchema.path('generatedAt')).toBeDefined();
  });

  it('status field has enum with all four values', () => {
    const path = TournamentMatchSchema.path('status') as { enumValues?: string[] };
    expect(path.enumValues).toEqual(
      expect.arrayContaining(['scheduled', 'in_progress', 'completed', 'cancelled']),
    );
  });

  it('status field defaults to scheduled', () => {
    const path = TournamentMatchSchema.path('status') as { defaultValue?: unknown };
    expect(path.defaultValue).toBe('scheduled');
  });
});

describe('TournamentMatch schema — index declarations', () => {
  it('declares compound index on tournamentId + round + matchNumber', () => {
    const indexes = TournamentMatchSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([[{ tournamentId: 1, round: 1, matchNumber: 1 }, expect.anything()]]),
    );
  });

  it('declares a unique index on tournamentId + round + matchNumber', () => {
    const indexes = TournamentMatchSchema.indexes();
    const uniqueIdx = indexes.find((entry) => {
      const fields = entry[0] as Record<string, unknown>;
      const opts = entry[1] as Record<string, unknown>;
      return (
        fields['tournamentId'] === 1 &&
        fields['round'] === 1 &&
        fields['matchNumber'] === 1 &&
        opts['unique'] === true
      );
    });
    expect(uniqueIdx).toBeDefined();
  });
});
