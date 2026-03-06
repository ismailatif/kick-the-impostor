import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition, hoverScale } from "@/lib/animations";
import { Play, HelpCircle, Volume2, VolumeX, Moon, Sun } from "lucide-react";
import mascot from "@/assets/mascot.png";
import HowToPlay from "@/components/HowToPlay";
import GameSetup from "@/components/GameSetup";
import GamePlay from "@/components/GamePlay";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
import { useTheme } from "next-themes";

const Index = () => {
  const [screen, setScreen] = useState("home");
  const [showHowTo, setShowHowTo] = useState(false);
  const [gameConfig, setGameConfig] = useState(null);
  const { t } = useLanguage();
  const { sfx, playBGM, isMuted, setIsMuted } = useAudio();
  const { theme, setTheme } = useTheme();

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
    setScreen("setup");
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

  return (
    <AnimatePresence mode="wait">
      {screen === "setup" && (
        <motion.div key="setup" variants={pageTransition} initial="initial" animate="animate" exit="exit" className="absolute top-0 left-0 w-full min-h-screen">
          <GameSetup
            onBack={() => { sfx.click(); setScreen("home"); }}
            onStart={(config) => {
              setGameConfig(config);
              setScreen("play");
            }}
          />
        </motion.div>
      )}

      {screen === "play" && gameConfig && (
        <motion.div key="game" variants={pageTransition} initial="initial" animate="animate" exit="exit" className="absolute top-0 left-0 w-full min-h-screen">
          <GamePlay config={gameConfig} onEnd={() => { sfx.click(); setScreen("home"); }} />
        </motion.div>
      )}

      {screen === "home" && (
        <motion.div key="home" variants={pageTransition} initial="initial" animate="animate" exit="exit" className="min-h-screen flex flex-col items-center justify-center px-5 relative overflow-hidden">
          <div className="absolute top-6 left-5 flex gap-3">
            <motion.button
              whileHover={hoverScale}
              onMouseEnter={() => sfx.hover()}
              onClick={() => {
                sfx.click();
                setTheme(theme === "dark" ? "light" : "dark");
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

          <div className="absolute top-6 right-5">
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
              whileTap={{ scale: 0.97 }}
              onClick={handleStartClick}
              className="w-full glass-button py-4 rounded-2xl text-xl font-bold flex items-center justify-center gap-3">
              <Play className="w-6 h-6" />
              {t("home.start")}
            </motion.button>

            <motion.button
              whileHover={hoverScale}
              onMouseEnter={() => sfx.hover()}
              whileTap={{ scale: 0.97 }}
              onClick={handleHowToClick}
              className="w-full bg-card/80 backdrop-blur-sm text-foreground py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 shadow-game border border-white/20">
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
