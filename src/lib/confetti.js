import confetti from "canvas-confetti";

export const triggerPremiumCelebration = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#2EB85C', '#F2C427', '#ffffff'] // Success green, Gold, White
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#2EB85C', '#F2C427', '#ffffff']
        });
    }, 250);
};

export const triggerErrorBurst = () => {
    confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#EB2727', '#1a1a1a'], // Destructive red
        disableForReducedMotion: true
    });
};
