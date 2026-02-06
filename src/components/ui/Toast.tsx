'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useToastStore, type Toast as ToastType, type ToastType as ToastVariant } from '@/stores/toastStore';

const iconMap: Record<ToastVariant, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  warning: 'M12 9v4m0 4h.01',
  info: 'M13 16h-1v-4h-1m1-4h.01',
};

const colorMap: Record<ToastVariant, string> = {
  success: 'border-green-500 bg-green-50 dark:bg-green-950/50',
  error: 'border-red-500 bg-red-50 dark:bg-red-950/50',
  warning: 'border-amber-500 bg-amber-50 dark:bg-amber-950/50',
  info: 'border-blue-500 bg-blue-50 dark:bg-blue-950/50',
};

const iconColorMap: Record<ToastVariant, string> = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
};

interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => onDismiss(toast.id), 150);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 150);
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 w-80 rounded-lg border-l-4 p-4 shadow-lg',
        'bg-white dark:bg-zinc-900',
        colorMap[toast.type],
        exiting ? 'animate-slide-out-right' : 'animate-slide-in-right',
      )}
    >
      <svg
        className={cn('h-5 w-5 mt-0.5 shrink-0', iconColorMap[toast.type])}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={iconMap[toast.type]} />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        aria-label="Dismiss notification"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

export default ToastContainer;
