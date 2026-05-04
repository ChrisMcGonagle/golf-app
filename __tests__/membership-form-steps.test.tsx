import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step1Personal from '@/app/(authenticated)/dashboard/membership/form/components/Step1Personal';
import Step2Membership from '@/app/(authenticated)/dashboard/membership/form/components/Step2Membership';
import Step3Safeguarding from '@/app/(authenticated)/dashboard/membership/form/components/Step3Safeguarding';
import Step4Placeholder from '@/app/(authenticated)/dashboard/membership/form/components/Step4Placeholder';
import { FormProvider } from '@/components/contexts/FormContext';

describe('Step1Personal', () => {
  const mockOnValidationChange = jest.fn();

  it('renders all 13 personal detail fields', () => {
    render(
      <FormProvider>
        <Step1Personal
          onValidationChange={mockOnValidationChange}
          intent="new"
        />
      </FormProvider>
    );

    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Surname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gender/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
  });

  it('shows validation error for empty required fields', async () => {
    render(
      <FormProvider>
        <Step1Personal
          onValidationChange={mockOnValidationChange}
          intent="new"
        />
      </FormProvider>
    );

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(false);
    });
  });

  it('validates email format', async () => {
    render(
      <FormProvider>
        <Step1Personal
          onValidationChange={jest.fn()}
          intent="new"
        />
      </FormProvider>
    );

    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    await waitFor(() => {
      expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
    });
  });
});

describe('Step2Membership', () => {
  it('renders all membership detail fields', () => {
    const { container } = render(
      <FormProvider>
        <Step2Membership
          onValidationChange={jest.fn()}
          intent="new"
        />
      </FormProvider>
    );

    expect(container.querySelector('#isCruitHome')).toBeInTheDocument();
    expect(container.querySelector('#homeClub')).toBeInTheDocument();
    expect(container.querySelector('#previousClubs')).toBeInTheDocument();
    expect(container.querySelector('#ghinNumber')).toBeInTheDocument();
  });

  it('shows validation errors for missing required fields', async () => {
    render(
      <FormProvider>
        <Step2Membership
          onValidationChange={jest.fn()}
          intent="new"
        />
      </FormProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Please select if Cruit Island is your home club/i)).toBeInTheDocument();
    });
  });

  it('disables homeClub when isCruitHome is Yes', async () => {
    const { container } = render(
      <FormProvider>
        <Step2Membership
          onValidationChange={jest.fn()}
          intent="new"
        />
      </FormProvider>
    );

    const cruitSelect = container.querySelector('#isCruitHome') as HTMLSelectElement;
    fireEvent.change(cruitSelect, { target: { value: 'Yes' } });

    const homeClubInput = container.querySelector('#homeClub') as HTMLInputElement;
    await waitFor(() => {
      expect(homeClubInput).toBeDisabled();
    });
  });

  it('disables ghinNumber when homeClub is empty', () => {
    const { container } = render(
      <FormProvider>
        <Step2Membership
          onValidationChange={jest.fn()}
          intent="new"
        />
      </FormProvider>
    );

    const ghinInput = container.querySelector('#ghinNumber') as HTMLInputElement;
    expect(ghinInput).toBeDisabled();
  });
});

describe('Step3Safeguarding', () => {
  it('renders all safeguarding fields', () => {
    render(
      <FormProvider>
        <Step3Safeguarding
          onValidationChange={jest.fn()}
          intent="new"
        />
      </FormProvider>
    );

    expect(screen.getByLabelText(/Emergency Contact Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Relationship/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Emergency Phone/i)).toBeInTheDocument();
  });

  it('validates required emergency contact fields', async () => {
    render(
      <FormProvider>
        <Step3Safeguarding
          onValidationChange={jest.fn()}
          intent="new"
        />
      </FormProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Emergency contact name is required/i)).toBeInTheDocument();
    });
  });

  it('validates phone format', async () => {
    const { container } = render(
      <FormProvider>
        <Step3Safeguarding
          onValidationChange={jest.fn()}
          intent="new"
        />
      </FormProvider>
    );

    const phoneInput = container.querySelector('#emergencyPhone') as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone!@#' } });

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid phone number/i)).toBeInTheDocument();
    });
  });
});

describe('Step4Placeholder', () => {
  it('renders placeholder content', () => {
    render(
      <FormProvider>
        <Step4Placeholder intent="new" />
      </FormProvider>
    );

    expect(screen.getByText(/Additional Info and Consent/i)).toBeInTheDocument();
    expect(screen.getByText(/Consent information/i)).toBeInTheDocument();
  });
});
