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
      
      {/* Background that flows from loading screen */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-100">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-primary-200/40 to-transparent rounded-full blur-[100px]" />
          <div className="absolute bottom-0 -right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-primary-300/30 to-transparent rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-accent/10 to-primary-200/20 rounded-full blur-[60px]" />
        </div>
      </div>
      
      <main className="min-h-screen relative">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="container mx-auto px-4 py-20 relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="max-w-4xl mx-auto text-center"
            >
              {/* Badge */}
              <motion.div variants={fadeInUp} className="mb-6">
                <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary-100 text-primary-800 font-medium text-sm shadow-lg shadow-primary-100/20">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                  17 Lenders • All Credit Types Welcome
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-slate-900"
              >
                Find Your{' '}
                <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Next Ride</span>
                <br />
                in Ontario
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed"
              >
                We don&apos;t show inventory—we find <strong className="text-slate-800">your perfect match</strong>. 
                Fill out our quick application and we&apos;ll connect you with the right 
                vehicle and financing from our network of dealers and lenders.
              </motion.p>

              {/* Key Promise */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap justify-center gap-4 mb-10"
              >
                {[
                  'All Makes & Models',
                  'Response Within 24 Hours',
                  'No Obligation',
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-slate-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-100">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
                  <Button size="lg" variant="primary" className="text-lg px-8 py-4 shadow-xl shadow-primary-500/30">
                    Start Your Application
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="ghost" className="text-lg px-8 py-4">
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
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex items-start justify-center p-1">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-3 bg-slate-400 rounded-full"
              />
            </div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-4 relative">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                How It <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Works</span>
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
                  <div className="group h-full bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 p-8 hover:shadow-2xl hover:shadow-primary-200/30 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/30">
                        {item.icon}
                      </div>
                      <span className="text-5xl font-bold text-slate-100 group-hover:text-primary-100 transition-colors">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-slate-900">{item.title}</h3>
                    <p className="text-slate-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Showcase Section */}
        <ShowcaseSection />

        {/* Credit Profiles Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                All <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Credit Types</span> Welcome
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                We work with 17 different lenders including prime, near-prime, and non-prime, 
                giving us high approval odds for a wide range of credit profiles.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Excellent', subtitle: 'Prime', description: 'Best rates and terms available', color: 'from-green-500 to-emerald-600', bg: 'bg-green-50' },
                { title: 'Good', subtitle: 'Prime', description: 'Great options with competitive rates', color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50' },
                { title: 'Fair', subtitle: 'Near-Prime', description: 'Many options available', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
                { title: 'Poor', subtitle: 'Non-Prime', description: 'We can still help you get approved', color: 'from-primary-500 to-primary-600', bg: 'bg-primary-50' },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`h-full text-center p-6 rounded-2xl ${item.bg} border border-white/50 shadow-lg`}>
                    <div className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${item.color} text-white text-xs font-semibold mb-4`}>
                      {item.subtitle}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm">{item.description}</p>
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
              <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-8 py-4 rounded-2xl border border-slate-100 shadow-lg">
                <span className="font-bold text-slate-900">17 Lenders</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-slate-600">High Approval Rates</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-slate-600">Quick Decisions</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Service Area Map Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                Example <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Service Area</span>
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                This map shows an example of our primary service area in the Greater Toronto Area. 
                <strong className="text-slate-800"> This is not a strict limit</strong>—contact us even if you&apos;re outside this zone.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl overflow-hidden">
                <GoogleMap />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-6 mt-8"
            >
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-100">
                <span className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-sm text-slate-600">Within Service Area (e.g., Oshawa)</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-100">
                <span className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-sm text-slate-600">Outside Service Area (e.g., Brampton)</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative overflow-hidden text-center p-10 md:p-16 rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 shadow-2xl shadow-primary-900/30">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
                  <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-primary-400/10 rounded-full blur-3xl" />
                </div>
                <div className="relative">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                    Ready to Find Your Next Ride?
                  </h2>
                  <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
                    Complete our quick application and we&apos;ll be in touch within 24 hours 
                    with vehicle and financing options tailored to your needs.
                  </p>
                  <Link href="/apply">
                    <Button size="lg" variant="accent" className="text-lg px-8 py-4 shadow-xl">
                      Start Your Application Now
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-slate-200/50">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} My Next Ride Ontario. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
