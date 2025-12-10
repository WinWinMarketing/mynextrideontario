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
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary-300/30 to-transparent rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl"
            />
          </div>

          <div className="container mx-auto px-4 py-20 relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="max-w-4xl mx-auto text-center"
            >
              {/* Badge */}
              <motion.div variants={fadeInUp} className="mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-accent/20 text-primary-900 font-medium text-sm">
                  <span className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" />
                  17 Lenders • All Credit Types Welcome
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                Find Your{' '}
                <span className="gradient-text">Next Ride</span>
                <br />
                in Ontario
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto leading-relaxed"
              >
                We don&apos;t show inventory—we find <strong>your perfect match</strong>. 
                Fill out our quick application and we&apos;ll connect you with the right 
                vehicle and financing from our network of dealers and lenders.
              </motion.p>

              {/* Key Promise */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap justify-center gap-4 mb-10"
              >
                <div className="flex items-center gap-2 text-sm text-muted">
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All Makes & Models
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Response Within 24 Hours
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  No Obligation
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link href="/apply">
                  <Button size="lg" variant="accent" className="text-lg px-8 py-4">
                    Start Your Application
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
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
            <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">
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
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                },
                {
                  step: '02',
                  title: 'We Find Your Match',
                  description: 'Our team searches our network of dealers and 17 lenders to find vehicles and financing that fit your situation.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ),
                },
                {
                  step: '03',
                  title: 'Get Approved & Drive',
                  description: 'Review your options, get approved, and drive away in your new vehicle. It&apos;s that simple.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <Card hover className="h-full text-center p-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 mb-6">
                      {item.icon}
                    </div>
                    <div className="text-5xl font-bold text-primary-100 mb-2">{item.step}</div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted">{item.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Showcase Section */}
        <ShowcaseSection />

        {/* Credit Profiles Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-transparent to-primary-100/50">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                All <span className="gradient-text">Credit Types</span> Welcome
              </h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                We work with 17 different lenders including prime, near-prime, and non-prime, 
                giving us high approval odds for a wide range of credit profiles.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Excellent',
                  subtitle: 'Prime',
                  description: 'Best rates and terms available',
                  color: 'bg-success/10 border-success/30 text-success',
                },
                {
                  title: 'Good',
                  subtitle: 'Prime',
                  description: 'Great options with competitive rates',
                  color: 'bg-info/10 border-info/30 text-info',
                },
                {
                  title: 'Fair',
                  subtitle: 'Near-Prime',
                  description: 'Many options available',
                  color: 'bg-warning/10 border-warning/30 text-warning',
                },
                {
                  title: 'Poor',
                  subtitle: 'Non-Prime',
                  description: 'We can still help you get approved',
                  color: 'bg-primary-500/10 border-primary-500/30 text-primary-700',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className={`h-full text-center p-6 border-2 ${item.color}`}>
                    <h3 className="text-2xl font-bold mb-1">{item.title}</h3>
                    <p className="text-sm font-medium opacity-80 mb-3">{item.subtitle}</p>
                    <p className="text-muted text-sm">{item.description}</p>
                  </Card>
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
              <Card variant="glass" className="inline-block px-8 py-4">
                <p className="text-lg">
                  <span className="font-bold text-primary-900">17 Lenders</span>
                  <span className="text-muted"> • High Approval Rates • Quick Decisions</span>
                </p>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Service Area Map Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Example <span className="gradient-text">Service Area</span>
              </h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                This map shows an example of our primary service area in the Greater Toronto Area. 
                <strong> This is not a strict limit</strong>—contact us even if you&apos;re outside this zone.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-2">
                <GoogleMap />
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-6 mt-8"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-success" />
                <span className="text-sm text-muted">Within Service Area (e.g., Oshawa)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-error" />
                <span className="text-sm text-muted">Outside Service Area (e.g., Brampton)</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="text-center p-8 md:p-12 glass-dark text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Find Your Next Ride?
                </h2>
                <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
                  Complete our quick application and we&apos;ll be in touch within 24 hours 
                  with vehicle and financing options tailored to your needs.
                </p>
                <Link href="/apply">
                  <Button size="lg" variant="accent" className="text-lg px-8 py-4">
                    Start Your Application Now
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-primary-100">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-muted text-sm">
              © {new Date().getFullYear()} My Next Ride Ontario. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
