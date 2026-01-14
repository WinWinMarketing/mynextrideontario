'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Logo } from '@/components/Logo';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="group">
            <Logo size="md" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium text-primary-600">Our Mission</Link>
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900">Contact</Link>
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
              Our <span className="text-primary-600">Mission</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              We believe everyone deserves a reliable vehicle, regardless of their credit history. 
              Our mission is to make car buying accessible, stress-free, and personalized.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-slate-900">Our Story</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  My Next Ride Ontario was founded with a simple belief: finding your next vehicle 
                  shouldn&apos;t be stressful or complicated. We saw too many people struggling to 
                  navigate the complex world of auto financing, especially those with less-than-perfect credit.
                </p>
                <p>
                  Instead of showing you a confusing inventory, we take a different approach. 
                  We listen to your needs, understand your financial situation, and then search 
                  through our extensive network of dealers and lenders to find options that actually work for you.
                </p>
                <p>
                  With access to 17 different lenders—from prime to non-prime—we can help almost anyone 
                  get into the vehicle they need. It&apos;s not about pushing inventory; it&apos;s about finding your perfect match.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-6"
            >
              {[
                { number: '17', label: 'Partner Lenders' },
                { number: '24h', label: 'Response Time' },
                { number: '0', label: 'Hidden Fees' },
                { number: 'All', label: 'Credit Types' },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                  <div className="text-4xl font-bold text-primary-600 mb-2">{stat.number}</div>
                  <div className="text-slate-600 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4 text-slate-900">What We Stand For</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Our values guide everything we do, from how we interact with clients to how we build our network.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Personalized Service',
                description: 'Every client is unique. We take the time to understand your specific needs and find solutions that fit your situation.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                title: 'Transparency',
                description: 'No hidden fees, no pressure tactics. We\'re upfront about our process and will always give you honest advice.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
              },
              {
                title: 'Results',
                description: 'Our success is measured by yours. We don\'t rest until we\'ve found you the best possible option.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 border border-slate-100 shadow-lg"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{value.title}</h3>
                <p className="text-slate-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary-900 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Find Your Next Ride?
            </h2>
            <p className="text-primary-100/80 text-lg mb-8">
              Let us help you get into the vehicle you need. No pressure, no obligation—just honest help.
            </p>
            <Link href="/apply">
              <Button size="lg" variant="accent" className="px-10 py-5 text-lg">
                Start Your Application
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size="sm" className="[&_span]:text-white [&_span]:!text-slate-400" />
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} All rights reserved.
            </p>
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
