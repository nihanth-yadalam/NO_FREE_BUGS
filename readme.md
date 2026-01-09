# VaultGuard: Adaptive Liquidity for the Unpredictable Economy

VaultGuard is an intelligent financial management platform built for the reality of modern work—where income is often irregular and expenses fluctuate. Unlike traditional apps that assume a steady monthly paycheck, VaultGuard utilizes predictive machine learning to normalize volatile cash flows. It calculates a user's true **"Safe Withdrawable Amount"** in real-time, helping freelancers, gig workers, and variable earners bridge the gap between "feast and famine" cycles.

## Problem Statement
Standard personal finance tools are designed for the 9-to-5 salaried employee, failing the millions of individuals with irregular income streams. These users face unique challenges that retrospective trackers cannot solve:

- **The "High Balance Illusion"**: A gig worker receiving a large payment today may feel "rich," unaware that this money must stretch across three lean weeks of zero income.

- **Volatility Blindness**: Users struggle to plan for essential bills (Rent/EMI) when cash flow varies wildly, often leading to accidental overspending during peak earning days.

- **Reactive vs. Proactive**: Current apps only report past mistakes. Irregular earners need future visibility to know exactly how much is safe to spend right now without endangering next week's liabilities.

VaultGuard solves this by treating personal finance as a liquidity management system, using predictive models to smooth out income spikes and strictly reserve cash for upcoming obligations before they become a crisis.

## Target Audience
VaultGuard is designed for:
- **Students & young professionals** managing monthly stipends or salaries  
- **First-time earners** learning budgeting and savings discipline  
- **Individuals with irregular expenses** who struggle with financial planning  
- **Users seeking proactive financial guidance**, not just expense logs  

## Solution Overview
VaultGuard acts as a **financial command center**, providing:
- A real-time view of budget health  
- AI-driven predictions for upcoming income and expenses  
- A clear distinction between *safe spending* and *savings (Vault)*  
- Timely alerts to prevent missed payments or budget overruns  

## Architecture Diagram
<img width="2816" height="1536" alt="VaultGuard Architecture Diagram" src="https://github.com/user-attachments/assets/eff64c45-8f4f-4596-a9ad-bffb9cb43ef5" />


## ⚠️ Security Scope & Simulation Notice (Read Before Testing)

**Important:** The `bank-api` service included in this repository is a **Mock Data Generator** built solely to simulate a banking environment for the Build2Break hackathon.

* **Status:** `bank-api` is **OUT OF SCOPE** for security testing.
* **Reasoning:** It contains intentional simplifications (such as open endpoints) to facilitate data seeding for our ML models. In a real-world production deployment, this entire service would be replaced by a secure 3rd-party integration (e.g., Plaid, Yodlee, or a generic Open Banking API).
* **Targeting:** Please direct all architectural and security challenges to the **`vaultguard-backend`** (Risk Engine) and **`vaultguard-frontend`** (User Dashboard).

**Issues raised against `bank-api` (e.g., missing auth on data seeders) will be marked as Invalid/Out-of-Scope.**


## Key Features

### 1. Centralized Dashboard
- Acts as the **command center** of personal finances with an instant monthly overview  
- **Budget Status Gauge**: Speedometer-style visualization showing remaining “Safe to Spend” amount  
- **Categorized Expenses**:
  - Regular (Bills & Subscriptions)
  - Irregular (Shopping, Events)
  - Daily (Food, Transport)
- **Smart Alerts**: Notifications for bills due within the next 3 days  
- **Quick Entry System**: Unified interface for adding expenses in real time  

### 2. AI-Powered Predictions
VaultGuard moves beyond simple forecasting by deploying a Dual-Pipeline Architecture that decouples income prediction from expense forecasting to prevent error propagation.

- **Model A: Stochastic Income Predictor (Random Forest)**

  - Designed for the "Gig Economy," this model captures non-linear income patterns (e.g.,       irregular Friday payouts) that traditional linear regression misses.

  - **Feature Engineering:** Utilizes temporal signals (days_since_last_pay,                    rolling_volatility) to differentiate between stable salaries and volatile gig work.

- **Model B: Adaptive Expense Forecaster (Weighted Moving Average)**

  - Uses a **Recency-Weighted** statistical model to predict variable spending (Food, Fuel) based on the user's latest lifestyle trends rather than ancient history.
  
  - **Trend Awareness:** Automatically adjusts for "Lifestyle Creep" or sudden budget tightening in real-time.

- **The "Atomic Ledger" Logic (Safe-to-Spend)**

  - Replaces static budgeting with a dynamic Liquidity Equation:
    **SafeAmount=(Balance+Discounted Future Income) − (Fixed Bills+Projected Variable Spend)**

  - **Volatility Shield:** The system automatically applies a **"Confidence Discount" (5-30%)** to predicted income based on the user's historical volatility, ensuring users never spend money that isn't guaranteed.

- **Resilience & Cold-Start Defense**

  - **Hybrid Confidence System:** For new users (<30 days history), the system automatically falls back to statistical averages, gradually shifting weight to the ML model as data maturity increases (Hybrid → Pure ML).

  - **Zero-Debt Protocol:** Prioritizes rent and EMI obligations as "Immutable Liabilities," subtracting them from available funds before the user even sees their balance.  

### 3. Analytics & Transaction History
- **Category Breakdown**: Donut chart showing spending distribution  
- **Weekly Velocity**: Bar chart highlighting high-spending days  
- **Vault Tracking**:
  - Funds allocated to savings vs free spending  
- **Searchable Transaction History**:
  - Audited, real-time updated transaction list  

## Tech Stack
- **Frontend**: React.js (TypeScript), Tailwind CSS, Framer Motion  
- **Backend**: Node.js, Express.js  
- **Database**: PostgreSQL  
- **Machine Learning**: Python-based prediction model (API-integrated)  
- **DevOps**: Docker & Docker Compose  

## Key Highlights
- Moves beyond static expense tracking to **predictive budgeting**  
- Combines **data visualization + AI insights** for better decision-making  
- Designed with **security, scalability, and usability** in mind  
- Emphasizes **financial awareness and discipline**, not just record-keeping  


## Steps to run
- Clone the repo
- Generate a SECRET_KEY with 
```bash
echo "SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(64))')" > .env
```
- run `docker compose up --build` (run with sudo if required on linux)
- visit `localhost:5173`
- login (a sample user account has been setup already)

## Video Demonstration
- https://vimeo.com/1152688816?fl=ip&fe=ec
