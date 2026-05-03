import Link from 'next/link';

export default function MembershipRegistrationPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <h1 className="text-4xl font-bold text-gray-900">Membership Registration</h1>
      <div className="flex flex-col sm:flex-row gap-6">
        <Link
          href="/dashboard/new-member"
          className="px-10 py-5 text-xl font-semibold text-white bg-blue-600 rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
        >
          New Membership
        </Link>
        <Link
          href="/dashboard/membership-renewal"
          className="px-10 py-5 text-xl font-semibold text-white bg-green-600 rounded-xl shadow-lg hover:bg-green-700 transition-colors"
        >
          Membership Renewal
        </Link>
      </div>
    </div>
  );
}
