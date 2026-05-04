export type MembershipIntent = 'new' | 'renewal';
export type MembershipAction = 'form' | 'email';
export type MemberFlowSearchResult = {
  MEMBER_NUMBER: number;
  FIRST_NAME: string;
  LAST_NAME: string;
  MEMBERSHIP_TYPE: string | null;
};
