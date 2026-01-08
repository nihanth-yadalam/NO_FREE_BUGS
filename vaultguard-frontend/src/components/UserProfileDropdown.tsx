import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ChevronDown, Wallet, CreditCard, Building, Copy, Check, X, Loader2 } from "lucide-react";
import { getUserProfile, type UserProfile } from "@/lib/api";

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserProfile>({
    name: "Rahul Sharma",
    email: "rahul.sharma@email.com",
    bankName: "VaultGuard Bank",
    accountNumber: "XXXX XXXX 5678",
    ifscCode: "VAULT0001",
    balance: 0,
  });

  // Fetch user profile when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const fetchUser = async () => {
        try {
          setLoading(true);
          const data = await getUserProfile();
          setUser(data);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [isOpen]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute right-0 top-14 w-80 glass-card p-4 z-50 shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* User info header */}
              <div className="flex items-center gap-3 pb-4 border-b border-glass-border">
                <motion.div
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  <User className="w-7 h-7 text-primary-foreground" />
                </motion.div>
                <div>
                  <motion.h3
                    className="font-display font-semibold text-lg"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {user.name}
                  </motion.h3>
                  <motion.p
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {user.email}
                  </motion.p>
                </div>
              </div>

              {/* Balance card */}
              <motion.div
                className="mt-4 p-4 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Wallet className="w-4 h-4" />
                  <span>Available Balance</span>
                </div>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <p className="text-2xl font-display font-bold text-gradient">
                    ₹{user.balance.toLocaleString()}
                  </p>
                )}
              </motion.div>

              {/* Bank details */}
              <motion.div
                className="mt-4 space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Bank Details
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{user.bankName}</p>
                    </div>
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="font-medium font-mono">{user.accountNumber}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(user.accountNumber, "account")}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                    >
                      {copied === "account" ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-xs text-muted-foreground">IFSC Code</p>
                      <p className="font-medium font-mono">{user.ifscCode}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(user.ifscCode, "ifsc")}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                    >
                      {copied === "ifsc" ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfileDropdown;
