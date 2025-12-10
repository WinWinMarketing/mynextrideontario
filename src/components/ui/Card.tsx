'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'glass' | 'solid' | 'outlined';
  hover?: boolean;
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', hover = false, children, ...props }, ref) => {
    const variants = {
      glass: 'bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl shadow-primary-900/5',
      solid: 'bg-white border border-primary-100 shadow-lg shadow-primary-900/5',
      outlined: 'bg-transparent border-2 border-primary-200',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
        transition={{ duration: 0.3 }}
        className={cn(
          'rounded-2xl p-6',
          variants[variant],
          hover && 'cursor-pointer transition-shadow hover:shadow-2xl hover:shadow-primary-900/10',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export { Card };

