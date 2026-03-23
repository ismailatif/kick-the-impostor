import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    staggerContainer, slideUpItem, hoverScale, tapScale,
    pulseGlow, breathing, revealCard, flip, shake
} from "@/lib/animations";
import {
    Eye, EyeOff, RotateCcw, Vote, Mic, User, Crown, VolumeX, Volume2, ArrowLeft, ArrowRight, Home, Settings2, MessageCircle, Send
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
import { useSocket } from "@/hooks/useSocketHook";
import { triggerPremiumCelebration, triggerErrorBurst } from "@/lib/confetti";
import { useCustomToast } from "@/hooks/useCustomToast";

const OnlineGamePlay = ({ onEnd }) => {
    const { t, isRTL } = useLanguage();
    const { sfx, playBGM, isMuted, toggleMute } = useAudio();
    const { 
        socket, room, onlinePhase, onlineGameData, 
        votedPlayers, voteResults, syncPhase, 
        setReady, resetGame, submitVote, 
        emitResetGame, leaveRoom, timeLeft, updateTimer,
        messages, sendMessage, unreadCount, clearUnread
    } = useSocket();
    const toast = useCustomToast();

    const [isRevealed, setIsRevealed] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [localVote, setLocalVote] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(true);

    const audioRef = useRef(null);
    const holdTimerRef = useRef(null);
    const chatEndRef = useRef(null);

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
        } else if (onlinePhase === 'result') {
            playBGM('none');
            const correctGuess = voteResults?.impostorCaught ?? false;
            if (correctGuess) triggerPremiumCelebration();
            else triggerErrorBurst();
        }
    }, [onlinePhase, playBGM, room, voteResults]);

    // Timer logic: Only Host manages the timer countdown
    useEffect(() => {
        if (!isHost || !room?.settings?.hasTimer) return;
        if (onlinePhase !== 'speaking' && onlinePhase !== 'discussion') return;

        // Initialize timer if not yet set for this phase
        if (timeLeft === null || timeLeft === undefined) {
             const initialTime = room.settings.timerDuration || 120;
             updateTimer(room.code, initialTime);
             return;
        }

        if (timeLeft > 0) {
            const timer = setInterval(() => {
                const newTime = timeLeft - 1;
                updateTimer(room.code, newTime);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isHost, onlinePhase, timeLeft, room?.code, room?.settings, updateTimer]);

    // Auto-scroll chat to bottom when new messages arrive
    useEffect(() => {
        if (isChatOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            clearUnread();
        }
    }, [messages, isChatOpen, clearUnread]);

    const handleSendMessage = () => {
        if (!chatInput.trim() || !room?.code) return;
        sendMessage(room.code, chatInput);
        setChatInput('');
    };

    const handleChatKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const myName = room?.players.find(p => p.id === socket?.id)?.name;

    // SFX Tick for all players when timer is low
    useEffect(() => {
        if (timeLeft !== null && timeLeft <= 10 && timeLeft > 0) {
            sfx.tick();
        }
    }, [timeLeft, sfx]);

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
        const phases = ['reveal', 'discussion', 'vote', 'result'];
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
        const totalTime = room?.settings?.timerDuration || 120;
        const progress = timeLeft !== null ? timeLeft / totalTime : 1;
        const radius = 95;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference * (1 - progress);
        const isUrgent = timeLeft !== null && timeLeft <= 10;
        const strokeColorClass = isUrgent ? "stroke-destructive" : "stroke-success";

        return (
            <div className="min-h-screen bg-background flex flex-col items-center px-5 pt-6 pb-6 relative overflow-hidden gap-4">
                <motion.div animate={breathing} className="absolute inset-0 bg-primary/5 z-0 pointer-events-none" />

                {/* Top bar */}
                <div className="w-full max-w-sm flex items-center justify-between z-20 flex-shrink-0">
                    <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">
                        {onlinePhase === 'speaking' ? t("game.speakingTime") : t("game.discussionTime")}
                    </h2>
                    <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={toggleMute} className="w-10 h-10 rounded-xl bg-card border border-white/20 shadow-sm flex items-center justify-center">
                        {isMuted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-primary" />}
                    </motion.button>
                </div>

                {/* Timer circle */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-[220px] h-[220px] flex items-center justify-center z-10 flex-shrink-0">
                    <div className="absolute inset-2 rounded-full glass-panel border-none shadow-game-lg z-0" />
                    {timeLeft !== null && (
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90 z-10 drop-shadow-md" viewBox="0 0 220 220">
                            <circle cx="110" cy="110" r={radius} className="stroke-muted/20 fill-none" strokeWidth="10" />
                            <motion.circle
                                cx="110" cy="110" r={radius}
                                className={`${strokeColorClass} fill-none`}
                                strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference}
                                animate={{ strokeDashoffset }}
                                transition={{ strokeDashoffset: { duration: 1, ease: "linear" } }}
                            />
                        </svg>
                    )}
                    <div className="relative z-20 flex flex-col items-center justify-center text-center px-4">
                        <motion.div animate={isUrgent ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : pulseGlow} transition={isUrgent ? { repeat: Infinity, duration: 0.5 } : {}} className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner ${isUrgent ? 'bg-destructive/20' : 'bg-accent/20'}`}>
                            <Mic className={`w-6 h-6 ${isUrgent ? 'text-destructive' : 'text-accent-foreground'}`} />
                        </motion.div>
                        {timeLeft !== null && (
                            <div className={`text-4xl font-black font-mono tracking-tighter tabular-nums ${isUrgent ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Chat Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm flex flex-col z-10 flex-1 min-h-0"
                    style={{ maxHeight: '320px' }}
                >
                    {/* Chat header */}
                    <button
                        onClick={() => {
                            setIsChatOpen(o => {
                                if (!o) clearUnread(); // clear on open
                                return !o;
                            });
                        }}
                        className="flex items-center justify-between w-full bg-card/60 backdrop-blur-md border border-white/10 rounded-t-2xl px-4 py-2 text-sm font-bold text-muted-foreground"
                    >
                        <span className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-primary" />
                            {t("chat.title")}
                            {!isChatOpen && unreadCount > 0 && (
                                <span className="bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </span>
                        <motion.div animate={{ rotate: isChatOpen ? 0 : 180 }}>
                            <Send className="w-3 h-3 rotate-[-45deg]" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {isChatOpen && (
                            <motion.div
                                key="chat-body"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden flex flex-col bg-card/40 backdrop-blur-md border-x border-white/10"
                            >
                                {/* Messages list */}
                                <div className="overflow-y-auto flex flex-col gap-2 p-3" style={{ maxHeight: '180px' }}>
                                    {messages.length === 0 ? (
                                        <p className="text-center text-muted-foreground text-xs py-4 font-medium">{t("chat.noMessages")}</p>
                                    ) : (
                                        messages.map((msg) => {
                                            const isMe = msg.sender === myName;
                                            // For RTL (Arabic): flip bubble sides so own msgs are on the left
                                            const alignSelf = isRTL
                                                ? (isMe ? 'self-start items-start' : 'self-end items-end')
                                                : (isMe ? 'self-end items-end' : 'self-start items-start');
                                            const slideDir = isRTL
                                                ? (isMe ? -20 : 20)
                                                : (isMe ? 20 : -20);
                                            return (
                                                <motion.div
                                                    key={msg.id || msg.timestamp}
                                                    initial={{ opacity: 0, x: slideDir }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`flex flex-col max-w-[80%] ${alignSelf}`}
                                                >
                                                    {!isMe && (
                                                        <span className="text-[10px] font-bold text-primary mb-0.5 px-1">{msg.sender}</span>
                                                    )}
                                                    <div className={`px-3 py-2 rounded-2xl text-sm font-medium leading-snug ${
                                                        isMe
                                                            ? 'bg-primary text-white rounded-br-sm'
                                                            : 'bg-card border border-white/10 text-foreground rounded-bl-sm'
                                                    }`}>
                                                        {msg.text}
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input */}
                                <div className="flex gap-2 p-3 border-t border-white/10">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={handleChatKeyDown}
                                        maxLength={200}
                                        placeholder={t("chat.placeholder")}
                                        className="flex-1 bg-background/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                                    />
                                    <motion.button
                                        whileTap={tapScale}
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim()}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white disabled:opacity-40 transition-opacity flex-shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Chat panel bottom border */}
                    <div
                        className="h-0 w-full"
                        style={{
                            borderBottom: isChatOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            borderLeft: isChatOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            borderRight: isChatOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            borderBottomLeftRadius: '16px',
                            borderBottomRightRadius: '16px',
                            backgroundColor: 'transparent'
                        }}
                    />
                </motion.div>

                {/* Host next phase button */}
                {isHost && (
                    <motion.button
                        whileHover={hoverScale} whileTap={tapScale}
                        onClick={handleNextPhase}
                        className="w-full max-w-sm glass-button py-4 rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-game text-lg z-10 flex-shrink-0"
                    >
                        {onlinePhase === 'speaking' ? t("game.beginDiscussion") : t("game.startVoting")}
                        <MenuIcon className="w-5 h-5" />
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
            <div className="h-[100dvh] game-grid-bg flex flex-col items-center justify-center px-4 py-4 sm:py-8 relative overflow-hidden">
                {/* Big Header Text - Single Line */}
                <motion.div 
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-6 flex flex-col items-center flex-shrink-0"
                >
                    <h1 className="text-4xl sm:text-6xl font-black text-foreground game-text-shadow tracking-tighter uppercase whitespace-nowrap">{t("game.result")}</h1>
                </motion.div>

                {/* Main Results card - Theme-Aware */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm bg-[var(--results-card-bg)] rounded-[40px] border-[6px] border-[var(--results-card-border)] p-4 sm:p-6 shadow-xl relative flex-shrink min-h-[60dvh] flex flex-col justify-between"
                >
                    <div className="text-center h-full flex flex-col justify-between">
                        <div className="flex-1 flex flex-col justify-center">
                            <h2 className={`text-3xl sm:text-4xl font-black mb-2 leading-tight uppercase tracking-tight ${didIWin ? 'text-[#4ade80]' : 'text-[#ef4444]'}`}>
                                {mainTitle}
                            </h2>
                            <p className="text-[var(--results-card-text-muted)] font-bold mb-6 sm:mb-8 text-[11px] sm:text-xs uppercase tracking-widest">
                                {secondaryLine}
                            </p>
                            
                            {/* Impostor Info */}
                            {voteResults && !isImpostor && (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-[var(--results-panel-bg)] rounded-2xl py-4 px-6 border border-foreground/5 mb-8"
                                >
                                    <p className="text-[var(--results-card-text-muted)] text-[10px] font-black uppercase tracking-wider mb-2">{t("game.impostorWas").split(":")[0]}</p>
                                    <div className="flex gap-2 justify-center flex-wrap">
                                        {voteResults.impostorNames?.map((name, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-foreground/5 px-3 py-1.5 rounded-full">
                                                <User className="w-4 h-4 text-primary" />
                                                <span className="font-bold text-sm text-foreground">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Secret Word */}
                            {voteResults && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-[var(--results-panel-bg)] rounded-2xl py-3 px-8 inline-block border border-foreground/5 self-center mb-8"
                                >
                                    <p className="text-[var(--results-card-text-muted)] text-[9px] font-black uppercase tracking-[0.3em] mb-1">{t("game.secretWord")}</p>
                                    <p className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-widest">{voteResults.secretWord}</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Buttons Section - With Online Logic */}
                        <div className="space-y-4 flex-shrink-0 mt-auto">
                            <motion.button 
                                whileHover={{ scale: 1.02, brightness: 1.1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    sfx.click();
                                    if (isHost) {
                                        emitResetGame(room.code);
                                    } else {
                                        resetGame();
                                    }
                                }}
                                disabled={!isHost}
                                className={`w-full bg-[#4c66d6] text-white font-black text-xl sm:text-2xl py-5 rounded-2xl border-b-[6px] border-black/30 shadow-xl transition-all uppercase tracking-tight flex items-center justify-center gap-3 ${!isHost ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
                                {t("game.newRound")}
                            </motion.button>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <motion.button 
                                    whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.05)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        sfx.click();
                                        leaveRoom();
                                        onEnd();
                                    }} 
                                    className="bg-[var(--results-panel-bg)] border border-foreground/5 text-foreground/70 font-black text-[10px] sm:text-xs py-4 rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <Home className="w-4 h-4" />
                                    {t("game.menu")}
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.05)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        sfx.click();
                                        if (isHost) {
                                            emitResetGame(room.code);
                                        } else {
                                            resetGame();
                                        }
                                    }}
                                    className="bg-[var(--results-panel-bg)] border border-foreground/5 text-foreground/70 font-black text-[10px] sm:text-xs py-4 rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    {t("game.settings")}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return null;
};

export default OnlineGamePlay;
