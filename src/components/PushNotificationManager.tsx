import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  checkPushSubscription,
  isPushNotificationSupported
} from '@/utils/pushNotifications';

interface PushNotificationManagerProps {
  companyId: string;
}

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({ companyId }) => {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const checkStatus = async () => {
      const supported = isPushNotificationSupported();
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        const subscribed = await checkPushSubscription();
        setIsSubscribed(subscribed);
      }
      
      setIsLoading(false);
    };

    checkStatus();
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true);

    try {
      if (enabled) {
        // Request permission first
        const perm = await requestNotificationPermission();
        setPermission(perm);

        if (perm !== 'granted') {
          toast({
            title: "الإذن مرفوض",
            description: "يرجى السماح بالإشعارات من إعدادات المتصفح",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Register service worker
        const registration = await registerServiceWorker();
        if (!registration) {
          throw new Error('Failed to register service worker');
        }

        // Subscribe to push
        const subscription = await subscribeToPushNotifications(registration, companyId);
        if (subscription) {
          setIsSubscribed(true);
          toast({
            title: "تم التفعيل",
            description: "ستتلقى الآن تنبيهات المتصفح"
          });
        }
      } else {
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsSubscribed(false);
          toast({
            title: "تم الإلغاء",
            description: "لن تتلقى تنبيهات المتصفح بعد الآن"
          });
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعديل إعدادات الإشعارات",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const sendTestNotification = async () => {
    if (!isSubscribed) {
      toast({
        title: "غير مفعل",
        description: "يرجى تفعيل إشعارات المتصفح أولاً",
        variant: "destructive"
      });
      return;
    }

    // Show a test notification locally
    if (Notification.permission === 'granted') {
      new Notification('إشعار تجريبي', {
        body: 'هذا إشعار تجريبي للتأكد من عمل التنبيهات',
        icon: '/favicon.ico',
        dir: 'rtl',
        lang: 'ar'
      });
      toast({
        title: "تم الإرسال",
        description: "تم إرسال إشعار تجريبي"
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <BellOff className="h-5 w-5" />
            تنبيهات المتصفح غير مدعومة
          </CardTitle>
          <CardDescription>
            المتصفح الحالي لا يدعم إشعارات Push. جرب استخدام Chrome أو Firefox أو Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          تنبيهات المتصفح (Push Notifications)
        </CardTitle>
        <CardDescription>
          تفعيل التنبيهات الفورية للمتصفح لتلقي إشعارات مهمة حتى عند إغلاق التطبيق
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-toggle" className="text-base">
              تفعيل تنبيهات المتصفح
            </Label>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? "التنبيهات مفعلة - ستتلقى إشعارات فورية" 
                : "التنبيهات معطلة - قم بتفعيلها للحصول على إشعارات فورية"}
            </p>
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Switch
              id="push-toggle"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          )}
        </div>

        {permission === 'denied' && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            تم رفض إذن الإشعارات. يرجى السماح بالإشعارات من إعدادات المتصفح ثم إعادة تحميل الصفحة.
          </div>
        )}

        {isSubscribed && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={sendTestNotification}
            className="w-full"
          >
            إرسال إشعار تجريبي
          </Button>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• ستتلقى إشعارات للفواتير المتأخرة وتنبيهات المخزون</p>
          <p>• تعمل الإشعارات حتى عند إغلاق التطبيق (في المتصفحات المدعومة)</p>
          <p>• يمكنك إيقاف الإشعارات في أي وقت</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PushNotificationManager;
