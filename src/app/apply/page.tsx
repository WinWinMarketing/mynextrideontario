'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
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

type FormStep = 1 | 2 | 3;

const STEPS = [
  { step: 1, title: 'Vehicle Preferences', desc: 'Tell us about your ideal vehicle' },
  { step: 2, title: 'Your Information', desc: 'Contact details' },
  { step: 3, title: 'Additional Details', desc: 'Trade-in & license info' },
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
    clearErrors,
  } = useForm<LeadApplicationData>({
    resolver: zodResolver(leadApplicationSchema),
    mode: 'onBlur',
    defaultValues: {
      urgency: undefined,
      vehicleType: undefined,
      paymentType: undefined,
      financeBudget: undefined,
      cashBudget: undefined,
      creditRating: undefined,
      tradeIn: undefined,
      tradeInYear: '',
      tradeInMake: '',
      tradeInModel: '',
      tradeInMileage: '',
      tradeInVin: '',
      fullName: '',
      phone: '',
      email: '',
      dateOfBirth: '',
      bestTimeToReach: undefined,
      licenseClass: undefined,
      cosigner: undefined,
      cosignerFullName: '',
      cosignerPhone: '',
      cosignerEmail: '',
      cosignerDateOfBirth: '',
    },
  });

  const paymentType = watch('paymentType');
  const tradeIn = watch('tradeIn');
  const cosigner = watch('cosigner');

  const getStepFields = useCallback((step: FormStep): (keyof LeadApplicationData)[] => {
    const currentPaymentType = getValues('paymentType');
    const currentTradeIn = getValues('tradeIn');
    const currentCosigner = getValues('cosigner');
    
    switch (step) {
      case 1:
        const step1Fields: (keyof LeadApplicationData)[] = ['urgency', 'vehicleType', 'paymentType'];
        if (currentPaymentType === 'finance') {
          step1Fields.push('financeBudget', 'creditRating');
        }
        if (currentPaymentType === 'cash') {
          step1Fields.push('cashBudget');
        }
        return step1Fields;
      case 2:
        return ['fullName', 'phone', 'email', 'dateOfBirth', 'bestTimeToReach', 'licenseClass'];
      case 3:
        const step3Fields: (keyof LeadApplicationData)[] = ['tradeIn', 'cosigner'];
        if (currentTradeIn === 'yes' || currentTradeIn === 'unsure') {
          step3Fields.push('tradeInYear', 'tradeInMake', 'tradeInModel');
        }
        if (currentCosigner === 'yes') {
          step3Fields.push('cosignerFullName', 'cosignerPhone', 'cosignerEmail');
        }
        return step3Fields;
      default:
        return [];
    }
  }, [getValues]);

  const validateStep = async (): Promise<boolean> => {
    const fields = getStepFields(currentStep);
    clearErrors();
    const result = await trigger(fields);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < 3) {
      setCurrentStep((currentStep + 1) as FormStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.details?.formErrors?.join(', ') || 
                            result.details?.fieldErrors ? Object.values(result.details.fieldErrors).flat().join(', ') :
                            result.error || 'Submission failed. Please try again.';
        throw new Error(errorMessage);
      }

      setIsSuccess(true);
    } catch (err) {
      console.error('Form submission error:', err);
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitError(null);
    
    // Validate current step first
    const stepValid = await validateStep();
    if (!stepValid) {
      setSubmitError('Please fill in all required fields correctly.');
      return;
    }
    
    // Trigger full form validation then submit
    const allValid = await trigger();
    if (!allValid) {
      // Find which fields have errors
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        setSubmitError(`Please check the following fields: ${errorFields.join(', ')}`);
      } else {
        setSubmitError('Please fill in all required fields.');
      }
      return;
    }
    
    // Get form data and submit
    const data = getValues();
    await onSubmit(data);
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

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="sr-only">Vehicle financing application - My Next Ride Ontario</h1>
        {/* Step Progress */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((s, index) => (
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
                {index < STEPS.length - 1 && (
                  <div className={`w-16 md:w-24 h-1 mx-2 rounded-full transition-all ${
                    currentStep > s.step ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{STEPS[currentStep - 1].title}</h2>
            <p className="text-slate-600 text-base">{STEPS[currentStep - 1].desc}</p>
          </div>
        </div>

        {/* Error Display */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{submitError}</span>
            </div>
          </motion.div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-slate-200/50 p-10 min-h-[480px]">
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
                      When do you want to get into your next vehicle? <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={[...urgencyOptions]}
                      error={errors.urgency?.message}
                      placeholder="Select timing..."
                      {...register('urgency')}
                    />
                  </div>

                  {/* Vehicle Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      What type of vehicle are you seeking? <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={[...vehicleTypeOptions]}
                      error={errors.vehicleType?.message}
                      placeholder="Select vehicle type..."
                      {...register('vehicleType')}
                    />
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Payment type <span className="text-red-500">*</span>
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
                            options={[...financeBudgetOptions]}
                            error={errors.financeBudget?.message}
                            placeholder="Select budget..."
                            required
                            {...register('financeBudget')}
                          />
                          <Select
                            label="What is your credit rating?"
                            options={[...creditRatingOptions]}
                            error={errors.creditRating?.message}
                            placeholder="Select credit rating..."
                            required
                            {...register('creditRating')}
                          />
                        </>
                      ) : (
                        <Select
                          label="What is your budget?"
                          options={[...cashBudgetOptions]}
                          error={errors.cashBudget?.message}
                          placeholder="Select budget..."
                          required
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
                      options={[...bestTimeOptions]}
                      error={errors.bestTimeToReach?.message}
                      placeholder="Select..."
                      required
                      {...register('bestTimeToReach')}
                    />
                    <Select
                      label="What class of license do you hold?"
                      options={[...licenseClassOptions]}
                      error={errors.licenseClass?.message}
                      placeholder="Select..."
                      required
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
                      Do you have a trade-in? <span className="text-red-500">*</span>
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
                        <Input label="Year" placeholder="2020" error={errors.tradeInYear?.message} required {...register('tradeInYear')} />
                        <Input label="Make" placeholder="Toyota" error={errors.tradeInMake?.message} required {...register('tradeInMake')} />
                        <Input label="Model" placeholder="Camry" error={errors.tradeInModel?.message} required {...register('tradeInModel')} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Mileage (optional)" placeholder="50,000 km" {...register('tradeInMileage')} />
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
                      Will you have a cosigner? <span className="text-red-500">*</span>
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
                      <Input label="Date of Birth (optional)" type="date" {...register('cosignerDateOfBirth')} />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            {currentStep > 1 ? (
              <Button type="button" variant="ghost" onClick={prevStep}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            ) : <div />}

            {currentStep < 3 ? (
              <Button type="button" variant="primary" onClick={nextStep}>
                Continue
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="primary" 
                size="lg" 
                isLoading={isSubmitting} 
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
