import { RequestsTableClient } from './RequestsTableClient';
import { mockRequestRows } from './requestsViewModel';

export default function RequestsPage() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <RequestsTableClient rows={mockRequestRows} />
    </div>
  );
}