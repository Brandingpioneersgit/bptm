import React, { useMemo, useState } from "react";
import { monthLabel, round1 } from "./constants";
import { TestimonialsBadge } from "./TestimonialsBadge";

export function FixedLeaderboardView({ allSubmissions }) {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedMetric, setSelectedMetric] = useState('overall');

  // Get unique departments from submissions
  const departments = useMemo(() => {
    if (!allSubmissions || allSubmissions.length === 0) return [];
    const depts = [...new Set(allSubmissions.map(s => s.employee?.department).filter(Boolean))];
    return ['All', ...depts.sort()];
  }, [allSubmissions]);

  // Get unique months from submissions
  const availableMonths = useMemo(() => {
    if (!allSubmissions || allSubmissions.length === 0) return [];
    const months = [...new Set(allSubmissions.map(s => s.monthKey).filter(Boolean))];
    return months.sort((a, b) => b.localeCompare(a)); // Most recent first
  }, [allSubmissions]);

  const leaderboardData = useMemo(() => {
    if (!allSubmissions || allSubmissions.length === 0) return [];

    // Filter submissions by period
    let filteredSubmissions = allSubmissions;
    if (selectedPeriod !== 'all') {
      filteredSubmissions = allSubmissions.filter(s => s.monthKey === selectedPeriod);
    }

    // Filter by department
    if (selectedDepartment !== 'All') {
      filteredSubmissions = filteredSubmissions.filter(s => 
        s.employee?.department === selectedDepartment
      );
    }

    // Group submissions by employee
    const employeeGroups = {};
    filteredSubmissions.forEach(submission => {
      if (!submission.employee?.name || !submission.employee?.phone) return;
      
      const key = `${submission.employee.name}-${submission.employee.phone}`;
      if (!employeeGroups[key]) {
        employeeGroups[key] = {
          name: submission.employee.name,
          phone: submission.employee.phone,
          department: submission.employee.department,
          submissions: [],
          testimonials: submission.employee?.testimonials || []
        };
      }
      employeeGroups[key].submissions.push(submission);
    });

    // Calculate metrics for each employee
    const rankedEmployees = Object.values(employeeGroups).map(emp => {
      const completedSubmissions = emp.submissions.filter(s => !s.isDraft);
      const submissionCount = completedSubmissions.length;
      
      if (submissionCount === 0) {
        return {
          ...emp,
          score: 0,
          submissionCount: 0,
          avgKPI: 0,
          avgLearning: 0,
          avgRelationship: 0,
          totalLearningHours: 0,
          clientCount: 0,
          consistencyScore: 0
        };
      }

      // Calculate average scores
      const totalKPI = completedSubmissions.reduce((sum, s) => sum + (s.scores?.kpiScore || 0), 0);
      const totalLearning = completedSubmissions.reduce((sum, s) => sum + (s.scores?.learningScore || 0), 0);
      const totalRelationship = completedSubmissions.reduce((sum, s) => sum + (s.scores?.relationshipScore || 0), 0);
      const totalOverall = completedSubmissions.reduce((sum, s) => sum + (s.scores?.overall || 0), 0);

      const avgKPI = round1(totalKPI / submissionCount);
      const avgLearning = round1(totalLearning / submissionCount);
      const avgRelationship = round1(totalRelationship / submissionCount);
      const avgOverall = round1(totalOverall / submissionCount);

      // Calculate learning hours
      const totalLearningHours = completedSubmissions.reduce((sum, s) => {
        const hours = (s.learning || []).reduce((h, l) => h + (l.durationMins || 0), 0) / 60;
        return sum + hours;
      }, 0);

      // Calculate client count
      const clientCount = completedSubmissions.reduce((sum, s) => sum + (s.clients?.length || 0), 0);

      // Consistency score (bonus for regular submissions)
      const consistencyScore = submissionCount >= 3 ? 1.2 : submissionCount >= 2 ? 1.1 : 1.0;

      // Select score based on metric
      let score = avgOverall;
      switch (selectedMetric) {
        case 'kpi':
          score = avgKPI;
          break;
        case 'learning':
          score = avgLearning;
          break;
        case 'relationship':
          score = avgRelationship;
          break;
        default:
          score = avgOverall;
      }

      return {
        ...emp,
        score: round1(score * consistencyScore),
        submissionCount,
        avgKPI,
        avgLearning,
        avgRelationship,
        avgOverall,
        totalLearningHours: round1(totalLearningHours),
        clientCount,
        consistencyScore: round1(consistencyScore),
        testimonials: emp.submissions[0]?.employee?.testimonials || []
      };
    });

    // Sort by score (highest first)
    return rankedEmployees.sort((a, b) => b.score - a.score);
  }, [allSubmissions, selectedPeriod, selectedDepartment, selectedMetric]);

  if (!allSubmissions || allSubmissions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">No submissions found to generate leaderboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">🏆 Performance Leaderboard</h1>
        
        {/* Filters */}
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {monthLabel(month)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select 
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overall">Overall Score</option>
              <option value="kpi">KPI Performance</option>
              <option value="learning">Learning Score</option>
              <option value="relationship">Client Relations</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <div>Total Employees: {leaderboardData.length}</div>
              <div>Period: {selectedPeriod === 'all' ? 'All Time' : monthLabel(selectedPeriod)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboardData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600">
            No employees found matching the selected criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedMetric === 'overall' ? 'Overall Score' :
                     selectedMetric === 'kpi' ? 'KPI Score' :
                     selectedMetric === 'learning' ? 'Learning Score' :
                     'Relationship Score'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Learning Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboardData.map((employee, index) => {
                  const rank = index + 1;
                  const isTopPerformer = rank <= 3;
                  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                  
                  return (
                    <tr key={`${employee.name}-${employee.phone}`} 
                        className={`hover:bg-gray-50 ${isTopPerformer ? 'bg-yellow-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <span className="mr-2">{rankEmoji}</span>
                          <span className={`${isTopPerformer ? 'font-bold text-yellow-700' : ''}`}>
                            #{rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {employee.name}
                            <TestimonialsBadge testimonials={employee.testimonials} />
                          </div>
                          <div className="text-sm text-gray-500">{employee.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`text-lg font-bold ${
                            employee.score >= 9 ? 'text-green-600' :
                            employee.score >= 7 ? 'text-blue-600' :
                            employee.score >= 5 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {employee.score}/10
                          </div>
                          {employee.consistencyScore > 1 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              +{round1((employee.consistencyScore - 1) * 100)}% consistency
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.submissionCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.totalLearningHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.clientCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <div className={`w-3 h-3 rounded-full ${
                            employee.avgKPI >= 8 ? 'bg-green-500' :
                            employee.avgKPI >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} title={`KPI: ${employee.avgKPI}/10`}></div>
                          <div className={`w-3 h-3 rounded-full ${
                            employee.avgLearning >= 8 ? 'bg-green-500' :
                            employee.avgLearning >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} title={`Learning: ${employee.avgLearning}/10`}></div>
                          <div className={`w-3 h-3 rounded-full ${
                            employee.avgRelationship >= 8 ? 'bg-green-500' :
                            employee.avgRelationship >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} title={`Relationship: ${employee.avgRelationship}/10`}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {leaderboardData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Performance Insights</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Top Performer</div>
              <div className="text-lg font-bold text-green-700">
                {leaderboardData[0]?.name} - {leaderboardData[0]?.score}/10
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Average Score</div>
              <div className="text-lg font-bold text-blue-700">
                {round1(leaderboardData.reduce((sum, emp) => sum + emp.score, 0) / leaderboardData.length)}/10
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Most Active</div>
              <div className="text-lg font-bold text-purple-700">
                {leaderboardData.sort((a, b) => b.submissionCount - a.submissionCount)[0]?.name} - {leaderboardData[0]?.submissionCount} reports
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}