import React, { useState } from 'react';
import Select from 'react-select';
import { getName } from 'country-list';
import { submitScore } from '../../../utils/api';
import { ScoreRecord } from '../../../types/score';

interface ScoreSubmitModalProps {
  score: number;
  onClose: () => void;
}

interface CountryOption {
  value: string;
  label: string;
}

const countries: CountryOption[] = require('country-list')
  .getCodes()
  .map((code: string) => ({
    value: code,
    label: getName(code),
  }));

const ScoreSubmitModal: React.FC<ScoreSubmitModalProps> = ({ score, onClose }) => {
  const [nickname, setNickname] = useState('');
  const [country, setCountry] = useState<CountryOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !country) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const scoreData: ScoreRecord = {
      nickname,
      country: country.value,
      score,
    };

    const response = await submitScore(scoreData);
    setIsSubmitting(false);

    if (response.success) {
      onClose();
    } else {
      setError(response.message || '스코어 제출에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">스코어 기록하기</h2>
        <p className="mb-4">달성 스코어: {score}점</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="닉네임을 입력하세요"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">국가</label>
            <Select
              options={countries}
              value={country}
              onChange={(option) => setCountry(option as CountryOption)}
              placeholder="국가를 선택하세요"
            />
          </div>

          {error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? '제출 중...' : '제출하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScoreSubmitModal; 