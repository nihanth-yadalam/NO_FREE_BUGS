import { Repeat, ShoppingCart, Coffee, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: "regular" | "irregular" | "daily";
  date: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

const categoryConfig = {
  regular: { 
    icon: Repeat, 
    label: "Regular",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    borderColor: "border-l-primary"
  },
  irregular: { 
    icon: ShoppingCart, 
    label: "Irregular",
    bgColor: "bg-accent/10",
    textColor: "text-accent",
    borderColor: "border-l-accent"
  },
  daily: { 
    icon: Coffee, 
    label: "Daily",
    bgColor: "bg-destructive/10",
    textColor: "text-destructive",
    borderColor: "border-l-destructive"
  },
};

const ExpenseList = ({ expenses, onDelete }: ExpenseListProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { 
      day: "numeric", 
      month: "short" 
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">No expenses yet. Add your first expense!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const config = categoryConfig[expense.category];
        const Icon = config.icon;
        
        return (
          <div 
            key={expense.id}
            className={cn(
              "glass-card p-4 flex items-center justify-between border-l-4 transition-all duration-200 hover:scale-[1.01]",
              config.borderColor
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn("p-2 rounded-lg", config.bgColor)}>
                <Icon className={cn("w-5 h-5", config.textColor)} />
              </div>
              <div>
                <p className="font-medium">{expense.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", config.bgColor, config.textColor)}>
                    {config.label}
                  </span>
                  <span>{formatDate(expense.date)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold">₹{expense.amount.toLocaleString()}</span>
              <button 
                onClick={() => onDelete(expense.id)}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExpenseList;
