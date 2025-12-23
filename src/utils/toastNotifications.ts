import { toast as baseToast } from "@/hooks/use-toast";

type ToastType = "success" | "error" | "warning" | "info" | "default";

interface ShowToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
}

const variantMap = {
  success: "success" as const,
  error: "destructive" as const,
  warning: "warning" as const,
  info: "info" as const,
  default: "default" as const,
};

const prefixMap = {
  success: "✓ ",
  error: "✕ ",
  warning: "⚠ ",
  info: "ℹ ",
  default: "",
};

export const showToast = ({ title, description, type = "default" }: ShowToastOptions) => {
  const prefix = prefixMap[type];
  
  return baseToast({
    title: `${prefix}${title}`,
    description,
    variant: variantMap[type],
  });
};

// Convenience methods
export const toastSuccess = (title: string, description?: string) => 
  showToast({ title, description, type: "success" });

export const toastError = (title: string, description?: string) => 
  showToast({ title, description, type: "error" });

export const toastWarning = (title: string, description?: string) => 
  showToast({ title, description, type: "warning" });

export const toastInfo = (title: string, description?: string) => 
  showToast({ title, description, type: "info" });

export default showToast;
