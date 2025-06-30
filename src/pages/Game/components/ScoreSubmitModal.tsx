import React, { useState } from 'react';
import Select from 'react-select';
import { getName } from 'country-list';
import Flag from 'react-world-flags';
import { submitScore } from '../../../utils/api';
import { ScoreRecord } from '../../../types/score';
import Modal from '../../../components/Modal';

interface ScoreSubmitModalProps {
    score: number;
    onClose: () => void;
    isOpen: boolean;
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

const formatOptionLabel = ({ value, label }: CountryOption) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <Flag code={value} height="12" />
        <span style={{
            marginLeft: '6px',
            fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '11px'
        }}>{label}</span>
    </div>
);

const SelectedFlag = ({ value }: { value: string }) => (
    <div style={{ width: '24px', marginRight: '8px' }}>
        <Flag code={value} height="16" />
    </div>
);

const ScoreSubmitModal: React.FC<ScoreSubmitModalProps> = ({ score, onClose, isOpen }) => {
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
            setNickname('');
            setCountry(null);
            onClose();
        } else {
            setError(response.message || '스코어 제출에 실패했습니다.');
        }
    };

    return (
        <Modal isOpen={isOpen}>
            <div className="h-full w-full flex flex-col items-center justify-center">
                <div className="max-w-[280px] w-full mx-auto">
                    <div className="text-center w-full mb-5">
                        <h2 className="text-2xl font-bold mb-2 text-white" style={{
                            fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                            letterSpacing: '-0.5px'
                        }}>GAME OVER</h2>
                        <p className="text-base text-gray-300" style={{
                            fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                            letterSpacing: '0.5px'
                        }}>Score: {score}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 w-full items-center justify-center">
                        <div className="w-full">
                            <label className="block text-xs font-medium mb-2 text-gray-300 text-center w-full" style={{
                                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                                letterSpacing: '1px'
                            }}>Nickname</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-center"
                                style={{
                                    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    transition: 'all 0.2s ease-in-out',
                                    letterSpacing: '0.5px'
                                }}
                                placeholder="Enter nickname"
                                autoFocus
                            />
                        </div>

                        <div className="w-full">
                            <label className="block text-xs font-medium mb-2 text-gray-300 text-center w-full" style={{
                                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                                letterSpacing: '1px'
                            }}>Country</label>
                            <div className="flex justify-center">
                                <div className="w-full">
                                    <Select
                                        options={countries}
                                        value={country}
                                        onChange={(option) => setCountry(option as CountryOption)}
                                        placeholder="Select country"
                                        formatOptionLabel={formatOptionLabel}
                                        isSearchable={false}
                                        components={{
                                            SingleValue: (props) => (
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{
                                                        fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                                                        fontSize: '11px',
                                                        color: 'white'
                                                    }}>{props.children}</span>
                                                </div>
                                            )
                                        }}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: '24px',
                                                maxHeight: '24px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    borderColor: 'rgba(255, 255, 255, 0.2)'
                                                },
                                                paddingLeft: '6px',
                                                paddingRight: '6px'
                                            }),
                                            valueContainer: (base) => ({
                                                ...base,
                                                padding: '0',
                                                display: 'flex',
                                                justifyContent: 'flex-start',
                                                maxHeight: '24px'
                                            }),
                                            option: (base, state) => ({
                                                ...base,
                                                padding: '4px 6px',
                                                height: '22px',
                                                backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? 'rgba(59, 130, 246, 0.2)' : '#1a1a1a',
                                                color: state.isSelected ? 'white' : '#e5e5e5',
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                backgroundColor: '#1a1a1a',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                                overflow: 'hidden'
                                            }),
                                            menuList: (base) => ({
                                                ...base,
                                                padding: '2px'
                                            }),
                                            placeholder: (base) => ({
                                                ...base,
                                                color: 'rgba(255, 255, 255, 0.5)',
                                                fontSize: '11px',
                                                margin: 0
                                            }),
                                            dropdownIndicator: (base) => ({
                                                ...base,
                                                padding: '0 4px'
                                            }),
                                            indicatorSeparator: () => ({
                                                display: 'none'
                                            })
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="w-full mt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(135deg, #323232 0%, #1a1a1a 100%)',
                                    color: '#e0e0e0',
                                    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
                                    fontSize: '13px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    transform: 'translateY(0)',
                                    transition: 'all 0.2s ease-in-out',
                                    letterSpacing: '1px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #3a3a3a 0%, #222222 100%)';
                                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #323232 0%, #1a1a1a 100%)';
                                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default ScoreSubmitModal; 