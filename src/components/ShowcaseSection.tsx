'use client';

import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { ShowcaseVehicle } from '@/lib/validation';
import Link from 'next/link';

export function ShowcaseSection() {
  const [vehicles, setVehicles] = useState<ShowcaseVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/showcase');
        if (response.ok) {
          const data = await response.json();
          setVehicles(data.vehicles || []);
        }
      } catch (err) {
        console.error('Error fetching showcase:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // Auto-advance on desktop
  useEffect(() => {
    if (vehicles.length <= 3 || isMobile) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, vehicles.length - 2));
    }, 5000);
    return () => clearInterval(timer);
  }, [vehicles.length, isMobile]);

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentIndex < vehicles.length - 1) {
      setCurrentIndex(prev => Math.min(prev + 1, vehicles.length - 1));
    } else if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const next = () => setCurrentIndex((prev) => Math.min(prev + 1, Math.max(0, vehicles.length - 3)));
  const prev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  if (!isLoading && vehicles.length === 0) {
    return null;
  }

  const cardWidth = isMobile ? 280 : 380;
  const gap = isMobile ? 16 : 24;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
            Featured <span className="text-primary-600">Vehicles</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Examples of the quality vehicles we can help you find.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="relative" ref={containerRef}>
            {/* Desktop: 3-wide view */}
            {!isMobile && (
              <>
                <div className="overflow-hidden">
                  <motion.div
                    className="flex"
                    animate={{ x: -(currentIndex * (cardWidth + gap)) }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{ gap }}
                  >
                    {vehicles.map((vehicle, i) => (
                      <motion.div
                        key={vehicle.id}
                        className="flex-shrink-0"
                        style={{ width: cardWidth }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <VehicleCard vehicle={vehicle} />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Navigation */}
                {vehicles.length > 3 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={prev}
                      disabled={currentIndex === 0}
                      className="w-12 h-12 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary-600 hover:border-primary-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="flex gap-2">
                      {Array.from({ length: Math.max(1, vehicles.length - 2) }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentIndex(i)}
                          className={`h-2 rounded-full transition-all ${
                            i === currentIndex ? 'w-8 bg-primary-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={next}
                      disabled={currentIndex >= vehicles.length - 3}
                      className="w-12 h-12 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary-600 hover:border-primary-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Mobile: Swipe carousel with peek */}
            {isMobile && (
              <>
                <motion.div
                  className="flex cursor-grab active:cursor-grabbing"
                  drag="x"
                  dragConstraints={{ left: -((vehicles.length - 1) * (cardWidth + gap)), right: 0 }}
                  dragElastic={0.1}
                  onDragEnd={handleDragEnd}
                  animate={{ x: -(currentIndex * (cardWidth + gap)) + 40 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ gap, paddingRight: 80, marginLeft: -40 }}
                >
                  {vehicles.map((vehicle, i) => (
                    <motion.div
                      key={vehicle.id}
                      className="flex-shrink-0"
                      style={{ width: cardWidth }}
                      animate={{
                        scale: i === currentIndex ? 1 : 0.9,
                        opacity: i === currentIndex ? 1 : 0.6,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <VehicleCard vehicle={vehicle} compact />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Mobile dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {vehicles.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === currentIndex ? 'w-6 bg-primary-600' : 'w-2 bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function VehicleCard({ vehicle, compact }: { vehicle: ShowcaseVehicle; compact?: boolean }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden ${compact ? 'h-full' : ''}`}>
      {/* Image */}
      <div className="relative aspect-[16/10] bg-slate-100">
        {vehicle.imageUrl && !imageError ? (
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <svg className="w-16 h-16 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
        )}

        {/* Price badge */}
        {vehicle.price && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
            <span className="font-bold text-primary-700">{vehicle.price}</span>
          </div>
        )}

        {/* Featured */}
        {vehicle.featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-md text-xs font-bold">
            Featured
          </div>
        )}
      </div>

      {/* Info */}
      <div className={compact ? 'p-4' : 'p-5'}>
        <h3 className={`font-bold text-slate-900 ${compact ? 'text-lg' : 'text-xl'} mb-1`}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        {vehicle.trim && <p className="text-slate-500 text-sm mb-3">{vehicle.trim}</p>}
        
        <div className="flex items-center justify-between">
          {vehicle.mileage && (
            <span className="text-xs text-slate-500">{vehicle.mileage} km</span>
          )}
          <Link href="/apply">
            <Button variant="primary" size={compact ? 'sm' : 'md'}>
              Inquire
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
