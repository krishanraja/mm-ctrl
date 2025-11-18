export const DEPARTMENTS = [
  'Revenue',
  'Operations',
  'Technology',
  'Finance',
  'Marketing',
  'Product',
  'Human Resources',
  'Customer Success',
  'Other'
] as const;

export type Department = typeof DEPARTMENTS[number];
