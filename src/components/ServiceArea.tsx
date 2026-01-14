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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-white mb-2">Greater Toronto Area & Beyond</h3>
          <p className="text-primary-100">Proudly serving the GTA and surrounding regions</p>
        </motion.div>
      </div>

      <div className="p-8">
        {/* Cities We Serve */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Cities We Serve</h4>
              <p className="text-sm text-slate-500">{cities.served.length} locations across the GTA</p>
            </div>
          </div>
          
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {cities.served.map((city) => (
              <motion.div
                key={city}
                variants={itemVariants}
                whileHover={{ scale: 1.02, backgroundColor: '#f0fdf4' }}
                className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 transition-colors cursor-default"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">{city}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 my-8" />

        {/* Currently Not Serviced */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Currently Not Serviced</h4>
              <p className="text-sm text-slate-500">{cities.excluded.length} location</p>
            </div>
          </div>
          
          <motion.div 
            className="flex flex-wrap gap-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {cities.excluded.map((city) => (
              <motion.div
                key={city}
                variants={itemVariants}
                className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-xl border border-red-100"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-sm font-medium text-red-700">{city}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Contact Note */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 border border-primary-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Outside Our Service Area?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Do not worry! Contact us anyway, we can often still help connect you with the right vehicle and financing options.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
