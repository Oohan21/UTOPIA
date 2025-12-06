// components/ui/Pagination.tsx - Fixed version
'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPageNumbers?: boolean
  maxVisiblePages?: number
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPageNumbers = true,
  maxVisiblePages = 7,
  className,
  size = 'default',
}: PaginationProps) {
  if (totalPages <= 1) return null

  // Calculate button sizes mapping
  const buttonSizes = {
    sm: { buttonSize: 'sm' as const, iconSize: 'h-8 w-8 text-xs' },
    default: { buttonSize: 'default' as const, iconSize: 'h-10 w-10 text-sm' },
    lg: { buttonSize: 'lg' as const, iconSize: 'h-12 w-12' },
  }

  const { buttonSize, iconSize } = buttonSizes[size]

  // Calculate visible page numbers
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisiblePages / 2)
    let start = currentPage - half
    let end = currentPage + half

    if (start < 1) {
      start = 1
      end = maxVisiblePages
    }

    if (end > totalPages) {
      end = totalPages
      start = totalPages - maxVisiblePages + 1
    }

    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  const handleFirstPage = () => onPageChange(1)
  const handleLastPage = () => onPageChange(totalPages)
  const handlePrevPage = () => onPageChange(currentPage - 1)
  const handleNextPage = () => onPageChange(currentPage + 1)
  const handlePageClick = (page: number) => onPageChange(page)

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {showFirstLast && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleFirstPage}
          disabled={currentPage === 1}
          aria-label="First page"
          className={cn('rounded-full', iconSize)}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevPage}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={cn('rounded-full', iconSize)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {showPageNumbers && (
        <>
          {visiblePages[0] > 1 && (
            <>
              <Button
                variant="outline"
                size={buttonSize}
                onClick={() => handlePageClick(1)}
                className={cn('rounded-full min-w-10', iconSize)}
              >
                1
              </Button>
              {visiblePages[0] > 2 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
            </>
          )}

          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size={buttonSize}
              onClick={() => handlePageClick(page)}
              className={cn('rounded-full min-w-10', iconSize)}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Button>
          ))}

          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
              <Button
                variant="outline"
                size={buttonSize}
                onClick={() => handlePageClick(totalPages)}
                className={cn('rounded-full min-w-10', iconSize)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={cn('rounded-full', iconSize)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {showFirstLast && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleLastPage}
          disabled={currentPage === totalPages}
          aria-label="Last page"
          className={cn('rounded-full', iconSize)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}