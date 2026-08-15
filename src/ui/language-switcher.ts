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
