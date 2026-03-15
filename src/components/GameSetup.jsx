import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, slideUpItem, hoverScale, tapScale } from "@/lib/animations";
import { ChevronRight, ChevronLeft, Users, UserX, Clock, Lightbulb, Play, Plus, Minus, User } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
import { toast } from "sonner";
import { CATEGORY_KEYS } from "@/i18n/translations";

const ToggleSwitch = ({ value, onChange, onHover, isRTL }) => (
  <motion.button
    whileHover={hoverScale}
    whileTap={tapScale}
    onMouseEnter={onHover}
    onClick={() => onChange(!value)}
    className={`w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner overflow-hidden border ${value ? "bg-primary border-primary" : "bg-card/80 border-white/20"}`}>
    <motion.div
      initial={false}
      animate={{ x: value ? (isRTL ? -24 : 24) : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="w-6 h-6 rounded-full bg-white shadow-sm absolute top-[3px] start-1"
    />
  </motion.button>
);

const GameSetup = ({ onBack, onStart }) => {
  const { t, isRTL } = useLanguage();
  const { sfx } = useAudio();

  const [players, setPlayers] = useState(["", "", ""]);
  const [impostorCount, setImpostorCount] = useState(1);
  const [hasTimer, setHasTimer] = useState(true);
  const [impostorHint, setImpostorHint] = useState(true);
  const [chaosMode, setChaosMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([...CATEGORY_KEYS]);

  const addPlayer = () => {
    if (players.length < 20) {
      sfx.click();
      setPlayers([...players, ""]);
    }
  };

  const removePlayer = (index) => {
    if (players.length > 3) {
      sfx.click();
      const newPlayers = [...players];
      newPlayers.splice(index, 1);
      setPlayers(newPlayers);
    }
  };

  const updatePlayerName = (index, name) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const toggleCategory = (cat) => {
    sfx.click();
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== cat));
      } else {
        toast.error(t("setup.errorCategory"));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleStart = () => {
    const finalPlayers = players.map((p, i) => p.trim() || `${t("setup.player")} ${i + 1}`);

    // Validate unique names
    const uniqueNames = new Set(finalPlayers);
    if (uniqueNames.size !== finalPlayers.length) {
      sfx.error();
      toast.error(t("setup.errorUniqueNames") || "Names must be unique");
      return;
    }

    sfx.success();
    onStart({
      players: finalPlayers,
      impostorCount,
      hasTimer,
      impostorHint,
      chaosMode,
      categories: selectedCategories
    });
  };

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div className="min-h-screen bg-background pb-32 max-w-md mx-auto relative shadow-xl overflow-x-hidden">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-5 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
        <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={onBack} className="w-10 h-10 rounded-xl bg-card border border-white/20 shadow-sm flex items-center justify-center">
          <BackIcon className="w-5 h-5 text-primary" />
        </motion.button>
        <h1 className="text-2xl font-black text-primary drop-shadow-sm">{t("setup.title")}</h1>
        <div className="w-10"></div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="px-5 space-y-6 mt-6 pb-10">
        {/* Players Section */}
        <div className="game-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> {t("setup.players")}
            </h3>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
              {players.length}/20
            </span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {players.map((name, i) => (
              <motion.div key={i} variants={slideUpItem} className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updatePlayerName(i, e.target.value)}
                    placeholder={`${t("setup.player")} ${i + 1}`}
                    className="w-full bg-background border border-white/10 rounded-xl py-3 ps-10 pr-4 font-bold outline-none focus:border-primary transition-all text-sm"
                  />
                </div>
                {players.length > 3 && (
                  <button onClick={() => removePlayer(i)} className="w-11 h-11 flex items-center justify-center bg-destructive/10 text-destructive rounded-xl border border-destructive/20 hover:bg-destructive hover:text-white transition-all">
                    <UserX className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={hoverScale} whileTap={tapScale}
            onClick={addPlayer}
            disabled={players.length >= 20}
            className="w-full mt-4 py-3 border-2 border-dashed border-primary/30 rounded-xl text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-all disabled:opacity-50">
            <Plus className="w-5 h-5" /> {t("setup.addPlayer") || "Add Player"}
          </motion.button>
        </div>

        {/* Categories Section */}
        <div className="game-card">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" /> {t("setup.categories")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_KEYS.map((cat) => (
              <motion.button
                key={cat}
                whileHover={hoverScale} whileTap={tapScale}
                onClick={() => toggleCategory(cat)}
                className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${selectedCategories.includes(cat) ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-card border-white/10 text-muted-foreground opacity-60"}`}>
                {t(cat)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Game Settings */}
        <div className="grid grid-cols-1 gap-4">
          <div className="game-card flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-bold">{t("setup.timer")}</p>
                <p className="text-xs text-muted-foreground font-semibold">{hasTimer ? t("setup.timerOn") : t("setup.timerOff")}</p>
              </div>
            </div>
            <ToggleSwitch value={hasTimer} onChange={setHasTimer} onHover={() => sfx.hover()} isRTL={isRTL} />
          </div>

          <div className="game-card flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Lightbulb className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-bold">{t("setup.hint")}</p>
                <p className="text-xs text-muted-foreground font-semibold line-clamp-1">{t("setup.hintDesc")}</p>
              </div>
            </div>
            <ToggleSwitch value={impostorHint} onChange={setImpostorHint} onHover={() => sfx.hover()} isRTL={isRTL} />
          </div>
        </div>

        {/* Impostors Count */}
        <div className="game-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <UserX className="w-5 h-5 text-destructive" /> {t("setup.impostors")}
            </h3>
            <div className="flex items-center gap-3 bg-muted rounded-xl p-1">
              <button
                onClick={() => { sfx.click(); setImpostorCount(Math.max(1, impostorCount - 1)); }}
                className="w-8 h-8 flex items-center justify-center bg-card rounded-lg shadow-sm">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-black text-lg">{impostorCount}</span>
              <button
                onClick={() => { sfx.click(); setImpostorCount(Math.min(Math.floor(players.length / 3), impostorCount + 1)); }}
                className="w-8 h-8 flex items-center justify-center bg-card rounded-lg shadow-sm">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-bold italic">
            {impostorCount === 1 ? t("setup.oneImpostor") : `${impostorCount} ${t("setup.impostors")}`}
          </p>
        </div>
      </motion.div>

      <div className="fixed bottom-0 inset-x-0 p-5 glass-panel bg-background/80 max-w-md mx-auto z-20">
        <motion.button
          whileHover={hoverScale} whileTap={tapScale}
          onClick={handleStart}
          className="w-full glass-button py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-xl shadow-game">
          <Play className="w-6 h-6 fill-current" />
          {t("setup.startGame")}
        </motion.button>
      </div>
    </div>
  );
};

export default GameSetup;
