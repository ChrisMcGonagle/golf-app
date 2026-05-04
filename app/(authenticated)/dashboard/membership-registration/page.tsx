import Link from 'next/link';

export default function MembershipRegistrationPage() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-8 py-16"
      style={{ backgroundColor: '#f5f6f5' }}
    >
      {/* Heading Section */}
      <div className="w-full max-w-[800px] mb-16">
        <p style={{ color: '#bab9bd' }} className="text-6xl font-normal">
          Choose a
        </p>
        <h1 style={{ color: '#2b2b2b' }} className="text-6xl font-normal mt-2">
          Membership
        </h1>
      </div>

      {/* Cards Container */}
      <div className="w-full max-w-[800px] flex flex-col gap-8">
        {/* Card 1: New Membership */}
        <Link
          href="/dashboard/membership-flow?intent=new"
          className="flex flex-col items-start justify-start p-10 rounded-3xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #eeeeee',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Icon Container */}
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full mb-6"
            style={{ backgroundColor: '#f0f0f0' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: '#969696' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>

          {/* Text Container */}
          <div className="flex flex-col items-start justify-start">
            <h2 style={{ color: '#282828' }} className="text-4xl font-semibold">
              New Membership
            </h2>
            <p style={{ color: '#969696' }} className="text-xl font-normal mt-2">
              Register a new member
            </p>
          </div>
        </Link>

        {/* Card 2: Membership Renewal */}
        <Link
          href="/dashboard/membership-flow?intent=renewal"
          className="flex flex-col items-start justify-start p-10 rounded-3xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #eeeeee',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Icon Container */}
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full mb-6"
            style={{ backgroundColor: '#f0f0f0' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: '#969696' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>

          {/* Text Container */}
          <div className="flex flex-col items-start justify-start">
            <h2 style={{ color: '#282828' }} className="text-4xl font-semibold">
              Membership Renewal
            </h2>
            <p style={{ color: '#969696' }} className="text-xl font-normal mt-2">
              Renew an existing membership
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
