import { redirect } from 'next/navigation';

export default function MembershipRenewalPage() {
  redirect('/dashboard/membership-flow?intent=renewal');
}