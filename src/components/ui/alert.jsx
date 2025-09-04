import React from 'react';
import { cn } from '@/shared/utils/cn';

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "relative w-full rounded-lg border p-4",
      {
        "border-red-200 bg-red-50 text-red-900": variant === "destructive",
        "border-yellow-200 bg-yellow-50 text-yellow-900": variant === "warning",
        "border-blue-200 bg-blue-50 text-blue-900": variant === "info",
        "border-green-200 bg-green-50 text-green-900": variant === "success",
        "border-gray-200 bg-gray-50 text-gray-900": !variant || variant === "default"
      },
      className
    )}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

export { Alert, AlertDescription, AlertTitle };