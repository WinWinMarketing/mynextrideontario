'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label?: string;
  error?: string;
  hint?: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  name: string;
  required?: boolean;
  layout?: 'horizontal' | 'vertical';
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ label, error, hint, options, value, onChange, name, required, layout = 'horizontal' }, ref) => {
    return (
      <div ref={ref} className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-3">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div
          className={cn(
            'flex gap-3',
            layout === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
          )}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200',
                value === option.value
                  ? 'border-primary-500 bg-primary-50 text-primary-900'
                  : 'border-primary-100 bg-white/50 hover:border-primary-300'
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                  value === option.value
                    ? 'border-primary-500'
                    : 'border-muted-foreground'
                )}
              >
                {value === option.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                )}
              </div>
              <span className="font-medium text-sm">{option.label}</span>
            </label>
          ))}
        </div>
        {hint && !error && (
          <p className="mt-2 text-sm text-muted">{hint}</p>
        )}
        {error && (
          <p className="mt-2 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export { RadioGroup };








