const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* HisabiX Logo - Colorful blocks */}
      {/* HisabiX Logo */}
      <img
        src="/logo-new.png"
        alt="Logo"
        className="h-8 w-auto object-contain"
      />
      <span className="text-2xl font-bold text-foreground">HisabiX</span>
    </div>
  );
};

export default Logo;
