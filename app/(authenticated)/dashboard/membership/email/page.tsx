import Link from 'next/link';

type GenerateEmailFormPageProps = {
  searchParams: Promise<{
    intent?: string;
    typeId?: string;
    memberId?: string;
  }>;
};

export default async function GenerateEmailFormPage({ searchParams }: GenerateEmailFormPageProps) {
  const { intent, typeId, memberId } = await searchParams;

  const decodedType = typeId ? decodeURIComponent(typeId) : undefined;

  const backParams = new URLSearchParams({ intent: intent ?? '', action: 'email' });
  if (memberId) backParams.set('memberId', memberId);
  if (decodedType) backParams.set('memberType', decodedType);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Generate Email Form</h1>

      <dl className="mb-6 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <div className="flex gap-2">
          <dt className="font-medium text-gray-700">Intent:</dt>
          <dd className="text-gray-600">{intent ?? '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-gray-700">Membership Type:</dt>
          <dd className="text-gray-600">{decodedType ?? '—'}</dd>
        </div>
        {memberId && (
          <div className="flex gap-2">
            <dt className="font-medium text-gray-700">Member ID:</dt>
            <dd className="text-gray-600">{memberId}</dd>
          </div>
        )}
      </dl>

      <p className="text-sm text-gray-500">Email generation coming soon</p>

      <div className="mt-8">
        <Link
          href={`/dashboard/membership/type?${backParams.toString()}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}
