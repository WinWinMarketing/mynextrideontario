'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button, Input, Select, FileUpload } from '@/components/ui';
import { Logo } from '@/components/Logo';
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

type FormStep = 1 | 2 | 3 | 4;

const STEPS = [
  { step: 1, title: 'Vehicle Preferences', desc: 'Tell us about your ideal vehicle' },
  { step: 2, title: 'Your Information', desc: 'Contact details' },
  { step: 3, title: 'Additional Details', desc: 'Trade-in & license info' },
  { step: 4, title: 'Review & Submit', desc: 'Confirm your application' },
];

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
    getValues,
  } = useForm<LeadApplicationData>({
    resolver: zodResolver(leadApplicationSchema),
    mode: 'onChange',
  });

  const paymentType = watch('paymentType');
  const tradeIn = watch('tradeIn');
  const cosigner = watch('cosigner');

  const validateStep = async (): Promise<boolean> => {
    let fields: (keyof LeadApplicationData)[] = [];
    
    switch (currentStep) {
      case 1:
        fields = ['urgency', 'vehicleType', 'paymentType'];
        if (paymentType === 'finance') fields.push('financeBudget', 'creditRating');
        if (paymentType === 'cash') fields.push('cashBudget');
        break;
      case 2:
        fields = ['fullName', 'phone', 'email', 'dateOfBirth', 'bestTimeToReach', 'licenseClass'];
        break;
      case 3:
        fields = ['tradeIn', 'cosigner'];
        if (tradeIn === 'yes' || tradeIn === 'unsure') {
          fields.push('tradeInYear', 'tradeInMake', 'tradeInModel');
        }
        if (cosigner === 'yes') {
          fields.push('cosignerFullName', 'cosignerPhone', 'cosignerEmail');
        }
        break;
    }
    
    return await trigger(fields);
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < 4) {
      setCurrentStep((currentStep + 1) as FormStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormStep);
    }
  };

  const onSubmit = async (data: LeadApplicationData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      if (licenseFile) formData.append('license', licenseFile);

      const response = await fetch('/api/submit-lead', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Submission failed');
      setIsSuccess(true);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-slate-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-primary-500/10 p-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Application Submitted!</h1>
            <p className="text-slate-600 mb-8">
              Thank you for your application. We&apos;ll review it and contact you within <strong className="text-primary-700">24 hours</strong>.
            </p>
            <Link href="/">
              <Button variant="primary" size="lg" className="w-full">Return Home</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="group">
            <Logo size="md" />
          </Link>
          <div className="text-sm text-slate-500">Vehicle Application</div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Step Progress */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((s) => (
              <div key={s.step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep > s.step 
                    ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/30' 
                    : currentStep === s.step 
                    ? 'bg-white border-2 border-primary-500 text-primary-700 shadow-lg' 
                    : 'bg-white/50 border border-slate-200 text-slate-400'
                }`}>
                  {currentStep > s.step ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : s.step}
                </div>
                {s.step < 4 && (
                  <div className={`w-full h-1 mx-2 rounded-full transition-all ${
                    currentStep > s.step ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-slate-200'
                  }`} style={{ width: '60px' }} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">{STEPS[currentStep - 1].title}</h2>
            <p className="text-slate-500 mt-1">{STEPS[currentStep - 1].desc}</p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-slate-200/50 p-8 min-h-[420px]">
            <AnimatePresence mode="wait">
              
              {/* Step 1: Vehicle Preferences */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Urgency */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      When do you want to get into your next vehicle?
                    </label>
                    <Select
                      options={urgencyOptions}
                      error={errors.urgency?.message}
                      placeholder="Select timing..."
                      {...register('urgency')}
                    />
                  </div>

                  {/* Vehicle Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      What type of vehicle are you seeking?
                    </label>
                    <Select
                      options={vehicleTypeOptions}
                      error={errors.vehicleType?.message}
                      placeholder="Select vehicle type..."
                      {...register('vehicleType')}
                    />
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Payment type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'finance', label: 'Finance', desc: 'Monthly payments' },
                        { value: 'cash', label: 'Cash', desc: 'Pay upfront' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                            paymentType === opt.value
                              ? 'border-primary-500 bg-primary-50/50 shadow-lg shadow-primary-500/10'
                              : 'border-slate-200 hover:border-slate-300 bg-white/50'
                          }`}
                        >
                          <input type="radio" value={opt.value} {...register('paymentType')} className="sr-only" />
                          <div className="font-semibold text-slate-900">{opt.label}</div>
                          <p className="text-sm text-slate-500 mt-1">{opt.desc}</p>
                          {paymentType === opt.value && (
                            <div className="absolute top-3 right-3 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                    {errors.paymentType && <p className="text-red-500 text-sm mt-2">{errors.paymentType.message}</p>}
                  </div>

                  {/* Conditional Budget & Credit */}
                  {paymentType && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6 pt-4 border-t border-slate-100"
                    >
                      {paymentType === 'finance' ? (
                        <>
                          <Select
                            label="What is your monthly payment budget?"
                            options={financeBudgetOptions}
                            error={errors.financeBudget?.message}
                            placeholder="Select budget..."
                            {...register('financeBudget')}
                          />
                          <Select
                            label="What is your credit rating?"
                            options={creditRatingOptions}
                            error={errors.creditRating?.message}
                            placeholder="Select credit rating..."
                            {...register('creditRating')}
                          />
                        </>
                      ) : (
                        <Select
                          label="What is your budget?"
                          options={cashBudgetOptions}
                          error={errors.cashBudget?.message}
                          placeholder="Select budget..."
                          {...register('cashBudget')}
                        />
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Contact Info */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <Input
                    label="Full Name"
                    placeholder="John Smith"
                    error={errors.fullName?.message}
                    required
                    {...register('fullName')}
                  />
                  <div className="grid md:grid-cols-2 gap-5">
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="(416) 555-0123"
                      error={errors.phone?.message}
                      required
                      {...register('phone')}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="john@example.com"
                      error={errors.email?.message}
                      required
                      {...register('email')}
                    />
                  </div>
                  <Input
                    label="Date of Birth"
                    type="date"
                    error={errors.dateOfBirth?.message}
                    required
                    {...register('dateOfBirth')}
                  />
                  <div className="grid md:grid-cols-2 gap-5">
                    <Select
                      label="Best time to reach you"
                      options={bestTimeOptions}
                      error={errors.bestTimeToReach?.message}
                      placeholder="Select..."
                      {...register('bestTimeToReach')}
                    />
                    <Select
                      label="What class of license do you hold?"
                      options={licenseClassOptions}
                      error={errors.licenseClass?.message}
                      placeholder="Select..."
                      {...register('licenseClass')}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Additional Details */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Trade-in */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Do you have a trade-in?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                        { value: 'unsure', label: 'Unsure' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all ${
                            tradeIn === opt.value
                              ? 'border-primary-500 bg-primary-50/50 shadow-md'
                              : 'border-slate-200 hover:border-slate-300 bg-white/50'
                          }`}
                        >
                          <input type="radio" value={opt.value} {...register('tradeIn')} className="sr-only" />
                          <span className="font-medium text-slate-800">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors.tradeIn && <p className="text-red-500 text-sm mt-2">{errors.tradeIn.message}</p>}
                  </div>

                  {/* Trade-in Details */}
                  {(tradeIn === 'yes' || tradeIn === 'unsure') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4"
                    >
                      <p className="text-sm font-medium text-slate-600">Trade-in vehicle details</p>
                      <div className="grid grid-cols-3 gap-4">
                        <Input label="Year" placeholder="2020" error={errors.tradeInYear?.message} {...register('tradeInYear')} />
                        <Input label="Make" placeholder="Toyota" error={errors.tradeInMake?.message} {...register('tradeInMake')} />
                        <Input label="Model" placeholder="Camry" error={errors.tradeInModel?.message} {...register('tradeInModel')} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Mileage" placeholder="50,000 km" {...register('tradeInMileage')} />
                        <Input label="VIN (optional)" placeholder="Vehicle ID" {...register('tradeInVin')} />
                      </div>
                    </motion.div>
                  )}

                  {/* Driver's License Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Upload Driver&apos;s License (Optional)
                    </label>
                    <FileUpload
                      accept="image/*"
                      maxSize={10 * 1024 * 1024}
                      onFileSelect={setLicenseFile}
                      selectedFile={licenseFile}
                      onClear={() => setLicenseFile(null)}
                    />
                  </div>

                  {/* Cosigner */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Will you have a cosigner?
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-w-xs">
                      {[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all ${
                            cosigner === opt.value
                              ? 'border-primary-500 bg-primary-50/50 shadow-md'
                              : 'border-slate-200 hover:border-slate-300 bg-white/50'
                          }`}
                        >
                          <input type="radio" value={opt.value} {...register('cosigner')} className="sr-only" />
                          <span className="font-medium text-slate-800">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors.cosigner && <p className="text-red-500 text-sm mt-2">{errors.cosigner.message}</p>}
                  </div>

                  {/* Cosigner Details */}
                  {cosigner === 'yes' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4"
                    >
                      <p className="text-sm font-medium text-slate-600">Cosigner information</p>
                      <Input label="Cosigner Full Name" placeholder="Jane Smith" error={errors.cosignerFullName?.message} required {...register('cosignerFullName')} />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" type="tel" placeholder="(416) 555-0124" error={errors.cosignerPhone?.message} required {...register('cosignerPhone')} />
                        <Input label="Email" type="email" placeholder="jane@example.com" error={errors.cosignerEmail?.message} required {...register('cosignerEmail')} />
                      </div>
                      <Input label="Date of Birth" type="date" {...register('cosignerDateOfBirth')} />
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <p className="text-slate-600">Please review your information before submitting.</p>
                  </div>

                  <ReviewCard title="Vehicle Preferences">
                    <ReviewItem label="Timing" value={getValues('urgency')} />
                    <ReviewItem label="Vehicle Type" value={getValues('vehicleType')} />
                    <ReviewItem label="Payment" value={getValues('paymentType')} />
                    {paymentType === 'finance' && (
                      <>
                        <ReviewItem label="Monthly Budget" value={getValues('financeBudget')} />
                        <ReviewItem label="Credit Rating" value={getValues('creditRating')} />
                      </>
                    )}
                    {paymentType === 'cash' && <ReviewItem label="Cash Budget" value={getValues('cashBudget')} />}
                  </ReviewCard>

                  <ReviewCard title="Contact Information">
                    <ReviewItem label="Name" value={getValues('fullName')} />
                    <ReviewItem label="Phone" value={getValues('phone')} />
                    <ReviewItem label="Email" value={getValues('email')} />
                    <ReviewItem label="DOB" value={getValues('dateOfBirth')} />
                    <ReviewItem label="Best Time" value={getValues('bestTimeToReach')} />
                    <ReviewItem label="License Class" value={getValues('licenseClass')} />
                  </ReviewCard>

                  <ReviewCard title="Additional Details">
                    <ReviewItem label="Trade-in" value={getValues('tradeIn')} />
                    {(tradeIn === 'yes' || tradeIn === 'unsure') && (
                      <ReviewItem label="Trade-in Vehicle" value={`${getValues('tradeInYear')} ${getValues('tradeInMake')} ${getValues('tradeInModel')}`} />
                    )}
                    <ReviewItem label="Cosigner" value={getValues('cosigner')} />
                    {cosigner === 'yes' && (
                      <ReviewItem label="Cosigner Name" value={getValues('cosignerFullName')} />
                    )}
                    {licenseFile && <ReviewItem label="License Uploaded" value={licenseFile.name} />}
                  </ReviewCard>

                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {submitError}
                    </div>
                  )}

                  <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100 text-center">
                    <p className="text-sm text-primary-700">
                      You will receive a response within <strong>24 hours</strong> of submitting your application.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            {currentStep > 1 ? (
              <Button type="button" variant="ghost" onClick={prevStep}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            ) : <div />}

            {currentStep < 4 ? (
              <Button type="button" variant="primary" onClick={nextStep}>
                Continue
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            ) : (
              <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
                Submit Application
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
      <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-slate-500">{label}:</span>{' '}
      <span className="text-slate-900 font-medium">{value || '-'}</span>
    </div>
  );
}
