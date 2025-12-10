'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  Button,
  Input,
  Select,
  Card,
  RadioGroup,
  FileUpload,
} from '@/components/ui';
import {
  leadApplicationSchema,
  LeadApplicationData,
  urgencyOptions,
  vehicleTypeOptions,
  paymentTypeOptions,
  financeBudgetOptions,
  cashBudgetOptions,
  creditRatingOptions,
  tradeInOptions,
  bestTimeOptions,
  licenseClassOptions,
  cosignerOptions,
} from '@/lib/validation';

type FormStep = 'vehicle' | 'personal' | 'additional' | 'review';

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState<FormStep>('vehicle');
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
    trigger,
  } = useForm<LeadApplicationData>({
    resolver: zodResolver(leadApplicationSchema),
    mode: 'onChange',
    defaultValues: {
      urgency: undefined,
      vehicleType: undefined,
      paymentType: undefined,
      tradeIn: undefined,
      bestTimeToReach: undefined,
      licenseClass: undefined,
      cosigner: undefined,
    },
  });

  const paymentType = watch('paymentType');
  const tradeIn = watch('tradeIn');
  const cosigner = watch('cosigner');

  const steps: { key: FormStep; label: string }[] = [
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'personal', label: 'Personal' },
    { key: 'additional', label: 'Additional' },
    { key: 'review', label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const validateAndNext = async () => {
    let fieldsToValidate: (keyof LeadApplicationData)[] = [];

    if (currentStep === 'vehicle') {
      fieldsToValidate = ['urgency', 'vehicleType', 'paymentType'];
      if (paymentType === 'finance') {
        fieldsToValidate.push('financeBudget', 'creditRating');
      } else if (paymentType === 'cash') {
        fieldsToValidate.push('cashBudget');
      }
    } else if (currentStep === 'personal') {
      fieldsToValidate = ['fullName', 'phone', 'email', 'dateOfBirth', 'bestTimeToReach'];
    } else if (currentStep === 'additional') {
      fieldsToValidate = ['tradeIn', 'licenseClass', 'cosigner'];
      if (tradeIn === 'yes' || tradeIn === 'unsure') {
        fieldsToValidate.push('tradeInYear', 'tradeInMake', 'tradeInModel');
      }
      if (cosigner === 'yes') {
        fieldsToValidate.push('cosignerFullName', 'cosignerPhone', 'cosignerEmail');
      }
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex].key);
      }
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="text-center p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold mb-4">Application Submitted!</h1>
            <p className="text-muted mb-6">
              Thank you for your application. Our team will review your information and 
              <strong className="text-primary-900"> contact you within 24 hours</strong> with 
              vehicle and financing options tailored to your needs.
            </p>
            <Link href="/">
              <Button variant="primary">Return to Home</Button>
            </Link>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-bold gradient-text">My Next Ride Ontario</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Vehicle Application</h1>
          <p className="text-muted">Tell us about yourself and your ideal vehicle</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between max-w-md mx-auto">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    index <= currentStepIndex
                      ? 'bg-primary-900 text-white'
                      : 'bg-primary-100 text-muted'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 md:w-20 h-1 mx-2 transition-all duration-300 ${
                      index < currentStepIndex ? 'bg-primary-900' : 'bg-primary-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-md mx-auto mt-2">
            {steps.map((step) => (
              <span key={step.key} className="text-xs text-muted w-10 text-center">
                {step.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Vehicle Preferences */}
              {currentStep === 'vehicle' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold mb-4">Vehicle Preferences</h2>

                  <Select
                    label="When do you want to get into your next vehicle?"
                    options={[...urgencyOptions]}
                    placeholder="Select timeframe"
                    error={errors.urgency?.message}
                    required
                    {...register('urgency')}
                  />

                  <Select
                    label="What type of vehicle are you seeking?"
                    options={[...vehicleTypeOptions]}
                    placeholder="Select vehicle type"
                    error={errors.vehicleType?.message}
                    required
                    {...register('vehicleType')}
                  />

                  <RadioGroup
                    label="Payment Type"
                    name="paymentType"
                    options={[...paymentTypeOptions]}
                    value={paymentType}
                    onChange={(value) => setValue('paymentType', value as 'cash' | 'finance')}
                    error={errors.paymentType?.message}
                    required
                  />

                  {paymentType === 'finance' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6"
                    >
                      <Select
                        label="Monthly Payment Budget"
                        options={[...financeBudgetOptions]}
                        placeholder="Select budget"
                        error={errors.financeBudget?.message}
                        required
                        {...register('financeBudget')}
                      />
                      <Select
                        label="Credit Rating"
                        options={[...creditRatingOptions]}
                        placeholder="Select credit rating"
                        error={errors.creditRating?.message}
                        required
                        {...register('creditRating')}
                      />
                    </motion.div>
                  )}

                  {paymentType === 'cash' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <Select
                        label="Cash Budget"
                        options={[...cashBudgetOptions]}
                        placeholder="Select budget"
                        error={errors.cashBudget?.message}
                        required
                        {...register('cashBudget')}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Personal Information */}
              {currentStep === 'personal' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    error={errors.fullName?.message}
                    required
                    {...register('fullName')}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="(xxx) xxx-xxxx"
                      error={errors.phone?.message}
                      required
                      {...register('phone')}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="you@example.com"
                      error={errors.email?.message}
                      required
                      {...register('email')}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Date of Birth"
                      type="date"
                      error={errors.dateOfBirth?.message}
                      required
                      {...register('dateOfBirth')}
                    />
                    <Select
                      label="Best Time to Reach You"
                      options={[...bestTimeOptions]}
                      placeholder="Select time"
                      error={errors.bestTimeToReach?.message}
                      required
                      {...register('bestTimeToReach')}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Additional Information */}
              {currentStep === 'additional' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold mb-4">Additional Information</h2>

                  <RadioGroup
                    label="Do you have a trade-in?"
                    name="tradeIn"
                    options={[...tradeInOptions]}
                    value={tradeIn}
                    onChange={(value) => setValue('tradeIn', value as 'yes' | 'no' | 'unsure')}
                    error={errors.tradeIn?.message}
                    required
                  />

                  {(tradeIn === 'yes' || tradeIn === 'unsure') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 p-4 bg-primary-50 rounded-xl"
                    >
                      <h3 className="font-medium">Trade-In Details</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Input
                          label="Year"
                          placeholder="2020"
                          error={errors.tradeInYear?.message}
                          required
                          {...register('tradeInYear')}
                        />
                        <Input
                          label="Make"
                          placeholder="Honda"
                          error={errors.tradeInMake?.message}
                          required
                          {...register('tradeInMake')}
                        />
                        <Input
                          label="Model"
                          placeholder="Civic"
                          error={errors.tradeInModel?.message}
                          required
                          {...register('tradeInModel')}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          label="Mileage"
                          placeholder="50,000 km"
                          {...register('tradeInMileage')}
                        />
                        <Input
                          label="VIN (Optional)"
                          placeholder="Vehicle Identification Number"
                          {...register('tradeInVin')}
                        />
                      </div>
                    </motion.div>
                  )}

                  <Select
                    label="License Class"
                    options={[...licenseClassOptions]}
                    placeholder="Select license class"
                    error={errors.licenseClass?.message}
                    required
                    {...register('licenseClass')}
                  />

                  <FileUpload
                    label="Driver's License Image"
                    hint="Upload a clear photo of your driver's license"
                    accept="image/*"
                    maxSize={10}
                    onChange={setLicenseFile}
                  />

                  <RadioGroup
                    label="Will you have a cosigner?"
                    name="cosigner"
                    options={[...cosignerOptions]}
                    value={cosigner}
                    onChange={(value) => setValue('cosigner', value as 'yes' | 'no')}
                    error={errors.cosigner?.message}
                    required
                  />

                  {cosigner === 'yes' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 p-4 bg-primary-50 rounded-xl"
                    >
                      <h3 className="font-medium">Cosigner Information</h3>
                      <Input
                        label="Cosigner Full Name"
                        placeholder="Enter cosigner's full name"
                        error={errors.cosignerFullName?.message}
                        required
                        {...register('cosignerFullName')}
                      />
                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          label="Cosigner Phone"
                          type="tel"
                          placeholder="(xxx) xxx-xxxx"
                          error={errors.cosignerPhone?.message}
                          required
                          {...register('cosignerPhone')}
                        />
                        <Input
                          label="Cosigner Email"
                          type="email"
                          placeholder="cosigner@example.com"
                          error={errors.cosignerEmail?.message}
                          required
                          {...register('cosignerEmail')}
                        />
                      </div>
                      <Input
                        label="Cosigner Date of Birth"
                        type="date"
                        {...register('cosignerDateOfBirth')}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Review */}
              {currentStep === 'review' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold mb-4">Review Your Application</h2>
                  <p className="text-muted mb-6">
                    Please review your information before submitting. You&apos;ll receive a response 
                    within 24 hours.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 bg-primary-50 rounded-xl">
                      <h3 className="font-medium mb-2">Vehicle Preferences</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted">Timeframe:</span>
                        <span>{urgencyOptions.find(o => o.value === watch('urgency'))?.label}</span>
                        <span className="text-muted">Vehicle Type:</span>
                        <span>{vehicleTypeOptions.find(o => o.value === watch('vehicleType'))?.label}</span>
                        <span className="text-muted">Payment:</span>
                        <span>{watch('paymentType') === 'finance' ? 'Finance' : 'Cash'}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-primary-50 rounded-xl">
                      <h3 className="font-medium mb-2">Contact Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted">Name:</span>
                        <span>{watch('fullName')}</span>
                        <span className="text-muted">Phone:</span>
                        <span>{watch('phone')}</span>
                        <span className="text-muted">Email:</span>
                        <span>{watch('email')}</span>
                      </div>
                    </div>

                    {licenseFile && (
                      <div className="p-4 bg-success/10 rounded-xl">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium">Driver&apos;s license uploaded</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {submitError && (
                    <div className="p-4 bg-error/10 text-error rounded-xl">
                      {submitError}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-primary-100">
                {currentStepIndex > 0 ? (
                  <Button type="button" variant="ghost" onClick={goBack}>
                    ← Back
                  </Button>
                ) : (
                  <Link href="/">
                    <Button type="button" variant="ghost">
                      ← Home
                    </Button>
                  </Link>
                )}

                {currentStep === 'review' ? (
                  <Button
                    type="submit"
                    variant="accent"
                    isLoading={isSubmitting}
                  >
                    Submit Application
                  </Button>
                ) : (
                  <Button type="button" variant="primary" onClick={validateAndNext}>
                    Continue →
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

