import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { getName } from 'country-list';
import 'flag-icons/css/flag-icons.min.css';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  isNicknameAvailable,
  UserIdentityProfile,
} from '../services/userDataService';
import { useModalAccessibility } from './useModalAccessibility';

interface ProfileSetupModalProps {
  isOpen: boolean;
  initialValue?: UserIdentityProfile | null;
  onConfirm: (value: UserIdentityProfile) => Promise<void>;
  onClose: () => void;
}

interface CountryOption {
  value: string;
  label: string;
}

const majorCountryCodes = ['KR', 'US', 'JP', 'CN', 'GB', 'DE', 'FR', 'CA', 'AU', 'IN'];

const NICKNAME_REGEX = /^[\p{L}\p{N} ]+$/u;

export default function ProfileSetupModal({
  isOpen,
  initialValue,
  onConfirm,
  onClose,
}: ProfileSetupModalProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [nickname, setNickname] = useState('');
  const [country, setCountry] = useState('KR');
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const countryMenuRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();
  const errorId = useId();
  const countryListId = useId();
  const countryButtonId = useId();

  useModalAccessibility({
    isOpen,
    dialogRef,
    onClose,
    autoFocusSelector: '#nickname-input',
  });

  const countries = useMemo<CountryOption[]>(() => {
    const locale = i18n.resolvedLanguage ?? i18n.language ?? 'en';
    const displayNames =
      typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined'
        ? new Intl.DisplayNames([locale], { type: 'region' })
        : null;

    return majorCountryCodes
      .map((code: string) => ({
        value: code,
        label: displayNames?.of(code) || getName(code) || code,
      }))
      .filter((item) => Boolean(item.label));
  }, [i18n.language, i18n.resolvedLanguage]);

  const selectedCountry = useMemo(
    () => countries.find((item) => item.value === country),
    [countries, country]
  );

  useEffect(() => {
    if (!isOpen) return;
    setNickname(initialValue?.nickname ?? '');
    setCountry(initialValue?.country ?? 'KR');
    setError(null);
    setIsCountryMenuOpen(false);
  }, [initialValue, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryMenuRef.current && !countryMenuRef.current.contains(event.target as Node)) {
        setIsCountryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validateNickname = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return t('profileSetup.errorRequired');
    if (!NICKNAME_REGEX.test(trimmed)) return t('profileSetup.errorInvalidNickname');
    return null;
  };

  const handleConfirm = async () => {
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!country) {
      setError(t('profileSetup.errorRequired'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const isAvailable = await isNicknameAvailable(nickname.trim(), user?.uid);
      if (!isAvailable) {
        setError(t('profileSetup.errorNicknameTaken'));
        setIsSubmitting(false);
        return;
      }

      await onConfirm({
        nickname: nickname.trim(),
        country,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('profileSetup.errorSaveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-lg flex items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-[min(520px,calc(100vw-24px))] rounded-[24px] border border-border-primary shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-bg-primary px-5 sm:px-8 md:px-10 py-8 sm:py-10 md:py-12 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={error ? `${subtitleId} ${errorId}` : subtitleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={titleId}
          className="font-primary text-[32px] font-bold text-accent-green tracking-[2px] mb-2 text-center"
        >
          {t('profileSetup.title')}
        </h2>
        <p id={subtitleId} className="text-center text-[12px] text-text-secondary mb-8 font-primary">
          {t('profileSetup.subtitle')}
        </p>

        <div className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="nickname-input"
              className="block font-primary text-[10px] font-medium text-text-disabled tracking-[1px] mb-2"
            >
              {t('profileSetup.nickname')}
            </label>
            <input
              id="nickname-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full h-12 rounded-xl border border-border-secondary bg-bg-card text-text-primary text-sm font-primary px-4 outline-none"
              placeholder={t('profileSetup.nicknamePlaceholder')}
            />
          </div>

          <div>
            <label className="block font-primary text-[10px] font-medium text-text-disabled tracking-[1px] mb-2">
              {t('profileSetup.country')}
            </label>
            <div className="relative" ref={countryMenuRef}>
              <button
                id={countryButtonId}
                type="button"
                onClick={() => setIsCountryMenuOpen((prev) => !prev)}
                className="w-full h-12 rounded-xl border border-border-secondary bg-bg-card text-text-primary text-sm font-primary px-4 cursor-pointer flex items-center justify-between"
                aria-haspopup="listbox"
                aria-expanded={isCountryMenuOpen}
                aria-controls={countryListId}
                aria-label={t('profileSetup.country')}
              >
                <span className="flex items-center gap-2">
                  {selectedCountry ? (
                    <span
                      className={`fi fi-${selectedCountry.value.toLowerCase()} rounded-[2px]`}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span>{selectedCountry?.label ?? t('profileSetup.countryPlaceholder')}</span>
                </span>
                <span className="text-text-disabled text-xs">{isCountryMenuOpen ? '▲' : '▼'}</span>
              </button>

              {isCountryMenuOpen && (
                <div
                  id={countryListId}
                  role="listbox"
                  aria-label={t('profileSetup.country')}
                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-64 overflow-y-auto rounded-xl border border-border-primary bg-bg-secondary shadow-lg p-1"
                >
                  {countries.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setCountry(option.value);
                        setIsCountryMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-bg-card-alt flex items-center gap-2"
                      role="option"
                      aria-selected={country === option.value}
                      aria-label={option.label}
                    >
                      <span className={`fi fi-${option.value.toLowerCase()} rounded-[2px]`} aria-hidden="true" />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div id={errorId} className="text-center mt-4" role="status" aria-live="polite">
            <p className="font-primary text-sm text-accent-green tracking-[0.5px]">{error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[52px] rounded-xl border border-border-secondary bg-bg-card text-text-primary font-primary text-[15px] font-semibold"
          >
            {t('profileSetup.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 h-[52px] rounded-xl border-none font-primary text-[15px] font-semibold transition-all duration-200 bg-accent-green text-bg-primary cursor-pointer hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('profileSetup.saving') : t('profileSetup.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
