export type MembershipIntent = 'new' | 'renewal';
export type MembershipAction = 'form' | 'email';
export type MemberFlowSearchResult = {
  id: string;
  MEMBER_NUMBER: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  MEMBERSHIP_TYPE: string | null;
};
