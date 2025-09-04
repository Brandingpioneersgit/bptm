// Industry options with specific terminology for client onboarding
export const industryOptions = [
  { value: 'healthcare', label: 'Healthcare', customerTerm: 'Patient' },
  { value: 'retail', label: 'Retail', customerTerm: 'Customer' },
  { value: 'restaurant', label: 'Restaurant', customerTerm: 'Customer' },
  { value: 'education', label: 'Education', customerTerm: 'Student' },
  { value: 'real-estate', label: 'Real Estate', customerTerm: 'Client' },
  { value: 'legal', label: 'Legal Services', customerTerm: 'Client' },
  { value: 'fitness', label: 'Fitness & Wellness', customerTerm: 'Member' },
  { value: 'automotive', label: 'Automotive', customerTerm: 'Customer' },
  { value: 'technology', label: 'Technology', customerTerm: 'User' },
  { value: 'other', label: 'Other', customerTerm: 'Customer' }
];

// Business type options for healthcare
export const healthcareTypes = [
  'Doctor/Physician',
  'Clinic',
  'Hospital',
  'Dental Practice',
  'Veterinary Clinic',
  'Pharmacy',
  'Medical Laboratory',
  'Physiotherapy Center',
  'Mental Health Practice',
  'Chiropractic Practice',
  'Optometry/Eye Care',
  'Dermatology Practice',
  'Pediatric Practice',
  'Urgent Care Center',
  'Rehabilitation Center'
];

// Healthcare-specific condition options
export const healthConditionsOptions = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Arthritis',
  'Asthma',
  'Depression/Anxiety',
  'Chronic Pain',
  'Obesity',
  'Cancer',
  'Allergies',
  'Sleep Disorders',
  'Digestive Issues',
  'Skin Conditions',
  'Vision Problems',
  'Hearing Issues',
  'Pregnancy/Maternity',
  'Pediatric Conditions',
  'Mental Health',
  'Preventive Care',
  'General Wellness'
];

// Insurance types for healthcare industry
export const insuranceTypesOptions = [
  'Medicare',
  'Medicaid',
  'Private Insurance',
  'Blue Cross Blue Shield',
  'Aetna',
  'Cigna',
  'UnitedHealthcare',
  'Humana',
  'Kaiser Permanente',
  'Self-Pay/Cash',
  'HSA/FSA',
  'Workers Compensation',
  'Auto Insurance',
  'No Insurance',
  'Multiple Insurance Types'
];

// Healthcare audience types
export const healthcareAudienceOptions = [
  'Patients (General)',
  'Elderly Patients (65+)',
  'Pediatric Patients',
  'Chronic Care Patients',
  'Emergency Care Patients',
  'Preventive Care Patients',
  'Healthcare Providers',
  'Medical Staff',
  'Insurance Companies',
  'Healthcare Administrators',
  'Caregivers/Family Members',
  'Healthcare Students',
  'Medical Researchers'
];

// Occupation options for target audience
export const occupationOptions = [
  'Professionals (Doctors, Lawyers, Engineers)',
  'Business Owners/Entrepreneurs',
  'Corporate Employees',
  'Students',
  'Homemakers',
  'Retirees/Senior Citizens',
  'Government Employees',
  'Teachers/Educators',
  'Healthcare Workers',
  'IT Professionals',
  'Sales Professionals',
  'Freelancers/Consultants',
  'Blue Collar Workers',
  'Artists/Creatives',
  'Mixed/All Occupations'
];

// Business size options
export const businessSizeOptions = [
  'Solo Practice/Individual',
  'Small (2-10 employees)',
  'Medium (11-50 employees)',
  'Large (51-200 employees)',
  'Enterprise (200+ employees)',
  'Multiple Locations',
  'Franchise',
  'Non-profit Organization',
  'Government/Public Sector'
];

// Budget range options
export const budgetRangeOptions = [
  'Under $1,000/month',
  '$1,000 - $5,000/month',
  '$5,000 - $10,000/month',
  '$10,000 - $25,000/month',
  '$25,000+ /month',
  'Project-based pricing',
  'Performance-based pricing',
  'Custom pricing needed'
];

// Service options - Web services
export const webServices = [
  'Website Development',
  'E-commerce Platform',
  'Mobile App Development',
  'Web App Development',
  'API Development',
  'Database Design',
  'Website Maintenance',
  'Performance Optimization',
  'Security Implementation'
];

// Service options - Marketing services  
export const marketingServices = [
  'Search Engine Optimization (SEO)',
  'Pay-Per-Click (PPC) Advertising',
  'Social Media Marketing',
  'Content Marketing',
  'Email Marketing',
  'Marketing Automation',
  'Conversion Rate Optimization',
  'Analytics & Reporting'
];

// Get customer term based on industry
export const getCustomerTerm = (industry) => {
  const option = industryOptions.find(opt => opt.value === industry);
  return option ? option.customerTerm : 'Customer';
};