import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">One More Second</h1>
        <button
          onClick={handleStartGame}
          className="px-8 py-4 bg-blue-500 text-white text-xl rounded-lg hover:bg-blue-600"
        >
          게임 시작
        </button>
      </div>
    </div>
  );
};

export default Home; 