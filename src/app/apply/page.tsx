'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button, Input, Select, FileUpload } from '@/components/ui';
import {
  leadApplicationSchema,
  LeadApplicationData,
  urgencyOptions,
  vehicleTypeOptions,
  financeBudgetOptions,
  cashBudgetOptions,
  creditRatingOptions,
  bestTimeOptions,
  licenseClassOptions,
} from '@/lib/validation';

export default function ApplyPage() {
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadApplicationData>({
    resolver: zodResolver(leadApplicationSchema),
    mode: 'onChange',
  });

  const paymentType = watch('paymentType');
  const tradeIn = watch('tradeIn');
  const cosigner = watch('cosigner');

  const onSubmit = async (data: LeadApplicationData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      if (licenseFile) {
        formData.append('license', licenseFile);
      }

      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      setIsSuccess(true);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Application Submitted!</h1>
          <p className="text-lg text-slate-600 mb-8">
            Thank you! We'll review your application and contact you within <strong>24 hours</strong>.
          </p>
          <Link href="/">
            <Button variant="primary" size="lg">Back to Home</Button>
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <span className="font-semibold text-slate-900">My Next Ride Ontario</span>
          </Link>
          <span className="text-sm text-slate-500">Vehicle Application</span>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Your Perfect Vehicle</h1>
          <p className="text-slate-600">Complete the form below and we'll match you with the right vehicle and financing.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Vehicle Preferences */}
          <Section title="Vehicle Preferences" description="Tell us what you're looking for">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  When do you need your vehicle? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {urgencyOptions.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center text-sm ${
                        watch('urgency') === opt.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input type="radio" value={opt.value} {...register('urgency')} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.urgency && <p className="text-red-500 text-sm mt-1">{errors.urgency.message}</p>}
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {vehicleTypeOptions.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center text-sm ${
                        watch('vehicleType') === opt.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input type="radio" value={opt.value} {...register('vehicleType')} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {errors.vehicleType && <p className="text-red-500 text-sm mt-1">{errors.vehicleType.message}</p>}
              </div>
            </div>

            {/* Payment Type */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                How would you like to pay? <span className="text-red-500">*</span>
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentType === 'finance'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" value="finance" {...register('paymentType')} className="sr-only" />
                  <div className="font-semibold text-slate-900 mb-1">Finance</div>
                  <p className="text-sm text-slate-500">Monthly payments with approved financing</p>
                </label>
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentType === 'cash'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" value="cash" {...register('paymentType')} className="sr-only" />
                  <div className="font-semibold text-slate-900 mb-1">Cash</div>
                  <p className="text-sm text-slate-500">Pay the full amount upfront</p>
                </label>
              </div>
              {errors.paymentType && <p className="text-red-500 text-sm mt-1">{errors.paymentType.message}</p>}
            </div>

            {/* Conditional Budget & Credit */}
            {paymentType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 grid md:grid-cols-2 gap-6"
              >
                {paymentType === 'finance' ? (
                  <>
                    <Select
                      label="Monthly Budget"
                      options={financeBudgetOptions}
                      error={errors.financeBudget?.message}
                      required
                      {...register('financeBudget')}
                    />
                    <Select
                      label="Credit Rating"
                      options={creditRatingOptions}
                      error={errors.creditRating?.message}
                      required
                      {...register('creditRating')}
                    />
                  </>
                ) : (
                  <Select
                    label="Cash Budget"
                    options={cashBudgetOptions}
                    error={errors.cashBudget?.message}
                    required
                    {...register('cashBudget')}
                  />
                )}
              </motion.div>
            )}
          </Section>

          {/* Contact Information */}
          <Section title="Contact Information" description="How can we reach you?">
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                placeholder="John Smith"
                error={errors.fullName?.message}
                required
                {...register('fullName')}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="(416) 555-0123"
                error={errors.phone?.message}
                required
                {...register('phone')}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                error={errors.email?.message}
                required
                {...register('email')}
              />
              <Input
                label="Date of Birth"
                type="date"
                error={errors.dateOfBirth?.message}
                required
                {...register('dateOfBirth')}
              />
              <Select
                label="Best Time to Reach"
                options={bestTimeOptions}
                error={errors.bestTimeToReach?.message}
                required
                {...register('bestTimeToReach')}
              />
              <Select
                label="License Class"
                options={licenseClassOptions}
                error={errors.licenseClass?.message}
                required
                {...register('licenseClass')}
              />
            </div>
          </Section>

          {/* Trade-In */}
          <Section title="Trade-In" description="Do you have a vehicle to trade?">
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unsure', label: 'Not Sure' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                    tradeIn === opt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" value={opt.value} {...register('tradeIn')} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
            {errors.tradeIn && <p className="text-red-500 text-sm mb-4">{errors.tradeIn.message}</p>}

            {(tradeIn === 'yes' || tradeIn === 'unsure') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl"
              >
                <Input
                  label="Year"
                  placeholder="2020"
                  error={errors.tradeInYear?.message}
                  {...register('tradeInYear')}
                />
                <Input
                  label="Make"
                  placeholder="Toyota"
                  error={errors.tradeInMake?.message}
                  {...register('tradeInMake')}
                />
                <Input
                  label="Model"
                  placeholder="Camry"
                  error={errors.tradeInModel?.message}
                  {...register('tradeInModel')}
                />
                <Input
                  label="Mileage"
                  placeholder="50,000"
                  {...register('tradeInMileage')}
                />
              </motion.div>
            )}
          </Section>

          {/* Driver's License */}
          <Section title="Driver's License" description="Upload a photo of your license (optional)">
            <FileUpload
              accept="image/*"
              maxSize={10 * 1024 * 1024}
              onFileSelect={setLicenseFile}
              selectedFile={licenseFile}
              onClear={() => setLicenseFile(null)}
            />
          </Section>

          {/* Cosigner */}
          <Section title="Cosigner" description="Will you have a cosigner?">
            <div className="grid grid-cols-2 gap-3 mb-6 max-w-xs">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                    cosigner === opt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" value={opt.value} {...register('cosigner')} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
            {errors.cosigner && <p className="text-red-500 text-sm mb-4">{errors.cosigner.message}</p>}

            {cosigner === 'yes' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl"
              >
                <Input
                  label="Cosigner Full Name"
                  placeholder="Jane Smith"
                  error={errors.cosignerFullName?.message}
                  required
                  {...register('cosignerFullName')}
                />
                <Input
                  label="Cosigner Phone"
                  type="tel"
                  placeholder="(416) 555-0124"
                  error={errors.cosignerPhone?.message}
                  required
                  {...register('cosignerPhone')}
                />
                <Input
                  label="Cosigner Email"
                  type="email"
                  placeholder="jane@example.com"
                  error={errors.cosignerEmail?.message}
                  required
                  {...register('cosignerEmail')}
                />
                <Input
                  label="Cosigner DOB"
                  type="date"
                  {...register('cosignerDateOfBirth')}
                />
              </motion.div>
            )}
          </Section>

          {/* Submit */}
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              We'll respond within <strong>24 hours</strong>
            </p>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

// Section Component
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      {children}
    </section>
  );
}
