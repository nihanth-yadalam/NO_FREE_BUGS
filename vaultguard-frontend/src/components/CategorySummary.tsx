import { Repeat, ShoppingCart, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: "regular" | "irregular" | "daily";
  date: string;
}

interface CategorySummaryProps {
  expenses: Expense[];
}

const categoryConfig = {
  regular: { 
    icon: Repeat, 
    label: "Regular Expenses",
    description: "Bills & subscriptions",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    glowClass: "glow-primary"
  },
  irregular: { 
    icon: ShoppingCart, 
    label: "Irregular Expenses",
    description: "Shopping & occasions",
    bgColor: "bg-accent/10",
    textColor: "text-accent",
    glowClass: "glow-accent"
  },
  daily: { 
    icon: Coffee, 
    label: "Daily Expenses",
    description: "Food & transport",
    bgColor: "bg-destructive/10",
    textColor: "text-destructive",
    glowClass: "glow-danger"
  },
};

const CategorySummary = ({ expenses }: CategorySummaryProps) => {
  const getCategoryTotal = (category: "regular" | "irregular" | "daily") => {
    return expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getCategoryCount = (category: "regular" | "irregular" | "daily") => {
    return expenses.filter(e => e.category === category).length;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map((category) => {
        const config = categoryConfig[category];
        const Icon = config.icon;
        const total = getCategoryTotal(category);
        const count = getCategoryCount(category);

        return (
          <div 
            key={category}
            className={cn(
              "glass-card p-5 transition-all duration-300 hover:scale-[1.02]",
              total > 0 && config.glowClass
            )}
          >
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-xl", config.bgColor)}>
                <Icon className={cn("w-6 h-6", config.textColor)} />
              </div>
              <span className="text-xs text-muted-foreground">{count} items</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{config.label}</p>
              <p className={cn("text-2xl font-display font-bold mt-1", config.textColor)}>
                ₹{total.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategorySummary;
