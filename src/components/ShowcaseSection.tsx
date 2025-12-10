'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui';
import { ShowcaseVehicle } from '@/lib/validation';
import Link from 'next/link';

export function ShowcaseSection() {
  const [vehicles, setVehicles] = useState<ShowcaseVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

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

  // Auto-advance
  useEffect(() => {
    if (vehicles.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % vehicles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [vehicles.length]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % vehicles.length);
  }, [vehicles.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + vehicles.length) % vehicles.length);
  }, [vehicles.length]);

  if (!isLoading && vehicles.length === 0) {
    return null;
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 600 : -600, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 600 : -600, opacity: 0 }),
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">
            Featured <span className="text-primary-600">Vehicles</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Examples of the quality vehicles we can help you find.
            Don&apos;t see what you want? We&apos;ll source it for you!
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="relative">
            {/* Main carousel */}
            <div className="relative h-[450px] md:h-[500px] flex items-center justify-center">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute w-full max-w-2xl px-4"
                >
                  <VehicleCard vehicle={vehicles[currentIndex]} />
                </motion.div>
              </AnimatePresence>

              {/* Navigation arrows */}
              {vehicles.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 md:left-8 z-10 w-12 h-12 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary-600 hover:border-primary-300 transition-all hover:scale-110"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 md:right-8 z-10 w-12 h-12 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary-600 hover:border-primary-300 transition-all hover:scale-110"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Dots */}
            {vehicles.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {vehicles.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDirection(i > currentIndex ? 1 : -1);
                      setCurrentIndex(i);
                    }}
                    className={`h-2.5 rounded-full transition-all ${
                      i === currentIndex ? 'w-8 bg-primary-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function VehicleCard({ vehicle }: { vehicle: ShowcaseVehicle }) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container - fixed 16:9 aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {vehicle.imageUrl && !imageError ? (
          <motion.img
            src={vehicle.imageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <svg className="w-20 h-20 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Price badge */}
        {vehicle.price && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
            <span className="font-bold text-lg text-primary-700">{vehicle.price}</span>
          </div>
        )}

        {/* Featured badge */}
        {vehicle.featured && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
            ⭐ Featured
          </div>
        )}

        {/* Vehicle info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="text-2xl md:text-3xl font-bold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.trim && <p className="text-white/80 text-lg mt-1">{vehicle.trim}</p>}
        </div>
      </div>

      {/* Bottom section */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-slate-500">
          {vehicle.mileage && (
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {vehicle.mileage}
            </div>
          )}
        </div>
        <Link href="/apply">
          <Button variant="primary" className="group">
            Inquire Now
            <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
        </Link>
      </div>
    </div>
  );
}
