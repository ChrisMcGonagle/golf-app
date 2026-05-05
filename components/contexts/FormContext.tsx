'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Step1Data {
  firstName: string;
  surname: string;
  dob: string;
  gender: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
}

export interface Step2Data {
  isCurrentMember: string;
  isCruitHome: string;
  homeClub: string;
  homeClubCountry: string;
  hadOtherClub: string;
  previousClubs: string;
  ghinNumber: string;
  hasHandicap: string;
  handicapIndex: string;
  noHandicapSyncWanted: string;
}

export interface Step3Data {
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyPhone: string;
  medicalConditions: string;
  allergies: string;
  medications: string;
  additionalAssistance: string;
}

export interface Step4Data {
  acceptedTerms: string;
  acceptedGdpr: string;
}

export interface FlowContext {
  intent: 'new' | 'renewal';
  typeId: string;
  memberId?: string;
}

export interface FormContextType {
  // Form data
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  setStep1: (data: Partial<Step1Data>) => void;
  setStep2: (data: Partial<Step2Data>) => void;
  setStep3: (data: Partial<Step3Data>) => void;
  setStep4: (data: Partial<Step4Data>) => void;
  // Flow context
  flow: FlowContext;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

const initialStep1: Step1Data = {
  firstName: '',
  surname: '',
  dob: '',
  gender: '',
  address1: '',
  address2: '',
  address3: '',
  city: '',
  county: '',
  postalCode: '',
  country: '',
  email: '',
  phone: '',
};

const initialStep2: Step2Data = {
  isCurrentMember: '',
  isCruitHome: '',
  homeClub: '',
  homeClubCountry: '',
  hadOtherClub: '',
  previousClubs: '',
  ghinNumber: '',
  hasHandicap: '',
  handicapIndex: '',
  noHandicapSyncWanted: '',
};

const initialStep3: Step3Data = {
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyPhone: '',
  medicalConditions: '',
  allergies: '',
  medications: '',
  additionalAssistance: '',
};

const initialStep4: Step4Data = {
  acceptedTerms: '',
  acceptedGdpr: '',
};

interface FormProviderProps {
  children: ReactNode;
  intent: 'new' | 'renewal';
  typeId: string;
  memberId?: string;
}

export function FormProvider({
  children,
  intent,
  typeId,
  memberId,
}: FormProviderProps) {
  const [step1, setStep1State] = useState<Step1Data>(initialStep1);
  const [step2, setStep2State] = useState<Step2Data>(initialStep2);
  const [step3, setStep3State] = useState<Step3Data>(initialStep3);
  const [step4, setStep4State] = useState<Step4Data>(initialStep4);

  const setStep1 = (data: Partial<Step1Data>) => {
    setStep1State((prev) => ({ ...prev, ...data }));
  };

  const setStep2 = (data: Partial<Step2Data>) => {
    setStep2State((prev) => ({ ...prev, ...data }));
  };

  const setStep3 = (data: Partial<Step3Data>) => {
    setStep3State((prev) => ({ ...prev, ...data }));
  };

  const setStep4 = (data: Partial<Step4Data>) => {
    setStep4State((prev) => ({ ...prev, ...data }));
  };

  const flow: FlowContext = {
    intent,
    typeId,
    memberId,
  };

  const value: FormContextType = {
    step1,
    step2,
    step3,
    step4,
    setStep1,
    setStep2,
    setStep3,
    setStep4,
    flow,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useFormContext(): FormContextType {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within FormProvider');
  }
  return context;
}
