# Finance Calculator Suite

A modern, comprehensive suite of financial planning calculators and projection tools built with React 19, TypeScript, Tailwind CSS, and Recharts. Designed with a clean **Geometric Balance** interface, responsive visual charts, full amortization schedules, scenario comparison, and real-time currency conversion.

---

## ✨ Features & Calculators

### 1. 💳 Loan Calculator
- Calculate monthly principal and interest payments with custom extra payments (monthly, yearly, one-time).
- Track loan payoff acceleration, interest savings, and payoff timeline reduction.
- Full annual and monthly amortization schedules with CSV export and search filtering.

### 2. 🏡 Mortgage Calculator
- Deep property cost analysis: Home Price, Down Payment (amount & percentage), Loan Term, and Interest Rate.
- Incorporates Property Tax, Home Insurance, HOA fees, and Private Mortgage Insurance (PMI) thresholds (<20% down payment).
- Total cost of homeownership breakdown with interactive breakdown charts and early payoff scenarios.

### 3. 🐖 Savings & Goal Planner
- **Grow Balance Mode**: Project long-term savings growth with starting deposit, recurring contributions, APY, and compounding frequencies.
- **Reach Goal Mode**: Back-solve for the exact monthly contribution required to hit a specific savings target.
- Inflation-adjusted real purchasing power analysis and milestone timeline projection.

### 4. 📈 Compound Interest Calculator
- Interactive simulations across multiple compounding frequencies (Daily, Monthly, Quarterly, Semi-Annually, Annually).
- Compare compound interest versus simple flat growth.
- Visual stacked area graphs breaking down initial principal, contributions, and cumulative interest earned.

### 5. 💼 Investment & Portfolio Forecaster
- Project long-term portfolio growth with Dollar-Cost Averaging (DCA) and dividend yield settings.
- Dividend Reinvestment Plan (DRIP) modeling vs. cash-out scenarios.
- Quantify the drag of fund expense ratios and explore Bull (+4.5%) vs. Bear (-3.5%) market scenario bands.

### 6. 💱 Real-Time Currency Converter
- Live foreign exchange rates across 20+ major global currencies (USD, EUR, GBP, JPY, CAD, AUD, CHF, INR, CNY, etc.).
- Multi-currency global cross-rate conversion matrix.
- Inverse rate calculations and quick one-click result copying.

### 7. 📊 Scenario Manager & Side-by-Side Comparison
- Save custom calculation configurations with local storage persistence.
- Compare multiple financial scenarios side-by-side to make informed decisions.
- Export all amortization schedules and projection tables to CSV.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Visualizations**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or later)
- npm or bun

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/finance-calculator-suite.git

# Navigate into project directory
cd finance-calculator-suite

# Install dependencies
npm install
```

### Running in Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Building for Production

```bash
npm run build
```

The production-ready static assets will be output to the `dist/` directory.

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── AmortizationTable.tsx          # Amortization schedule viewer & CSV exporter
│   │   ├── CompoundInterestCalculator.tsx # Compound interest simulator
│   │   ├── CurrencyConverter.tsx          # FX currency converter & global matrix
│   │   ├── InvestmentCalculator.tsx       # Portfolio & DCA forecaster
│   │   ├── LoanCalculator.tsx             # Standard loan & extra payment calculator
│   │   ├── MortgageCalculator.tsx         # Comprehensive mortgage & property cost solver
│   │   ├── Navbar.tsx                     # Header navigation & currency selector
│   │   ├── SavedCalculationsDrawer.tsx    # Saved scenarios sidebar
│   │   └── ScenarioComparisonModal.tsx    # Side-by-side comparison modal
│   ├── utils/
│   │   ├── formatters.ts                  # Currency & number formatting helpers
│   │   ├── loanCalculations.ts            # Mathematical amortization engines
│   │   ├── savingsCalculations.ts         # Compounding & savings equations
│   │   └── currencyData.ts                # Currency definitions & exchange rates
│   ├── types.ts                           # Shared TypeScript types & interfaces
│   ├── App.tsx                            # Root application component
│   └── main.tsx                           # React DOM entry point
├── index.html
├── package.json
└── tsconfig.json
```

---

## 📄 License

MIT License. Open source and free to use for personal or commercial projects.
