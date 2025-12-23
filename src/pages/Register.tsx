import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Settings, User, Upload, Phone, Globe, MapPin, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  { id: 1, label: "المالك", icon: User },
  { id: 2, label: "النشاط", icon: Building2 },
  { id: 3, label: "إعدادات الشركة", icon: Settings },
];

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signUp } = useAuth();

  const [formData, setFormData] = useState({
    // User data (step 1)
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    // Company data (step 2)
    businessName: "",
    startDate: "",
    currency: "EGP",
    website: "",
    companyPhone: "",
    altPhone: "",
    country: "مصر",
    governorate: "",
    city: "",
    address: "",
    postalCode: "",
    timezone: "Africa/Cairo",
  });

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const validateStep1 = () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة السر غير متطابقة",
        variant: "destructive",
      });
      return false;
    }
    if (formData.password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة السر يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.businessName) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم النشاط",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      await handleRegister();
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);

    // 1. Create user account
    const { error: signUpError } = await signUp(formData.email, formData.password, formData.fullName);

    if (signUpError) {
      setIsLoading(false);
      let errorMessage = "حدث خطأ أثناء إنشاء الحساب";
      if (signUpError.message.includes("already registered")) {
        errorMessage = "البريد الإلكتروني مسجل بالفعل";
      }
      toast({
        title: "خطأ في التسجيل",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // 2. Create company (will be linked after user confirms email and logs in)
    // For now, store company data in localStorage to create after login
    localStorage.setItem('pendingCompany', JSON.stringify({
      name: formData.businessName,
      phone: formData.companyPhone,
      website: formData.website,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      currency: formData.currency,
      timezone: formData.timezone,
      financial_year_start: formData.startDate || new Date().toISOString().split('T')[0],
    }));

    setIsLoading(false);
    toast({
      title: "تم التسجيل بنجاح",
      description: "مرحباً بك في HisabiX",
    });
    navigate("/dashboard");
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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
      <div className="w-full max-w-3xl card-glass rounded-2xl p-8 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-card-foreground">
            HisabiX | Cloud ERP, Accounting, Sales, Inventory Software
          </h2>
          <p className="text-muted-foreground text-sm mt-1">سجل وابدأ في دقائق</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                disabled={currentStep < step.id}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "bg-primary/20 text-primary cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <span>{step.id}. {step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${currentStep > step.id ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <>
              <h3 className="text-lg font-semibold text-card-foreground text-center mb-6">
                معلومات الحساب:
              </h3>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label className="text-card-foreground text-sm">الاسم الكامل:*</Label>
                  <div className="relative">
                    <Input
                      placeholder="الاسم الكامل"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                    />
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-card-foreground text-sm">البريد الإلكتروني:*</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-card border-border/50 text-card-foreground h-12 text-left pl-12"
                      dir="ltr"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">تأكيد كلمة السر:*</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="تأكيد كلمة السر"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">كلمة السر:*</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="كلمة السر (6 أحرف على الأقل)"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12 pl-12"
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="text-card-foreground text-sm">رقم الموبايل:</Label>
                  <div className="relative">
                    <Input
                      placeholder="رقم الموبايل"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                    />
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h3 className="text-lg font-semibold text-card-foreground text-center mb-6">
                تفاصيل عن الشركة:
              </h3>
              
              <div className="space-y-4">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label className="text-card-foreground text-sm">اسم النشاط:*</Label>
                  <div className="relative">
                    <Input
                      placeholder="اسم النشاط"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                    />
                    <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  </div>
                </div>

                {/* Start Date & Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">العملة:*</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger className="bg-card border-border/50 text-card-foreground h-12">
                        <SelectValue placeholder="اختر العملة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                        <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">تاريخ البدء:</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="bg-card border-border/50 text-card-foreground h-12"
                    />
                  </div>
                </div>

                {/* Logo & Website */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">موقع الكتروني:</Label>
                    <div className="relative">
                      <Input
                        placeholder="موقع الكتروني"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                      />
                      <Globe className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">تحميل الشعار:</Label>
                    <Button variant="outline" className="w-full h-12 bg-warning text-card-foreground hover:bg-warning/90">
                      <Upload className="w-4 h-4 ml-2" />
                      تصفح...
                    </Button>
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">رقم موبايل بديل:</Label>
                    <div className="relative">
                      <Input
                        placeholder="رقم موبايل بديل"
                        value={formData.altPhone}
                        onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                      />
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">رقم تليفون النشاط:</Label>
                    <div className="relative">
                      <Input
                        placeholder="رقم تليفون النشاط"
                        value={formData.companyPhone}
                        onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                      />
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h3 className="text-lg font-semibold text-card-foreground text-center mb-6">
                إعدادات الموقع:
              </h3>
              
              <div className="space-y-4">
                {/* Country & Governorate */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">المحافظة:</Label>
                    <div className="relative">
                      <Input
                        placeholder="المحافظة"
                        value={formData.governorate}
                        onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                      />
                      <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">الدولة:</Label>
                    <div className="relative">
                      <Input
                        placeholder="الدولة"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                      />
                      <Globe className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* City & Postal Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">كود الإتصال:</Label>
                    <div className="relative">
                      <Input
                        placeholder="كود الإتصال"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                      />
                      <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">المدينة:</Label>
                    <div className="relative">
                      <Input
                        placeholder="المدينة"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                      />
                      <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Address & Timezone */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">المنطقة الزمنية:</Label>
                    <Select value={formData.timezone} onValueChange={(v) => setFormData({ ...formData, timezone: v })}>
                      <SelectTrigger className="bg-card border-border/50 text-card-foreground h-12">
                        <SelectValue placeholder="اختر المنطقة الزمنية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Cairo">Africa/Cairo</SelectItem>
                        <SelectItem value="Asia/Riyadh">Asia/Riyadh</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">عنوان مختصر:</Label>
                    <div className="relative">
                      <Input
                        placeholder="عنوان مختصر"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                      />
                      <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1 || isLoading}
              className="px-8"
            >
              السابق
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="px-8 bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التسجيل...
                </>
              ) : currentStep === 3 ? (
                "إنهاء التسجيل"
              ) : (
                "التالي"
              )}
            </Button>
          </div>
        </div>

        {/* Login Link */}
        <p className="text-center text-card-foreground text-sm mt-6">
          لديك حساب بالفعل؟{" "}
          <Link to="/" className="text-primary font-semibold hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;
