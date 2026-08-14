export type CalculatorType = 
  | 'loan' 
  | 'mortgage' 
  | 'savings' 
  | 'compound' 
  | 'investment' 
  | 'currency';

export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'CHF' 
  | 'CNY' | 'BRL' | 'MXN' | 'SGD' | 'HKD' | 'NZD' | 'SEK' | 'KRW' 
  | 'ZAR' | 'AED' | 'SAR' | 'TRY' | 'PLN' | 'NOK' | 'DKK' | 'THB';

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  rateToUSD: number; // fallback rate
}

export type CompoundingFrequency = 1 | 2 | 4 | 12 | 52 | 365;

export type PaymentFrequency = 'monthly' | 'biweekly' | 'weekly' | 'annually';

// Loan Calculation Types
export interface LoanInputs {
  principal: number;
  interestRate: number; // Annual percentage (e.g., 6.5)
  loanTermYears: number;
  loanTermMonths: number;
  paymentFrequency: PaymentFrequency;
  extraPayment: number; // Extra payment per period
  originationFeePercent: number; // Upfront fee %
}

export interface AmortizationScheduleItem {
  period: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  extraPayment: number;
  totalInterest: number;
  remainingBalance: number;
}

export interface AnnualAmortizationItem {
  year: number;
  principalPaid: number;
  interestPaid: number;
  extraPaid: number;
  totalPaid: number;
  endBalance: number;
}

export interface LoanResults {
  periodicPayment: number;
  totalPaymentsCount: number;
  totalPrincipal: number;
  totalInterest: number;
  totalCost: number;
  payoffDurationMonths: number;
  interestSaved: number;
  monthsSaved: number;
  originationFeeAmount: number;
  schedule: AmortizationScheduleItem[];
  annualSchedule: AnnualAmortizationItem[];
}

// Mortgage Calculation Types
export interface MortgageInputs {
  homePrice: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
  downPaymentType: 'amount' | 'percent';
  interestRate: number;
  loanTermYears: number;
  propertyTaxRate: number; // Annual % of home value
  annualHomeInsurance: number;
  pmiRate: number; // Annual PMI % if down payment < 20%
  monthlyHoa: number;
  extraMonthlyPayment: number;
  startDate: string;
}

export interface MortgageResults {
  loanAmount: number;
  monthlyPrincipalInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyPmi: number;
  monthlyHoa: number;
  totalMonthlyPayment: number;
  totalLoanInterest: number;
  totalTaxPaid: number;
  totalInsurancePaid: number;
  totalPmiPaid: number;
  totalCostOfHome: number;
  pmiDropOffMonth: number; // month when LTV reaches 80%
  payoffMonths: number;
  interestSaved: number;
  yearsSaved: number;
  schedule: AmortizationScheduleItem[];
  annualSchedule: AnnualAmortizationItem[];
}

// Savings Calculation Types
export interface SavingsInputs {
  mode: 'futureValue' | 'goalTarget';
  initialDeposit: number;
  regularDeposit: number;
  depositFrequency: 'monthly' | 'weekly' | 'biweekly' | 'annually';
  annualInterestRate: number;
  compoundingFrequency: CompoundingFrequency;
  timeYears: number;
  timeMonths: number;
  targetGoalAmount?: number;
  inflationRate: number;
}

export interface SavingsYearlyBreakdown {
  year: number;
  startingBalance: number;
  deposits: number;
  interestEarned: number;
  endingBalance: number;
  totalDeposits: number;
  totalInterest: number;
  purchasingPower: number; // Inflation adjusted
}

export interface SavingsResults {
  finalBalance: number;
  totalInitial: number;
  totalDeposited: number;
  totalInterestEarned: number;
  effectiveApy: number;
  purchasingPower: number;
  requiredMonthlyDeposit?: number;
  schedule: SavingsYearlyBreakdown[];
  milestones: { amount: number; reachedMonth: number; reachedDate: string }[];
}

// Compound Interest Types
export interface CompoundInputs {
  principal: number;
  interestRate: number;
  compoundingFrequency: CompoundingFrequency;
  years: number;
  contributionAmount: number;
  contributionFrequency: 'monthly' | 'annually';
  contributionTiming: 'beginning' | 'end';
}

export interface CompoundYearlyData {
  year: number;
  principal: number;
  totalContributions: number;
  interestOnly: number;
  compoundInterestTotal: number;
  totalBalance: number;
  simpleInterestComparison: number;
}

export interface CompoundResults {
  finalBalance: number;
  totalPrincipal: number;
  totalContributions: number;
  totalInterest: number;
  apy: number;
  doublingTimeYears: number; // Rule of 72 and exact
  schedule: CompoundYearlyData[];
}

// Investment Projections Types
export interface InvestmentInputs {
  initialInvestment: number;
  monthlyContribution: number;
  annualReturnRate: number; // e.g. 8%
  annualDividendYield: number; // e.g. 1.8%
  dividendReinvest: boolean;
  expenseRatio: number; // e.g. 0.05%
  inflationRate: number; // e.g. 2.5%
  investmentYears: number;
  riskScenario: 'conservative' | 'moderate' | 'aggressive' | 'custom';
}

export interface InvestmentYearlyProjection {
  year: number;
  investedCapital: number;
  nominalValue: number;
  realValue: number; // Inflation adjusted
  annualDividends: number;
  totalFeesPaid: number;
  bearCaseValue: number; // -3% volatility
  bullCaseValue: number; // +4% volatility
}

export interface InvestmentResults {
  finalNominalValue: number;
  finalRealValue: number;
  totalContributions: number;
  totalCapitalGains: number;
  totalDividends: number;
  totalFeesPaid: number;
  finalYearDividendIncome: number;
  schedule: InvestmentYearlyProjection[];
}

// Saved Scenario for Comparison
export interface SavedScenario {
  id: string;
  name: string;
  type: CalculatorType;
  dateCreated: string;
  summary: {
    label1: string;
    value1: string;
    label2: string;
    value2: string;
    label3: string;
    value3: string;
  };
  payload: any;
}
