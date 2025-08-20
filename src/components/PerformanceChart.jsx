import React from 'react';

export const PerformanceChart = ({ currentData = [], comparisonData = [], title }) => {
  const data = currentData;
  if (!data || data.length === 0) return null;

  const chartHeight = 200;
  const xPos = i => 50 + (i * (100 / Math.max(data.length - 1, 1)) * 8);
  const yPos = score => chartHeight - (score / 10) * (chartHeight - 40);

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
                y1={yPos(score)}
                x2="100%"
                y2={yPos(score)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x="35"
                y={yPos(score) + 4}
                fontSize="12"
                fill="#6b7280"
                textAnchor="end"
              >
                {score}
              </text>
            </g>
          ))}

          {/* Current month line */}
          <polyline
            points={data
              .map((d, i) => `${xPos(i)},${yPos(d.score)}`)
              .join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Comparison month line */}
          {comparisonData.length > 0 && (
            <polyline
              points={comparisonData
                .map((d, i) => `${xPos(i)},${yPos(d.score)}`)
                .join(' ')}
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 2"
            />
          )}

          {/* Data points */}
          {data.map((d, i) => (
            <g key={`cur-${i}`}>
              <circle cx={xPos(i)} cy={yPos(d.score)} r="4" fill="#3b82f6" />
              <text
                x={xPos(i)}
                y={chartHeight - 10}
                fontSize="10"
                fill="#6b7280"
                textAnchor="middle"
              >
                {d.month}
              </text>
            </g>
          ))}

          {comparisonData.map((d, i) => (
            <g key={`cmp-${i}`}>
              <circle cx={xPos(i)} cy={yPos(d.score)} r="3" fill="#9ca3af" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};