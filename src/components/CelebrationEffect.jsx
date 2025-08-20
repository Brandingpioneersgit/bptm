import React from 'react';

export const CelebrationEffect = ({ show, overall }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="celebration-container">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][Math.floor(Math.random() * 6)]
            }}
          />
        ))}
      </div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-50">
        <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 p-1 rounded-2xl animate-pulse">
          <div className="bg-white rounded-2xl p-8 shadow-2xl animate-bounce">
            <div className="text-6xl mb-4 animate-spin">🎉</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent mb-2">
              Excellent Work!
            </div>
            <div className="text-lg text-gray-600 mb-2">Overall Score: {overall}/10</div>
            <div className="text-sm text-green-600 font-semibold">🌟 Outstanding Performance! 🌟</div>
          </div>
        </div>
      </div>
      <style>{`
        .celebration-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s linear infinite;
        }
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};