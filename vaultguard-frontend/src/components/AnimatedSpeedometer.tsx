import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedSpeedometerProps {
  spent: number;
  total: number;
}

const AnimatedSpeedometer = ({ spent, total }: AnimatedSpeedometerProps) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const percentage = Math.min((spent / total) * 100, 100);
  const remaining = total - spent;

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;
    const targetPercentage = percentage;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercentage(targetPercentage * eased);

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [percentage]);

  // Calculate rotation: 0% = -90deg (left), 100% = 90deg (right)
  const rotation = -90 + animatedPercentage * 1.8;

  // Determine status color based on percentage
  const getStatusColor = () => {
    if (percentage < 50) return "text-gauge-safe";
    if (percentage < 80) return "text-gauge-warning";
    return "text-gauge-danger";
  };

  const getGlowClass = () => {
    if (percentage < 50) return "glow-primary";
    if (percentage < 80) return "glow-accent";
    return "glow-danger";
  };

  const getStatusText = () => {
    if (percentage < 50) return "You're doing great!";
    if (percentage < 80) return "Watch your spending";
    return "Budget Alert!";
  };

  // Calculate tick marks
  const ticks = Array.from({ length: 11 }, (_, i) => i * 18 - 90);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-72 h-36 overflow-hidden">
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 w-72 h-72 rounded-full"
          style={{
            background: `conic-gradient(from 180deg, 
              hsl(var(--gauge-safe)) 0deg, 
              hsl(var(--gauge-safe)) 90deg, 
              hsl(var(--gauge-warning)) 140deg, 
              hsl(var(--gauge-danger)) 180deg,
              transparent 180deg
            )`,
            filter: "blur(10px)",
            opacity: 0.3,
            clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
          }}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Background arc */}
        <div
          className="absolute inset-0 w-72 h-72 rounded-full border-[20px] border-secondary"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
        />

        {/* Gradient arc with animated stroke */}
        <svg
          className="absolute inset-0 w-72 h-72"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="hsl(var(--gauge-safe))" />
              <stop offset="50%" stopColor="hsl(var(--gauge-warning))" />
              <stop offset="100%" stopColor="hsl(var(--gauge-danger))" />
            </linearGradient>
          </defs>
          <circle
            cx="144"
            cy="144"
            r="130"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray="408.4"
            strokeDashoffset={408.4 - (animatedPercentage / 100) * 408.4}
            transform="rotate(180 144 144)"
            style={{
              transition: "stroke-dashoffset 0.05s linear",
              filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))",
            }}
          />
        </svg>

        {/* Tick marks */}
        {ticks.map((angle, index) => (
          <motion.div
            key={index}
            className="absolute left-1/2 bottom-0 origin-bottom"
            style={{
              transform: `translateX(-50%) rotate(${angle}deg)`,
              width: "2px",
              height: "134px",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <div
              className={`w-0.5 ${index % 2 === 0 ? "h-4" : "h-2"} rounded-full ${
                index <= Math.floor((animatedPercentage / 100) * 10)
                  ? "bg-foreground"
                  : "bg-muted-foreground/30"
              }`}
            />
          </motion.div>
        ))}

        {/* Needle */}
        <motion.div
          className="absolute bottom-0 left-1/2 origin-bottom"
          style={{
            width: "4px",
            height: "110px",
          }}
          animate={{ rotate: rotation }}
          transition={{ type: "spring", damping: 15, stiffness: 100 }}
          initial={{ rotate: -90 }}
        >
          <motion.div
            className="w-1 h-24 bg-gradient-to-t from-foreground to-foreground/50 rounded-full mx-auto"
            style={{
              boxShadow: `0 0 20px 2px ${
                percentage < 50
                  ? "hsl(var(--primary) / 0.5)"
                  : percentage < 80
                  ? "hsl(var(--accent) / 0.5)"
                  : "hsl(var(--destructive) / 0.5)"
              }`,
            }}
          />
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-foreground"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>

        {/* Center circle with glow */}
        <motion.div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-card to-background border-4 border-glass-border ${getGlowClass()}`}
          animate={{
            boxShadow: [
              `0 0 30px -5px ${
                percentage < 50
                  ? "hsl(var(--primary) / 0.3)"
                  : percentage < 80
                  ? "hsl(var(--accent) / 0.3)"
                  : "hsl(var(--destructive) / 0.3)"
              }`,
              `0 0 40px -5px ${
                percentage < 50
                  ? "hsl(var(--primary) / 0.5)"
                  : percentage < 80
                  ? "hsl(var(--accent) / 0.5)"
                  : "hsl(var(--destructive) / 0.5)"
              }`,
              `0 0 30px -5px ${
                percentage < 50
                  ? "hsl(var(--primary) / 0.3)"
                  : percentage < 80
                  ? "hsl(var(--accent) / 0.3)"
                  : "hsl(var(--destructive) / 0.3)"
              }`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between w-72 mt-4 text-xs text-muted-foreground">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          ₹0
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          ₹{(total / 2).toLocaleString()}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          ₹{total.toLocaleString()}
        </motion.span>
      </div>

      {/* Stats */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.p
          className={`text-sm font-medium ${getStatusColor()}`}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {getStatusText()}
        </motion.p>
        <motion.p
          className="text-4xl font-display font-bold mt-3"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.8 }}
        >
          <span className="text-muted-foreground text-lg">Spent: </span>
          <span className={getStatusColor()}>₹{spent.toLocaleString()}</span>
        </motion.p>
        <motion.p
          className="text-muted-foreground mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Remaining:{" "}
          <span className="text-foreground font-semibold">
            ₹{remaining.toLocaleString()}
          </span>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AnimatedSpeedometer;
