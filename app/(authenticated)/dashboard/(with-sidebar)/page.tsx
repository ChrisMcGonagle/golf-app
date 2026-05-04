import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Welcome to the admin dashboard. Use the sidebar to navigate.
      </p>
      <section className="mb-8" aria-labelledby="dashboard-quick-actions-heading">
        <h2
          id="dashboard-quick-actions-heading"
          className="text-lg font-semibold text-gray-900 mb-4"
        >
          Quick Actions
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/membership-flow?intent=new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            New Member
          </Link>
          <Link
            href="/dashboard/membership-flow?intent=renewal"
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-blue-600 shadow ring-1 ring-inset ring-blue-200 transition hover:bg-blue-50"
          >
            Membership Renewal
          </Link>
        </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900">Total Submissions</h2>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900">Total Members</h2>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
