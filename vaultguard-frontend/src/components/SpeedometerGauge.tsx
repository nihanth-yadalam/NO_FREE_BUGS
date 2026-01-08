import { useEffect, useState } from "react";

interface SpeedometerGaugeProps {
  spent: number;
  total: number;
}

const SpeedometerGauge = ({ spent, total }: SpeedometerGaugeProps) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const percentage = Math.min((spent / total) * 100, 100);
  const remaining = total - spent;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  // Calculate rotation: 0% = -90deg (left), 100% = 90deg (right)
  const rotation = -90 + (animatedPercentage * 1.8);
  
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

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-32 overflow-hidden">
        {/* Background arc */}
        <div className="absolute inset-0 w-64 h-64 rounded-full border-[16px] border-secondary" 
             style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }} />
        
        {/* Gradient arc */}
        <div 
          className="absolute inset-0 w-64 h-64 rounded-full gauge-gradient"
          style={{ 
            clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
            mask: "radial-gradient(circle at center, transparent 45%, black 46%, black 54%, transparent 55%)",
            WebkitMask: "radial-gradient(circle at center, transparent 45%, black 46%, black 54%, transparent 55%)"
          }} 
        />

        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-1000 ease-out"
          style={{ 
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            width: "4px",
            height: "100px"
          }}
        >
          <div className={`w-1 h-20 bg-foreground rounded-full ${getGlowClass()}`} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-foreground" />
        </div>

        {/* Center circle */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 rounded-full bg-card border-4 border-glass-border ${getGlowClass()}`} />
      </div>

      {/* Labels */}
      <div className="flex justify-between w-64 mt-2 text-xs text-muted-foreground">
        <span>₹0</span>
        <span>₹{(total / 2).toLocaleString()}</span>
        <span>₹{total.toLocaleString()}</span>
      </div>

      {/* Stats */}
      <div className="mt-6 text-center">
        <p className={`text-sm font-medium ${getStatusColor()}`}>{getStatusText()}</p>
        <p className="text-3xl font-display font-bold mt-2">
          <span className="text-muted-foreground text-lg">Spent: </span>
          <span className={getStatusColor()}>₹{spent.toLocaleString()}</span>
        </p>
        <p className="text-muted-foreground mt-1">
          Remaining: <span className="text-foreground font-semibold">₹{remaining.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
};

export default SpeedometerGauge;
