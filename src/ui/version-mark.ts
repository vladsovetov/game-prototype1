import { version as packageVersion } from '../../package.json';
import { t } from '../i18n/messages';

export function appVersionLabel(version = packageVersion, commit = String(import.meta.env.VITE_COMMIT ?? 'dev')) {
  return `v${version} · ${commit}`;
}

export function createVersionMark() {
  const mark = document.createElement('p');
  mark.className = 'version-mark';
  mark.dataset.testid = 'game-version';
  mark.textContent = appVersionLabel();
  mark.setAttribute('aria-label', t('gameVersion', { version: appVersionLabel() }));
  return mark;
}
