'use client';

import { motion, AnimatePresence } from 'framer-motion';
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

  // Auto-advance carousel on desktop
  useEffect(() => {
    if (vehicles.length <= 3 || isMobile) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, vehicles.length - 2));
    }, 6000);
    return () => clearInterval(timer);
  }, [vehicles.length, isMobile]);

  const next = () => {
    if (isMobile) {
      setCurrentIndex((prev) => Math.min(prev + 1, vehicles.length - 1));
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, Math.max(0, vehicles.length - 3)));
    }
  };

  const prev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  // HIDE SECTION COMPLETELY if no vehicles
  if (!isLoading && vehicles.length === 0) {
    return null;
  }

  // Still loading
  if (isLoading) {
    return null;
  }

  const cardWidth = isMobile ? 300 : 380;
  const gap = 24;
  const visibleCards = isMobile ? 1 : 3;
  const maxIndex = Math.max(0, vehicles.length - visibleCards);

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white via-slate-50/50 to-white overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">
            Featured <span className="text-primary-600">Vehicles</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Examples of the quality vehicles we can help you find. Contact us to learn more about any of these options.
          </p>
        </motion.div>

        <div className="relative" ref={containerRef}>
          {/* Desktop: 3-wide carousel */}
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
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <VehicleCard vehicle={vehicle} />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Navigation Arrows */}
          {vehicles.length > visibleCards && (
            <>
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-14 h-14 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary-600 hover:border-primary-300 hover:shadow-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={next}
                disabled={currentIndex >= maxIndex}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-14 h-14 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary-600 hover:border-primary-300 hover:shadow-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Dots */}
          {vehicles.length > visibleCards && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-10 bg-primary-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function VehicleCard({ vehicle }: { vehicle: ShowcaseVehicle }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-xl hover:shadow-2xl overflow-hidden h-full"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        {vehicle.imageUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            )}
            <img
              src={vehicle.imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <svg className="w-20 h-20 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
        )}

        {/* Price badge */}
        {vehicle.price && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
            <span className="font-bold text-primary-700 text-lg">{vehicle.price}</span>
          </div>
        )}

        {/* Featured badge */}
        {vehicle.featured && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
            ★ Featured
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6">
        <h3 className="font-bold text-xl text-slate-900 mb-1">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        {vehicle.trim && (
          <p className="text-slate-500 text-sm mb-4">{vehicle.trim}</p>
        )}
        
        <div className="flex items-center justify-between">
          {vehicle.mileage && (
            <span className="text-sm text-slate-400">{vehicle.mileage}</span>
          )}
          <Link href="/apply">
            <Button variant="primary" size="md">
              Contact Us
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
