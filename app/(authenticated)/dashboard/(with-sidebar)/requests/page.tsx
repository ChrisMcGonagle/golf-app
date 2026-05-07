import { RequestsTableClient } from './RequestsTableClient';
import { getMembershipRequestsForAdmin } from '@/lib/actions/getMembershipRequests';

export default async function RequestsPage() {
  const rows = await getMembershipRequestsForAdmin();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <RequestsTableClient rows={rows} />
    </div>
  );
}