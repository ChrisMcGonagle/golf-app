import { render, screen } from '@testing-library/react';
import SelectUserPage from '@/app/select-user/page';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Staff User Selection Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renders staff profile cards', () => {
    it('should render all staff profiles fetched from the database', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'John Smith',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: null,
        },
        {
          id: 'profile-2',
          display_name: 'Jane Doe',
          avatar_url: 'https://example.com/avatar.jpg',
          role: 'staff' as const,
          pin_hash: 'hash456',
          pin_locked_until: null,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      render(component);

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should display avatar image when avatar_url is present', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: null,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      const { container } = render(component);

      const img = container.querySelector('img[alt="Test User"]') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/avatar.jpg');
    });

    it('should show initials badge when avatar_url is null', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'John Smith',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: null,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      render(component);

      expect(screen.getByText('JS')).toBeInTheDocument();
    });
  });

  describe('locks accounts based on pin_locked_until timestamp', () => {
    it('should show "Locked" badge for profiles with pin_locked_until in the future', async () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min from now

      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'Locked User',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: futureDate,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      render(component);

      expect(screen.getByText('Locked')).toBeInTheDocument();
    });

    it('should not show "Locked" badge for profiles with pin_locked_until in the past', async () => {
      const pastDate = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 min ago

      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'Unlocked User',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: pastDate,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      render(component);

      const lockedBadges = screen.queryAllByText('Locked');
      expect(lockedBadges.length).toBe(0);
    });

    it('should treat null pin_locked_until as unlocked', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'Test User',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: null,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      render(component);

      const lockedBadges = screen.queryAllByText('Locked');
      expect(lockedBadges.length).toBe(0);
    });
  });

  describe('navigation links', () => {
    it('should link unlocked profiles with pin_hash to /pin route', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'Test User',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: null,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      const { container } = render(component);

      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link?.href).toContain('/pin?userId=profile-1');
    });

    it('should link unlocked profiles without pin_hash to /setup-pin route', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'Test User',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: null,
          pin_locked_until: null,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      const { container } = render(component);

      const link = container.querySelector('a') as HTMLAnchorElement;
      expect(link?.href).toContain('/setup-pin?userId=profile-1');
    });

    it('should not make locked profiles interactive', async () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'Locked User',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: futureDate,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      const { container } = render(component);

      const link = container.querySelector('a');
      expect(link).not.toBeInTheDocument();
    });
  });

  describe('error message display', () => {
    it('should render error message when ?error=locked query param is present', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'Test User',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: null,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({
        searchParams: Promise.resolve({ error: 'locked' }),
      });
      render(component);

      expect(screen.getByText('Account Locked')).toBeInTheDocument();
      expect(screen.getByText(/This account is locked/)).toBeInTheDocument();
    });

    it('should not show error message when error query param is not locked', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'Test User',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: null,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({
        searchParams: Promise.resolve({ error: 'other' }),
      });
      render(component);

      expect(screen.queryByText('Account Locked')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should render "No staff profiles available" when no profiles are returned', async () => {
      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      render(component);

      expect(screen.getByText('No staff profiles available')).toBeInTheDocument();
    });

    it('should render error message when database fetch fails', async () => {
      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database connection failed'),
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      render(component);

      expect(screen.getByText(/Unable to load profiles/)).toBeInTheDocument();
    });
  });

  describe('page rendering', () => {
    it('should render page title "Select Staff Member"', async () => {
      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      render(component);

      expect(screen.getByText('Select Staff Member')).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should render grid container with responsive grid classes', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          display_name: 'Test User',
          avatar_url: null,
          role: 'staff' as const,
          pin_hash: 'hash123',
          pin_locked_until: null,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProfiles,
              error: null,
            }),
          }),
        }),
      } as any);

      const component = await SelectUserPage({ searchParams: Promise.resolve({}) });
      const { container } = render(component);

      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
