export const pageTransition = {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -15, scale: 0.98 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
};

export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12
        }
    }
};

export const slideUpItem = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
    }
};

export const hoverScale = {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2, ease: "easeOut" }
};

export const tapScale = {
    scale: 0.98,
    y: 0,
    transition: { duration: 0.1, ease: "easeIn" }
};

export const pulseGlow = {
    boxShadow: [
        "0px 0px 0px 0px rgba(var(--primary-rgb), 0)",
        "0px 0px 15px 5px rgba(var(--primary-rgb), 0.3)",
        "0px 0px 0px 0px rgba(var(--primary-rgb), 0)"
    ],
    transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity
    }
};

export const shake = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4, ease: "easeInOut" }
};

export const breathing = {
    scale: [1, 1.03, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
};

export const flip = {
    initial: { rotateY: 180, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    transition: { duration: 0.6, ease: "easeOut" }
};

export const revealCard = {
    hidden: { filter: "blur(20px)", scale: 0.8, opacity: 0 },
    visible: {
        filter: "blur(0px)",
        scale: 1,
        opacity: 1,
        transition: { type: "spring", stiffness: 260, damping: 20 }
    }
};
