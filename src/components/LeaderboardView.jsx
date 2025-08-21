import React, { useMemo, useState } from "react";

export function LeaderboardView({ allSubmissions }) {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedMetric, setSelectedMetric] = useState('overall');

  const leaderboardData = useMemo(() => {
    if (!allSubmissions || allSubmissions.length === 0) return [];

    let filteredSubmissions = allSubmissions;
    if (selectedPeriod !== 'all') {
      const currentDate = new Date();
      const cutoffDate = new Date();
      
      switch (selectedPeriod) {
        case 'monthly':
          cutoffDate.setMonth(currentDate.getMonth() - 1);
          break;
        case 'quarterly':
          cutoffDate.setMonth(currentDate.getMonth() - 3);
          break;
        case 'yearly':
          cutoffDate.setFullYear(currentDate.getFullYear() - 1);
          break;
      }
      
      filteredSubmissions = allSubmissions.filter(emp => 
        emp.submissions && emp.submissions.some(sub => {
          const [year, month] = sub.monthKey.split('-').map(Number);
          const subDate = new Date(year, month - 1);
          return subDate >= cutoffDate;
        })
      );
    }

    if (selectedDepartment !== 'All') {
      filteredSubmissions = filteredSubmissions.filter(emp => 
        emp.department === selectedDepartment
      );
    }

    const rankedEmployees = filteredSubmissions.map(emp => {
      let score = 0;
      let submissionCount = 0;
      let totalHours = 0;
      let consistencyBonus = 0;
      let improvementBonus = 0;

      if (emp.submissions && emp.submissions.length > 0) {
        switch (selectedMetric) {
          case 'overall':
            score = parseFloat(emp.averageScore) || 0;
            break;
          case 'kpi':
            score = emp.submissions.reduce((sum, sub) => sum + (sub.scores?.kpiScore || 0), 0) / emp.submissions.length;
            break;
          case 'learning':
            score = emp.submissions.reduce((sum, sub) => sum + (sub.scores?.learningScore || 0), 0) / emp.submissions.length;
            break;
          case 'relationship':
            score = emp.submissions.reduce((sum, sub) => sum + (sub.scores?.relationshipScore || 0), 0) / emp.submissions.length;
            break;
        }

        submissionCount = emp.submissions.length;
        totalHours = emp.totalHours || 0;
        
        consistencyBonus = Math.min(1, submissionCount / 6);
        
        if (emp.submissions.length >= 2) {
          const sortedSubs = [...emp.submissions].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
          const firstScore = sortedSubs[0].scores?.overall || 0;
          const latestScore = sortedSubs[sortedSubs.length - 1].scores?.overall || 0;
          improvementBonus = Math.max(0, (latestScore - firstScore) / 10);
        }
      }

      const finalScore = score + (consistencyBonus * 0.5) + (improvementBonus * 0.3);

      return {
        ...emp,
        rankingScore: finalScore,
        submissionCount,
        totalHours,
        consistencyBonus,
        improvementBonus,
        badge: getBadge(finalScore, submissionCount)
      };
    });

    return rankedEmployees
      .filter(emp => emp.rankingScore > 0)
      .sort((a, b) => b.rankingScore - a.rankingScore)
      .map((emp, index) => ({ ...emp, rank: index + 1 }));
  }, [allSubmissions, selectedPeriod, selectedDepartment, selectedMetric]);

  const departments = useMemo(() => {
    if (!allSubmissions) return [];
    return [...new Set(allSubmissions.map(emp => emp.department))].filter(Boolean).sort();
  }, [allSubmissions]);

  const getBadge = (score, submissionCount) => {
    if (score >= 9 && submissionCount >= 6) return { type: 'gold', icon: '🥇', label: 'Gold Champion' };
    if (score >= 8 && submissionCount >= 4) return { type: 'silver', icon: '🥈', label: 'Silver Star' };
    if (score >= 7 && submissionCount >= 2) return { type: 'bronze', icon: '🥉', label: 'Bronze Achiever' };
    if (score >= 6) return { type: 'rising', icon: '🌟', label: 'Rising Star' };
    return { type: 'participant', icon: '💪', label: 'Active' };
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">🏆 Employee Leaderboard</h2>
            <p className="opacity-90">Top performing team members across all metrics</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{leaderboardData.length}</div>
            <div className="text-sm opacity-90">Active Performers</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="monthly">Last Month</option>
              <option value="quarterly">Last Quarter</option>
              <option value="yearly">Last Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ranking Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overall">Overall Score</option>
              <option value="kpi">KPI Performance</option>
              <option value="learning">Learning & Development</option>
              <option value="relationship">Client Relationships</option>
            </select>
          </div>
        </div>
      </div>

      {leaderboardData.length >= 3 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">🏆 Top Performers</h3>
          <div className="flex justify-center items-end gap-4">
            <div className="text-center">
              <div className="bg-gray-200 rounded-lg p-4 mb-2">
                <div className="text-2xl">🥈</div>
                <div className="text-sm font-medium mt-2">{leaderboardData[1].name}</div>
                <div className="text-xs text-gray-600">{leaderboardData[1].department}</div>
                <div className="text-lg font-bold text-gray-600 mt-1">{leaderboardData[1].rankingScore.toFixed(1)}</div>
                {leaderboardData[1].hasTestimonial && (
                  <div className="text-xs text-purple-700 mt-1">🎥 Testimonial</div>
                )}
              </div>
              <div className="bg-gray-400 h-16 rounded-t-lg flex items-center justify-center text-white font-bold">
                2nd
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-100 rounded-lg p-4 mb-2 border-2 border-yellow-400">
                <div className="text-3xl">🥇</div>
                <div className="text-sm font-medium mt-2">{leaderboardData[0].name}</div>
                <div className="text-xs text-gray-600">{leaderboardData[0].department}</div>
                <div className="text-xl font-bold text-yellow-600 mt-1">{leaderboardData[0].rankingScore.toFixed(1)}</div>
                {leaderboardData[0].hasTestimonial && (
                  <div className="text-xs text-purple-700 mt-1">🎥 Testimonial</div>
                )}
              </div>
              <div className="bg-yellow-500 h-20 rounded-t-lg flex items-center justify-center text-white font-bold">
                1st
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 rounded-lg p-4 mb-2">
                <div className="text-2xl">🥉</div>
                <div className="text-sm font-medium mt-2">{leaderboardData[2].name}</div>
                <div className="text-xs text-gray-600">{leaderboardData[2].department}</div>
                <div className="text-lg font-bold text-orange-600 mt-1">{leaderboardData[2].rankingScore.toFixed(1)}</div>
                {leaderboardData[2].hasTestimonial && (
                  <div className="text-xs text-purple-700 mt-1">🎥 Testimonial</div>
                )}
              </div>
              <div className="bg-orange-500 h-12 rounded-t-lg flex items-center justify-center text-white font-bold">
                3rd
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Complete Rankings</h3>
        </div>
        
        {leaderboardData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📋</div>
            <p className="text-gray-500">No performance data available for the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learning Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboardData.map((employee) => (
                  <tr key={`${employee.name}-${employee.phone}`} className={`hover:bg-gray-50 ${
                    employee.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-lg font-bold ${
                          employee.rank === 1 ? 'text-yellow-600' :
                          employee.rank === 2 ? 'text-gray-600' :
                          employee.rank === 3 ? 'text-orange-600' : 'text-gray-800'
                        }`}>
                          #{employee.rank}
                        </span>
                        {employee.rank <= 3 && (
                          <span className="ml-2 text-lg">
                            {employee.rank === 1 ? '🥇' : employee.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-semibold ${
                        employee.rankingScore >= 9 ? 'text-green-600' :
                        employee.rankingScore >= 8 ? 'text-blue-600' :
                        employee.rankingScore >= 7 ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {employee.rankingScore.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.submissionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.totalHours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.badge.type === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        employee.badge.type === 'silver' ? 'bg-gray-100 text-gray-800' :
                        employee.badge.type === 'bronze' ? 'bg-orange-100 text-orange-800' :
                        employee.badge.type === 'rising' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        <span className="mr-1">{employee.badge.icon}</span>
                        {employee.badge.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
