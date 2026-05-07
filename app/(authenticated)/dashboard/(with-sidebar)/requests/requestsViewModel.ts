export type RequestStatus = 'Pending' | 'In Progress' | 'Completed';

export type RequestStepState = 'completed' | 'active' | 'pending' | 'failed';

export type RequestStep = {
  label: '1' | '2' | '3';
  title: 'Golf Ireland' | 'BRS' | 'ClubV1';
  state: RequestStepState;
  showWarningIcon?: boolean;
};

export type RequestPayload = {
  name: string;
  email: string;
  membershipType: string;
  phone: string;
  club: string;
  notes: string;
};

export type RequestIntent = 'New' | 'Renew';

export type RequestIntentSource = 'email' | 'form';

export type RequestRow = {
  id: string;
  request: string;
  creationDateTime: string;
  submittedDateTime: string;
  requester: string;
  intent: RequestIntent;
  intentSource: RequestIntentSource;
  membershipStatus: string;
  status: RequestStatus;
  steps: [RequestStep, RequestStep, RequestStep];
  payload: RequestPayload;
};

export const mockRequestRows: RequestRow[] = [
  {
    id: 'REQ-1001',
    request: 'Full Member',
    creationDateTime: '07 May 2026, 09:12',
    submittedDateTime: '07 May 2026, 09:18',
    requester: 'Aisling Murphy',
    intent: 'New',
    intentSource: 'form',
    membershipStatus: 'New Member',
    status: 'Pending',
    steps: [
      { label: '1', title: 'Golf Ireland', state: 'active' },
      { label: '2', title: 'BRS', state: 'pending' },
      { label: '3', title: 'ClubV1', state: 'pending' },
    ],
    payload: {
      name: 'Aisling Murphy',
      email: 'aisling.murphy@example.com',
      membershipType: 'Full Member',
      phone: '(087) 321-4567',
      club: 'Elm Park Golf Club',
      notes: 'Recently moved to Dublin and would like an early morning tee-time option.',
    },
  },
  {
    id: 'REQ-1002',
    request: 'Senior Member',
    creationDateTime: '06 May 2026, 14:05',
    submittedDateTime: '06 May 2026, 14:22',
    requester: 'Brian Kelly',
    intent: 'Renew',
    intentSource: 'email',
    membershipStatus: 'Awaiting Approval',
    status: 'In Progress',
    steps: [
      { label: '1', title: 'Golf Ireland', state: 'completed' },
      { label: '2', title: 'BRS', state: 'failed', showWarningIcon: true },
      { label: '3', title: 'ClubV1', state: 'pending' },
    ],
    payload: {
      name: 'Brian Kelly',
      email: 'brian.kelly@example.com',
      membershipType: 'Senior Member',
      phone: '(086) 555-0198',
      club: 'Portmarnock Golf Club',
      notes: 'Renewal includes a request to keep handicap history synced with BRS.',
    },
  },
  {
    id: 'REQ-1003',
    request: 'Junior',
    creationDateTime: '05 May 2026, 11:30',
    submittedDateTime: '05 May 2026, 11:42',
    requester: 'Ciara O\'Brien',
    intent: 'Renew',
    intentSource: 'form',
    membershipStatus: 'Renewed',
    status: 'Completed',
    steps: [
      { label: '1', title: 'Golf Ireland', state: 'completed' },
      { label: '2', title: 'BRS', state: 'completed' },
      { label: '3', title: 'ClubV1', state: 'completed' },
    ],
    payload: {
      name: "Ciara O'Brien",
      email: 'ciara.obrien@example.com',
      membershipType: 'Junior',
      phone: '(085) 777-2134',
      club: 'Greystones Golf Club',
      notes: 'Guardian requested coaching programme details and weekend access information.',
    },
  },
  {
    id: 'REQ-1004',
    request: 'Overseas Life',
    creationDateTime: '07 May 2026, 10:01',
    submittedDateTime: '07 May 2026, 10:15',
    requester: 'Daniel Flynn',
    intent: 'Renew',
    intentSource: 'email',
    membershipStatus: 'Pending Renewal',
    status: 'Pending',
    steps: [
      { label: '1', title: 'Golf Ireland', state: 'pending' },
      { label: '2', title: 'BRS', state: 'pending' },
      { label: '3', title: 'ClubV1', state: 'pending' },
    ],
    payload: {
      name: 'Daniel Flynn',
      email: 'daniel.flynn@example.com',
      membershipType: 'Overseas Life',
      phone: '(083) 444-9921',
      club: 'Royal County Down',
      notes: 'Travels between Belfast and New York, so the account should remain remote-only.',
    },
  },
  {
    id: 'REQ-1005',
    request: 'Corporate Member',
    creationDateTime: '07 May 2026, 10:24',
    submittedDateTime: '07 May 2026, 10:37',
    requester: 'Emer Walsh',
    intent: 'New',
    intentSource: 'form',
    membershipStatus: 'Awaiting Approval',
    status: 'Pending',
    steps: [
      { label: '1', title: 'Golf Ireland', state: 'active' },
      { label: '2', title: 'BRS', state: 'pending' },
      { label: '3', title: 'ClubV1', state: 'pending' },
    ],
    payload: {
      name: 'Emer Walsh',
      email: 'emer.walsh@example.com',
      membershipType: 'Corporate Member',
      phone: '(086) 410-2288',
      club: 'The K Club',
      notes: 'Company package should include weekday guest access for visiting clients.',
    },
  },
  {
    id: 'REQ-1006',
    request: 'Distance Member',
    creationDateTime: '07 May 2026, 10:46',
    submittedDateTime: '07 May 2026, 10:58',
    requester: 'Fiona Hart',
    intent: 'New',
    intentSource: 'email',
    membershipStatus: 'New Member',
    status: 'Pending',
    steps: [
      { label: '1', title: 'Golf Ireland', state: 'active' },
      { label: '2', title: 'BRS', state: 'pending' },
      { label: '3', title: 'ClubV1', state: 'pending' },
    ],
    payload: {
      name: 'Fiona Hart',
      email: 'fiona.hart@example.com',
      membershipType: 'Distance Member',
      phone: '(087) 645-1130',
      club: 'Galway Bay Golf Resort',
      notes: 'Lives outside the county and wants to confirm eligibility for distance pricing.',
    },
  },
  {
    id: 'REQ-1007',
    request: 'Country Member',
    creationDateTime: '07 May 2026, 11:09',
    submittedDateTime: '07 May 2026, 11:21',
    requester: 'Grace Doyle',
    intent: 'Renew',
    intentSource: 'form',
    membershipStatus: 'Pending Review',
    status: 'Pending',
    steps: [
      { label: '1', title: 'Golf Ireland', state: 'pending' },
      { label: '2', title: 'BRS', state: 'pending' },
      { label: '3', title: 'ClubV1', state: 'pending' },
    ],
    payload: {
      name: 'Grace Doyle',
      email: 'grace.doyle@example.com',
      membershipType: 'Country Member',
      phone: '(085) 229-8814',
      club: 'Mount Juliet Estate',
      notes: 'Requested confirmation that reciprocal club access remains available during summer.',
    },
  },
  {
    id: 'REQ-1008',
    request: 'Pavilion Social',
    creationDateTime: '07 May 2026, 11:34',
    submittedDateTime: '07 May 2026, 11:49',
    requester: 'Hugh Larkin',
    intent: 'New',
    intentSource: 'email',
    membershipStatus: 'Awaiting Payment',
    status: 'Pending',
    steps: [
      { label: '1', title: 'Golf Ireland', state: 'pending' },
      { label: '2', title: 'BRS', state: 'pending' },
      { label: '3', title: 'ClubV1', state: 'pending' },
    ],
    payload: {
      name: 'Hugh Larkin',
      email: 'hugh.larkin@example.com',
      membershipType: 'Pavilion Social',
      phone: '(083) 118-0045',
      club: 'Castleknock Golf Club',
      notes: 'Interested in clubhouse events only and does not need tee booking access.',
    },
  },
  {
    id: 'REQ-1009',
    request: 'Student Member',
    creationDateTime: '18 Apr 2025, 08:10',
    submittedDateTime: '18 Apr 2025, 08:26',
    requester: 'Isla Byrne',
    intent: 'Renew',
    intentSource: 'form',
    membershipStatus: 'Renewed',
    status: 'Completed',
    steps: [
      { label: '1', title: 'Golf Ireland', state: 'completed' },
      { label: '2', title: 'BRS', state: 'completed' },
      { label: '3', title: 'ClubV1', state: 'completed' },
    ],
    payload: {
      name: 'Isla Byrne',
      email: 'isla.byrne@example.com',
      membershipType: 'Student Member',
      phone: '(085) 441-2098',
      club: 'Lahinch Golf Club',
      notes: 'Requested student pricing confirmation before the summer term starts.',
    },
  },
];