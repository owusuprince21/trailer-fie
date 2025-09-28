'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
}

export default function Carousel({ children, className = '' }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      slidesToScroll: 1,
      dragFree: true,
      containScroll: 'trimSnaps',
      breakpoints: {
        '(min-width: 640px)': { slidesToScroll: 2 },
        '(min-width: 1024px)': { slidesToScroll: 4 },
      },
    },
    [
      WheelGesturesPlugin({
        forceWheelAxis: 'x',
      }),
    ]
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const items = Array.isArray(children) ? children : [children];

  return (
    <div className={`relative ${className}`} role="region" aria-label="carousel">
      <div ref={emblaRef} className="overflow-hidden overscroll-x-contain">
        <div className="flex gap-3 md:gap-4 select-none cursor-grab active:cursor-grabbing">
          {items.map((child, index) => (
            <div
              key={index}
              className="flex-none w-[220px] sm:w-[240px] lg:w-[260px]"
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {canScrollPrev && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 bg-white/90 hover:bg-white shadow-lg"
          onClick={scrollPrev}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {canScrollNext && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 bg-white/90 hover:bg-white shadow-lg"
          onClick={scrollNext}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
