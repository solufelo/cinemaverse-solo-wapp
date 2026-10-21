'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../src/lib/utils';

interface BasicPaginationProps {
  totalPages: number;
  initialPage?: number;
  siblingsCount?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'rounded';
  showDemo?: boolean;
}

export default function BasicPagination({
  totalPages = 10,
  initialPage = 1,
  siblingsCount = 1,
  onPageChange,
  className,
  variant = 'default',
  showDemo = false,
}: BasicPaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    onPageChange?.(page);
  };

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const start = Math.max(1, currentPage - siblingsCount);
    const end = Math.min(totalPages, currentPage + siblingsCount);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const getButtonStyle = (isActive: boolean) => {
    if (variant === 'outline') {
      return isActive
        ? 'border-primary text-primary hover:bg-primary/10'
        : 'border-border hover:border-primary/50 hover:text-primary';
    }

    if (variant === 'rounded') {
      return isActive
        ? 'bg-primary text-primary-foreground rounded-full'
        : 'hover:bg-muted rounded-full';
    }

    return isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted';
  };

  const pageNumbers = generatePageNumbers();

  return (
    <nav className={cn('flex items-center justify-center', className)}>
      <ul className="flex items-center gap-1">
        <li>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              currentPage <= 1 ? 'pointer-events-none opacity-50' : '',
              variant === 'rounded' ? 'rounded-full' : '',
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </li>

        {pageNumbers.map((page, index) => (
          <li key={index}>
            {page === '...' ? (
              <span className="flex h-9 w-9 items-center justify-center text-sm">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <button
                onClick={() => handlePageChange(page as number)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  getButtonStyle(page === currentPage),
                  variant === 'outline' && 'border',
                )}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        <li>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              currentPage >= totalPages ? 'pointer-events-none opacity-50' : '',
              variant === 'rounded' ? 'rounded-full' : '',
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
 