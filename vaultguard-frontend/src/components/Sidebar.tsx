import { LayoutDashboard, TrendingUp, BarChart3, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "prediction", label: "Prediction", icon: TrendingUp },
  { id: "analytics", label: "Analytics & Transactions", icon: BarChart3 },
];

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-display font-bold text-gradient">VaultGuard</h1>
        <p className="text-xs text-muted-foreground mt-1">Smart Budget Tracking</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground glow-primary" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
