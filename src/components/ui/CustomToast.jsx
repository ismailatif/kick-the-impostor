import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    AlertCircle,
    XCircle,
    Info,
    X,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toastStore } from '@/hooks/useCustomToast';

// Individual toast component
const Toast = ({ toast, onClose }) => {
    const variants = {
        success: { bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-900 dark:text-emerald-50', icon: CheckCircle2, iconColor: 'text-emerald-600 dark:text-emerald-400' },
        error: { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800', text: 'text-red-900 dark:text-red-50', icon: XCircle, iconColor: 'text-red-600 dark:text-red-400' },
        warning: { bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-50', icon: AlertTriangle, iconColor: 'text-amber-600 dark:text-amber-400' },
        info: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-50', icon: Info, iconColor: 'text-blue-600 dark:text-blue-400' },
        loading: { bg: 'bg-slate-50 dark:bg-slate-950', border: 'border-slate-200 dark:border-slate-800', text: 'text-slate-900 dark:text-slate-50', icon: null, iconColor: '' }
    };

    const variant = variants[toast.type] || variants.info;
    const IconComponent = variant.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{
                duration: 0.3,
                ease: 'easeOut'
            }}
            className={cn(
                'relative min-w-[320px] max-w-sm mx-auto px-4 py-4 rounded-xl border shadow-lg backdrop-blur-sm',
                'flex items-start gap-3 pointer-events-auto',
                variant.bg,
                variant.border
            )}
        >
            {/* Icon */}
            {IconComponent ? (
                <div className="flex-shrink-0 pt-1">
                    {toast.type === 'loading' ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className={cn('w-5 h-5 rounded-full border-2 border-transparent border-t-current', variant.iconColor)}
                        />
                    ) : (
                        <IconComponent className={cn('w-5 h-5', variant.iconColor)} />
                    )}
                </div>
            ) : null}

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={cn('font-semibold text-sm leading-tight', variant.text)}>
                    {toast.message}
                </p>
                {toast.description && (
                    <p className={cn('text-xs mt-1 opacity-80', variant.text)}>
                        {toast.description}
                    </p>
                )}
            </div>

            {/* Close button */}
            <button
                onClick={() => onClose(toast.id)}
                className={cn(
                    'flex-shrink-0 p-1 rounded-lg transition-colors',
                    'hover:bg-black/5 dark:hover:bg-white/10',
                    variant.text
                )}
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

// Toast container component
export const CustomToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        return toastStore.subscribe(setToasts);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
            <div className="flex flex-col gap-3 p-4 max-w-lg mx-auto pointer-events-auto">
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            toast={toast}
                            onClose={(id) => toastStore.remove(id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
