import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Building2,
  Mail,
  Lock,
  User,
  AlertTriangle,
} from "lucide-react";
import Logo from "@/components/Logo";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  company_id: string;
  company_name?: string;
  expires_at: string;
  status: string;
}

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"loading" | "register" | "success" | "error">("loading");

  // Registration form
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registering, setRegistering] = useState(false);

  // Check if user exists
  const [userExists, setUserExists] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("رابط الدعوة غير صالح");
        setStep("error");
        setLoading(false);
        return;
      }

      try {
        // Fetch invitation by token
        const { data: invData, error: invError } = await supabase
          .from("user_invitations")
          .select("*")
          .eq("token", token)
          .maybeSingle();

        if (invError) throw invError;

        if (!invData) {
          setError("لم يتم العثور على الدعوة");
          setStep("error");
          setLoading(false);
          return;
        }

        // Check if expired
        if (new Date(invData.expires_at) < new Date()) {
          setError("انتهت صلاحية هذه الدعوة");
          setStep("error");
          setLoading(false);
          return;
        }

        // Check if already accepted
        if (invData.status !== "pending") {
          setError("تم استخدام هذه الدعوة مسبقاً");
          setStep("error");
          setLoading(false);
          return;
        }

        // Fetch company name
        const { data: companyData } = await supabase
          .from("companies")
          .select("name")
          .eq("id", invData.company_id)
          .maybeSingle();

        setInvitation({
          ...invData,
          company_name: companyData?.name || "الشركة",
        });

        // Check if user already exists by trying to sign in
        // We'll show the appropriate form based on their input
        setStep("register");
      } catch (err: any) {
        console.error("Error fetching invitation:", err);
        setError("فشل في تحميل الدعوة");
        setStep("error");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) return;

    if (!fullName.trim()) {
      toast.error("يرجى إدخال الاسم");
      return;
    }

    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    setRegistering(true);

    try {
      // Sign up user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        // If user already exists, show login form
        if (signUpError.message.includes("already registered")) {
          setUserExists(true);
          toast.error("هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول");
          setRegistering(false);
          return;
        }
        throw signUpError;
      }

      if (signUpData.user) {
        // Add user to company
        const { error: companyError } = await supabase
          .from("company_users")
          .insert({
            user_id: signUpData.user.id,
            company_id: invitation.company_id,
            role: invitation.role as "admin" | "moderator" | "user",
          });

        if (companyError) throw companyError;

        // Update invitation status
        await supabase
          .from("user_invitations")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
          })
          .eq("id", invitation.id);

        setStep("success");
        toast.success("تم إنشاء حسابك بنجاح!");
      }
    } catch (err: any) {
      console.error("Error registering:", err);
      toast.error(err.message || "فشل في إنشاء الحساب");
    } finally {
      setRegistering(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) return;

    setLoggingIn(true);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: loginPassword,
      });

      if (signInError) throw signInError;

      if (signInData.user) {
        // Check if already member of company
        const { data: existingMember } = await supabase
          .from("company_users")
          .select("id")
          .eq("user_id", signInData.user.id)
          .eq("company_id", invitation.company_id)
          .maybeSingle();

        if (!existingMember) {
          // Add user to company
          const { error: companyError } = await supabase
            .from("company_users")
            .insert({
              user_id: signInData.user.id,
              company_id: invitation.company_id,
              role: invitation.role as "admin" | "moderator" | "user",
            });

          if (companyError) throw companyError;
        }

        // Update invitation status
        await supabase
          .from("user_invitations")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
          })
          .eq("id", invitation.id);

        toast.success("تم قبول الدعوة بنجاح!");
        navigate("/");
      }
    } catch (err: any) {
      console.error("Error logging in:", err);
      toast.error(err.message || "فشل في تسجيل الدخول");
    } finally {
      setLoggingIn(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "مدير",
      moderator: "مشرف",
      user: "مستخدم",
    };
    return labels[role] || role;
  };

  if (loading || step === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">جاري تحميل الدعوة...</p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">خطأ في الدعوة</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link to="/login">الذهاب لتسجيل الدخول</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">تم إنشاء حسابك بنجاح!</CardTitle>
            <CardDescription>
              تم إضافتك إلى {invitation?.company_name} كـ {getRoleLabel(invitation?.role || "")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>يمكنك الآن تسجيل الدخول والبدء في استخدام النظام</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link to="/login">تسجيل الدخول</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Building2 className="w-5 h-5" />
            دعوة للانضمام
          </CardTitle>
          <CardDescription className="space-y-2">
            <p>لقد تمت دعوتك للانضمام إلى:</p>
            <p className="font-semibold text-foreground text-lg">{invitation?.company_name}</p>
            <p className="text-sm">
              الصلاحية: <span className="font-medium">{getRoleLabel(invitation?.role || "")}</span>
            </p>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!userExists ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  البريد الإلكتروني
                </Label>
                <Input
                  type="email"
                  value={invitation?.email || ""}
                  disabled
                  className="bg-muted text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  الاسم الكامل
                </Label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  كلمة المرور
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                  required
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  تأكيد كلمة المرور
                </Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  required
                  dir="ltr"
                />
              </div>

              <Button type="submit" className="w-full" disabled={registering}>
                {registering && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                إنشاء الحساب والانضمام
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                لديك حساب بالفعل؟{" "}
                <button
                  type="button"
                  onClick={() => setUserExists(true)}
                  className="text-primary hover:underline"
                >
                  تسجيل الدخول
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول لقبول الدعوة.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  البريد الإلكتروني
                </Label>
                <Input
                  type="email"
                  value={invitation?.email || ""}
                  disabled
                  className="bg-muted text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  كلمة المرور
                </Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  dir="ltr"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loggingIn}>
                {loggingIn && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                تسجيل الدخول وقبول الدعوة
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ليس لديك حساب؟{" "}
                <button
                  type="button"
                  onClick={() => setUserExists(false)}
                  className="text-primary hover:underline"
                >
                  إنشاء حساب جديد
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
