import { getMembers } from '@/lib/actions/getMembers';
import { MembersTableClient } from './MembersTableClient';

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div>
      <MembersTableClient members={members} />
    </div>
  );
}
