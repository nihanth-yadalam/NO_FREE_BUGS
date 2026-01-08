import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import AnimatedSpeedometer from "@/components/AnimatedSpeedometer";
import AddExpenseModal from "@/components/AddExpenseModal";
import CategorySummary from "@/components/CategorySummary";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import PredictionTab from "@/components/PredictionTab";
import AnalyticsTransactions from "@/components/AnalyticsTransactions";
import { getDashboardData, addExpense as apiAddExpense, setupFullSetup, type Expense, type DashboardData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Database } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const { toast } = useToast();

  // Derived state from dashboard data
  const budget = dashboardData?.budget ?? 50000;
  const expenses = dashboardData?.expenses ?? [];
  const userName = dashboardData?.user?.name ?? "User";
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to connect to backend. Make sure services are running.");
      toast({
        title: "Connection Error",
        description: "Could not fetch data from backend. Try setting up the database first.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleSetup = async () => {
    try {
      setSetupLoading(true);
      toast({
        title: "Setting up...",
        description: "Creating user and seeding 200 transactions. This may take a moment.",
      });
      
      const result = await setupFullSetup();
      
      toast({
        title: "Setup Complete!",
        description: `Created user with ${result.details?.message || 'transactions'}. Final balance: ₹${result.details?.final_balance || 1000}`,
      });
      
      // Refresh dashboard data
      await fetchDashboardData();
    } catch (err) {
      console.error("Setup failed:", err);
      toast({
        title: "Setup Failed",
        description: "Could not complete setup. Make sure bank-api is running.",
        variant: "destructive",
      });
    } finally {
      setSetupLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAddExpense = async (expense: Omit<Expense, "id">) => {
    try {
      await apiAddExpense({
        name: expense.name,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
      });
      
      toast({
        title: "Expense Added",
        description: `₹${expense.amount} added as ${expense.category} expense.`,
      });
      
      // Refresh data
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to add expense:", err);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    // For now, just remove from local state (backend delete not implemented)
    if (dashboardData) {
      setDashboardData({
        ...dashboardData,
        expenses: dashboardData.expenses.filter((e) => e.id !== id),
      });
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state with setup option
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Database className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-display font-bold">Connection Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-y-3">
            <Button onClick={handleSetup} disabled={setupLoading} className="w-full">
              {setupLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Setup Database & Seed Data
                </>
              )}
            </Button>
            <Button variant="outline" onClick={fetchDashboardData} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          </div>
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
              <h2 className="text-2xl font-display font-bold">{userName}</h2>
            </motion.div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchDashboardData}
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
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
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Current Balance</span>
                        <span className="font-semibold text-primary">
                          ₹{(dashboardData?.user?.balance ?? 0).toLocaleString()}
                        </span>
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
