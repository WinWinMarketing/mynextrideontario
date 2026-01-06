'use client';

import { motion } from 'framer-motion';

export function ServiceArea() {
  const cities = {
    served: [
      'Toronto',
      'Mississauga',
      'Vaughan',
      'Markham',
      'Richmond Hill',
      'Aurora',
      'Newmarket',
      'Pickering',
      'Ajax',
      'Whitby',
      'Oshawa',
      'Oakville',
      'Burlington',
      'East Gwillimbury',
      'Whitchurch-Stouffville',
      'Uxbridge',
    ],
    excluded: ['Brampton'],
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Greater Toronto Area & Surrounding Regions</h3>
          <p className="text-slate-600">We proudly serve the following communities across Ontario</p>
        </div>

        {/* Cities We Serve */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <h4 className="font-semibold text-slate-900">Cities We Serve</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cities.served.map((city, index) => (
              <motion.div
                key={city}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-slate-800">{city}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cities We Don't Serve */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <h4 className="font-semibold text-slate-900">Currently Not Serviced</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cities.excluded.map((city, index) => (
              <motion.div
                key={city}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (cities.served.length * 0.03) + (index * 0.03) }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm font-medium text-slate-800">{city}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Note */}
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 text-center">
          <p className="text-base text-primary-900">
            <strong>Outside our service area?</strong> Contact us anyway—we can often still help!
          </p>
        </div>
      </div>
    </div>
  );
}

