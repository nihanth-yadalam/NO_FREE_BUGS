import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Repeat, ShoppingCart, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddExpenseModalProps {
  onAddExpense: (expense: {
    name: string;
    amount: number;
    category: "regular" | "irregular" | "daily";
    date: string;
  }) => void;
}

const categories = [
  { 
    id: "regular" as const, 
    label: "Regular", 
    description: "School fees, Electricity, etc.",
    icon: Repeat,
    color: "bg-primary/20 border-primary text-primary"
  },
  { 
    id: "irregular" as const, 
    label: "Irregular", 
    description: "Grocery, Festival shopping",
    icon: ShoppingCart,
    color: "bg-accent/20 border-accent text-accent"
  },
  { 
    id: "daily" as const, 
    label: "Daily", 
    description: "Food, Transport, etc.",
    icon: Coffee,
    color: "bg-destructive/20 border-destructive text-destructive"
  },
];

const AddExpenseModal = ({ onAddExpense }: AddExpenseModalProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<"regular" | "irregular" | "daily">("daily");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    onAddExpense({
      name,
      amount: parseFloat(amount),
      category,
      date,
    });

    setName("");
    setAmount("");
    setCategory("daily");
    setDate(new Date().toISOString().split("T")[0]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 glow-primary">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label>Category</Label>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all duration-200 text-center",
                      category === cat.id 
                        ? cat.color 
                        : "border-border bg-secondary/50 hover:border-muted-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {categories.find(c => c.id === category)?.description}
            </p>
          </div>

          {/* Expense Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Expense Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Electricity Bill"
              className="bg-secondary/50"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-secondary/50"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-secondary/50 pl-10"
              />
            </div>
          </div>

          <Button type="submit" className="w-full glow-primary">
            Add Expense
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
