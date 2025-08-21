import React from 'react';

export function TaskCompletionBadge({ isCompleted, isOverdue = false, label = 'Task', size = 'normal' }) {
  const sizeClasses = { small: 'px-2 py-1 text-xs', normal: 'px-3 py-1 text-sm', large: 'px-4 py-2 text-base' };
  if (isCompleted) return (<span className={`${sizeClasses[size]} bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-1`}><span>✅</span><span>Completed</span></span>);
  if (isOverdue) return (<span className={`${sizeClasses[size]} bg-red-100 text-red-800 rounded-full font-medium flex items-center gap-1`}><span>⏰</span><span>Overdue</span></span>);
  return (<span className={`${sizeClasses[size]} bg-gray-100 text-gray-800 rounded-full font-medium flex items-center gap-1`}><span>⏳</span><span>{label}</span></span>);
}

export function RequirementIndicator({ met, label, hint, size = 'normal' }) {
  const sizeClasses = { small: 'px-2 py-1 text-xs', normal: 'px-3 py-1 text-sm', large: 'px-4 py-2 text-base' };
  const colorClasses = met ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  return (
    <span className={`${sizeClasses[size]} ${colorClasses} rounded-full font-medium flex items-center gap-2`}>
      <span>{met ? '✓' : '!'}</span>
      <span>{label}</span>
      {hint && <span className="text-xs opacity-75">({hint})</span>}
    </span>
  );
}

