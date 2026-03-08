import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    staggerContainer, slideUpItem, hoverScale, tapScale,
    pulseGlow, breathing, revealCard, flip
} from "@/lib/animations";
import {
    Eye, EyeOff, RotateCcw, Vote, Mic, User, Crown
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
import { useSocket } from "@/hooks/useSocket";

const OnlineGamePlay = ({ onEnd }) => {
    const { t, isRTL } = useLanguage();
    const { sfx, playBGM, isMuted, toggleMute } = useAudio();
    const { socket, room, onlinePhase, onlineGameData, votedPlayers, voteResults, syncPhase, submitVote } = useSocket();

    const [isRevealed, setIsRevealed] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [localVote, setLocalVote] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

    const audioRef = useRef(null);
    const holdTimerRef = useRef(null);

    const isHost = room?.hostId === socket?.id;
    const myRole = onlineGameData?.role; // 'citizen' or 'impostor'
    const isImpostor = myRole === 'impostor';
    const players = onlineGameData?.players || [];
    const myIndex = players.indexOf(room?.players.find(p => p.id === socket?.id)?.name);

    // Synchronize phase music and local state
    useEffect(() => {
        if (onlinePhase === 'speaking' || onlinePhase === 'discussion') {
            playBGM('suspense');
            if (room?.settings.hasTimer) setTimeLeft(120);
        } else if (onlinePhase === 'result') {
            playBGM('none');
        }
    }, [onlinePhase, playBGM, room]);

    // Timer logic (Sync with server in a real app, here we just do local for display)
    useEffect(() => {
        if ((onlinePhase === 'speaking' || onlinePhase === 'discussion') && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [onlinePhase, timeLeft]);

    const startHold = () => {
        if (isRevealed) return;
        sfx.vibrate();
        holdTimerRef.current = setInterval(() => {
            setHoldProgress(prev => {
                if (prev >= 100) {
                    clearInterval(holdTimerRef.current);
                    handleReveal();
                    return 100;
                }
                return prev + 2;
            });
        }, 20);
    };

    const stopHold = () => {
        if (holdProgress < 100) {
            clearInterval(holdTimerRef.current);
            setHoldProgress(0);
        }
    };

    const handleReveal = () => {
        sfx.reveal();
        setIsRevealed(true);
        if (isImpostor) {
            sfx.error();
            sfx.vibrate();
        }
    };

    const handleNextPhase = () => {
        if (!isHost) return;
        sfx.click();
        const phases = ['reveal', 'speaking', 'discussion', 'vote', 'suspense', 'result'];
        const currentIndex = phases.indexOf(onlinePhase);
        if (currentIndex < phases.length - 1) {
            syncPhase(room.code, phases[currentIndex + 1]);
        }
    };

    const handleVote = (index) => {
        if (localVote !== null) return;
        sfx.vote();
        setLocalVote(index);
        submitVote(room.code, index);
    };

    // REVEAL PHASE
    if (onlinePhase === "reveal") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
                <motion.div animate={breathing} className="absolute inset-0 bg-primary/5 z-0" />

                <div className="relative z-10 w-full max-w-sm text-center">
                    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mb-8">
                        <motion.h2 variants={slideUpItem} className="text-4xl font-black text-primary mb-2 uppercase tracking-tighter italic">
                            {t("game.holdToReveal")}
                        </motion.h2>
                    </motion.div>

                    <motion.div
                        initial={false}
                        animate={isRevealed ? { rotateY: 180 } : { rotateY: 0 }}
                        transition={flip}
                        className="preserve-3d relative w-full aspect-[3/4] max-w-[280px] mx-auto cursor-pointer"
                        onMouseDown={startHold}
                        onMouseUp={stopHold}
                        onMouseLeave={stopHold}
                        onTouchStart={startHold}
                        onTouchEnd={stopHold}
                    >
                        {/* Front of card */}
                        <div className="absolute inset-0 backface-hidden game-card glass-panel flex flex-col items-center justify-center border-2 border-primary/20 shadow-2xl">
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                <motion.div
                                    className="absolute inset-0 rounded-full border-4 border-primary"
                                    style={{ clipPath: `inset(${100 - holdProgress}% 0 0 0)` }}
                                />
                                <Eye className="w-10 h-10 text-primary" />
                            </div>
                            <p className="text-xl font-black text-primary/60 uppercase tracking-widest">{t("game.holdButton")}</p>
                        </div>

                        {/* Back of card */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 game-card glass-panel flex flex-col items-center justify-center border-4 border-primary shadow-2xl overflow-hidden">
                            <motion.div animate={isRevealed ? revealCard : {}} className="text-center p-6 w-full">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isImpostor ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                                    {isImpostor ? <EyeOff className="w-10 h-10 text-destructive" /> : <Eye className="w-10 h-10 text-primary" />}
                                </div>

                                {isImpostor ? (
                                    <div>
                                        <h3 className="text-2xl font-black mb-4 uppercase text-destructive">
                                            {t("game.youAreImpostor")}
                                        </h3>
                                        {room?.settings?.impostorHint && (
                                            <div className="mt-4 bg-background/50 rounded-2xl p-4 border border-destructive/10">
                                                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                                                    {t("game.categoryHint")}
                                                </p>
                                                <p className="text-2xl font-black text-destructive">
                                                    {t(onlineGameData?.category)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                                            {t("game.secretWord")}
                                        </p>
                                        <h3 className="text-3xl font-black mb-2 uppercase text-primary">
                                            {onlineGameData?.secretWord}
                                        </h3>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>

                    {isHost && (
                        <motion.button
                            whileHover={hoverScale} whileTap={tapScale}
                            onClick={handleNextPhase}
                            className="mt-12 w-full glass-button py-4 rounded-2xl font-bold text-xl shadow-game"
                        >
                            {t("game.beginDiscussion")}
                        </motion.button>
                    )}
                </div>
            </div>
        );
    }

    // Common UI for Speaking/Discussion
    if (onlinePhase === "speaking" || onlinePhase === "discussion") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
                <h2 className="text-3xl font-black mb-8 text-primary">{onlinePhase === 'speaking' ? t("game.speakingTime") : t("game.discussionTime")}</h2>
                <div className="game-card max-w-sm w-full text-center">
                    <Mic className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-xl font-bold text-muted-foreground mb-4">{t("game.discussionDesc")}</p>
                    {timeLeft !== null && (
                        <div className="text-5xl font-black font-mono tracking-tighter text-primary">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    )}
                </div>
                {isHost && (
                    <motion.button
                        whileHover={hoverScale} whileTap={tapScale}
                        onClick={handleNextPhase}
                        className="mt-8 w-full max-w-sm glass-button py-4 rounded-2xl font-bold text-xl shadow-game"
                    >
                        {onlinePhase === 'speaking' ? t("game.beginDiscussion") : t("game.startVoting")}
                    </motion.button>
                )}
            </div>
        );
    }

    // VOTING PHASE
    if (onlinePhase === "vote") {
        return (
            <div className="min-h-screen bg-background px-5 pt-12 pb-24 overflow-y-auto">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-primary drop-shadow-sm mb-2 uppercase tracking-tighter">{t("game.voting")}</h2>
                    <p className="text-lg text-muted-foreground font-semibold">{t("game.whoIsImpostor")}</p>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                    {players.map((player, i) => (
                        i !== myIndex && (
                            <motion.button
                                key={i}
                                whileHover={hoverScale}
                                whileTap={tapScale}
                                disabled={localVote !== null}
                                onClick={() => handleVote(i)}
                                className={`w-full game-card border-white/20 flex items-center gap-4 py-4 px-6 transition-all shadow-md ${localVote === i ? 'bg-primary border-primary text-white' : 'bg-card/80 hover:bg-card border-white/10 opacity-70'}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${localVote === i ? 'bg-white/20' : 'bg-primary/10'}`}>
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-xl font-bold">{player}</p>
                                </div>
                            </motion.button>
                        )
                    ))}
                </div>

                {isHost && (
                    <motion.button
                        whileHover={hoverScale} whileTap={tapScale}
                        onClick={handleNextPhase}
                        className="mt-12 w-full max-w-sm mx-auto block glass-button py-4 rounded-2xl font-bold text-xl shadow-game"
                    >
                        {t("game.revealTruth")}
                    </motion.button>
                )}
            </div>
        );
    }

    // RESULTS PHASE
    if (onlinePhase === "result") {
        const isRTLSeparator = isRTL ? "، " : ", ";
        const correctGuess = voteResults?.impostorCaught ?? false;
        const impostorNames = voteResults?.impostorNames?.join(isRTLSeparator) ?? "";

        // Determine per-player win/lose
        const didIWin = voteResults
            ? (isImpostor ? !correctGuess : correctGuess)
            : null;
        const mainTitle = didIWin === null
            ? (correctGuess ? t("game.impostorCaught") : t("game.impostorWon"))
            : (didIWin ? t("game.youWin") : t("game.youLose"));
        const secondaryLine = correctGuess ? t("game.impostorCaught") : t("game.impostorWon");

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
                <motion.div animate={breathing} className={`absolute inset-0 z-0 ${correctGuess ? 'bg-emerald-500/5' : 'bg-destructive/5'}`} />

                <motion.div variants={flip} initial="initial" animate="animate" className="game-card glass-panel w-full max-w-sm text-center relative z-10 shadow-2xl border-white/30">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-2 ${correctGuess ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-destructive/20 border-destructive/40'}`}>
                        <Crown className={`w-12 h-12 ${correctGuess ? 'text-emerald-500' : 'text-destructive'}`} />
                    </div>
                    <h2 className="text-4xl font-black mb-6 drop-shadow-sm uppercase tracking-tighter text-primary">{t("game.result")}</h2>

                    {voteResults ? (
                        <>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className={`rounded-3xl p-6 mb-8 shadow-inner border-2 ${correctGuess ? "bg-emerald-500/10 border-emerald-500/30" : "bg-destructive/10 border-destructive/30"}`}
                            >
                                <p className={`text-3xl font-black mb-2 ${didIWin ? "text-emerald-500" : "text-destructive"}`}>
                                    {mainTitle}
                                </p>
                                <p className="text-sm font-semibold text-muted-foreground mb-3">
                                    {secondaryLine}
                                </p>
                                <div className="h-px bg-white/10 w-full mb-4" />
                                {!isImpostor && (
                                    <p className="text-muted-foreground font-semibold text-lg italic">
                                        {t("game.impostorWas", { names: impostorNames })}
                                    </p>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="bg-primary/5 border-2 border-primary/20 shadow-inner rounded-3xl p-6 mb-10"
                            >
                                <p className="text-xs text-muted-foreground mb-1 uppercase font-black tracking-widest">
                                    {t("game.secretWord")}
                                </p>
                                <p className="text-4xl font-black text-primary drop-shadow-sm italic">
                                    {voteResults.secretWord}
                                </p>
                            </motion.div>
                        </>
                    ) : (
                        <p className="text-muted-foreground font-semibold mb-10">
                            {t("game.truthReveal")}
                        </p>
                    )}

                    <div className="flex gap-4">
                        <motion.button
                            whileHover={hoverScale}
                            whileTap={tapScale}
                            onClick={() => window.location.reload()}
                            className="flex-1 glass-button py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg text-lg"
                        >
                            <RotateCcw className="w-5 h-5" />
                            {t("game.newRound")}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return null;
};

export default OnlineGamePlay;
