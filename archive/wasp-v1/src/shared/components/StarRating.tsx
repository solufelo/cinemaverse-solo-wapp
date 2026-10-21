import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  size = 'md', 
  readonly = false,
  showValue = true 
}: StarRatingProps) {
  const maxStars = 10; // Changed from 5 to 10
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-6 w-6';
      default:
        return 'h-4 w-4';
    }
  };

  const handleStarClick = (starValue: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue: number) => {
    if (!readonly) {
      // Add hover effect if needed
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            disabled={readonly}
            className={`transition-colors duration-200 ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              className={`${getSizeClasses()} ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
          {rating.toFixed(1)}/10
        </span>
      )}
    </div>
  );
} 