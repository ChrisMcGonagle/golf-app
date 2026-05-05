import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import FormShell from '@/app/(authenticated)/dashboard/membership/form/components/FormShell';
import { FormProvider } from '@/components/contexts/FormContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

const mockSearchParams = new URLSearchParams('step=1&intent=new&typeId=Full+Member');

describe('FormShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('renders step 1 indicator', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={1} />
      </FormProvider>
    );
    expect(screen.getByText(/personal details/i)).toBeInTheDocument();
  });

  it('renders back button disabled on step 1', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={1} />
      </FormProvider>
    );
    const backButton = screen.getByRole('button', { name: /Back/i });
    expect(backButton).toBeDisabled();
  });

  it('renders back button enabled on step 2', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={2} />
      </FormProvider>
    );
    const backButton = screen.getByRole('button', { name: /Back/i });
    expect(backButton).not.toBeDisabled();
  });

  it('renders next button on steps 1-3', () => {
    for (let step = 1; step <= 3; step++) {
      const { unmount } = render(
        <FormProvider intent="new" typeId="Full Member">
          <FormShell currentStep={step} />
        </FormProvider>
      );
      expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      unmount();
    }
  });

  it('renders complete button on step 4', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={4} />
      </FormProvider>
    );
    expect(screen.getByRole('button', { name: /Complete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete/i })).toBeDisabled();
  });

  it('disables next button when step is invalid', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={1} />
      </FormProvider>
    );
    const nextButton = screen.getByRole('button', { name: /Next/i });
    // Next button should be disabled initially because required fields are empty
    expect(nextButton).toBeDisabled();
  });

  it('renders step 1 content', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={1} />
      </FormProvider>
    );
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Surname/i)).toBeInTheDocument();
  });

  it('renders step 2 content', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={2} />
      </FormProvider>
    );
    expect(screen.getByLabelText(/Will Cruit Island/i)).toBeInTheDocument();
  });

  it('renders step 3 content', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={3} />
      </FormProvider>
    );
    expect(screen.getByLabelText(/Emergency Contact Name/i)).toBeInTheDocument();
  });

  it('renders step 4 placeholder content', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={4} />
      </FormProvider>
    );
    expect(screen.getByText(/Consent information/i)).toBeInTheDocument();
  });

  it('renders step indicator for each step', () => {
    const stepLabels = ['PERSONAL DETAILS', 'MEMBERSHIP DETAILS', 'SAFEGUARDING & MEDICAL', 'ADDITIONAL INFO & CONSENT'];
    for (let step = 1; step <= 4; step++) {
      const { unmount } = render(
        <FormProvider intent="new" typeId="Full Member">
          <FormShell currentStep={step} />
        </FormProvider>
      );
      expect(screen.getByText(stepLabels[step - 1])).toBeInTheDocument();
      unmount();
    }
  });

  it('displays flow context (journey type) on step 1', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={1} />
      </FormProvider>
    );
    expect(screen.getByText(/New Membership/i)).toBeInTheDocument();
  });

  it('displays flow context for renewal journey', () => {
    render(
      <FormProvider intent="renewal" typeId="Standard Member" memberId="member-123">
        <FormShell currentStep={1} />
      </FormProvider>
    );
    expect(screen.getByText(/Renewal/i)).toBeInTheDocument();
    expect(screen.getByText(/member-123/i)).toBeInTheDocument();
  });
});

describe('FormShell with memberId (renewal)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('renders form with memberId for renewal flow', () => {
    render(
      <FormProvider intent="renewal" typeId="Full Member" memberId="member-123">
        <FormShell currentStep={1} />
      </FormProvider>
    );
    expect(screen.getByText(/personal details/i)).toBeInTheDocument();
  });
});
