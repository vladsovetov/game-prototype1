import { t } from '../i18n/messages';
import { SUPPORTED_LOCALES, type Locale } from '../i18n/locale';

const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', uk: 'Українська', ru: 'Русский' };
const SHORT_NAMES: Record<Locale, string> = { en: 'EN', uk: 'УКР', ru: 'RU' };

export function createLanguageSwitcher(active: Locale, onSelect: (locale: Locale) => void) {
  const nav = document.createElement('nav');
  nav.className = 'language-switcher';
  nav.dataset.testid = 'language-switcher';
  nav.setAttribute('aria-label', t('language'));
  for (const locale of SUPPORTED_LOCALES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.lang = locale;
    button.textContent = SHORT_NAMES[locale];
    button.setAttribute('aria-label', LANGUAGE_NAMES[locale]);
    button.setAttribute('aria-pressed', String(locale === active));
    button.addEventListener('click', () => { if (locale !== active) onSelect(locale); });
    nav.append(button);
  }
  return nav;
}

export function createReloadButton(onReload: () => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'site-reload';
  button.dataset.testid = 'reload-playthrough';
  button.textContent = t('reloadGame');
  button.setAttribute('aria-label', t('reloadGameAria'));
  button.addEventListener('click', onReload);
  return button;
}

export function createSiteChrome(active: Locale, onSelect: (locale: Locale) => void, onReload: () => void) {
  const chrome = document.createElement('div');
  chrome.className = 'site-chrome';
  chrome.append(createLanguageSwitcher(active, onSelect), createReloadButton(onReload));
  return chrome;
}
