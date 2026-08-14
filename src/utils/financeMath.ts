import {
  LoanInputs,
  LoanResults,
  MortgageInputs,
  MortgageResults,
  SavingsInputs,
  SavingsResults,
  CompoundInputs,
  CompoundResults,
  InvestmentInputs,
  InvestmentResults,
  AmortizationScheduleItem,
  AnnualAmortizationItem,
  SavingsYearlyBreakdown,
  CompoundYearlyData,
  InvestmentYearlyProjection,
} from '../types';

/**
 * LOAN CALCULATOR ENGINE
 */
export function calculateLoan(inputs: LoanInputs): LoanResults {
  const principal = Math.max(0, inputs.principal);
  const annualRate = Math.max(0, inputs.interestRate) / 100;
  const extraPayment = Math.max(0, inputs.extraPayment || 0);
  const originationFeeRate = Math.max(0, inputs.originationFeePercent || 0) / 100;
  const originationFeeAmount = principal * originationFeeRate;

  let periodsPerYear = 12;
  if (inputs.paymentFrequency === 'biweekly') periodsPerYear = 26;
  if (inputs.paymentFrequency === 'weekly') periodsPerYear = 52;
  if (inputs.paymentFrequency === 'annually') periodsPerYear = 1;

  const totalYears = (inputs.loanTermYears || 0) + (inputs.loanTermMonths || 0) / 12;
  const totalStandardPeriods = Math.round(totalYears * periodsPerYear);

  if (principal === 0 || totalStandardPeriods === 0) {
    return {
      periodicPayment: 0,
      totalPaymentsCount: 0,
      totalPrincipal: 0,
      totalInterest: 0,
      totalCost: 0,
      payoffDurationMonths: 0,
      interestSaved: 0,
      monthsSaved: 0,
      originationFeeAmount: 0,
      schedule: [],
      annualSchedule: [],
    };
  }

  const ratePerPeriod = annualRate / periodsPerYear;
  
  // Standard PMT calculation
  let basePeriodicPayment = 0;
  if (ratePerPeriod > 0) {
    basePeriodicPayment =
      (principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, totalStandardPeriods))) /
      (Math.pow(1 + ratePerPeriod, totalStandardPeriods) - 1);
  } else {
    basePeriodicPayment = principal / totalStandardPeriods;
  }

  // Calculate baseline total interest without extra payments
  let baselineTotalInterest = 0;
  if (ratePerPeriod > 0) {
    baselineTotalInterest = basePeriodicPayment * totalStandardPeriods - principal;
  }

  // Generate Amortization Schedule with Extra Payments
  const schedule: AmortizationScheduleItem[] = [];
  let currentBalance = principal;
  let accumulatedInterest = 0;
  let period = 1;
  const now = new Date();

  while (currentBalance > 0.001 && period <= totalStandardPeriods * 2) {
    const interestForPeriod = currentBalance * ratePerPeriod;
    let principalForPeriod = basePeriodicPayment - interestForPeriod;
    
    // Extra payment applied directly to principal
    let actualExtra = extraPayment;
    let totalPrincipalPaid = principalForPeriod + actualExtra;

    if (totalPrincipalPaid >= currentBalance) {
      totalPrincipalPaid = currentBalance;
      principalForPeriod = Math.max(0, currentBalance - actualExtra);
      if (principalForPeriod + actualExtra > currentBalance) {
        actualExtra = currentBalance - principalForPeriod;
      }
      currentBalance = 0;
    } else {
      currentBalance -= totalPrincipalPaid;
    }

    accumulatedInterest += interestForPeriod;
    const actualPayment = principalForPeriod + interestForPeriod + actualExtra;

    const paymentDate = new Date(now.getFullYear(), now.getMonth() + Math.floor((period * 12) / periodsPerYear), 1);
    const dateString = paymentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    schedule.push({
      period,
      date: dateString,
      payment: actualPayment,
      principal: principalForPeriod,
      interest: interestForPeriod,
      extraPayment: actualExtra,
      totalInterest: accumulatedInterest,
      remainingBalance: Math.max(0, currentBalance),
    });

    if (currentBalance <= 0.001) break;
    period++;
  }

  // Aggregate to Annual Schedule
  const annualSchedule: AnnualAmortizationItem[] = [];
  let yearPrincipal = 0;
  let yearInterest = 0;
  let yearExtra = 0;
  let currentYear = 1;

  for (let i = 0; i < schedule.length; i++) {
    const item = schedule[i];
    yearPrincipal += item.principal;
    yearInterest += item.interest;
    yearExtra += item.extraPayment;

    const isYearEnd = (i + 1) % periodsPerYear === 0 || i === schedule.length - 1;
    if (isYearEnd) {
      annualSchedule.push({
        year: currentYear,
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        extraPaid: yearExtra,
        totalPaid: yearPrincipal + yearInterest + yearExtra,
        endBalance: item.remainingBalance,
      });
      yearPrincipal = 0;
      yearInterest = 0;
      yearExtra = 0;
      currentYear++;
    }
  }

  const actualTotalPayments = schedule.length;
  const actualMonths = Math.ceil((actualTotalPayments * 12) / periodsPerYear);
  const standardMonths = Math.ceil(totalYears * 12);
  const monthsSaved = Math.max(0, standardMonths - actualMonths);
  const interestSaved = Math.max(0, baselineTotalInterest - accumulatedInterest);

  return {
    periodicPayment: basePeriodicPayment,
    totalPaymentsCount: schedule.length,
    totalPrincipal: principal,
    totalInterest: accumulatedInterest,
    totalCost: principal + accumulatedInterest + originationFeeAmount,
    payoffDurationMonths: actualMonths,
    interestSaved,
    monthsSaved,
    originationFeeAmount,
    schedule,
    annualSchedule,
  };
}

/**
 * MORTGAGE CALCULATOR ENGINE
 */
export function calculateMortgage(inputs: MortgageInputs): MortgageResults {
  const homePrice = Math.max(0, inputs.homePrice);
  let downPayment = 0;
  if (inputs.downPaymentType === 'percent') {
    downPayment = (homePrice * (inputs.downPaymentPercent || 0)) / 100;
  } else {
    downPayment = Math.min(homePrice, inputs.downPaymentAmount || 0);
  }

  const loanAmount = Math.max(0, homePrice - downPayment);
  const annualRate = Math.max(0, inputs.interestRate) / 100;
  const monthlyRate = annualRate / 12;
  const totalMonths = Math.max(1, (inputs.loanTermYears || 30) * 12);
  const extraMonthly = Math.max(0, inputs.extraMonthlyPayment || 0);

  // Standard Monthly Principal & Interest (P&I)
  let monthlyPI = 0;
  if (loanAmount > 0) {
    if (monthlyRate > 0) {
      monthlyPI =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    } else {
      monthlyPI = loanAmount / totalMonths;
    }
  }

  // Monthly Escrows
  const monthlyTax = (homePrice * (inputs.propertyTaxRate || 0) / 100) / 12;
  const monthlyInsurance = (inputs.annualHomeInsurance || 0) / 12;
  const monthlyHoa = inputs.monthlyHoa || 0;

  // PMI: Required if down payment < 20% (Loan To Value > 80%)
  const isPmiRequired = downPayment < homePrice * 0.20 && (inputs.pmiRate || 0.5) > 0;
  const initialMonthlyPmi = isPmiRequired ? (loanAmount * ((inputs.pmiRate || 0.5) / 100)) / 12 : 0;
  const pmiThresholdBalance = homePrice * 0.80; // PMI cancels at 80% LTV

  // Baseline standard interest
  const baselineTotalInterest = monthlyRate > 0 ? monthlyPI * totalMonths - loanAmount : 0;

  // Schedule Simulation
  const schedule: AmortizationScheduleItem[] = [];
  let currentBalance = loanAmount;
  let accumulatedInterest = 0;
  let totalTaxPaid = 0;
  let totalInsurancePaid = 0;
  let totalPmiPaid = 0;
  let pmiDropOffMonth = 0;
  let month = 1;
  const now = inputs.startDate ? new Date(inputs.startDate) : new Date();

  while (currentBalance > 0.001 && month <= totalMonths * 2) {
    const interest = currentBalance * monthlyRate;
    let principalPaid = monthlyPI - interest;
    let extra = extraMonthly;

    if (principalPaid + extra >= currentBalance) {
      const needed = currentBalance;
      if (principalPaid > needed) {
        principalPaid = needed;
        extra = 0;
      } else {
        extra = needed - principalPaid;
      }
      currentBalance = 0;
    } else {
      currentBalance -= (principalPaid + extra);
    }

    accumulatedInterest += interest;
    totalTaxPaid += monthlyTax;
    totalInsurancePaid += monthlyInsurance;

    // Check PMI status
    let currentPmi = 0;
    if (isPmiRequired) {
      if (currentBalance > pmiThresholdBalance) {
        currentPmi = initialMonthlyPmi;
        totalPmiPaid += initialMonthlyPmi;
      } else if (pmiDropOffMonth === 0) {
        pmiDropOffMonth = month;
      }
    }

    const payDate = new Date(now.getFullYear(), now.getMonth() + month - 1, 1);
    const dateStr = payDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    schedule.push({
      period: month,
      date: dateStr,
      payment: monthlyPI + extra + monthlyTax + monthlyInsurance + currentPmi + monthlyHoa,
      principal: principalPaid,
      interest,
      extraPayment: extra,
      totalInterest: accumulatedInterest,
      remainingBalance: Math.max(0, currentBalance),
    });

    if (currentBalance <= 0.001) break;
    month++;
  }

  // Annual Aggregation
  const annualSchedule: AnnualAmortizationItem[] = [];
  let yearPrincipal = 0;
  let yearInterest = 0;
  let yearExtra = 0;
  let currentYear = 1;

  for (let i = 0; i < schedule.length; i++) {
    const item = schedule[i];
    yearPrincipal += item.principal;
    yearInterest += item.interest;
    yearExtra += item.extraPayment;

    if ((i + 1) % 12 === 0 || i === schedule.length - 1) {
      annualSchedule.push({
        year: currentYear,
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        extraPaid: yearExtra,
        totalPaid: yearPrincipal + yearInterest + yearExtra,
        endBalance: item.remainingBalance,
      });
      yearPrincipal = 0;
      yearInterest = 0;
      yearExtra = 0;
      currentYear++;
    }
  }

  const payoffMonths = schedule.length;
  const yearsSaved = Math.max(0, (totalMonths - payoffMonths) / 12);
  const interestSaved = Math.max(0, baselineTotalInterest - accumulatedInterest);
  const initialTotalMonthly = monthlyPI + monthlyTax + monthlyInsurance + initialMonthlyPmi + monthlyHoa;
  const totalCostOfHome = downPayment + loanAmount + accumulatedInterest + totalTaxPaid + totalInsurancePaid + totalPmiPaid + (monthlyHoa * payoffMonths);

  return {
    loanAmount,
    monthlyPrincipalInterest: monthlyPI,
    monthlyPropertyTax: monthlyTax,
    monthlyInsurance: monthlyInsurance,
    monthlyPmi: initialMonthlyPmi,
    monthlyHoa,
    totalMonthlyPayment: initialTotalMonthly,
    totalLoanInterest: accumulatedInterest,
    totalTaxPaid,
    totalInsurancePaid,
    totalPmiPaid,
    totalCostOfHome,
    pmiDropOffMonth: pmiDropOffMonth || (isPmiRequired ? payoffMonths : 0),
    payoffMonths,
    interestSaved,
    yearsSaved,
    schedule,
    annualSchedule,
  };
}

/**
 * SAVINGS CALCULATOR ENGINE (Future Value & Goal Solver)
 */
export function calculateSavings(inputs: SavingsInputs): SavingsResults {
  const initial = Math.max(0, inputs.initialDeposit || 0);
  const rate = Math.max(0, inputs.annualInterestRate || 0) / 100;
  const compFreq = inputs.compoundingFrequency || 12;
  const totalYears = (inputs.timeYears || 0) + (inputs.timeMonths || 0) / 12;
  const inflationRate = Math.max(0, inputs.inflationRate || 0) / 100;

  let depositFreqMultiplier = 12;
  if (inputs.depositFrequency === 'weekly') depositFreqMultiplier = 52;
  if (inputs.depositFrequency === 'biweekly') depositFreqMultiplier = 26;
  if (inputs.depositFrequency === 'annually') depositFreqMultiplier = 1;

  const totalDepositPeriods = Math.round(totalYears * depositFreqMultiplier);

  // If Goal Target Mode: Calculate required periodic deposit
  let regularDeposit = inputs.regularDeposit || 0;
  let requiredMonthlyDeposit = 0;

  if (inputs.mode === 'goalTarget' && inputs.targetGoalAmount) {
    const target = inputs.targetGoalAmount;
    const r = rate;
    const n = compFreq;
    const t = totalYears;
    const futureInitial = initial * Math.pow(1 + r / n, n * t);
    const neededFromDeposits = Math.max(0, target - futureInitial);

    if (t > 0 && neededFromDeposits > 0) {
      if (r > 0) {
        // Periodic payment formula for compounding deposits
        const ratePerDepositPeriod = Math.pow(1 + r / n, n / depositFreqMultiplier) - 1;
        const depositNeeded =
          neededFromDeposits * (ratePerDepositPeriod / (Math.pow(1 + ratePerDepositPeriod, totalDepositPeriods) - 1));
        regularDeposit = depositNeeded;
        requiredMonthlyDeposit = (depositNeeded * depositFreqMultiplier) / 12;
      } else {
        regularDeposit = neededFromDeposits / totalDepositPeriods;
        requiredMonthlyDeposit = (regularDeposit * depositFreqMultiplier) / 12;
      }
    } else {
      regularDeposit = 0;
      requiredMonthlyDeposit = 0;
    }
  }

  // Yearly Breakdown Simulation
  const yearlySchedule: SavingsYearlyBreakdown[] = [];
  const milestones: { amount: number; reachedMonth: number; reachedDate: string }[] = [];
  const milestoneTargets = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  const passedMilestones = new Set<number>();

  let currentBalance = initial;
  let totalDeposits = initial;
  let accumulatedInterest = 0;
  const now = new Date();

  const totalSimulationMonths = Math.round(totalYears * 12);
  const monthlyRate = Math.pow(1 + rate / compFreq, compFreq / 12) - 1;
  const depositPerMonth = (regularDeposit * depositFreqMultiplier) / 12;

  let yearStartBalance = initial;
  let yearDeposits = 0;
  let yearInterest = 0;

  for (let m = 1; m <= totalSimulationMonths; m++) {
    const interestThisMonth = currentBalance * monthlyRate;
    currentBalance += interestThisMonth + depositPerMonth;
    totalDeposits += depositPerMonth;
    accumulatedInterest += interestThisMonth;

    yearDeposits += depositPerMonth;
    yearInterest += interestThisMonth;

    // Check milestones
    for (const target of milestoneTargets) {
      if (currentBalance >= target && !passedMilestones.has(target)) {
        passedMilestones.add(target);
        const reachedDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
        milestones.push({
          amount: target,
          reachedMonth: m,
          reachedDate: reachedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        });
      }
    }

    if (m % 12 === 0 || m === totalSimulationMonths) {
      const yearIndex = Math.ceil(m / 12);
      const discountFactor = Math.pow(1 + inflationRate, yearIndex);
      const realPurchasingPower = currentBalance / discountFactor;

      yearlySchedule.push({
        year: yearIndex,
        startingBalance: yearStartBalance,
        deposits: yearDeposits,
        interestEarned: yearInterest,
        endingBalance: currentBalance,
        totalDeposits,
        totalInterest: accumulatedInterest,
        purchasingPower: realPurchasingPower,
      });

      yearStartBalance = currentBalance;
      yearDeposits = 0;
      yearInterest = 0;
    }
  }

  // APY Calculation: (1 + r/n)^n - 1
  const effectiveApy = (Math.pow(1 + rate / compFreq, compFreq) - 1) * 100;
  const finalDiscountFactor = Math.pow(1 + inflationRate, totalYears);
  const finalPurchasingPower = currentBalance / (finalDiscountFactor || 1);

  return {
    finalBalance: currentBalance,
    totalInitial: initial,
    totalDeposited: totalDeposits - initial,
    totalInterestEarned: accumulatedInterest,
    effectiveApy,
    purchasingPower: finalPurchasingPower,
    requiredMonthlyDeposit: inputs.mode === 'goalTarget' ? requiredMonthlyDeposit : undefined,
    schedule: yearlySchedule,
    milestones,
  };
}

/**
 * COMPOUND INTEREST CALCULATOR ENGINE
 */
export function calculateCompoundInterest(inputs: CompoundInputs): CompoundResults {
  const principal = Math.max(0, inputs.principal || 0);
  const rate = Math.max(0, inputs.interestRate || 0) / 100;
  const n = inputs.compoundingFrequency || 12;
  const totalYears = Math.max(1, inputs.years || 1);
  const contribution = Math.max(0, inputs.contributionAmount || 0);
  const isMonthly = inputs.contributionFrequency === 'monthly';
  const isBeginning = inputs.contributionTiming === 'beginning';

  const schedule: CompoundYearlyData[] = [];
  let currentBalance = principal;
  let totalContribAccum = 0;

  const apy = (Math.pow(1 + rate / n, n) - 1) * 100;
  const doublingTimeYears = rate > 0 ? Math.log(2) / (n * Math.log(1 + rate / n)) : 0;

  for (let year = 1; year <= totalYears; year++) {
    const periodsInYear = isMonthly ? 12 : 1;
    const contributionPerPeriod = contribution;

    for (let p = 1; p <= periodsInYear; p++) {
      if (isBeginning) {
        currentBalance += contributionPerPeriod;
        totalContribAccum += contributionPerPeriod;
      }

      // Grow for 1/periodsInYear of a year
      const periodRate = Math.pow(1 + rate / n, n / periodsInYear) - 1;
      currentBalance *= 1 + periodRate;

      if (!isBeginning) {
        currentBalance += contributionPerPeriod;
        totalContribAccum += contributionPerPeriod;
      }
    }

    // Simple Interest baseline comparison
    const simpleInterest = principal * (1 + rate * year) + (totalContribAccum * (1 + rate * (year / 2)));
    const totalPrincipalAndContributions = principal + totalContribAccum;
    const totalInterestAccum = Math.max(0, currentBalance - totalPrincipalAndContributions);

    schedule.push({
      year,
      principal,
      totalContributions: totalContribAccum,
      interestOnly: principal * (Math.pow(1 + rate / n, n * year) - 1),
      compoundInterestTotal: totalInterestAccum,
      totalBalance: currentBalance,
      simpleInterestComparison: simpleInterest,
    });
  }

  const finalInterest = Math.max(0, currentBalance - (principal + totalContribAccum));

  return {
    finalBalance: currentBalance,
    totalPrincipal: principal,
    totalContributions: totalContribAccum,
    totalInterest: finalInterest,
    apy,
    doublingTimeYears,
    schedule,
  };
}

/**
 * INVESTMENT PROJECTION ENGINE (DCA, Dividend Yield, Expense Ratio & Market Bands)
 */
export function calculateInvestmentProjection(inputs: InvestmentInputs): InvestmentResults {
  const initial = Math.max(0, inputs.initialInvestment || 0);
  const monthlyContrib = Math.max(0, inputs.monthlyContribution || 0);
  const annualReturn = Math.max(-20, inputs.annualReturnRate || 0) / 100;
  const dividendYield = Math.max(0, inputs.annualDividendYield || 0) / 100;
  const expenseRatio = Math.max(0, inputs.expenseRatio || 0) / 100;
  const inflationRate = Math.max(0, inputs.inflationRate || 0) / 100;
  const totalYears = Math.max(1, inputs.investmentYears || 1);

  // Net rate of return after fee
  const netReturnRate = annualReturn + (inputs.dividendReinvest ? dividendYield : 0) - expenseRatio;
  const bearReturnRate = netReturnRate - 0.035; // -3.5% volatility
  const bullReturnRate = netReturnRate + 0.045; // +4.5% volatility

  const schedule: InvestmentYearlyProjection[] = [];
  let currentNominal = initial;
  let currentBear = initial;
  let currentBull = initial;
  let totalInvested = initial;
  let totalDividends = 0;
  let totalFeesPaid = 0;
  let lastYearDividends = 0;

  for (let year = 1; year <= totalYears; year++) {
    let yearDividends = 0;
    let yearFees = 0;

    for (let m = 1; m <= 12; m++) {
      currentNominal += monthlyContrib;
      currentBear += monthlyContrib;
      currentBull += monthlyContrib;
      totalInvested += monthlyContrib;

      // Monthly fee drag
      const monthlyFee = (currentNominal * expenseRatio) / 12;
      yearFees += monthlyFee;
      totalFeesPaid += monthlyFee;

      // Monthly dividend
      const monthlyDiv = (currentNominal * dividendYield) / 12;
      yearDividends += monthlyDiv;
      totalDividends += monthlyDiv;

      // Growth
      const monthlyNetRate = Math.pow(1 + Math.max(-0.9, netReturnRate), 1 / 12) - 1;
      const monthlyBearRate = Math.pow(1 + Math.max(-0.9, bearReturnRate), 1 / 12) - 1;
      const monthlyBullRate = Math.pow(1 + Math.max(-0.9, bullReturnRate), 1 / 12) - 1;

      currentNominal = Math.max(0, currentNominal * (1 + monthlyNetRate));
      currentBear = Math.max(0, currentBear * (1 + monthlyBearRate));
      currentBull = Math.max(0, currentBull * (1 + monthlyBullRate));
    }

    lastYearDividends = yearDividends;
    const inflationFactor = Math.pow(1 + inflationRate, year);
    const realVal = currentNominal / inflationFactor;

    schedule.push({
      year,
      investedCapital: totalInvested,
      nominalValue: currentNominal,
      realValue: realVal,
      annualDividends: yearDividends,
      totalFeesPaid,
      bearCaseValue: currentBear,
      bullCaseValue: currentBull,
    });
  }

  const finalRealValue = currentNominal / Math.pow(1 + inflationRate, totalYears);
  const totalGains = Math.max(0, currentNominal - totalInvested);

  return {
    finalNominalValue: currentNominal,
    finalRealValue,
    totalContributions: totalInvested - initial,
    totalCapitalGains: totalGains,
    totalDividends,
    totalFeesPaid,
    finalYearDividendIncome: lastYearDividends,
    schedule,
  };
}
