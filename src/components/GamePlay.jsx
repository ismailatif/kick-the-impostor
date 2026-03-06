import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, slideUpItem, hoverScale, tapScale, pulseGlow } from "@/lib/animations";
import { triggerPremiumCelebration, triggerErrorBurst } from "@/lib/confetti";
import { Eye, EyeOff, ArrowLeft, ArrowRight, RotateCcw, Vote, Crown, Mic, VolumeX, Volume2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
import { WORD_BANKS, getCategoryWordBankKey } from "@/i18n/translations";
const GamePlay = ({ config, onEnd }) => {
  const { t, lang, isRTL } = useLanguage();
  const [phase, setPhase] = useState("reveal");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [votes, setVotes] = useState({});
  const [timeLeft, setTimeLeft] = useState(config.hasTimer ? 120 : null);
  const audioRef = useRef(null);
  const { sfx, playBGM, isMuted, setIsMuted } = useAudio();
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

  const handleReveal = () => {
    sfx.click();
    setIsRevealed(true);
    if (isImpostor) sfx.error(); // Dramatic sound for impostor
  };

  const handleHide = () => {
    sfx.click();
    setIsRevealed(false);
    if (currentPlayerIndex < config.players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    }
    else {
      setCurrentPlayerIndex(0);
      if (config.hasTimer) setTimeLeft(120);
      setPhase("speaking");
      playBGM('suspense');

      // Initialize and play audio
      if (!audioRef.current && !isMuted) {
        audioRef.current = new Audio('/timer.ogg');
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
      }
    }
  };

  // Handle Timer
  useEffect(() => {
    if (phase === "speaking" && timeLeft !== null && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;

          if (newTime <= 6) sfx.tick();

          // Auto-rotate player every 10 seconds
          if (newTime > 0 && newTime % 10 === 0) {
            setCurrentPlayerIndex(curr => (curr + 1) % config.players.length);
            sfx.click(); // Notification that player changed
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

  // Cleanup audio on unmount or game end
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMute = () => {
    sfx.click();
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

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

  // Fire confetti / error burst when entering result phase
  useEffect(() => {
    if (phase === "result") {
      if (correctGuess) {
        triggerPremiumCelebration();
      } else {
        triggerErrorBurst();
      }
    }
  }, [phase, correctGuess]);

  const MenuIcon = isRTL ? ArrowRight : ArrowLeft;
  if (phase === "reveal") {
    return (<div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <motion.div key={currentPlayerIndex} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="game-card w-full max-w-sm text-center shadow-game-lg border-white/20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <span className="text-3xl font-bold text-primary">{currentPlayerIndex + 1}</span>
        </div>
        <h2 className="text-3xl font-black mb-2 drop-shadow-sm">{config.players[currentPlayerIndex]}</h2>
        <p className="text-muted-foreground font-semibold mb-6">{t("game.holdToReveal")}</p>

        <AnimatePresence>
          {isRevealed ? (<motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            {isImpostor ? (<div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-4 shadow-inner">
              <p className="text-3xl font-black text-destructive drop-shadow-sm">{t("game.youAreImpostor")}</p>
              {config.impostorHint && (<div className="mt-4 bg-background/50 rounded-xl p-3 border border-destructive/10">
                <p className="text-sm text-muted-foreground mb-1 font-semibold">{t("game.categoryHint")}</p>
                <p className="text-2xl font-black text-destructive drop-shadow-sm">{t(selectedCategory)}</p>
              </div>)}
            </div>) : (<div className="bg-success/10 border border-success/20 rounded-2xl p-6 mb-4 shadow-inner">
              <p className="text-sm text-muted-foreground mb-1 font-semibold">{t("game.secretWord")}</p>
              <p className="text-4xl font-black text-success drop-shadow-sm">{secretWord}</p>
            </div>)}
            <motion.button whileHover={hoverScale} whileTap={tapScale} onMouseEnter={() => sfx.hover()} onClick={handleHide} className="w-full glass-button py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg">
              <EyeOff className="w-5 h-5" />
              {t("game.understood")}
            </motion.button>
          </motion.div>) : (<motion.button whileHover={hoverScale} whileTap={tapScale} onMouseEnter={() => sfx.hover()} onPointerDown={handleReveal} className="w-full bg-card/80 border border-white/20 py-5 rounded-xl font-bold flex items-center justify-center gap-3 text-foreground shadow-sm active:bg-primary active:text-primary-foreground transition-all duration-300">
            <Eye className="w-6 h-6 text-primary" />
            <span className="text-lg">{t("game.holdButton")}</span>
          </motion.button>)}
        </AnimatePresence>
      </motion.div>

      <p className="text-sm text-muted-foreground mt-6">
        {t("game.playerOf", { current: currentPlayerIndex + 1, total: config.players.length })}
      </p>
    </div>);
  }
  if (phase === "speaking") {
    // Calculate timer values for SVG circle
    const totalTime = 120;
    const progress = timeLeft !== null ? timeLeft / totalTime : 1;
    const radius = 150;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);
    const strokeColorClass = timeLeft <= 20 ? "stroke-destructive text-destructive" : "stroke-success text-success";

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative">
        <motion.button
          whileHover={hoverScale}
          whileTap={tapScale}
          onMouseEnter={() => sfx.hover()}
          onClick={toggleMute}
          className="absolute top-6 right-5 w-12 h-12 rounded-xl bg-card border border-white/20 shadow-sm flex items-center justify-center z-10 transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-primary" />}
        </motion.button>

        <motion.div
          key={currentPlayerIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-[320px] h-[320px] flex items-center justify-center mb-8"
        >
          {/* Background blurred panel */}
          <div className="absolute inset-2 rounded-full glass-panel border-none shadow-game-lg z-0" />

          {/* SVG Timer Border */}
          {timeLeft !== null && (
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 z-10 drop-shadow-md">
              <circle
                cx="160"
                cy="160"
                r={radius}
                className="stroke-muted/30 fill-none"
                strokeWidth="12"
              />
              <motion.circle
                cx="160"
                cy="160"
                r={radius}
                className={`${strokeColorClass} fill-none transition-colors duration-1000`}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
          )}

          {/* Inner Content */}
          <div className="relative z-20 flex flex-col items-center justify-center text-center w-full px-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ${timeLeft !== null && timeLeft <= 20 ? 'bg-destructive/20 border-destructive/30' : 'bg-accent/20 border-accent/30'} relative overflow-hidden transition-colors duration-500`}>
              <Mic className={`w-8 h-8 z-10 animate-pulse ${timeLeft !== null && timeLeft <= 20 ? 'text-destructive' : 'text-accent-foreground'}`} />
              <motion.div
                animate={timeLeft !== null && timeLeft <= 20 ? { scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] } : pulseGlow}
                transition={{ repeat: Infinity, duration: timeLeft !== null && timeLeft <= 20 ? 0.5 : 2 }}
                className={`absolute inset-0 rounded-full ${timeLeft !== null && timeLeft <= 20 ? 'bg-destructive/30' : 'bg-accent/20'}`}
              />
            </div>

            <h2 className="text-xl font-black mb-1 drop-shadow-sm text-foreground/80">{t("game.speakingTime")}</h2>

            <p className="text-2xl font-black text-foreground drop-shadow-md leading-tight mb-2">
              {config.players[currentPlayerIndex]}
            </p>

            {timeLeft !== null && (
              <div className={`text-5xl font-black font-mono tracking-wider drop-shadow-md transition-colors duration-1000 ${timeLeft <= 20 ? 'text-destructive' : 'text-foreground'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </motion.div>

        <motion.button
          whileHover={hoverScale}
          whileTap={tapScale}
          onMouseEnter={() => sfx.hover()}
          onClick={handleNextSpeaker}
          className="w-full max-w-sm glass-button py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-game text-lg"
        >
          {t("game.beginDiscussion")}
          <MenuIcon className="w-6 h-6" />
        </motion.button>
      </div>
    );
  }
  if (phase === "discussion") {
    return (<div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="game-card glass-panel w-full max-w-sm text-center">
        <motion.div animate={pulseGlow} className="w-24 h-24 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <span className="text-5xl drop-shadow-sm">💬</span>
        </motion.div>
        <h2 className="text-3xl font-black mb-3 drop-shadow-sm">{t("game.discussionTime")}</h2>
        <p className="text-lg text-muted-foreground font-semibold mb-8 leading-relaxed">{t("game.discussionDesc")}</p>
        <motion.button whileHover={hoverScale} whileTap={tapScale} onMouseEnter={() => sfx.hover()} onClick={() => {
          sfx.click();
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          setCurrentPlayerIndex(0);
          setPhase("vote");
        }} className="w-full glass-button py-4 rounded-xl font-bold flex items-center justify-center gap-3 text-lg">
          <Vote className="w-6 h-6" />
          {t("game.startVoting")}
        </motion.button>
      </motion.div>
    </div>);
  }
  if (phase === "vote") {
    return (<div className="min-h-screen bg-background px-5 pt-8 pb-20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-primary drop-shadow-sm mb-2">{t("game.voting")}</h2>
        <p className="text-lg text-muted-foreground font-semibold">{t("game.whoIsImpostor")}</p>
        <p className="text-base font-bold mt-3">{t("game.votingNow", { player: config.players[currentPlayerIndex] })}</p>
      </div>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-sm mx-auto">
        {config.players.map((player, i) => (i !== currentPlayerIndex && (
          <motion.button key={i} variants={slideUpItem} whileHover={hoverScale} whileTap={tapScale} onMouseEnter={() => sfx.hover()} onClick={() => {
            sfx.click();
            const newVotes = { ...votes, [currentPlayerIndex]: i };
            setVotes(newVotes);
            if (currentPlayerIndex < config.players.length - 1) {
              setCurrentPlayerIndex(currentPlayerIndex + 1);
            }
            else {
              playBGM('none');
              setPhase("result");
              // small delay to calculate correctly
              setTimeout(() => {
                const voted = getMostVoted();
                if (impostorIndices.includes(voted)) sfx.success();
                else sfx.error();
              }, 100);
            }
          }} className="w-full game-card border-white/20 flex items-center justify-end gap-4 text-end bg-card/80 hover:bg-card hover:border-primary/30 transition-colors">
            <span className="font-bold text-xl">{player}</span>
            <div className="w-12 h-12 rounded-xl bg-primary/10 shadow-inner flex items-center justify-center border border-primary/20">
              <span className="font-black text-xl text-primary">{i + 1}</span>
            </div>
          </motion.button>)))}
      </motion.div>
    </div>);
  }
  const separator = lang === "ar" ? "، " : ", ";

  return (<div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="game-card glass-panel w-full max-w-sm text-center">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border ${correctGuess ? 'bg-success/20 border-success/30' : 'bg-destructive/20 border-destructive/30'}`}>
        <Crown className={`w-12 h-12 ${correctGuess ? 'text-success' : 'text-destructive'}`} />
      </div>
      <h2 className="text-3xl font-black mb-4 drop-shadow-sm">{t("game.result")}</h2>

      <div className={`rounded-2xl p-5 mb-6 shadow-inner border ${correctGuess ? "bg-success/10 border-success/20" : "bg-destructive/10 border-destructive/20"}`}>
        <p className={`text-2xl font-black mb-2 ${correctGuess ? "text-success" : "text-destructive"}`}>
          {correctGuess ? t("game.impostorCaught") : t("game.impostorWon")}
        </p>
        <p className="text-muted-foreground font-semibold text-lg">
          {t("game.impostorWas", { names: impostorIndices.map((i) => config.players[i]).join(separator) })}
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 shadow-inner rounded-2xl p-5 mb-8">
        <p className="text-sm text-muted-foreground mb-1 font-semibold">{t("game.secretWord")}</p>
        <p className="text-3xl font-black text-primary drop-shadow-sm">{secretWord}</p>
      </div>

      <div className="flex gap-4">
        <motion.button whileHover={hoverScale} whileTap={tapScale} onMouseEnter={() => sfx.hover()} onClick={() => { sfx.click(); onEnd(); }} className="flex-1 bg-card border border-white/20 text-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm">
          <MenuIcon className="w-5 h-5" />
          {t("game.menu")}
        </motion.button>
        <motion.button whileHover={hoverScale} whileTap={tapScale} onMouseEnter={() => sfx.hover()} onClick={() => { sfx.click(); window.location.reload(); }} className="flex-1 glass-button py-4 rounded-xl font-bold flex items-center justify-center gap-2">
          <RotateCcw className="w-5 h-5" />
          {t("game.newRound")}
        </motion.button>
      </div>
    </motion.div>
  </div>);
};
export default GamePlay;
