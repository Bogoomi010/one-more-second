import { getName } from 'country-list';
import { ScoreRecord } from '../types/score';

export const SCORE_LIMITS = {
  maxScore: 500000,
  maxNormalScore: 500000,
} as const;

const MAX_NICKNAME_LENGTH = 20;
const NICKNAME_REGEX = /^[A-Za-z0-9 _-]+$/;
const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;

export function normalizeNickname(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('닉네임은 문자열이어야 합니다.');
  }

  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    throw new Error('닉네임은 필수 입력값입니다.');
  }

  if (trimmed.length > MAX_NICKNAME_LENGTH) {
    throw new Error(`닉네임은 ${MAX_NICKNAME_LENGTH}자 이하로 입력해야 합니다.`);
  }

  if (!NICKNAME_REGEX.test(trimmed)) {
    throw new Error('닉네임에는 영문, 숫자, 공백, -, _만 사용할 수 있습니다.');
  }

  return trimmed;
}

export function normalizeCountryCode(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('국가 코드는 문자열이어야 합니다.');
  }

  const normalized = value.trim().toUpperCase();
  if (!COUNTRY_CODE_REGEX.test(normalized)) {
    throw new Error('국가 코드는 ISO 3166-1 alpha-2 형식이어야 합니다.');
  }

  if (!getName(normalized)) {
    throw new Error('유효하지 않은 국가 코드입니다.');
  }

  return normalized;
}

export function normalizeIntegerScore(value: unknown, options: { max: number; min?: number }): number {
  const min = options.min ?? 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error('점수 값이 유효하지 않습니다.');
  }

  const normalized = Math.max(min, Math.floor(parsed));
  if (normalized > options.max) {
    throw new Error(`점수는 ${options.max}을(를) 초과할 수 없습니다.`);
  }

  return normalized;
}

export function sanitizeScoreRecord(raw: ScoreRecord): ScoreRecord {
  const score = normalizeIntegerScore(raw.score, { min: 0, max: SCORE_LIMITS.maxScore });
  const finalScore = normalizeIntegerScore(raw.finalScore, {
    min: score,
    max: SCORE_LIMITS.maxScore,
  });
  const normalScore = normalizeIntegerScore(raw.normalScore, {
    min: 0,
    max: SCORE_LIMITS.maxNormalScore,
  });

  return {
    nickname: normalizeNickname(raw.nickname),
    country: normalizeCountryCode(raw.country),
    score,
    finalScore,
    normalScore,
  };
}
