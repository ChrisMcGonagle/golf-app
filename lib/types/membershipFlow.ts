export type MembershipIntent = 'new' | 'renewal';
export type MembershipAction = 'form' | 'email';
export type MemberFlowSearchResult = {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  membership_type: string | null;
};
