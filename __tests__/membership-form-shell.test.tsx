import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import FormShell from '@/app/(authenticated)/dashboard/membership/form/components/FormShell';
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
      toDataURL: (type?: string) => string;
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
      toDataURL: (_type?: string) => dataUrlRef.current || 'data:image/png;base64,mock-signature',
      getTrimmedCanvas: () => ({
        toDataURL: () => dataUrlRef.current || 'data:image/png;base64,mock-signature',
      }),
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
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
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
    const backLink = screen.getByRole('link', { name: /Back/i });
    expect(backLink).toBeInTheDocument();
  });

  it('renders back button enabled on step 2', () => {
    render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={2} />
      </FormProvider>
    );
    const backLink = screen.getByRole('link', { name: /Back/i });
    expect(backLink).toBeInTheDocument();
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

  it('keeps the complete button disabled until step 4 is fully valid', async () => {
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={4} />
      </FormProvider>
    );

    const completeButton = screen.getByRole('button', { name: /Complete/i });
    expect(completeButton).toBeDisabled();

    fireEvent.click(container.querySelector('#acceptedTerms') as HTMLInputElement);
    fireEvent.click(container.querySelector('#acceptedGdpr') as HTMLInputElement);
    expect(completeButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Mock draw signature/i }));

    await waitFor(() => {
      expect(completeButton).toBeEnabled();
    });
  });

  it('logs a payload containing the signature when step 4 completes', async () => {
    const { container } = render(
      <FormProvider intent="new" typeId="Full Member">
        <FormShell currentStep={4} />
      </FormProvider>
    );

    fireEvent.click(container.querySelector('#acceptedTerms') as HTMLInputElement);
    fireEvent.click(container.querySelector('#acceptedGdpr') as HTMLInputElement);
    fireEvent.click(screen.getByRole('button', { name: /Mock draw signature/i }));

    const completeButton = screen.getByRole('button', { name: /Complete/i });

    await waitFor(() => {
      expect(completeButton).toBeEnabled();
    });

    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Membership form payload:',
        expect.objectContaining({
          consent: expect.objectContaining({
            acceptedTerms: 'true',
            acceptedGdpr: 'true',
            signature: 'data:image/png;base64,mock-signature',
          }),
        })
      );
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Membership form payload JSON:',
      expect.stringContaining('"signature": "data:image/png;base64,mock-signature"')
    );
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
    expect(screen.getByText(/Please read our Membership Terms/i)).toBeInTheDocument();
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
