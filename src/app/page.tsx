'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { LoadingScreen } from '@/components/LoadingScreen';
import { GoogleMap } from '@/components/GoogleMap';
import { ShowcaseSection } from '@/components/ShowcaseSection';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  return (
    <>
      <LoadingScreen />
      
      <main className="min-h-screen">
        {/* Hero Section - Dark blue gradient matching loading screen */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900">
          {/* Animated background effects */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[120px]"
            />
            <motion.div
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px]"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-400/10 rounded-full blur-[150px]"
            />
          </div>

          <div className="container mx-auto px-6 py-20 relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="max-w-4xl mx-auto text-center"
            >
              {/* Badge */}
              <motion.div variants={fadeInUp} className="mb-8">
                <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-3 animate-pulse" />
                  17 Lenders • All Credit Types Welcome
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white"
              >
                Find Your{' '}
                <span className="bg-gradient-to-r from-primary-300 via-primary-200 to-accent bg-clip-text text-transparent">
                  Next Ride
                </span>
                <br />
                in Ontario
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-primary-100/80 mb-10 max-w-2xl mx-auto leading-relaxed"
              >
                We don&apos;t show inventory—we find <strong className="text-white">your perfect match</strong>. 
                Fill out our quick application and we&apos;ll connect you with the right 
                vehicle and financing from our network of dealers and lenders.
              </motion.p>

              {/* Key Promise */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap justify-center gap-4 mb-12"
              >
                {[
                  'All Makes & Models',
                  'Response Within 24 Hours',
                  'No Obligation',
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-primary-100/70 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {text}
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link href="/apply">
                  <Button size="lg" variant="accent" className="text-lg px-10 py-5 shadow-2xl shadow-accent/30 hover:shadow-accent/50 transition-shadow">
                    Start Your Application
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="ghost" className="text-lg px-10 py-5 text-white border-white/20 hover:bg-white/10">
                    Learn More
                  </Button>
                </a>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-3 bg-white/50 rounded-full"
              />
            </div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">
                How It <span className="text-primary-600">Works</span>
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Getting into your next vehicle is simple. We handle the hard work so you don&apos;t have to.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Tell Us Your Needs',
                  description: 'Complete our simple application form with your vehicle preferences, budget, and contact information.',
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                },
                {
                  step: '02',
                  title: 'We Find Your Match',
                  description: 'Our team searches our network of dealers and 17 lenders to find vehicles and financing that fit your situation.',
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ),
                },
                {
                  step: '03',
                  title: 'Get Approved & Drive',
                  description: 'Review your options, get approved, and drive away in your new vehicle. It&apos;s that simple.',
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div className="group h-full bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 hover:shadow-2xl hover:border-primary-100 transition-all duration-300 hover:-translate-y-2">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary-500/30">
                        {item.icon}
                      </div>
                      <span className="text-6xl font-bold text-slate-100 group-hover:text-primary-100 transition-colors">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">{item.title}</h3>
                    <p className="text-slate-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Showcase Section */}
        <ShowcaseSection />

        {/* Credit Profiles Section - Dynamic */}
        <section className="py-24 px-6 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
          {/* Subtle animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-64 h-64 rounded-full blur-3xl"
                style={{
                  background: `radial-gradient(circle, ${['rgba(34,197,94,0.08)', 'rgba(59,130,246,0.08)', 'rgba(251,191,36,0.08)', 'rgba(99,102,241,0.08)'][i % 4]}, transparent)`,
                  top: `${20 + i * 15}%`,
                  left: `${10 + i * 20}%`,
                }}
                animate={{
                  x: [0, 30, 0],
                  y: [0, -20, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 10 + i * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">
                All <span className="text-primary-600">Credit Types</span> Welcome
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                We work with 17 different lenders including prime, near-prime, and non-prime, 
                giving us high approval odds for a wide range of credit profiles.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Excellent', subtitle: 'Prime', description: 'Best rates and terms available', gradient: 'from-emerald-500 to-green-600', iconColor: 'text-emerald-600', icon: '🌟' },
                { title: 'Good', subtitle: 'Prime', description: 'Great options with competitive rates', gradient: 'from-blue-500 to-cyan-600', iconColor: 'text-blue-600', icon: '✨' },
                { title: 'Fair', subtitle: 'Near-Prime', description: 'Many options available', gradient: 'from-amber-500 to-orange-600', iconColor: 'text-amber-600', icon: '💫' },
                { title: 'Poor', subtitle: 'Non-Prime', description: 'We can still help you get approved', gradient: 'from-primary-500 to-primary-700', iconColor: 'text-primary-600', icon: '🚀' },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className="relative h-full bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
                    {/* Animated gradient on hover */}
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                    />
                    
                    <div className="relative z-10">
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <div className={`inline-block px-4 py-1.5 rounded-full bg-gradient-to-r ${item.gradient} text-white text-xs font-bold mb-4 shadow-lg`}>
                        {item.subtitle}
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mt-12"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-4 bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-xl"
              >
                <span className="font-bold text-slate-900 text-lg">17 Lenders</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-slate-600">High Approval Rates</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-slate-600">Quick Decisions</span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Service Area Map Section */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">
                Our <span className="text-primary-600">Service Area</span>
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                We proudly serve the Greater Toronto Area and surrounding regions.
                <strong className="text-slate-800"> Contact us even if you&apos;re outside our main zone</strong>—we can often still help!
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                <GoogleMap />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Ready to Find Your Next Ride?
              </h2>
              <p className="text-primary-100/80 text-lg mb-10 max-w-2xl mx-auto">
                Complete our quick application and we&apos;ll be in touch within 24 hours 
                with vehicle and financing options tailored to your needs.
              </p>
              <Link href="/apply">
                <Button size="lg" variant="accent" className="text-lg px-10 py-5 shadow-2xl shadow-accent/30">
                  Start Your Application Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 bg-slate-900 border-t border-slate-800">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} My Next Ride Ontario. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
