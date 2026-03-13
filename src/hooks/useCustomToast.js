// Toast store for managing multiple toasts
const toastStore = {
    listeners: [],
    toasts: [],

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    notify() {
        this.listeners.forEach(l => l(this.toasts));
    },

    add(toast) {
        const id = Date.now();
        const toastItem = { ...toast, id };
        this.toasts.push(toastItem);
        this.notify();

        if (toast.duration !== 0) {
            setTimeout(() => this.remove(id), toast.duration ?? 4000);
        }

        return id;
    },

    remove(id) {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.notify();
    },

    clear() {
        this.toasts = [];
        this.notify();
    }
};

// Custom hook to use toasts
export const useCustomToast = () => {
    return {
        success: (message, description, duration = 4000) =>
            toastStore.add({
                type: 'success',
                message,
                description,
                duration
            }),
        error: (message, description, duration = 5000) =>
            toastStore.add({
                type: 'error',
                message,
                description,
                duration
            }),
        warning: (message, description, duration = 4000) =>
            toastStore.add({
                type: 'warning',
                message,
                description,
                duration
            }),
        info: (message, description, duration = 4000) =>
            toastStore.add({
                type: 'info',
                message,
                description,
                duration
            }),
        loading: (message, description) =>
            toastStore.add({
                type: 'loading',
                message,
                description,
                duration: 0
            }),
        remove: (id) => toastStore.remove(id),
        clear: () => toastStore.clear()
    };
};

export { toastStore };
