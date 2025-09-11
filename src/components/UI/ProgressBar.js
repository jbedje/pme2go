import React from 'react';

export function ProgressBar({ 
  progress = 0, 
  size = 'md',
  color = 'primary',
  showPercentage = false,
  className = '' 
}) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    blue: 'bg-blue-500'
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-1 ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} h-full transition-all duration-300 ease-in-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
}

export default ProgressBar;