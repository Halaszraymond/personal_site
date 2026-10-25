/**
 * Unit tests for chooseLanguageHint (spec: i18n-routing, "Language hint on the root").
 * Each test mirrors a scenario from the spec, plus the edge cases of reading browser languages.
 */
import { describe, expect, it } from 'vitest';
import { chooseLanguageHint, firstSupportedLanguage } from '../../src/lib/language-hint';

describe('chooseLanguageHint', () => {
  it('offers Hungarian to a Hungarian browser on a first visit', () => {
    expect(chooseLanguageHint({ storedChoice: null, browserLanguages: ['hu'] })).toBe('hu');
  });

  it('offers Dutch to a Dutch browser on a first visit', () => {
    expect(chooseLanguageHint({ storedChoice: null, browserLanguages: ['nl'] })).toBe('nl');
  });

  it('shows no hint to an English browser', () => {
    expect(chooseLanguageHint({ storedChoice: null, browserLanguages: ['en-US'] })).toBeNull();
  });

  it('shows no hint after English was chosen (or the hint was dismissed)', () => {
    expect(chooseLanguageHint({ storedChoice: 'en', browserLanguages: ['hu'] })).toBeNull();
  });

  it('lets the stored choice win over the browser language', () => {
    expect(chooseLanguageHint({ storedChoice: 'nl', browserLanguages: ['hu'] })).toBe('nl');
  });

  it('shows no hint when the browser reports no languages', () => {
    expect(chooseLanguageHint({ storedChoice: null, browserLanguages: [] })).toBeNull();
  });
});

describe('firstSupportedLanguage', () => {
  it('ignores the region subtag', () => {
    expect(firstSupportedLanguage(['hu-HU'])).toBe('hu');
    expect(firstSupportedLanguage(['nl-BE'])).toBe('nl');
  });

  it('ignores letter case', () => {
    expect(firstSupportedLanguage(['NL-nl'])).toBe('nl');
  });

  it('skips languages we do not have', () => {
    expect(firstSupportedLanguage(['de-DE', 'fr', 'hu'])).toBe('hu');
  });

  it('respects the order: English first means English', () => {
    expect(firstSupportedLanguage(['en-GB', 'hu'])).toBe('en');
  });

  it('returns null when no language is supported', () => {
    expect(firstSupportedLanguage(['de', 'fr'])).toBeNull();
  });
});
