import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Settings, User, Calendar, Upload, Phone, Globe, MapPin } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, label: "النشاط", icon: Building2 },
  { id: 2, label: "إعدادات الشركة", icon: Settings },
  { id: 3, label: "المالك", icon: User },
];

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    businessName: "",
    startDate: "",
    currency: "",
    website: "",
    phone: "",
    altPhone: "",
    country: "",
    governorate: "",
    city: "",
    address: "",
    postalCode: "",
    timezone: "Africa/Cairo",
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({
        title: "تم التسجيل بنجاح",
        description: "مرحباً بك في HisabiX",
      });
      navigate("/dashboard");
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
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
                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right"
                      />
                    </div>
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
                    <Label className="text-card-foreground text-sm">رقم تليفون النشاط:*</Label>
                    <div className="relative">
                      <Input
                        placeholder="رقم تليفون النشاط"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-card border-border/50 text-card-foreground h-12 text-right pr-12"
                      />
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Country & Governorate */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">المحافظة:*</Label>
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
                    <Label className="text-card-foreground text-sm">الدولة:*</Label>
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
                    <Label className="text-card-foreground text-sm">كود الإتصال:*</Label>
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
                    <Label className="text-card-foreground text-sm">المدينة:*</Label>
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
                    <Label className="text-card-foreground text-sm">المنطقة الزمنية:*</Label>
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
                    <Label className="text-card-foreground text-sm">عنوان مختصر:*</Label>
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

          {currentStep === 2 && (
            <div className="text-center py-12">
              <Settings className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">إعدادات الشركة</h3>
              <p className="text-muted-foreground mt-2">سيتم إضافة المزيد من الإعدادات هنا</p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">معلومات المالك</h3>
              <p className="text-muted-foreground mt-2">سيتم إضافة بيانات المالك هنا</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-8"
            >
              السابق
            </Button>
            <Button
              onClick={handleNext}
              className="px-8 bg-primary hover:bg-primary/90"
            >
              {currentStep === 3 ? "إنهاء التسجيل" : "التالي"}
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
