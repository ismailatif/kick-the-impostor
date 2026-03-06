import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const AudioContext = createContext(null);

export const AudioProvider = ({ children }) => {
    const [isMuted, setIsMuted] = useState(false);
    const audioCtxRef = useRef(null);

    // BGM refs
    const lobbyBgmRef = useRef(null);
    const suspenseBgmRef = useRef(null);
    const currentBgmRef = useRef(null);

    useEffect(() => {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();

        // Initialize background audio elements
        lobbyBgmRef.current = new Audio('/lobby.ogg');
        lobbyBgmRef.current.loop = true;
        lobbyBgmRef.current.volume = 0;

        suspenseBgmRef.current = new Audio('/suspense.ogg');
        suspenseBgmRef.current.loop = true;
        suspenseBgmRef.current.volume = 0;

        return () => {
            if (audioCtxRef.current?.state !== 'closed') {
                audioCtxRef.current?.close();
            }
            lobbyBgmRef.current?.pause();
            suspenseBgmRef.current?.pause();
        };
    }, []);

    // Update mute state across elements
    useEffect(() => {
        if (lobbyBgmRef.current) lobbyBgmRef.current.muted = isMuted;
        if (suspenseBgmRef.current) suspenseBgmRef.current.muted = isMuted;
    }, [isMuted]);

    // SFX Synth System
    const playTone = useCallback((frequency, type, duration, vol = 0.1) => {
        if (isMuted || !audioCtxRef.current) return;

        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const oscillator = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);

        gainNode.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);

        oscillator.start();
        oscillator.stop(audioCtxRef.current.currentTime + duration);
    }, [isMuted]);

    const sfx = {
        hover: () => playTone(600, 'sine', 0.05, 0.02),
        click: () => playTone(400, 'triangle', 0.1, 0.05),
        success: () => {
            if (isMuted) return;
            playTone(523.25, 'sine', 0.2, 0.05); // C5
            setTimeout(() => playTone(659.25, 'sine', 0.4, 0.05), 100); // E5
            setTimeout(() => playTone(783.99, 'sine', 0.6, 0.05), 200); // G5
        },
        tick: () => playTone(1000, 'square', 0.02, 0.02),
        error: () => playTone(150, 'sawtooth', 0.3, 0.05),
    };

    // Crossfade BGM System
    const playBGM = useCallback((type) => { // 'lobby' | 'suspense' | 'none'
        if (isMuted) return;

        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const fadeOut = (audioEl) => {
            if (!audioEl || audioEl.paused) return;
            let vol = audioEl.volume;
            const interval = setInterval(() => {
                if (vol > 0.05) {
                    vol -= 0.05;
                    audioEl.volume = vol;
                } else {
                    audioEl.volume = 0;
                    audioEl.pause();
                    clearInterval(interval);
                }
            }, 50);
        };

        const fadeIn = (audioEl, targetVol = 0.3) => {
            if (!audioEl) return;
            audioEl.play().catch(e => console.warn("BGM autoplay blocked", e));
            let vol = 0;
            audioEl.volume = vol;
            const interval = setInterval(() => {
                if (vol < targetVol - 0.05) {
                    vol += 0.05;
                    audioEl.volume = vol;
                } else {
                    audioEl.volume = targetVol;
                    clearInterval(interval);
                }
            }, 50);
        };

        const targetAudio = type === 'lobby' ? lobbyBgmRef.current :
            type === 'suspense' ? suspenseBgmRef.current : null;

        if (currentBgmRef.current === targetAudio && targetAudio && !targetAudio.paused) return;

        if (currentBgmRef.current) {
            fadeOut(currentBgmRef.current);
        }

        if (targetAudio) {
            fadeIn(targetAudio, type === 'lobby' ? 0.3 : 0.5);
        }

        currentBgmRef.current = targetAudio;
    }, [isMuted]);

    return (
        <AudioContext.Provider value={{ sfx, playBGM, isMuted, setIsMuted }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => useContext(AudioContext);
