import React from 'react'

interface RecommendationSkeletonProps {
  count?: number
}

export default function RecommendationSkeleton({ count = 6 }: RecommendationSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
        >
          {/* Poster Skeleton */}
          <div className="aspect-[2/3] bg-gray-200 relative">
            <div className="absolute top-2 right-2">
              <div className="w-12 h-6 bg-gray-300 rounded-full"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            
            {/* Year */}
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            
            {/* Rating */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="flex space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            
            {/* Explanation */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            
            {/* Buttons */}
            <div className="space-y-2 pt-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 