import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const ContactsMap = () => {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-7 h-7 text-primary" />
            خريطة العملاء
          </h1>
          <p className="text-muted-foreground">
            توزيع العملاء والموردين الجغرافي
          </p>
        </div>

        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0 h-full relative bg-secondary/20 flex flex-col items-center justify-center text-muted-foreground">
            {/* Placeholder for actual integration */}
            <MapPin className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">الخريطة التفاعلية</p>
            <p className="text-sm">سيتم دمج Google Maps / Leaflet هنا</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ContactsMap;
