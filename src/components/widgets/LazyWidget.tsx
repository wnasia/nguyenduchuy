import { useState, useEffect, useRef, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyWidgetProps {
  children: ReactNode;
  height?: string;
  delay?: number;
}

const LazyWidget = ({ children, height = '200px', delay = 0 }: LazyWidgetProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldRender(true), delay);
        return () => clearTimeout(timer);
      } else {
        setShouldRender(true);
      }
    }
  }, [isVisible, delay]);

  if (!shouldRender) {
    return (
      <div ref={ref} style={{ minHeight: height }}>
        <div className="bg-card rounded-lg border border-border p-5 animate-pulse">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LazyWidget;
