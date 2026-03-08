import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, slideUpItem, hoverScale, tapScale, pulseGlow, shake, breathing, flip, revealCard } from "@/lib/animations";
import { triggerPremiumCelebration, triggerErrorBurst } from "@/lib/confetti";
import { Eye, EyeOff, ArrowLeft, ArrowRight, RotateCcw, Vote, Crown, Mic, VolumeX, Volume2, User } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
import { WORD_BANKS, getCategoryWordBankKey } from "@/i18n/translations";
const GamePlay = ({ config, onEnd }) => {
  const { t, lang, isRTL } = useLanguage();
  const [phase, setPhase] = useState("reveal"); // "reveal" | "pass" | "speaking" | "discussion" | "suspense" | "result"
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [votes, setVotes] = useState({});
  const [timeLeft, setTimeLeft] = useState(config.hasTimer ? 120 : null);
  const audioRef = useRef(null);
  const holdTimerRef = useRef(null);
  const { sfx, playBGM, isMuted, setIsMuted, toggleMute } = useAudio();

  const [impostorIndices] = useState(() => {
    const indices = [];
    const count = config.chaosMode
      ? Math.floor(Math.random() * (config.players.length + 1))
      : config.impostorCount;
    while (indices.length < count) {
      const idx = Math.floor(Math.random() * config.players.length);
      if (!indices.includes(idx))
        indices.push(idx);
    }
    return indices;
  });

  const [{ secretWord, selectedCategory }] = useState(() => {
    const catKey = config.categories[Math.floor(Math.random() * config.categories.length)];
    const wordBankKey = getCategoryWordBankKey(lang, catKey);
    const banks = WORD_BANKS[lang];
    const words = banks[wordBankKey] || Object.values(banks)[0] || ["?"];
    return {
      secretWord: words[Math.floor(Math.random() * words.length)],
      selectedCategory: catKey
    };
  });

  const isImpostor = impostorIndices.includes(currentPlayerIndex);

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

  const handleHide = () => {
    sfx.click();
    setIsRevealed(false);
    setHoldProgress(0);

    if (currentPlayerIndex < config.players.length - 1) {
      setPhase("pass");
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      setCurrentPlayerIndex(0);
      if (config.hasTimer) setTimeLeft(120);
      setPhase("speaking");
      playBGM('suspense');
      if (!audioRef.current && !isMuted) {
        audioRef.current = new Audio('/timer.ogg');
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
      }
    }
  };

  // Timer handling
  useEffect(() => {
    if (phase === "speaking" && timeLeft !== null && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 10) sfx.tick();
          if (newTime > 0 && newTime % 10 === 0) {
            setCurrentPlayerIndex(curr => (curr + 1) % config.players.length);
            sfx.click();
            sfx.vibrate();
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timerId);
    } else if (timeLeft === 0 && phase === "speaking") {
      sfx.success();
      setPhase("discussion");
    }
  }, [phase, timeLeft, sfx, config.players.length]);

  const handleNextSpeaker = () => {
    sfx.click();
    sfx.success();
    setPhase("discussion");
  };

  const getMostVoted = useCallback(() => {
    const voteCounts = {};
    Object.values(votes).forEach((v) => {
      voteCounts[v] = (voteCounts[v] || 0) + 1;
    });
    let maxVotes = 0;
    let mostVoted = 0;
    Object.entries(voteCounts).forEach(([idx, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mostVoted = Number(idx);
      }
    });
    return mostVoted;
  }, [votes]);

  const mostVoted = getMostVoted();
  const correctGuess = impostorIndices.includes(mostVoted);

  useEffect(() => {
    if (phase === "result") {
      if (correctGuess) triggerPremiumCelebration();
      else triggerErrorBurst();
    }
  }, [phase, correctGuess]);

  const MenuIcon = isRTL ? ArrowRight : ArrowLeft;

  // PASS THE PHONE SCREEN
  if (phase === "pass") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="game-card max-w-sm w-full border-primary/20 bg-primary/5">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <RotateCcw className="w-10 h-10 text-primary animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("game.passTo")}</h2>
          <p className="text-4xl font-black text-primary mb-8">{config.players[currentPlayerIndex]}</p>
          <motion.button
            whileHover={hoverScale}
            whileTap={tapScale}
            onClick={() => { sfx.click(); setPhase("reveal"); sfx.vibrate(); }}
            className="w-full glass-button py-5 rounded-2xl font-bold text-xl shadow-lg"
          >
            {t("game.havePhone")}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // REVEAL PHASE
  if (phase === "reveal") {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (holdProgress / 100) * circumference;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
        {/* Breathing background during reveal if impostor and revealed */}
        {isRevealed && isImpostor && (
          <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-destructive/20 z-0 pointer-events-none" />
        )}

        <motion.div
          key={currentPlayerIndex}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={`game-card w-full max-w-sm text-center shadow-game-lg border-white/20 relative z-10 ${isRevealed && isImpostor ? 'border-destructive/30' : ''}`}
        >
          <h3 className="text-muted-foreground font-bold mb-2 uppercase tracking-widest text-xs">{t("game.playerLabel")} {currentPlayerIndex + 1}</h3>
          <h2 className="text-3xl font-black mb-10 drop-shadow-sm">{config.players[currentPlayerIndex]}</h2>

          <AnimatePresence mode="wait">
            {isRevealed ? (
              <motion.div key="revealed" variants={revealCard} initial="hidden" animate="visible" className={isImpostor ? "shake-container" : ""}>
                <motion.div animate={isImpostor ? shake : {}} className={`rounded-3xl p-8 mb-6 shadow-inner ${isImpostor ? 'bg-destructive/10 border border-destructive/20' : 'bg-success/10 border border-success/20'}`}>
                  {isImpostor ? (
                    <div>
                      <p className="text-4xl font-black text-destructive mb-4">{t("game.youAreImpostor")}</p>
                      {config.impostorHint && (
                        <div className="mt-4 bg-background/50 rounded-2xl p-4 border border-destructive/10">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("game.categoryHint")}</p>
                          <p className="text-2xl font-black text-destructive">{t(selectedCategory)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("game.secretWord")}</p>
                      <p className="text-5xl font-black text-success drop-shadow-sm">{secretWord}</p>
                    </div>
                  )}
                </motion.div>
                <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={handleHide} className="w-full glass-button py-5 rounded-2xl font-bold flex items-center justify-center gap-2 text-xl shadow-game">
                  <EyeOff className="w-6 h-6" />
                  {t("game.understood")}
                </motion.button>
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
        </motion.div>

        <div className="absolute bottom-10 left-0 right-0 text-center">
          <div className="flex justify-center gap-1.5 opacity-50">
            {config.players.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === currentPlayerIndex ? 'bg-primary w-6' : 'bg-muted'} transition-all`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SPEAKING PHASE
  if (phase === "speaking") {
    const totalTime = 120;
    const progress = timeLeft !== null ? timeLeft / totalTime : 1;
    const radius = 150;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);
    const isUrgent = timeLeft !== null && timeLeft <= 10;
    const strokeColorClass = isUrgent ? "stroke-destructive" : "stroke-success";

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
        {/* Breathing background */}
        <motion.div animate={breathing} className="absolute inset-0 bg-primary/5 z-0 pointer-events-none" />

        <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={toggleMute} className="absolute top-6 right-5 w-12 h-12 rounded-xl bg-card border border-white/20 shadow-sm flex items-center justify-center z-20">
          {isMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-primary" />}
        </motion.button>

        <motion.div key={currentPlayerIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-[320px] h-[320px] flex items-center justify-center mb-8 z-10">
          <div className="absolute inset-2 rounded-full glass-panel border-none shadow-game-lg z-0" />
          {timeLeft !== null && (
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 z-10 drop-shadow-md">
              <circle cx="160" cy="160" r={radius} className="stroke-muted/20 fill-none" strokeWidth="12" />
              <motion.circle
                cx="160" cy="160" r={radius}
                className={`${strokeColorClass} fill-none`}
                strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference}
                animate={{ strokeDashoffset, scale: isUrgent ? [1, 1.02, 1] : 1 }}
                transition={{ strokeDashoffset: { duration: 1, ease: "linear" }, scale: { repeat: Infinity, duration: 0.5 } }}
              />
            </svg>
          )}

          <div className="relative z-20 flex flex-col items-center justify-center text-center w-full px-6">
            <motion.div animate={isUrgent ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : pulseGlow} transition={isUrgent ? { repeat: Infinity, duration: 0.5 } : {}} className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ${isUrgent ? 'bg-destructive/20 border-destructive/30' : 'bg-accent/20 border-accent/30'}`}>
              <Mic className={`w-8 h-8 ${isUrgent ? 'text-destructive' : 'text-accent-foreground'}`} />
            </motion.div>
            <h2 className="text-xl font-black mb-1 text-foreground/70 tracking-tight uppercase">{t("game.speakingTime")}</h2>
            <p className="text-3xl font-black text-foreground drop-shadow-md mb-2">{config.players[currentPlayerIndex]}</p>
            {timeLeft !== null && (
              <div className={`text-5xl font-black font-mono tracking-tighter ${isUrgent ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </motion.div>

        <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={handleNextSpeaker} className="w-full max-w-sm glass-button py-5 rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-game text-xl z-10">
          {t("game.beginDiscussion")}
          <MenuIcon className="w-6 h-6" />
        </motion.button>
      </div>
    );
  }

  // DISCUSSION PHASE
  if (phase === "discussion") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
        <motion.div animate={breathing} className="absolute inset-0 bg-accent/5 z-0" />
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="game-card glass-panel w-full max-w-sm text-center relative z-10">
          <motion.div animate={pulseGlow} className="w-24 h-24 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <span className="text-5xl drop-shadow-sm">💬</span>
          </motion.div>
          <h2 className="text-3xl font-black mb-3 drop-shadow-sm">{t("game.discussionTime")}</h2>
          <p className="text-lg text-muted-foreground font-semibold mb-8 leading-relaxed">{t("game.discussionDesc")}</p>
          <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={() => {
            sfx.click();
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            setCurrentPlayerIndex(0);
            setPhase("vote");
          }} className="w-full glass-button py-5 rounded-2xl font-bold flex items-center justify-center gap-3 text-xl">
            <Vote className="w-6 h-6" />
            {t("game.startVoting")}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // VOTING PHASE
  if (phase === "vote") {
    return (
      <div className="min-h-screen bg-background px-5 pt-12 pb-24 overflow-y-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-primary drop-shadow-sm mb-2 uppercase tracking-tighter">{t("game.voting")}</h2>
          <p className="text-lg text-muted-foreground font-semibold">{t("game.whoIsImpostor")}</p>
          <div className="mt-6 bg-primary/10 inline-block px-6 py-2 rounded-full border border-primary/20">
            <p className="text-sm font-black text-primary">{t("game.votingNow", { player: config.players[currentPlayerIndex] })}</p>
          </div>
        </div>
        <div className="space-y-4 max-w-sm mx-auto">
          {config.players.map((player, i) => (
            i !== currentPlayerIndex && (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  sfx.vote();
                  sfx.vibrate();
                  const newVotes = { ...votes, [currentPlayerIndex]: i };
                  setVotes(newVotes);
                  if (currentPlayerIndex < config.players.length - 1) {
                    setCurrentPlayerIndex(currentPlayerIndex + 1);
                  } else {
                    playBGM('none');
                    setPhase("suspense");
                    setTimeout(() => {
                      setPhase("result");
                    }, 3000);
                  }
                }}
                className={`w-full game-card border-white/20 flex items-center gap-4 py-4 px-6 bg-card/80 hover:bg-card hover:border-primary/40 transition-all shadow-md active:scale-95 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-xl font-bold">{player}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center border border-white/10 opacity-50">
                  <span className="font-bold text-sm">{i + 1}</span>
                </div>
              </motion.button>
            )
          ))}
        </div>
      </div>
    );
  }


  // SUSPENSE PHASE
  if (phase === "suspense") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <motion.div animate={breathing} className="absolute inset-0 bg-primary/5 z-0" />
        <div className="relative z-10">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8 border-4 border-primary border-t-transparent animate-spin" />
          <h2 className="text-4xl font-black mb-4 uppercase italic tracking-tighter">{t("game.calculating")}...</h2>
          <p className="text-muted-foreground font-bold">{t("game.truthReveal")}</p>
        </div>
      </div>
    );
  }

  // RESULT PHASE
  const separator = lang === "ar" ? "، " : ", ";
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
      <motion.div animate={breathing} className={`absolute inset-0 z-0 ${correctGuess ? 'bg-success/5' : 'bg-destructive/5'}`} />

      <motion.div variants={flip} initial="initial" animate="animate" className="game-card glass-panel w-full max-w-sm text-center relative z-10 shadow-2xl border-white/30">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-2 ${correctGuess ? 'bg-success/20 border-success/40' : 'bg-destructive/20 border-destructive/40'}`}>
          <Crown className={`w-12 h-12 ${correctGuess ? 'text-success' : 'text-destructive'}`} />
        </div>
        <h2 className="text-4xl font-black mb-6 drop-shadow-sm uppercase tracking-tighter">{t("game.result")}</h2>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className={`rounded-3xl p-6 mb-8 shadow-inner border-2 ${correctGuess ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}>
          <p className={`text-3xl font-black mb-3 ${correctGuess ? "text-success" : "text-destructive"}`}>
            {correctGuess ? t("game.impostorCaught") : t("game.impostorWon")}
          </p>
          <div className="h-px bg-white/10 w-full mb-4" />
          <p className="text-muted-foreground font-semibold text-lg italic">
            {t("game.impostorWas", { names: impostorIndices.map((i) => config.players[i]).join(separator) })}
          </p>
        </motion.div>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1 }} className="bg-primary/5 border-2 border-primary/20 shadow-inner rounded-3xl p-6 mb-10">
          <p className="text-xs text-muted-foreground mb-1 uppercase font-black tracking-widest">{t("game.secretWord")}</p>
          <p className="text-4xl font-black text-primary drop-shadow-sm italic">{secretWord}</p>
        </motion.div>

        <div className="flex gap-4">
          <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={() => { sfx.click(); onEnd(); }} className="flex-1 bg-card border border-white/20 text-foreground py-5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-md">
            <MenuIcon className="w-5 h-5" />
            {t("game.menu")}
          </motion.button>
          <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={() => { sfx.click(); sfx.vibrate(); window.location.reload(); }} className="flex-1 glass-button py-5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg">
            <RotateCcw className="w-5 h-5" />
            {t("game.newRound")}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
export default GamePlay;
