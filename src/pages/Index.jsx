import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition, hoverScale } from "@/lib/animations";
import { Play, HelpCircle, Volume2, VolumeX, Moon, Sun } from "lucide-react";
import mascot from "@/assets/mascot.png";
import HowToPlay from "@/components/HowToPlay";
import GameSetup from "@/components/GameSetup";
import GamePlay from "@/components/GamePlay";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ModeSelection from "@/components/ModeSelection";
import OnlineSetup from "@/components/online/OnlineSetup";
import OnlineLobby from "@/components/online/OnlineLobby";
import OnlineGamePlay from "@/components/online/OnlineGamePlay";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSocket } from "@/hooks/useSocketHook";

import { useAudio } from "@/hooks/useAudio";
import { useTheme } from "next-themes";

const Index = () => {
  const [screen, setScreen] = useState("home");
  const [showHowTo, setShowHowTo] = useState(false);
  const [gameConfig, setGameConfig] = useState(null);
  const { t } = useLanguage();
  const { sfx, playBGM, isMuted, setIsMuted } = useAudio();
  const { theme, setTheme } = useTheme();
  const { room, onlinePhase } = useSocket();

  // Watch for room changes to switch to lobby
  useEffect(() => {
    if (room && screen === "online-setup") {
      setScreen("online-lobby");
    }
  }, [room, screen]);

  // Watch for phase changes to switch to online play
  useEffect(() => {
    if (onlinePhase && screen === "online-lobby") {
      setScreen("online-play");
    }
  }, [onlinePhase, screen]);

  // Watch for phase reset/end to return to lobby from play
  useEffect(() => {
    if (screen === "online-play" && !onlinePhase) {
      setScreen("online-lobby");
    }
  }, [onlinePhase, screen]);

  // Ensure lobby bgm plays when returned to home if unmuted
  useEffect(() => {
    if (screen === "home" && !isMuted) {
      playBGM('lobby');
    } else if (screen === "play") {
      playBGM('none');
    }
  }, [screen, isMuted, playBGM]);

  const handleStartClick = () => {
    sfx.click();
    playBGM('lobby');
    setScreen("mode-selection");
  };

  const handleHowToClick = () => {
    sfx.click();
    playBGM('lobby');
    setShowHowTo(true);
  };

  const toggleMute = () => {
    sfx.click();
    setIsMuted(!isMuted);
  };

  const toggleTheme = (event) => {
    sfx.click();
    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    if (!document.startViewTransition) {
      setTheme(theme === "dark" ? "light" : "dark");
      return;
    }

    const isToLight = theme === "dark";
    if (isToLight) {
      document.documentElement.setAttribute('data-theme-transition', 'reverse');
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(theme === "dark" ? "light" : "dark");
      });
    });

    transition.finished.finally(() => {
      document.documentElement.removeAttribute('data-theme-transition');
    });

    transition.ready.then(() => {
      // Add a small buffer to ensure full screen coverage
      const radius = endRadius * 1.1;
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${radius}px at ${x}px ${y}px)`,
      ];
      
      document.documentElement.animate(
        {
          clipPath: isToLight ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 400,
          easing: "ease-in-out",
          fill: "forwards",
          pseudoElement: isToLight ? "::view-transition-old(root)" : "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <AnimatePresence mode="wait">
      {screen === "setup" && (
        <motion.div key="setup" variants={pageTransition} initial="initial" animate="animate" exit="exit" className="absolute top-0 left-0 w-full min-h-screen">
          <GameSetup
            onBack={() => { sfx.click(); setScreen("mode-selection"); }}
            initialConfig={gameConfig}
            onStart={(config) => {
              setGameConfig(config);
              setScreen("play");
            }}
          />
        </motion.div>
      )}

      {screen === "mode-selection" && (
        <motion.div key="mode-selection" variants={pageTransition} initial="initial" animate="animate" exit="exit" className="absolute top-0 left-0 w-full min-h-screen">
          <ModeSelection
            onBack={() => { sfx.click(); setScreen("home"); }}
            onSelect={(mode) => {
              sfx.click();
              if (mode === "local") {
                setScreen("setup");
              } else {
                setScreen("online-setup");
              }
            }}
          />
        </motion.div>
      )}

      {screen === "online-setup" && (
        <motion.div key="online-setup" variants={pageTransition} initial="initial" animate="animate" exit="exit" className="absolute top-0 left-0 w-full min-h-screen">
          <OnlineSetup onBack={() => { sfx.click(); setScreen("mode-selection"); }} />
        </motion.div>
      )}

      {screen === "online-lobby" && (
        <motion.div key="online-lobby" variants={pageTransition} initial="initial" animate="animate" exit="exit" className="absolute top-0 left-0 w-full min-h-screen">
          <OnlineLobby />
        </motion.div>
      )}

      {screen === "online-play" && (
        <motion.div key="online-play" variants={pageTransition} initial="initial" animate="animate" exit="exit" className="absolute top-0 left-0 w-full min-h-screen">
          <OnlineGamePlay onEnd={() => { sfx.click(); setScreen("home"); }} />
        </motion.div>
      )}

      {screen === "play" && gameConfig && (
        <motion.div key="game" variants={pageTransition} initial="initial" animate="animate" exit="exit" className="absolute top-0 left-0 w-full min-h-screen">
          <GamePlay 
            config={gameConfig} 
            onEnd={() => { sfx.click(); setScreen("home"); }} 
            onSettings={() => { sfx.click(); setScreen("setup"); }}
          />
        </motion.div>
      )}

      {screen === "home" && (
        <motion.div key="home" variants={pageTransition} initial="initial" animate="animate" exit="exit" className="min-h-screen flex flex-col items-center justify-center px-5 relative overflow-hidden">
          <div className="absolute top-6 left-5 flex gap-3 z-20" dir="ltr">
            <motion.button
              whileHover={hoverScale}
              onMouseEnter={() => sfx.hover()}
              onClick={(e) => {
                sfx.click();
                toggleTheme(e);
              }}
              className="w-12 h-12 rounded-xl bg-card border border-white/20 shadow-sm flex items-center justify-center transition-colors">
              {theme === "dark" ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-primary" />}
            </motion.button>
            <motion.button
              whileHover={hoverScale}
              onMouseEnter={() => sfx.hover()}
              onClick={toggleMute}
              className="w-12 h-12 rounded-xl bg-card border border-white/20 shadow-sm flex items-center justify-center transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-primary" />}
            </motion.button>
          </div>

          <div className="absolute top-6 right-5 z-20" dir="ltr">
            <LanguageSwitcher />
          </div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-6">
            <img src={mascot} alt={t("home.title")} className="w-40 h-40 object-contain drop-shadow-2xl" />
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mb-10">
            <h1 className="text-5xl font-black text-primary mb-2 drop-shadow-sm">{t("home.title")}</h1>
            <p className="text-lg text-muted-foreground font-semibold">{t("home.subtitle")}</p>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="w-full max-w-sm space-y-4">
            <motion.button
              whileHover={hoverScale}
              onMouseEnter={() => sfx.hover()}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartClick}
              className={`w-full glass-button py-4 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] transition-shadow ${t("home.start") === "ابدأ" || t("home.start") === "ابدأ اللعب" ? "flex-row-reverse" : ""}`}>
              <Play className="w-6 h-6 fill-current" />
              {t("home.start")}
            </motion.button>

            <motion.button
              whileHover={hoverScale}
              onMouseEnter={() => sfx.hover()}
              whileTap={{ scale: 0.95 }}
              onClick={handleHowToClick}
              className={`w-full bg-card/80 backdrop-blur-sm text-foreground py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 shadow-game border border-white/20 hover:border-primary/30 transition-colors ${t("home.start") === "ابدأ" || t("home.start") === "ابدأ اللعب" ? "flex-row-reverse" : ""}`}>
              <HelpCircle className="w-5 h-5 text-primary" />
              {t("home.howToPlay")}
            </motion.button>
          </motion.div>

          <HowToPlay isOpen={showHowTo} onClose={() => { sfx.click(); setShowHowTo(false); }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Index;
