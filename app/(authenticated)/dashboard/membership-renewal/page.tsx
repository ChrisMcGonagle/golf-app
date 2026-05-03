import Link from 'next/link';

export default function MembershipRenewalPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <h1 className="text-4xl font-bold text-gray-900">Membership Renewal</h1>
      <p className="text-lg text-gray-600">Placeholder for membership renewal flow</p>
      <Link
        href="/dashboard/membership-registration"
        className="px-6 py-3 text-base font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
      >
        Back to Membership Registration
      </Link>
    </div>
  );
}