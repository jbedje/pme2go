import React from 'react';

export function LoadingSpinner({ size = 'md', color = 'primary' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-primary-600',
    white: 'border-white',
    gray: 'border-gray-600'
  };

  return (
    <div 
      className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}
    />
  );
}

export function SkeletonLoader({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 bg-gray-200 dark:bg-gray-700 rounded',
    title: 'h-6 bg-gray-200 dark:bg-gray-700 rounded',
    avatar: 'w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full',
    card: 'h-48 bg-gray-200 dark:bg-gray-700 rounded-lg',
    button: 'h-10 bg-gray-200 dark:bg-gray-700 rounded-lg'
  };

  return (
    <div className={`animate-pulse ${variants[variant]} ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start space-x-4 mb-4">
        <SkeletonLoader variant="avatar" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="title" className="w-3/4" />
          <SkeletonLoader variant="text" className="w-1/2" />
          <SkeletonLoader variant="text" className="w-2/3" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="text" className="w-5/6" />
        <SkeletonLoader variant="text" className="w-4/5" />
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          <SkeletonLoader variant="text" className="w-16" />
          <SkeletonLoader variant="text" className="w-20" />
        </div>
        <SkeletonLoader variant="text" className="w-12" />
      </div>
    </div>
  );
}

export default { LoadingSpinner, SkeletonLoader, PageLoader, CardSkeleton };