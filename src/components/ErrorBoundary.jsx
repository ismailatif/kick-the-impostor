import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { logError } from '@/lib/errorHandler';

/**
 * Error Boundary Component
 * Catches React errors and displays a user-friendly error UI
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        logError(error, 'React Error Boundary');

        this.setState(prev => ({
            error,
            errorInfo,
            errorCount: prev.errorCount + 1
        }));

        // You can also log the error to an error reporting service here
        // Example: Sentry, LogRocket, etc.
    }

    handleReset() {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    }

    handleGoHome() {
        window.location.href = '#/';
    }

    render() {
        if (this.state.hasError) {
            return (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4"
                >
                    <div className="max-w-md w-full">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 text-center border border-red-100 dark:border-red-900"
                        >
                            {/* Error Icon */}
                            <motion.div
                                animate={{ rotate: [0, -5, 5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                                className="mb-4 inline-flex"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg"></div>
                                    <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 relative" />
                                </div>
                            </motion.div>

                            {/* Error Title */}
                            <h1 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
                                Oops! Something Went Wrong
                            </h1>

                            {/* Error Description */}
                            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                                We're sorry, but something unexpected happened. Don't worry, we're on it!
                            </p>

                            {/* Error Details (Development Only) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-left mb-4 max-h-32 overflow-y-auto"
                                >
                                    <p className="text-xs font-mono text-red-900 dark:text-red-100 break-words">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-xs font-semibold text-red-700 dark:text-red-300">
                                                Stack Trace
                                            </summary>
                                            <pre className="text-xs text-red-600 dark:text-red-400 mt-2 overflow-x-auto">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </motion.div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => this.handleReset()}
                                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Try Again
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => this.handleGoHome()}
                                    className="w-full py-3 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-bold rounded-lg transition-colors"
                                >
                                    Go to Home
                                </motion.button>
                            </div>

                            {/* Error Count Warning */}
                            {this.state.errorCount > 3 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                                >
                                    <p className="text-xs text-amber-700 dark:text-amber-200">
                                        ⚠️ Multiple errors detected. Please refresh your page or contact support.
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
