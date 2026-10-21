import { useState, useMemo } from 'react';

interface UsePaginationOptions {
  itemsPerPage: number;
  totalItems: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  pageNumbers: number[];
  visiblePageNumbers: (number | string)[];
}

// export function usePagination({
//   itemsPerPage,
//   totalItems,
//   initialPage = 1
// }: UsePaginationOptions): UsePaginationReturn {
//   const [currentPage, setCurrentPage] = useState(initialPage);
//
//   const totalPages = Math.ceil(totalItems / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
//   const hasNextPage = currentPage < totalPages;
//   const hasPrevPage = currentPage > 1;
//
//   const goToPage = (page: number) => {
//     const validPage = Math.max(1, Math.min(page, totalPages));
//     setCurrentPage(validPage);
//   };
//
//   const nextPage = () => {
//     if (hasNextPage) {
//       setCurrentPage(currentPage + 1);
//     }
//   };
//
//   const prevPage = () => {
//     if (hasPrevPage) {
//       setCurrentPage(currentPage - 1);
//     }
//   };
//
//   const goToFirstPage = () => {
//     setCurrentPage(1);
//   };
//
//   const goToLastPage = () => {
//     setCurrentPage(totalPages);
//   };
//
//   // Generate all page numbers
//   const pageNumbers = useMemo(() => {
//     return Array.from({ length: totalPages }, (_, i) => i + 1);
//   }, [totalPages]);
//
//   // Generate visible page numbers (with ellipsis for large page counts)
//   const visiblePageNumbers = useMemo(() => {
//     if (totalPages <= 7) {
//       return pageNumbers;
//     }
//
//     const delta = 2; // Number of pages to show on each side of current page
//     const range = [];
//     const rangeWithDots: (number | string)[] = [];
//
//     for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
//       range.push(i);
//     }
//
//     if (currentPage - delta > 2) {
//       rangeWithDots.push(1, '...');
//     } else {
//       rangeWithDots.push(1);
//     }
//
//     rangeWithDots.push(...range);
//
//     if (currentPage + delta < totalPages - 1) {
//       rangeWithDots.push('...', totalPages);
//     } else {
//       rangeWithDots.push(totalPages);
//     }
//
//     return rangeWithDots;
//   }, [currentPage, totalPages, pageNumbers]);
//
//   return {
//     currentPage,
//     totalPages,
//     itemsPerPage,
//     startIndex,
//     endIndex,
//     hasNextPage,
//     hasPrevPage,
//     goToPage,
//     nextPage,
//     prevPage,
//     goToFirstPage,
//     goToLastPage,
//     pageNumbers,
//     visiblePageNumbers
//   };
// }

// Hook for infinite scroll pagination
interface UseInfinitePaginationOptions {
  itemsPerPage: number;
  totalItems: number;
  threshold?: number; // Distance from bottom to trigger load more
}

interface UseInfinitePaginationReturn {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

export function useInfinitePagination({
  itemsPerPage,
  totalItems,
  threshold = 100
}: UseInfinitePaginationOptions): UseInfinitePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = 0; // Always start from beginning for infinite scroll
  const endIndex = currentPage * itemsPerPage;
  const hasMore = currentPage < totalPages;

  const loadMore = () => {
    if (hasMore) {
      setCurrentPage(currentPage + 1);
    }
  };

  const reset = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    hasMore,
    loadMore,
    reset
  };
}

// Hook for virtual scrolling (for very large datasets)
interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  totalItems: number;
  overscan?: number; // Number of items to render outside visible area
}

interface UseVirtualScrollReturn {
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    size: number;
  }>;
  totalSize: number;
  startIndex: number;
  endIndex: number;
  handleScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}

export function useVirtualScroll({
  itemHeight,
  containerHeight,
  totalItems,
  overscan = 5
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const [scrollTop, setScrollTop] = useState(0);

  const totalSize = totalItems * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualItems = Array.from({ length: endIndex - startIndex + 1 }, (_, i) => {
    const index = startIndex + i;
    return {
      index,
      start: index * itemHeight,
      end: (index + 1) * itemHeight,
      size: itemHeight
    };
  });

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  return {
    virtualItems,
    totalSize,
    startIndex,
    endIndex,
    handleScroll
  };
} 