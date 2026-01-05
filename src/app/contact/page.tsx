'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Logo } from '@/components/Logo';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="group">
            <Logo size="md" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900">Our Mission</Link>
            <Link href="/contact" className="text-sm font-medium text-primary-600">Contact</Link>
            <Link href="/apply">
              <Button variant="primary" size="sm">Apply Now</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">
              Get In <span className="text-primary-600">Touch</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Have questions? We&apos;re here to help. Reach out and we&apos;ll get back to you within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Email Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Email Us</h3>
              <p className="text-slate-600 mb-4">
                Send us an email and we&apos;ll respond within 24 hours.
              </p>
              <a 
                href="mailto:info@mynextrideontario.com" 
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                info@mynextrideontario.com
              </a>
            </motion.div>

            {/* Location Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Service Area</h3>
              <p className="text-slate-600 mb-4">
                We proudly serve the Greater Toronto Area and surrounding regions.
              </p>
              <span className="text-slate-800 font-semibold">
                GTA & Durham Region
              </span>
            </motion.div>
          </div>

          {/* Quick Apply CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-10 text-center text-white"
          >
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-primary-100 mb-6 max-w-lg mx-auto">
              The fastest way to find your next vehicle is to fill out our quick application. 
              We&apos;ll review it and get back to you within 24 hours with personalized options.
            </p>
            <Link href="/apply">
              <Button size="lg" variant="accent" className="px-10 py-5 text-lg">
                Start Your Application
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: 'How long does the process take?',
                a: 'We respond to all applications within 24 hours. From there, getting approved and into your vehicle can take as little as a few days depending on your situation.',
              },
              {
                q: 'What credit score do I need?',
                a: 'We work with all credit types—excellent, good, fair, and poor. With 17 different lenders in our network, we can find options for almost anyone.',
              },
              {
                q: 'Is there a fee for your service?',
                a: 'Our service is completely free to you. We\'re compensated by the dealerships when we help connect you with a vehicle.',
              },
              {
                q: 'What areas do you serve?',
                a: 'We primarily serve the Greater Toronto Area including Toronto, Mississauga, Vaughan, Markham, Richmond Hill, Oakville, Ajax, Pickering, Whitby, Oshawa, and more. Note: We currently do not service Brampton.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" className="[&_span]:text-white [&_span]:!text-slate-400" />
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/about" className="text-slate-400 hover:text-white text-sm">Our Mission</Link>
            <Link href="/contact" className="text-slate-400 hover:text-white text-sm">Contact</Link>
            <Link href="/apply" className="text-slate-400 hover:text-white text-sm">Apply</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
