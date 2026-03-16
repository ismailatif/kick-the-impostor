import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    staggerContainer, slideUpItem, hoverScale, tapScale,
    pulseGlow, breathing, revealCard, flip, shake
} from "@/lib/animations";
import {
    Eye, EyeOff, RotateCcw, Vote, Mic, User, Crown, VolumeX, Volume2, ArrowLeft, ArrowRight
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
import { useSocket } from "@/hooks/useSocketHook";
import { triggerPremiumCelebration, triggerErrorBurst } from "@/lib/confetti";
import { useCustomToast } from "@/hooks/useCustomToast";

const OnlineGamePlay = ({ onEnd }) => {
    const { t, isRTL } = useLanguage();
    const { sfx, playBGM, isMuted, toggleMute } = useAudio();
    const { socket, room, onlinePhase, onlineGameData, votedPlayers, voteResults, syncPhase, setReady, resetGame, submitVote } = useSocket();
    const toast = useCustomToast();

    const [isRevealed, setIsRevealed] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [localVote, setLocalVote] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

    const audioRef = useRef(null);
    const holdTimerRef = useRef(null);

    const isHost = room?.hostId === socket?.id;
    const myRole = onlineGameData?.role; // 'citizen' or 'impostor'
    const isImpostor = myRole === 'impostor';
    const players = onlineGameData?.players || [];
    const myIndex = players.indexOf(room?.players.find(p => p.id === socket?.id)?.name);

    // Disconnection handling: Return to lobby if players leave
    useEffect(() => {
        if (onlinePhase && room?.players.length <= 2 && onlinePhase !== 'result') {
            toast.warning(t("game.error"), t("game.notEnoughPlayers"));
            resetGame();
            if (isHost) {
                setReady(room.code, false);
            }
        }
    }, [room?.players.length, onlinePhase, resetGame, setReady, room?.code, isHost, t, toast]);

    // Synchronize phase music and local state
    useEffect(() => {
        if (onlinePhase === 'speaking' || onlinePhase === 'discussion') {
            playBGM('suspense');
            if (room?.settings.hasTimer) setTimeLeft(120);
        } else if (onlinePhase === 'result') {
            playBGM('none');
            const correctGuess = voteResults?.impostorCaught ?? false;
            if (correctGuess) triggerPremiumCelebration();
            else triggerErrorBurst();
        }
    }, [onlinePhase, playBGM, room, voteResults]);

    // Timer logic
    useEffect(() => {
        if ((onlinePhase === 'speaking' || onlinePhase === 'discussion') && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    const newTime = prev - 1;
                    if (newTime <= 10) sfx.tick();
                    return newTime;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [onlinePhase, timeLeft, sfx]);

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
        sfx.click();
        setSelectedCandidate(index);
    };

    const handleConfirmVote = () => {
        if (selectedCandidate === null || localVote !== null) return;
        sfx.vote();
        setLocalVote(selectedCandidate);
        submitVote(room.code, selectedCandidate);
    };

    const MenuIcon = isRTL ? ArrowRight : ArrowLeft;

    // REVEAL PHASE
    if (onlinePhase === "reveal") {
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (holdProgress / 100) * circumference;

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
                {isRevealed && isImpostor && (
                    <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-destructive/20 z-0 pointer-events-none" />
                )}

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`game-card w-full max-w-sm text-center shadow-game-lg border-white/20 relative z-10 ${isRevealed && isImpostor ? 'border-destructive/30' : ''}`}
                >
                    <h2 className="text-3xl font-black mb-10 drop-shadow-sm">{room?.players.find(p => p.id === socket?.id)?.name}</h2>

                    <AnimatePresence mode="wait">
                        {isRevealed ? (
                            <motion.div key="revealed" variants={revealCard} initial="hidden" animate="visible" className={isImpostor ? "shake-container" : ""}>
                                <motion.div animate={isImpostor ? shake : {}} className={`rounded-3xl p-8 mb-6 shadow-inner ${isImpostor ? 'bg-destructive/10 border border-destructive/20' : 'bg-success/10 border border-success/20'}`}>
                                    {isImpostor ? (
                                        <div>
                                            <p className="text-4xl font-black text-destructive mb-4">{t("game.youAreImpostor")}</p>
                                            {room?.settings?.impostorHint && (
                                                <div className="mt-4 bg-background/50 rounded-2xl p-4 border border-destructive/10">
                                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("game.categoryHint")}</p>
                                                    <p className="text-2xl font-black text-destructive">{t(onlineGameData?.category)}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("game.secretWord")}</p>
                                            <p className="text-5xl font-black text-success drop-shadow-sm">{onlineGameData?.secretWord}</p>
                                        </div>
                                    )}
                                </motion.div>
                                <p className="text-muted-foreground font-semibold mb-2">{t("game.understood")}</p>
                            </motion.div>
                        ) : (
                            <motion.div key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex flex-col items-center">
                                <div className="relative w-40 h-40 mb-8">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                                        <motion.circle
                                            cx="80" cy="80" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8"
                                            className="text-primary" strokeDasharray={circumference} animate={{ strokeDashoffset: offset }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <motion.div animate={holdProgress > 0 ? { scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 0.5 }}>
                                            <Eye className={`w-12 h-12 ${holdProgress > 0 ? 'text-primary' : 'text-muted-foreground opacity-50'}`} />
                                        </motion.div>
                                    </div>
                                </div>

                                <button
                                    onPointerDown={startHold}
                                    onPointerUp={stopHold}
                                    onPointerLeave={stopHold}
                                    className="w-full bg-card/80 border border-white/20 py-8 rounded-2xl font-black text-2xl shadow-lg active:bg-primary transition-all select-none touch-none"
                                >
                                    {t("game.holdButton")}
                                </button>
                                <p className="text-muted-foreground font-semibold mt-4 text-sm">{t("game.holdHint")}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isHost && isRevealed && (
                        <motion.button
                            whileHover={hoverScale} whileTap={tapScale}
                            onClick={handleNextPhase}
                            className="mt-6 w-full glass-button py-5 rounded-2xl font-bold text-xl shadow-game"
                        >
                            {t("game.beginDiscussion")}
                        </motion.button>
                    )}
                </motion.div>
            </div>
        );
    }

    // Common UI for Speaking/Discussion
    if (onlinePhase === "speaking" || onlinePhase === "discussion") {
        const totalTime = 120;
        const progress = timeLeft !== null ? timeLeft / totalTime : 1;
        const radius = 150;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference * (1 - progress);
        const isUrgent = timeLeft !== null && timeLeft <= 10;
        const strokeColorClass = isUrgent ? "stroke-destructive" : "stroke-success";

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
                <motion.div animate={breathing} className="absolute inset-0 bg-primary/5 z-0 pointer-events-none" />

                <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={toggleMute} className="absolute top-6 end-5 w-12 h-12 rounded-xl bg-card border border-white/20 shadow-sm flex items-center justify-center z-20">
                    {isMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-primary" />}
                </motion.button>

                <h2 className="text-3xl font-black mb-8 text-primary uppercase tracking-tighter">
                    {onlinePhase === 'speaking' ? t("game.speakingTime") : t("game.discussionTime")}
                </h2>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-[320px] h-[320px] flex items-center justify-center mb-8 z-10">
                    <div className="absolute inset-2 rounded-full glass-panel border-none shadow-game-lg z-0" />
                    {timeLeft !== null && (
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90 z-10 drop-shadow-md">
                            <circle cx="160" cy="160" r={radius} className="stroke-muted/20 fill-none" strokeWidth="12" />
                            <motion.circle
                                cx="160" cy="160" r={radius}
                                className={`${strokeColorClass} fill-none`}
                                strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference}
                                animate={{ strokeDashoffset }}
                                transition={{ strokeDashoffset: { duration: 1, ease: "linear" } }}
                            />
                        </svg>
                    )}

                    <div className="relative z-20 flex flex-col items-center justify-center text-center w-full px-6">
                        <motion.div animate={isUrgent ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : pulseGlow} transition={isUrgent ? { repeat: Infinity, duration: 0.5 } : {}} className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ${isUrgent ? 'bg-destructive/20 border-destructive/30' : 'bg-accent/20 border-accent/30'}`}>
                            <Mic className={`w-8 h-8 ${isUrgent ? 'text-destructive' : 'text-accent-foreground'}`} />
                        </motion.div>
                        <p className="text-xl font-bold text-muted-foreground mb-4">{t("game.discussionDesc")}</p>
                        {timeLeft !== null && (
                            <div className={`text-5xl font-black font-mono tracking-tighter ${isUrgent ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                        )}
                    </div>
                </motion.div>

                {isHost && (
                    <motion.button
                        whileHover={hoverScale} whileTap={tapScale}
                        onClick={handleNextPhase}
                        className="w-full max-w-sm glass-button py-5 rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-game text-xl z-10"
                    >
                        {onlinePhase === 'speaking' ? t("game.beginDiscussion") : t("game.startVoting")}
                        <MenuIcon className="w-6 h-6" />
                    </motion.button>
                )}
            </div>
        );
    }

    // VOTING PHASE
    if (onlinePhase === "vote") {
        const activePlayerNames = room?.players.map(p => p.name) || [];

        return (
            <div className="min-h-screen bg-background px-5 pt-12 pb-24 overflow-y-auto">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-primary drop-shadow-sm mb-2 uppercase tracking-tighter">{t("game.voting")}</h2>
                    <p className="text-lg text-muted-foreground font-semibold">{t("game.whoIsImpostor")}</p>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                    {players.map((player, i) => (
                        i !== myIndex && activePlayerNames.includes(player) && (
                            <motion.button
                                key={i}
                                whileHover={hoverScale}
                                whileTap={tapScale}
                                disabled={localVote !== null}
                                onClick={() => handleVote(i)}
                                className={`w-full game-card border-4 flex items-center gap-4 py-4 px-6 transition-all shadow-md ${
                                    localVote === i 
                                        ? 'bg-primary border-white text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]' 
                                        : selectedCandidate === i
                                            ? 'bg-primary/20 border-primary text-primary scale-[1.02]'
                                            : 'bg-card/80 hover:bg-card border-white/10 opacity-70'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${localVote === i || selectedCandidate === i ? 'bg-white/20' : 'bg-primary/10'}`}>
                                    <User className={`w-6 h-6 ${selectedCandidate === i && localVote === null ? 'text-primary' : ''}`} />
                                </div>
                                <div className="flex-1 text-start">
                                    <p className={`text-xl font-bold ${selectedCandidate === i && localVote === null ? 'text-primary' : ''}`}>{player}</p>
                                </div>
                            </motion.button>
                        )
                    ))}
                </div>

                {selectedCandidate !== null && localVote === null && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 max-w-sm mx-auto"
                    >
                        <button
                            onClick={handleConfirmVote}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] animate-pulse"
                        >
                            {t("game.confirmVote")}
                        </button>
                    </motion.div>
                )}

                <div className="mt-8 text-center bg-card/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 max-w-sm mx-auto">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        {t("game.votingStatus")}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <div className="text-2xl font-black text-primary">
                            {votedPlayers.length} / {room.players.length}
                        </div>
                        <p className="text-xs font-bold text-muted-foreground">
                            {t("game.playersVoted")}
                        </p>
                    </div>
                </div>

                {isHost && (
                    <motion.button
                        whileHover={hoverScale} whileTap={tapScale}
                        disabled={votedPlayers.length < room.players.length}
                        onClick={handleNextPhase}
                        className={`mt-8 w-full max-w-sm mx-auto block glass-button py-4 rounded-2xl font-bold text-xl shadow-game transition-all ${
                            votedPlayers.length < room.players.length 
                                ? 'opacity-50 grayscale cursor-not-allowed scale-95' 
                                : 'shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]'
                        }`}
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
                <motion.div animate={breathing} className={`absolute inset-0 z-0 ${correctGuess ? 'bg-success/5' : 'bg-destructive/5'}`} />

                <motion.div variants={flip} initial="initial" animate="animate" className="game-card glass-panel w-full max-w-sm text-center relative z-10 shadow-2xl border-white/30">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-2 ${correctGuess ? 'bg-success/20 border-success/40' : 'bg-destructive/20 border-destructive/40'}`}>
                        <Crown className={`w-12 h-12 ${correctGuess ? 'text-success' : 'text-destructive'}`} />
                    </div>
                    <h2 className="text-4xl font-black mb-6 drop-shadow-sm uppercase tracking-tighter text-primary">{t("game.result")}</h2>

                    {voteResults ? (
                        <>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className={`rounded-3xl p-6 mb-8 shadow-inner border-2 ${correctGuess ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}
                            >
                                <p className={`text-3xl font-black mb-2 ${didIWin ? "text-success" : "text-destructive"}`}>
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
                            onClick={() => {
                                sfx.click();
                                resetGame();
                                setReady(room.code, false);
                            }}
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
