import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Trash2, TrendingUp, TrendingDown, Calendar, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: "regular" | "irregular" | "daily";
  date: string;
}

interface AnalyticsTransactionsProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

const categoryColors = {
  regular: "hsl(var(--primary))",
  irregular: "hsl(var(--accent))",
  daily: "hsl(var(--destructive))",
};

const categoryLabels = {
  regular: "Regular",
  irregular: "Irregular",
  daily: "Daily",
};

const AnalyticsTransactions = ({ expenses, onDelete }: AnalyticsTransactionsProps) => {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate category totals for pie chart
  const categoryData = useMemo(() => {
    const totals = { regular: 0, irregular: 0, daily: 0 };
    expenses.forEach((e) => {
      totals[e.category] += e.amount;
    });
    return [
      { name: "Regular", value: totals.regular, color: categoryColors.regular },
      { name: "Irregular", value: totals.irregular, color: categoryColors.irregular },
      { name: "Daily", value: totals.daily, color: categoryColors.daily },
    ].filter((d) => d.value > 0);
  }, [expenses]);

  // Weekly spending data for bar chart
  const weeklyData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, index) => ({
      day,
      regular: Math.round(Math.random() * 3000 + 1000),
      irregular: Math.round(Math.random() * 2000 + 500),
      daily: Math.round(Math.random() * 500 + 100),
    }));
  }, []);

  // Filtered and searched expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => filter === "all" || e.category === filter)
      .filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filter, searchQuery]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      onDelete(id);
      setDeletingId(null);
    }, 300);
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 shadow-xl">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-lg font-display font-bold">
            ₹{payload[0].value.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {((payload[0].value / totalSpent) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 shadow-xl">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ₹{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
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

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Analytics Section */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-display font-bold mb-6">Analytics Overview</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div
            className="glass-card p-6"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="font-display font-semibold mb-4">Spending by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              {categoryData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            className="glass-card p-6"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="font-display font-semibold mb-4">Weekly Spending</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="regular"
                    name="Regular"
                    fill={categoryColors.regular}
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                  <Bar
                    dataKey="irregular"
                    name="Irregular"
                    fill={categoryColors.irregular}
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                  <Bar
                    dataKey="daily"
                    name="Daily"
                    fill={categoryColors.daily}
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="glass-card p-6"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Spent</p>
              <p className="text-2xl font-display font-bold mt-1">
                ₹{totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-destructive/20">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glass-card p-6"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Transactions</p>
              <p className="text-2xl font-display font-bold mt-1">{expenses.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/20">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glass-card p-6"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Avg. Transaction</p>
              <p className="text-2xl font-display font-bold mt-1">
                ₹{expenses.length ? Math.round(totalSpent / expenses.length).toLocaleString() : 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-accent/20">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Transaction History */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-display font-semibold">Transaction History</h3>
          
          <div className="flex gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-glass-border"
              />
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36 bg-secondary/50 border-glass-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="irregular">Irregular</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          <AnimatePresence>
            {filteredExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: deletingId === expense.id ? 0 : 1,
                  x: deletingId === expense.id ? 100 : 0,
                  scale: deletingId === expense.id ? 0.8 : 1,
                }}
                exit={{ opacity: 0, x: 100 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  delay: index * 0.03,
                }}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[expense.category] }}
                  />
                  <div>
                    <p className="font-medium">{expense.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${categoryColors[expense.category]}20`,
                          color: categoryColors[expense.category],
                        }}
                      >
                        {categoryLabels[expense.category]}
                      </span>
                      <span>{new Date(expense.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <p className="font-display font-semibold text-lg">
                    ₹{expense.amount.toLocaleString()}
                  </p>
                  <motion.button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredExpenses.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <p>No transactions found</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsTransactions;
