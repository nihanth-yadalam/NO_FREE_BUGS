import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import AnimatedSpeedometer from "@/components/AnimatedSpeedometer";
import AddExpenseModal from "@/components/AddExpenseModal";
import CategorySummary from "@/components/CategorySummary";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import PredictionTab from "@/components/PredictionTab";
import AnalyticsTransactions from "@/components/AnalyticsTransactions";

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: "regular" | "irregular" | "daily";
  date: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [budget] = useState(50000);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "1", name: "Electricity Bill", amount: 2500, category: "regular", date: "2026-01-05" },
    { id: "2", name: "Grocery Shopping", amount: 3200, category: "irregular", date: "2026-01-07" },
    { id: "3", name: "Morning Coffee", amount: 150, category: "daily", date: "2026-01-08" },
    { id: "4", name: "School Fees", amount: 15000, category: "regular", date: "2026-01-01" },
    { id: "5", name: "Lunch", amount: 250, category: "daily", date: "2026-01-08" },
  ]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = (expense: Omit<Expense, "id">) => {
    setExpenses([{ ...expense, id: Date.now().toString() }, ...expenses]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-muted-foreground text-sm">Welcome back,</p>
              <h2 className="text-2xl font-display font-bold">Rahul Sharma</h2>
            </motion.div>
            <div className="flex items-center gap-4">
              <AddExpenseModal onAddExpense={handleAddExpense} />
              <UserProfileDropdown />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <motion.div
                    className="glass-card p-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3 className="text-lg font-display font-semibold mb-6 text-center">
                      Budget Status
                    </h3>
                    <AnimatedSpeedometer spent={totalSpent} total={budget} />
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Budget</span>
                        <span className="font-semibold">₹{budget.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-display font-semibold">Expense Categories</h3>
                    <CategorySummary expenses={expenses} />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === "prediction" && (
              <motion.div
                key="prediction"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <PredictionTab expenses={expenses} budget={budget} />
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <AnalyticsTransactions expenses={expenses} onDelete={handleDeleteExpense} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Index;
