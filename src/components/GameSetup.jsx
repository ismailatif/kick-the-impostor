import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, slideUpItem, hoverScale, tapScale } from "@/lib/animations";
import { ChevronRight, ChevronLeft, Users, UserX, Clock, Lightbulb, Play, Plus, Minus, User } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
import { toast } from "sonner";
import { CATEGORY_KEYS } from "@/i18n/translations";

// Import category images
import thingsImg from "@/assets/category/things.png";
import countriesImg from "@/assets/category/Countries.png";
import foodImg from "@/assets/category/food.png";
import animalsImg from "@/assets/category/animals.png";
import sportsImg from "@/assets/category/sports.png";
import celebritiesImg from "@/assets/category/Celebrities.png";
import footballImg from "@/assets/category/footballPlayers.png";

const CATEGORY_IMAGES = {
  "cat.things": thingsImg,
  "cat.countries": countriesImg,
  "cat.food": foodImg,
  "cat.animals": animalsImg,
  "cat.sports": sportsImg,
  "cat.celebrities": celebritiesImg,
  "cat.football": footballImg
};

const CATEGORY_STYLES = {
  "cat.things": { gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/25" },
  "cat.countries": { gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/25" },
  "cat.food": { gradient: "from-orange-500 to-red-600", shadow: "shadow-orange-500/25" },
  "cat.animals": { gradient: "from-green-500 to-emerald-600", shadow: "shadow-green-500/25" },
  "cat.sports": { gradient: "from-sky-500 to-blue-600", shadow: "shadow-sky-500/25" },
  "cat.celebrities": { gradient: "from-purple-500 to-pink-600", shadow: "shadow-purple-500/25" },
  "cat.football": { gradient: "from-amber-600 to-orange-600", shadow: "shadow-amber-600/25" },
};

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

        {/* Categories Section Redesign: Large Illustration Cards */}
        <div className="game-card overflow-hidden relative border-none bg-transparent shadow-none p-0 space-y-4">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/30 shadow-lg">
              <Lightbulb className="w-6 h-6 text-accent animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight leading-none bg-clip-text">
                {t("setup.categories")}
              </h3>
              <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-60">
                {t("setup.categoriesSelected")}: {selectedCategories.length}
              </p>
            </div>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-4 px-1"
          >
            {CATEGORY_KEYS.map((cat) => {
              const selected = selectedCategories.includes(cat);
              const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES["cat.things"];
              
              return (
                <motion.button
                  key={cat}
                  variants={slideUpItem}
                  whileHover={{ scale: 1.02, translateY: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleCategory(cat)}
                  className={`relative w-full text-right flex items-center p-4 rounded-[28px] border-4 transition-all duration-300 min-h-[100px] overflow-hidden group ${
                    selected
                      ? `bg-gradient-to-br ${style.gradient} border-white/40 ${style.shadow} shadow-2xl scale-[1.02]`
                      : "bg-card/40 border-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Card Content (Right-to-Left) */}
                  <div className="flex-1 pr-2 relative z-10">
                    <h4 className={`text-xl font-black mb-0.5 transition-colors ${
                      selected ? "text-white" : "text-white/90 group-hover:text-white"
                    }`}>
                      {t(cat)}
                    </h4>
                    <p className={`text-xs font-bold leading-tight max-w-[180px] transition-colors ${
                      selected ? "text-white/80" : "text-muted-foreground group-hover:text-white/70"
                    }`}>
                      {t(`${cat}.desc`)}
                    </p>
                  </div>

                  {/* Large Illustration */}
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    {CATEGORY_IMAGES[cat] && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {selected && (
                          <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-125 animate-pulse" />
                        )}
                        <img
                          src={CATEGORY_IMAGES[cat]}
                          alt=""
                          className={`w-24 h-24 object-contain transition-all duration-500 drop-shadow-xl ${
                            selected 
                              ? "scale-110 rotate-6 translate-x-1 -translate-y-1" 
                              : "scale-100 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110"
                          }`}
                        />
                      </div>
                    )}
                  </div>


                  {/* Decorative background overlay */}
                  {selected && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
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
