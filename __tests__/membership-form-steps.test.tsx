import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step1Personal from '@/app/(authenticated)/dashboard/membership/form/components/Step1Personal';
import Step2Membership from '@/app/(authenticated)/dashboard/membership/form/components/Step2Membership';
import Step3Safeguarding from '@/app/(authenticated)/dashboard/membership/form/components/Step3Safeguarding';
import Step4Placeholder from '@/app/(authenticated)/dashboard/membership/form/components/Step4Placeholder';
import { FormProvider } from '@/components/contexts/FormContext';

jest.mock('react-signature-canvas', () => {
  const React = require('react');

  return React.forwardRef(function MockSignatureCanvas(
    {
      onEnd,
      canvasProps,
    }: {
      onEnd?: () => void;
      canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    },
    ref: React.ForwardedRef<{
      clear: () => void;
      isEmpty: () => boolean;
      fromDataURL: (value: string) => void;
      getTrimmedCanvas: () => { toDataURL: () => string };
    }>
  ) {
    const [dataUrl, setDataUrl] = React.useState('');
    const dataUrlRef = React.useRef('');

    React.useImperativeHandle(ref, () => ({
      clear: () => {
        dataUrlRef.current = '';
        setDataUrl('');
      },
      isEmpty: () => !dataUrlRef.current,
      fromDataURL: (value: string) => {
        dataUrlRef.current = value;
        setDataUrl(value);
      },
      getTrimmedCanvas: () => ({
        toDataURL: () => dataUrlRef.current || 'data:image/png;base64,mock-signature',
      }),
      toDataURL: () => dataUrlRef.current || 'data:image/png;base64,mock-signature',
    }), []);

    return (
      <div>
        <canvas {...canvasProps} data-testid="signature-canvas" />
        <button
          type="button"
          onClick={() => {
            dataUrlRef.current = 'data:image/png;base64,mock-signature';
            setDataUrl('data:image/png;base64,mock-signature');
            onEnd?.();
          }}
        >
          Mock draw signature
        </button>
      </div>
    );
  });
});

describe('Step1Personal', () => {
  const mockOnValidationChange = jest.fn();

  it('renders all 12 visible personal detail fields', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <Step1Personal onValidationChange={mockOnValidationChange} />
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
      <FormProvider intent="new" typeId="Full Member">
        <Step1Personal onValidationChange={mockOnValidationChange} />
      </FormProvider>
    );

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(false);
    });
  });

  it('validates email format', async () => {
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step1Personal onValidationChange={jest.fn()} />
      </FormProvider>
    );

    const emailInput = container.querySelector('#email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    await waitFor(() => {
      // Component should update validation state (calling onValidationChange with false)
      expect(emailInput.classList.contains('border-red-500')).toBe(true);
    });
  });

});

describe('Step2Membership', () => {
  it('renders isCurrentMember as first required field', () => {
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step2Membership onValidationChange={jest.fn()} />
      </FormProvider>
    );

    expect(container.querySelector('#isCurrentMember')).toBeInTheDocument();
    expect(container.querySelector('#homeClub')).toBeInTheDocument();
    expect(container.querySelector('#ghinNumber')).toBeInTheDocument();
  });

  it('shows validation error for isCurrentMember when required', async () => {
    const onValidationChange = jest.fn();
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step2Membership onValidationChange={onValidationChange} />
      </FormProvider>
    );

    const isCurrentMemberSelect = container.querySelector('#isCurrentMember') as HTMLSelectElement;
    await waitFor(() => {
      expect(isCurrentMemberSelect.classList.contains('border-red-500')).toBe(true);
    });
  });

  it('disables ghinNumber when isCurrentMember is not Yes', () => {
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step2Membership onValidationChange={jest.fn()} />
      </FormProvider>
    );

    const ghinInput = container.querySelector('#ghinNumber') as HTMLInputElement;
    expect(ghinInput).toBeDisabled();
  });

  it('enables ghinNumber when isCurrentMember is set to Yes', async () => {
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step2Membership onValidationChange={jest.fn()} />
      </FormProvider>
    );

    const isCurrentMemberSelect = container.querySelector('#isCurrentMember') as HTMLSelectElement;
    fireEvent.change(isCurrentMemberSelect, { target: { value: 'Yes' } });

    const ghinInput = container.querySelector('#ghinNumber') as HTMLInputElement;
    await waitFor(() => {
      expect(ghinInput).not.toBeDisabled();
    });
  });
});

describe('Step3Safeguarding', () => {
  it('renders all safeguarding fields', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <Step3Safeguarding onValidationChange={jest.fn()} />
      </FormProvider>
    );

    expect(screen.getByLabelText(/Emergency Contact Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Emergency Contact Relationship/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Emergency Contact Phone Number/i)).toBeInTheDocument();
  });

  it('validates required emergency contact fields', async () => {
    const onValidationChange = jest.fn();
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step3Safeguarding onValidationChange={onValidationChange} />
      </FormProvider>
    );

    const emergencyContactNameInput = container.querySelector('#emergencyContactName') as HTMLInputElement;
    await waitFor(() => {
      expect(emergencyContactNameInput.classList.contains('border-red-500')).toBe(true);
    });
  });

  it('validates phone format', async () => {
    const onValidationChange = jest.fn();
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step3Safeguarding onValidationChange={onValidationChange} />
      </FormProvider>
    );

    const phoneInput = container.querySelector('#emergencyPhone') as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone!@#' } });

    await waitFor(() => {
      // Component should apply red border styling when there's an error
      expect(phoneInput.classList.contains('border-red-500')).toBe(true);
    });
  });
});

describe('Step4Placeholder', () => {
  const mockOnValidationChange = jest.fn();

  it('renders intro text about membership terms', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <Step4Placeholder onValidationChange={mockOnValidationChange} />
      </FormProvider>
    );

    expect(screen.getByText(/Please read our Membership Terms/i)).toBeInTheDocument();
  });

  it('requires acceptedTerms checkbox', async () => {
    const onValidationChange = jest.fn();
    render(
      <FormProvider intent="new" typeId="Full Member">
        <Step4Placeholder onValidationChange={onValidationChange} />
      </FormProvider>
    );

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(false);
    });
  });

  it('renders acceptedTerms checkbox with correct label', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <Step4Placeholder onValidationChange={jest.fn()} />
      </FormProvider>
    );

    expect(screen.getByText(/By ticking this box I confirm I have read and agree to be bound by the Terms/i)).toBeInTheDocument();
  });

  it('renders acceptedGdpr checkbox with correct label', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <Step4Placeholder onValidationChange={jest.fn()} />
      </FormProvider>
    );

    expect(screen.getByText(/I confirm that I have read and accept the GDPR and data-processing terms/i)).toBeInTheDocument();
  });

  it('renders signature label and clear button', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <Step4Placeholder onValidationChange={jest.fn()} />
      </FormProvider>
    );

    expect(screen.getByText(/Please provide your signature/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
  });

  it('calls onValidationChange when acceptedTerms is checked', async () => {
    const onValidationChange = jest.fn();
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step4Placeholder onValidationChange={onValidationChange} />
      </FormProvider>
    );

    const acceptedTermsCheckbox = container.querySelector('#acceptedTerms') as HTMLInputElement;
    fireEvent.click(acceptedTermsCheckbox);

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalled();
    });
  });

  it('is invalid without a signature even when both checkboxes are checked', async () => {
    const onValidationChange = jest.fn();
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step4Placeholder onValidationChange={onValidationChange} />
      </FormProvider>
    );

    fireEvent.click(container.querySelector('#acceptedTerms') as HTMLInputElement);
    fireEvent.click(container.querySelector('#acceptedGdpr') as HTMLInputElement);

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(false);
    });

    expect(screen.getByText(/Please provide your signature/i)).toBeInTheDocument();
  });

  it('becomes valid when both checkboxes and a signature are present', async () => {
    const onValidationChange = jest.fn();
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step4Placeholder onValidationChange={onValidationChange} />
      </FormProvider>
    );

    fireEvent.click(container.querySelector('#acceptedTerms') as HTMLInputElement);
    fireEvent.click(container.querySelector('#acceptedGdpr') as HTMLInputElement);
    fireEvent.click(screen.getByRole('button', { name: /Mock draw signature/i }));

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenLastCalledWith(true);
    });
  });

  it('clear resets signature and returns the step to an invalid state', async () => {
    const onValidationChange = jest.fn();
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <Step4Placeholder onValidationChange={onValidationChange} />
      </FormProvider>
    );

    fireEvent.click(container.querySelector('#acceptedTerms') as HTMLInputElement);
    fireEvent.click(container.querySelector('#acceptedGdpr') as HTMLInputElement);
    fireEvent.click(screen.getByRole('button', { name: /Mock draw signature/i }));

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenLastCalledWith(true);
    });

    fireEvent.click(screen.getByRole('button', { name: /^Clear$/i }));

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenLastCalledWith(false);
    });

    expect(screen.getByText(/Please provide your signature/i)).toBeInTheDocument();
  });
});
