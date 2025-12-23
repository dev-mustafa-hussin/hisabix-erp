import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signIn } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني وكلمة السر",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      let errorMessage = "حدث خطأ أثناء تسجيل الدخول";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "البريد الإلكتروني أو كلمة السر غير صحيحة";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "يرجى تأكيد البريد الإلكتروني أولاً";
      }
      
      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "تم تسجيل الدخول بنجاح",
      description: "مرحباً بك في HisabiX",
    });
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md card-glass rounded-2xl p-8 animate-slide-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-card-foreground text-sm font-medium block text-left">
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border/50 text-card-foreground placeholder:text-muted-foreground/60 h-12 text-right"
              dir="ltr"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Link to="#" className="text-primary text-sm hover:underline">
                نسيت كلمة السر؟
              </Link>
              <Label htmlFor="password" className="text-card-foreground text-sm font-medium">
                كلمة السر
              </Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="كلمة السر"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-card border-border/50 text-card-foreground placeholder:text-muted-foreground/60 h-12 text-right pl-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-end gap-3">
            <Label htmlFor="remember" className="text-card-foreground text-sm cursor-pointer">
              تذكرني
            </Label>
            <Switch
              id="remember"
              checked={rememberMe}
              onCheckedChange={setRememberMe}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg rounded-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              "تسجيل الدخول"
            )}
          </Button>

          {/* Contact */}
          <div className="text-center space-y-4">
            <p className="text-primary text-sm">
              للاشتراك او خدمة العملاء تواصل معنا الان
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="#"
                className="w-12 h-12 rounded-lg bg-[#0084FF] flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.936 1.444 5.544 3.698 7.227V22l3.378-1.853c.9.25 1.855.384 2.924.384 5.523 0 10-4.145 10-9.243S17.523 2 12 2z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-lg bg-[#25D366] flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-card-foreground text-sm">
            لم تسجل بعد؟{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              سجل الآن
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
