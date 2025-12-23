const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* HisabiX Logo - Colorful blocks */}
      <div className="flex gap-0.5">
        <div className="w-3 h-3 rounded-sm bg-[#FF6B6B]" />
        <div className="w-3 h-3 rounded-sm bg-[#4ECDC4]" />
        <div className="w-3 h-3 rounded-sm bg-[#FFE66D]" />
        <div className="w-3 h-3 rounded-sm bg-[#6366F1]" />
      </div>
      <span className="text-2xl font-bold text-foreground">
        HisabiX
      </span>
    </div>
  );
};

export default Logo;
