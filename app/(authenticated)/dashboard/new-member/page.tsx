import { redirect } from 'next/navigation';

export default function NewMemberPage() {
  redirect('/dashboard/membership-flow?intent=new');
}
