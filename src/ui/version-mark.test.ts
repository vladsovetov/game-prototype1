import { describe, expect, it } from 'vitest';
import { appVersionLabel } from './version-mark';

describe('app version mark', () => {
  it('shows the package version and the build commit', () => {
    expect(appVersionLabel('0.3.3', 'abc1234')).toBe('v0.3.3 · abc1234');
    expect(appVersionLabel()).toMatch(/^v0\.3\.3 · ([0-9a-f]{4,40}|dev)$/);
  });
});
