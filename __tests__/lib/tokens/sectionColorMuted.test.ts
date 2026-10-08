import { sectionColorMuted, sectionColors } from '@/constants/tokens';

describe('sectionColorMuted', () => {
  it('converts the first section color to rgba at 18% opacity', () => {
    expect(sectionColorMuted(0)).toBe('rgba(99, 102, 241, 0.18)');
    expect(sectionColors[0]).toBe('#6366F1');
  });

  it('wraps colorKey beyond the palette length', () => {
    expect(sectionColorMuted(sectionColors.length)).toBe(sectionColorMuted(0));
    expect(sectionColorMuted(sectionColors.length + 1)).toBe(sectionColorMuted(1));
  });
});
