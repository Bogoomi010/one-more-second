import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ScoreSubmitModal from './components/ScoreSubmitModal';

interface LocationState {
  score: number;
}

const GameOver: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { score = 0 } = (location.state as LocationState) || {};
  const [showScoreModal, setShowScoreModal] = useState(true);

  const handleRetry = () => {
    navigate('/game');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">게임 오버</h1>
        <p className="text-2xl mb-8">최종 점수: {score}점</p>
        
        <div className="space-x-4">
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            다시 시작
          </button>
          <button
            onClick={handleHome}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            홈으로
          </button>
        </div>
      </div>

      {showScoreModal && (
        <ScoreSubmitModal
          score={score}
          onClose={() => setShowScoreModal(false)}
        />
      )}
    </div>
  );
};

export default GameOver; 