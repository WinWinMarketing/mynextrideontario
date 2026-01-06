'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export function ServiceArea() {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  
  const cities = {
    served: [
      { name: 'Toronto', position: { x: 48, y: 52 }, size: 'lg' },
      { name: 'Mississauga', position: { x: 38, y: 55 }, size: 'md' },
      { name: 'Vaughan', position: { x: 47, y: 42 }, size: 'md' },
      { name: 'Markham', position: { x: 58, y: 45 }, size: 'md' },
      { name: 'Richmond Hill', position: { x: 52, y: 38 }, size: 'sm' },
      { name: 'Aurora', position: { x: 54, y: 30 }, size: 'sm' },
      { name: 'Newmarket', position: { x: 56, y: 24 }, size: 'sm' },
      { name: 'Pickering', position: { x: 68, y: 52 }, size: 'sm' },
      { name: 'Ajax', position: { x: 75, y: 50 }, size: 'sm' },
      { name: 'Whitby', position: { x: 82, y: 48 }, size: 'sm' },
      { name: 'Oshawa', position: { x: 88, y: 45 }, size: 'md' },
      { name: 'Oakville', position: { x: 32, y: 62 }, size: 'sm' },
      { name: 'Burlington', position: { x: 24, y: 65 }, size: 'sm' },
      { name: 'East Gwillimbury', position: { x: 50, y: 18 }, size: 'sm' },
      { name: 'Whitchurch-Stouffville', position: { x: 65, y: 35 }, size: 'sm' },
      { name: 'Uxbridge', position: { x: 78, y: 30 }, size: 'sm' },
    ],
    excluded: [
      { name: 'Brampton', position: { x: 32, y: 45 } },
    ],
  };

  const sizeClasses = {
    lg: 'w-5 h-5',
    md: 'w-4 h-4',
    sm: 'w-3 h-3',
  };

  return (
    <div className="relative">
      {/* Main Container with Glass Effect */}
      <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50">
        
        {/* Header Section */}
        <div className="relative px-8 py-10 border-b border-slate-700/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-accent/10" />
          <div className="relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 rounded-full border border-primary-400/30 mb-4"
            >
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <span className="text-primary-300 text-sm font-medium">Greater Toronto Area & Beyond</span>
            </motion.div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Our <span className="bg-gradient-to-r from-primary-400 to-accent bg-clip-text text-transparent">Service Coverage</span>
            </h3>
            <p className="text-slate-400 max-w-xl mx-auto">
              Proudly serving the GTA and surrounding regions with personalized vehicle matching services
            </p>
          </div>
        </div>

        {/* Interactive Map Section */}
        <div className="relative px-8 py-10">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Decorative Glow Elements */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Map Container */}
          <div className="relative aspect-[16/9] max-w-4xl mx-auto">
            {/* Lake Ontario Shape */}
            <svg 
              viewBox="0 0 100 100" 
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Water/Lake Gradient */}
              <defs>
                <linearGradient id="lakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.15 }} />
                  <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.08 }} />
                </linearGradient>
                <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#1e293b', stopOpacity: 0.5 }} />
                  <stop offset="100%" style={{ stopColor: '#334155', stopOpacity: 0.3 }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Lake Ontario (simplified southern portion) */}
              <path
                d="M 0 75 Q 20 70, 45 72 Q 65 74, 80 68 Q 90 65, 100 70 L 100 100 L 0 100 Z"
                fill="url(#lakeGradient)"
                className="transition-all duration-500"
              />
              
              {/* Land Mass Outline */}
              <path
                d="M 0 75 Q 20 70, 45 72 Q 65 74, 80 68 Q 90 65, 100 70 L 100 0 L 0 0 Z"
                fill="url(#landGradient)"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="0.5"
              />

              {/* Service Area Boundary Circle */}
              <circle
                cx="50"
                cy="45"
                r="38"
                fill="none"
                stroke="rgba(34, 197, 94, 0.15)"
                strokeWidth="0.5"
                strokeDasharray="4 2"
              />
              <circle
                cx="50"
                cy="45"
                r="30"
                fill="none"
                stroke="rgba(34, 197, 94, 0.1)"
                strokeWidth="0.5"
                strokeDasharray="2 3"
              />
            </svg>

            {/* City Dots - Served */}
            {cities.served.map((city, index) => (
              <motion.div
                key={city.name}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${city.position.x}%`, top: `${city.position.y}%` }}
                onMouseEnter={() => setHoveredCity(city.name)}
                onMouseLeave={() => setHoveredCity(null)}
              >
                {/* Pulse Ring */}
                <motion.div
                  animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                  className={`absolute inset-0 bg-green-400/30 rounded-full ${sizeClasses[city.size as keyof typeof sizeClasses]}`}
                />
                
                {/* Main Dot */}
                <div className={`relative ${sizeClasses[city.size as keyof typeof sizeClasses]} rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30 group-hover:scale-125 transition-transform duration-200`}>
                  <div className="absolute inset-0.5 rounded-full bg-green-400/50" />
                </div>

                {/* Tooltip */}
                <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-xl whitespace-nowrap transition-all duration-200 z-20 ${
                  hoveredCity === city.name ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white text-sm font-medium">{city.name}</span>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800/95" />
                </div>
              </motion.div>
            ))}

            {/* City Dots - Excluded */}
            {cities.excluded.map((city, index) => (
              <motion.div
                key={city.name}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (cities.served.length + index) * 0.05, type: 'spring', stiffness: 200 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${city.position.x}%`, top: `${city.position.y}%` }}
                onMouseEnter={() => setHoveredCity(city.name)}
                onMouseLeave={() => setHoveredCity(null)}
              >
                {/* X Mark */}
                <div className="relative w-4 h-4 group-hover:scale-125 transition-transform duration-200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400 drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>

                {/* Tooltip */}
                <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-xl whitespace-nowrap transition-all duration-200 z-20 ${
                  hoveredCity === city.name ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-white text-sm font-medium">{city.name}</span>
                    <span className="text-slate-400 text-xs">(Not serviced)</span>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800/95" />
                </div>
              </motion.div>
            ))}

            {/* Lake Ontario Label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-cyan-400/60 text-xs font-medium tracking-wide uppercase flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                Lake Ontario
              </motion.div>
            </div>
          </div>
        </div>

        {/* City List Section */}
        <div className="px-8 pb-10">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Served Cities */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center border border-green-400/30">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Cities We Serve</h4>
                  <p className="text-xs text-slate-400">{cities.served.length} locations</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {cities.served.map((city, index) => (
                  <motion.div
                    key={city.name}
                    initial={{ opacity: 0, y: 5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group cursor-default"
                    onMouseEnter={() => setHoveredCity(city.name)}
                    onMouseLeave={() => setHoveredCity(null)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:scale-125 transition-transform" />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{city.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Not Served + Contact */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {/* Not Served */}
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400/20 to-rose-500/20 flex items-center justify-center border border-red-400/30">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Currently Not Serviced</h4>
                    <p className="text-xs text-slate-400">{cities.excluded.length} location</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cities.excluded.map((city) => (
                    <div
                      key={city.name}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span className="text-sm text-red-300">{city.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outside Service Area CTA */}
              <div className="bg-gradient-to-br from-primary-500/10 via-primary-600/5 to-accent/10 rounded-2xl p-6 border border-primary-400/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400/20 to-accent/20 flex items-center justify-center border border-primary-400/30 flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Outside Our Service Area?</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Don't worry! Contact us anyway—we can often still help connect you with the right vehicle and financing options.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
