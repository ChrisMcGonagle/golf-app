export const MEMBERSHIP_TYPES = [
  'Full Member',
  'Senior Member',
  'Student Member',
  'Beginner (Year 1)',
  'Beginner (Year 2)',
  'Juvenile',
  'Country Member',
  'Overseas Life Member',
  'Life Member',
  'Family Member',
] as const;

export type MembershipType = (typeof MEMBERSHIP_TYPES)[number];
