import React from 'react';

export const PerformanceChart = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  const maxScore = Math.max(...data.map(d => d.score), 10);
  const chartHeight = 200;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h4 className="font-medium text-gray-800 mb-4">{title}</h4>
      <div className="relative" style={{ height: chartHeight }}>
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          {[0, 2, 4, 6, 8, 10].map(score => (
            <g key={score}>
              <line
                x1="40"
                y1={chartHeight - (score / 10) * (chartHeight - 40)}
                x2="100%"
                y2={chartHeight - (score / 10) * (chartHeight - 40)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x="35"
                y={chartHeight - (score / 10) * (chartHeight - 40) + 4}
                fontSize="12"
                fill="#6b7280"
                textAnchor="end"
              >
                {score}
              </text>
            </g>
          ))}

          {/* Chart line */}
          <polyline
            points={data.map((d, i) =>
              `${50 + (i * (100 / Math.max(data.length - 1, 1)) * 8)},${chartHeight - (d.score / 10) * (chartHeight - 40)}`
            ).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={50 + (i * (100 / Math.max(data.length - 1, 1)) * 8)}
                cy={chartHeight - (d.score / 10) * (chartHeight - 40)}
                r="4"
                fill="#3b82f6"
              />
              <text
                x={50 + (i * (100 / Math.max(data.length - 1, 1)) * 8)}
                y={chartHeight - 10}
                fontSize="10"
                fill="#6b7280"
                textAnchor="middle"
              >
                {d.month}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};