import { z } from 'zod';

export const urgencyOptions = [
  { value: 'right-away', label: 'Right away' },
  { value: 'few-weeks', label: 'Within a few weeks' },
  { value: 'few-months', label: 'Within a few months' },
] as const;

export const vehicleTypeOptions = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'coupe-convertible', label: 'Coupe / Convertible' },
  { value: 'truck', label: 'Truck' },
  { value: 'minivan', label: 'Minivan' },
] as const;

export const paymentTypeOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'finance', label: 'Finance' },
] as const;

export const financeBudgetOptions = [
  { value: '400-or-less', label: '$400 or less monthly' },
  { value: '400-500', label: '$400 - $500 monthly' },
  { value: '500-600', label: '$500 - $600 monthly' },
  { value: '600-plus', label: '$600+ monthly' },
] as const;

export const cashBudgetOptions = [
  { value: '15k-or-less', label: '$15k or less' },
  { value: '20-30k', label: '$20k - $30k' },
  { value: '30-45k', label: '$30k - $45k' },
  { value: '50k-plus', label: '$50k+' },
] as const;

export const creditRatingOptions = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
] as const;

export const tradeInOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Unsure' },
] as const;

export const bestTimeOptions = [
  { value: 'morning', label: 'Morning' },
  { value: 'noon', label: 'Noon' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
] as const;

export const licenseClassOptions = [
  { value: 'g1', label: 'G1' },
  { value: 'g2', label: 'G2' },
  { value: 'g-or-above', label: 'G or above' },
] as const;

export const cosignerOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

// Phone validation regex
const phoneRegex = /^[\d\s\-\(\)\+]+$/;

// Zod schema for lead application
export const leadApplicationSchema = z.object({
  // Vehicle preferences
  urgency: z.enum(['right-away', 'few-weeks', 'few-months'], {
    required_error: 'Please select when you want your next vehicle',
  }),
  vehicleType: z.enum(['sedan', 'suv', 'hatchback', 'coupe-convertible', 'truck', 'minivan'], {
    required_error: 'Please select a vehicle type',
  }),
  paymentType: z.enum(['cash', 'finance'], {
    required_error: 'Please select a payment type',
  }),
  
  // Budget - conditional
  financeBudget: z.enum(['400-or-less', '400-500', '500-600', '600-plus']).optional(),
  cashBudget: z.enum(['15k-or-less', '20-30k', '30-45k', '50k-plus']).optional(),
  
  // Credit - conditional on finance
  creditRating: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
  
  // Trade-in
  tradeIn: z.enum(['yes', 'no', 'unsure'], {
    required_error: 'Please indicate if you have a trade-in',
  }),
  tradeInYear: z.string().optional(),
  tradeInMake: z.string().optional(),
  tradeInModel: z.string().optional(),
  tradeInMileage: z.string().optional(),
  tradeInVin: z.string().optional(),
  
  // Personal info
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string()
    .min(10, 'Phone number is required')
    .regex(phoneRegex, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  
  // Contact preference
  bestTimeToReach: z.enum(['morning', 'noon', 'afternoon', 'evening'], {
    required_error: 'Please select the best time to reach you',
  }),
  
  // License
  licenseClass: z.enum(['g1', 'g2', 'g-or-above'], {
    required_error: 'Please select your license class',
  }),
  
  // Cosigner
  cosigner: z.enum(['yes', 'no'], {
    required_error: 'Please indicate if you have a cosigner',
  }),
  cosignerFullName: z.string().optional(),
  cosignerPhone: z.string().optional(),
  cosignerEmail: z.string().optional(),
  cosignerDateOfBirth: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate finance budget when payment type is finance
  if (data.paymentType === 'finance' && !data.financeBudget) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select your monthly budget',
      path: ['financeBudget'],
    });
  }
  
  // Validate cash budget when payment type is cash
  if (data.paymentType === 'cash' && !data.cashBudget) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select your cash budget',
      path: ['cashBudget'],
    });
  }
  
  // Validate credit rating when financing
  if (data.paymentType === 'finance' && !data.creditRating) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select your credit rating',
      path: ['creditRating'],
    });
  }
  
  // Validate trade-in details when trade-in is yes or unsure
  if (data.tradeIn === 'yes' || data.tradeIn === 'unsure') {
    if (!data.tradeInYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter the trade-in year',
        path: ['tradeInYear'],
      });
    }
    if (!data.tradeInMake) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter the trade-in make',
        path: ['tradeInMake'],
      });
    }
    if (!data.tradeInModel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter the trade-in model',
        path: ['tradeInModel'],
      });
    }
  }
  
  // Validate cosigner details when cosigner is yes
  if (data.cosigner === 'yes') {
    if (!data.cosignerFullName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter cosigner full name',
        path: ['cosignerFullName'],
      });
    }
    if (!data.cosignerPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter cosigner phone number',
        path: ['cosignerPhone'],
      });
    }
    if (!data.cosignerEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter cosigner email',
        path: ['cosignerEmail'],
      });
    }
  }
});

export type LeadApplicationData = z.infer<typeof leadApplicationSchema>;

// Lead status options for admin (only the 5 requested statuses)
// 1. New Lead, 2. Working, 4. Circle Back, 5. Approval, 8. Dead Lead
export const leadStatusOptions = [
  { value: 'new', label: 'New Lead', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { value: 'working', label: 'Working', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'circle-back', label: 'Circle Back', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { value: 'approval', label: 'Approval', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'dead', label: 'Dead Lead', color: 'bg-red-100 text-red-800 border-red-300' },
] as const;

export type LeadStatus = typeof leadStatusOptions[number]['value'];

// Dead lead reason options (all except Cash Buyer and Not Ready to Buy, with "No longer interested")
export const deadReasonOptions = [
  { value: 'declined', label: 'Declined' },
  { value: 'negative-equity', label: 'Negative Equity' },
  { value: 'no-longer-interested', label: 'No longer interested' },
  { value: 'already-purchased', label: 'Already Purchased' },
  { value: 'no-vehicle-of-interest', label: 'No Vehicle of Interest' },
  { value: 'cannot-afford-payment', label: 'Cannot Afford Payment' },
  { value: 'too-far-to-visit', label: 'Too Far to Visit' },
] as const;

export type DeadReason = typeof deadReasonOptions[number]['value'];

// Showcase Vehicle
export interface ShowcaseVehicle {
  id: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
  price?: string;
  mileage?: string;
  imageUrl?: string;
  imageKey?: string;
  featured: boolean;
  createdAt: string;
}

export const MAX_SHOWCASE_VEHICLES = 12;

// Full lead type including metadata
export interface Lead {
  id: string;
  createdAt: string;
  monthYear: string;
  status: LeadStatus;
  deadReason?: DeadReason;
  notes: string;
  driversLicenseKey?: string;
  formData: LeadApplicationData;
}
