import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import AnimatedSpeedometer from "@/components/AnimatedSpeedometer";
import AddExpenseModal from "@/components/AddExpenseModal";
import CategorySummary from "@/components/CategorySummary";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import PredictionTab from "@/components/PredictionTab";
import AnalyticsTransactions from "@/components/AnalyticsTransactions";
import { getExpenses, getBudget, addExpense, deleteExpense, setupDemoUser, type Expense, type BudgetData } from "@/lib/api";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [budget, setBudget] = useState(50000);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch data from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesData, budgetInfo] = await Promise.all([
        getExpenses(),
        getBudget()
      ]);
      
      setExpenses(expensesData);
      setBudgetData(budgetInfo);
      setBudget(budgetInfo.monthly_budget);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the backend. Make sure the server is running.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Setup demo user
  const handleSetupDemoUser = async () => {
    try {
      setSettingUp(true);
      toast({
        title: "Setting up demo data",
        description: "Creating user and 200 transactions. This may take a minute...",
      });
      
      await setupDemoUser();
      
      toast({
        title: "Success!",
        description: "Demo user created with 200 transactions and ₹1,000 balance.",
      });
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Failed to setup demo user:", error);
      toast({
        title: "Setup Failed",
        description: "Failed to setup demo user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSettingUp(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalSpent = budgetData?.total_spent || expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = async (expense: Omit<Expense, "id">) => {
    try {
      const newExpense = await addExpense(expense);
      setExpenses([newExpense, ...expenses]);
      
      toast({
        title: "Expense Added",
        description: `${expense.name} - ₹${expense.amount} added successfully.`,
      });
      
      // Refresh budget data
      const budgetInfo = await getBudget();
      setBudgetData(budgetInfo);
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({
        title: "Failed to Add Expense",
        description: "Could not add expense. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
      
      // Refresh budget data
      const budgetInfo = await getBudget();
      setBudgetData(budgetInfo);
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading VaultGuard...</p>
        </div>
      </div>
    );
  }

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
              <h2 className="text-2xl font-display font-bold">{user?.name || "User"}</h2>
            </motion.div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetupDemoUser}
                disabled={settingUp}
                className="gap-2"
              >
                {settingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {settingUp ? "Setting up..." : "Reset Demo Data"}
              </Button>
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
                      {budgetData && (
                        <>
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-muted-foreground">Total Spent</span>
                            <span className="font-semibold text-destructive">₹{totalSpent.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className="font-semibold text-primary">₹{budgetData.remaining.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-muted-foreground">Bank Balance</span>
                            <span className="font-semibold text-accent">₹{budgetData.current_balance.toLocaleString()}</span>
                          </div>
                        </>
                      )}
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
