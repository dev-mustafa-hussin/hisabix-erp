import { ReactNode } from "react";
import Logo from "./Logo";
import heroBg from "@/assets/hero-bg.jpg";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 hero-bg opacity-90" />
        <div className="absolute inset-0 tech-grid-bg" />
        <div className="absolute inset-0 particles-bg opacity-30" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Logo className="text-foreground" />
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">حالة الإصلاح</a>
            <a href="#" className="hover:text-foreground transition-colors">ملف عضو الجيم</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>العربية - Arabic</span>
            <span>◄</span>
          </div>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            الباقات
          </a>
          <a 
            href="/register" 
            className="px-6 py-2 rounded-full border border-foreground/30 text-foreground text-sm hover:bg-foreground/10 transition-colors"
          >
            تسجيل
          </a>
        </div>
      </nav>

      {/* Hero Text */}
      <div className="relative z-10 px-6 mt-16 md:mt-24">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight max-w-md">
          أهلا بك في عالم التكنولوجيا
          <br />
          للأعمال التجارية
        </h1>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 flex items-start justify-center md:justify-end px-6 md:px-20 mt-8">
        {children}
      </div>

      {/* Globe decoration */}
      <div className="absolute bottom-8 left-8 z-10 hidden md:flex items-center gap-3 opacity-60">
        <div className="w-16 h-16 rounded-full border-2 border-accent/50 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-accent/30" />
        </div>
        <span className="text-accent text-lg">hisabix.com</span>
      </div>
    </div>
  );
};

export default AuthLayout;
