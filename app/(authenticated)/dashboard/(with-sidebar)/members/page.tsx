import { getMembers } from '@/lib/actions/getMembers';
import { MembersTableClient } from './MembersTableClient';

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MembersTableClient members={members} />
    </div>
  );
}
