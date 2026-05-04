import Link from 'next/link';
import { FormProvider } from '@/components/contexts/FormContext';
import FormShell from './components/FormShell';

type MembershipFormPageProps = {
  searchParams: Promise<{
    intent?: string;
    typeId?: string;
    memberId?: string;
    step?: string;
  }>;
};

export default async function MembershipFormPage({ searchParams }: MembershipFormPageProps) {
  const { intent, typeId, memberId, step } = await searchParams;

  // Validate required params
  const validIntents = ['new', 'renewal'];
  const isValidIntent = intent && validIntents.includes(intent);
  const isValidTypeId = typeId && typeId.trim();
  const currentStep = step ? parseInt(step, 10) : 1;
  const isValidStep = currentStep >= 1 && currentStep <= 4;

  // For renewal, memberId is required
  const isValidRenewal = intent === 'renewal' && memberId ? true : intent === 'new';

  if (!isValidIntent || !isValidTypeId || !isValidStep || !isValidRenewal) {
    const backParams = new URLSearchParams({ intent: intent ?? '', action: 'form' });
    if (memberId) backParams.set('memberId', memberId);
    if (typeId) backParams.set('memberType', decodeURIComponent(typeId));

    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Form Error</h1>
        <p className="mb-4 text-red-600">
          Invalid form parameters. Please restart the membership process.
        </p>
        <Link
          href={`/dashboard/membership/type?${backParams.toString()}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Membership Type
        </Link>
      </div>
    );
  }

  // Decode typeId for display in the form
  const decodedTypeId = decodeURIComponent(typeId);

  return (
    <FormProvider
      intent={intent as 'new' | 'renewal'}
      typeId={decodedTypeId}
      memberId={memberId}
    >
      <FormShell currentStep={currentStep} />
    </FormProvider>
  );
}
