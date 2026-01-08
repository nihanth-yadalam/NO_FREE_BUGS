import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles, ArrowUpRight, ArrowDownRight, Brain, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getPredictions, getChartData, type PredictionData, type ChartDataPoint } from "@/lib/api";

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: "regular" | "irregular" | "daily";
  date: string;
}

interface PredictionTabProps {
  expenses: Expense[];
  budget: number;
}

const PredictionTab = ({ expenses, budget }: PredictionTabProps) => {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [animatedValues, setAnimatedValues] = useState({
    income: 0,
    expense: 0,
    savings: 0,
    canSpend: 0,
  });

  // Fetch predictions from backend
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const [predData, chart] = await Promise.all([
          getPredictions(),
          getChartData()
        ]);
        setPredictions(predData);
        setChartData(chart);
      } catch (error) {
        console.error("Failed to fetch predictions:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPredictions();
  }, [expenses]);

  // Animate values when predictions load
  useEffect(() => {
    if (!predictions) return;
    
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedValues({
        income: Math.round(predictions.predicted_income * eased),
        expense: Math.round(predictions.predicted_expense * eased),
        savings: Math.round(predictions.predicted_savings * eased),
        canSpend: Math.round(predictions.can_spend * eased),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [predictions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isPredicted = label?.includes("(P)");
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-4 shadow-xl border border-glass-border"
        >
          <p className="font-display font-semibold mb-2 flex items-center gap-2">
            {label}
            {isPredicted && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                Predicted
              </span>
            )}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-primary flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Income: ₹{payload[0]?.value?.toLocaleString()}
            </p>
            <p className="text-destructive flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4" />
              Expense: ₹{payload[1]?.value?.toLocaleString()}
            </p>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading AI predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">AI Predictions</h2>
          <p className="text-muted-foreground text-sm">
            Smart insights powered by ML analysis • {predictions?.confidence || 0}% confidence
            {predictions?.income_details?.method && (
              <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {predictions.income_details.method === 'statistical' ? 'Cold Start Mode' : 
                 predictions.income_details.method === 'hybrid' ? 'Hybrid Model' : 'ML Model'}
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Prediction Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="glass-card p-6 relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Predicted Income</span>
          </div>
          <p className="text-3xl font-display font-bold text-primary">
            ₹{animatedValues.income.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Next month forecast</p>
        </motion.div>

        <motion.div
          className="glass-card p-6 relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span>Predicted Expense</span>
          </div>
          <p className="text-3xl font-display font-bold text-destructive">
            ₹{animatedValues.expense.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Based on spending patterns</p>
        </motion.div>

        <motion.div
          className="glass-card p-6 relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Expected Savings</span>
          </div>
          <p className="text-3xl font-display font-bold text-accent">
            ₹{animatedValues.savings.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">After all expenses</p>
        </motion.div>

        <motion.div
          className="glass-card p-6 relative overflow-hidden group border-2 border-primary/30"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Safe to Spend</span>
            </div>
            <p className="text-3xl font-display font-bold text-gradient">
              ₹{animatedValues.canSpend.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Recommended limit</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Chart */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display font-semibold">Income vs Expense Trend</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Expense</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
              <span className="text-muted-foreground">Predicted</span>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x="Jan"
                stroke="hsl(var(--accent))"
                strokeDasharray="5 5"
                label={{
                  value: "Prediction Start",
                  position: "top",
                  fill: "hsl(var(--accent))",
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fill="url(#incomeGradient)"
                animationDuration={2000}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="hsl(var(--destructive))"
                strokeWidth={3}
                fill="url(#expenseGradient)"
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI Insights
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <p>Your income is trending upward by ~5% month over month</p>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5" />
              <p>Festival season may increase irregular expenses by 15-20%</p>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="w-2 h-2 rounded-full bg-destructive mt-1.5" />
              <p>Consider reducing daily expenses to maximize savings</p>
            </li>
          </ul>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4">Spending Recommendation</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Regular Expenses</span>
                <span className="font-medium">₹25,000</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "50%" }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Irregular Expenses</span>
                <span className="font-medium">₹15,000</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "30%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Daily Expenses</span>
                <span className="font-medium">₹10,000</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full bg-destructive rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "20%" }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PredictionTab;
