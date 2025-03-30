import React from 'react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  fallback,
  ...props
}) => {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  return (
    <div
      ref={targetRef as React.RefObject<HTMLDivElement>}
      className={cn('lazy-load', className)}
    >
      {isIntersecting ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          {...props}
        />
      ) : (
        fallback || (
          <div className="animate-pulse bg-gray-200 h-full w-full rounded" />
        )
      )}
    </div>
  );
};