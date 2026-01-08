# VaultGuard: Smart Budget Tracking

VaultGuard is an intelligent financial management platform designed to help users move beyond simple expense logging. By utilizing machine learning, VaultGuard predicts future spending patterns, visualizes budget health via a real-time **Liquidity Dial**, and provides actionable insights to help users save more effectively.

## Problem Statement
Most personal finance applications focus only on **retrospective expense tracking**, leaving users unaware of whether their current spending behavior is sustainable. Users often:
- Overspend without realizing future consequences  
- Lack clarity on “how much is safe to spend”  
- Fail to balance daily expenses with long-term savings goals  

VaultGuard addresses this gap by combining **predictive analytics**, **budget health visualization**, and **behavior-driven insights** to help users make informed financial decisions *before* overspending occurs.

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
- Uses machine learning to forecast future financial behavior  
- **Predicted Metrics**:
  - Expected Income
  - Forecasted Expenses
  - Estimated Savings  
- **Income vs Expense Trends**: Historical and projected area charts  
- **Safe-to-Spend Logic**:
  - Analyzes savings (“Vault”) and recurring obligations  
  - Calculates daily and monthly spending limits without harming financial goals  

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
- run `docker compose up --build` (run with sudo if required on linux)
- visit `localhost:5173`
- login (a sample user account has been setup already)

## Video Demonstration
- https://vimeo.com/1152648591?share=copy&fl=sv&fe=ci
