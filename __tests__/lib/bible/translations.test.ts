import { TRANSLATIONS, getTranslation } from '@/lib/bible/translations';

describe('TRANSLATIONS', () => {
  it('includes NET as an offline-available local translation', () => {
    const net = getTranslation('net');
    expect(net).toMatchObject({
      id: 'net',
      abbreviation: 'NET',
      sourceType: 'local',
      offlineAvailable: true,
    });
  });

  it('includes KJV as not offline-available yet', () => {
    expect(getTranslation('kjv')?.offlineAvailable).toBe(false);
  });

  it('returns undefined for unknown ids', () => {
    expect(getTranslation('esv')).toBeUndefined();
  });

  it('lists at least the MVP translations', () => {
    expect(TRANSLATIONS.map((t) => t.id)).toEqual(
      expect.arrayContaining(['net', 'kjv']),
    );
  });
});
