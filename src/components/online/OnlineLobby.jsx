import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Copy, Users, Play, LogOut, ShieldCheck, User as UserIcon, Link, Settings, Lightbulb } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
import { useSocket } from "@/hooks/useSocketHook";
import { hoverScale, tapScale, slideUpItem, staggerContainer } from "@/lib/animations";
import { WORD_BANKS, getCategoryWordBankKey, CATEGORY_KEYS } from "@/i18n/translations";
import { toast } from "sonner";

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

const OnlineLobby = () => {
    const { t, lang } = useLanguage();
    const { sfx } = useAudio();
    const { room, socket, updateSettings, setReady, startGame } = useSocket();
    const [settingsOpen, setSettingsOpen] = useState(true);

    const isHost = room?.hostId === socket?.id;
    const everyoneReady = room?.players?.length >= 3 && room?.players?.every((p) => {
        return p && p.id && (p.id === room.hostId || p.ready);
    });

    const handleSettingsChange = (next) => {
        if (!room || room.hostId !== socket?.id) return;
        const newSettings = { ...room.settings, ...next };
        updateSettings(room.code, newSettings);
    };

    // Ensure at least one category is selected by default (host only)
    useEffect(() => {
        if (isHost && settingsOpen && (!room?.settings?.categories || room.settings.categories.length === 0)) {
            handleSettingsChange({ categories: [CATEGORY_KEYS[0]] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHost, settingsOpen]);

    if (!room || !room.players || !room.settings) return null;

    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers or insecure contexts
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            toast.error(t("setup.copyFailed") || "Failed to copy");
            throw error;
        }
    };

    const copyCode = () => {
        copyToClipboard(room.code);
        sfx.click();
        toast.success("Code copied!");
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/kick-the-impostor/#/?joinRoom=${room.code}`;
        copyToClipboard(link);
        sfx.click();
        toast.success("Invite link copied!");
    };

    const handleToggleReady = () => {
        const me = room.players.find(p => p.id === socket?.id);
        if (me) {
            sfx.click();
            setReady(room.code, !me.ready);
        }
    };

    const handleStart = () => {
        if (!everyoneReady) return;
        sfx.success();

        const { settings = {} } = room;
        const catKey = (settings.categories && settings.categories.length)
            ? settings.categories[Math.floor(Math.random() * settings.categories.length)]
            : CATEGORY_KEYS[Math.floor(Math.random() * CATEGORY_KEYS.length)];
        const wordBankKey = getCategoryWordBankKey(lang, catKey);
        const banks = WORD_BANKS[lang];
        const words = banks[wordBankKey] || Object.values(banks)[0] || ["?"];
        const secretWord = words[Math.floor(Math.random() * words.length)];

        const impostorIndices = [];
        const count = settings.impostorCount || 1;
        while (impostorIndices.length < count) {
            const idx = Math.floor(Math.random() * room.players.length);
            if (!impostorIndices.includes(idx)) impostorIndices.push(idx);
        }

        startGame(room.code, {
            impostorCount: count,
            impostorIndices,
            secretWord,
            category: catKey
        });
    };

    return (
        <div className="min-h-screen bg-background pb-32 max-w-md mx-auto relative shadow-xl overflow-x-hidden">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-5 pt-10 pb-4 flex items-center justify-between border-b border-white/5">
                <h1 className="text-2xl font-black text-primary drop-shadow-sm uppercase tracking-tighter">
                    {t("setup.lobby")}
                </h1>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-card border border-white/10 px-4 py-2 rounded-2xl shadow-inner">
                        <span className="text-xl font-black tracking-widest text-primary">{room.code}</span>
                        <button onClick={copyCode} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                            <Copy className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                    {isHost && (
                        <motion.button
                            whileHover={hoverScale}
                            whileTap={tapScale}
                            onClick={() => {
                                sfx.click();
                                setSettingsOpen(!settingsOpen);
                            }}
                            className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${settingsOpen ? 'bg-primary border-primary text-white' : 'bg-card border-white/20 text-primary'}`}
                        >
                            <Settings className={`w-6 h-6 ${settingsOpen ? 'animate-spin-slow' : ''}`} />
                        </motion.button>
                    )}
                </div>
            </div>

            <motion.div layout variants={staggerContainer} initial="hidden" animate="show" className="px-5 space-y-6 mt-6">
                {/* Host: Game settings - Moved up */}
                <AnimatePresence mode="popLayout">
                    {isHost && settingsOpen && (
                        <motion.div
                            key="settings-card"
                            layout
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            className="game-card overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-primary" /> {t("setup.subtitle")}
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {/* Impostor count */}
                                <div>
                                    <label className="block text-sm font-bold text-muted-foreground mb-1">
                                        {t("setup.impostors")}
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2].map((n) => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => handleSettingsChange({ impostorCount: n })}
                                                className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                                                    (room.settings?.impostorCount === n)
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background border-white/20 hover:border-primary/50"
                                                }`}
                                            >
                                                {n === 1 ? t("setup.oneImpostor") : "2"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Timer */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">{t("setup.timer")}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleSettingsChange({ hasTimer: !room.settings?.hasTimer })}
                                        className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                                            room.settings?.hasTimer ? "bg-primary" : "bg-muted"
                                        }`}
                                    >
                                        <span className="sr-only">{room.settings?.hasTimer ? "On" : "Off"}</span>
                                        <span
                                            className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                                room.settings?.hasTimer ? (lang === 'ar' ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                                            }`}
                                        ></span>
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {room.settings?.hasTimer ? t("setup.timerOn") : t("setup.timerOff")}
                                </p>
                                {/* Impostor hint */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">{t("setup.hint")}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleSettingsChange({ impostorHint: !room.settings?.impostorHint })}
                                        className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                                            room.settings?.impostorHint ? "bg-primary" : "bg-muted"
                                        }`}
                                    >
                                        <span className="sr-only">{room.settings?.impostorHint ? "On" : "Off"}</span>
                                        <span
                                            className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                                room.settings?.impostorHint ? (lang === 'ar' ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                                            }`}
                                        ></span>
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">{t("setup.hintDesc")}</p>
                                {/* Chaos mode (optional) */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">{t("setup.chaos")}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleSettingsChange({ chaosMode: !room.settings?.chaosMode })}
                                        className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                                            room.settings?.chaosMode ? "bg-primary" : "bg-muted"
                                        }`}
                                    >
                                        <span className="sr-only">{room.settings?.chaosMode ? "On" : "Off"}</span>
                                        <span
                                            className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                                room.settings?.chaosMode ? (lang === 'ar' ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                                            }`}
                                        ></span>
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">{t("setup.chaosDesc")}</p>
                                {/* Categories Redesign: Large Illustration Cards */}
                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center gap-3 mb-6 px-1">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-lg">
                                            <Lightbulb className="w-6 h-6 text-primary animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white tracking-tight leading-none bg-clip-text">
                                                {t("setup.categories")}
                                            </h3>
                                            <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-60">
                                                {t("setup.categoriesSelected")}: {room.settings?.categories?.length ?? 0}
                                            </p>
                                        </div>
                                    </div>

                                    <motion.div 
                                        variants={staggerContainer}
                                        initial="hidden"
                                        animate="show"
                                        className="space-y-4"
                                    >
                                        {CATEGORY_KEYS.map((key) => {
                                            const selected = room.settings?.categories?.includes(key) ?? false;
                                            const style = CATEGORY_STYLES[key] || CATEGORY_STYLES["cat.things"];
                                            
                                            return (
                                                <motion.button
                                                    key={key}
                                                    variants={slideUpItem}
                                                    whileHover={{ scale: 1.02, translateY: -4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    type="button"
                                                    onClick={() => {
                                                        const list = room.settings?.categories || [];
                                                        const next = selected
                                                            ? list.filter((c) => c !== key)
                                                            : [...list, key];
                                                        handleSettingsChange({ categories: next.length ? next : [] });
                                                    }}
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
                                                            {t(key)}
                                                        </h4>
                                                        <p className={`text-xs font-bold leading-tight max-w-[180px] transition-colors ${
                                                            selected ? "text-white/80" : "text-muted-foreground group-hover:text-white/70"
                                                        }`}>
                                                            {t(`${key}.desc`)}
                                                        </p>
                                                    </div>

                                                    {/* Large Illustration */}
                                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                                        {CATEGORY_IMAGES[key] && (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                {selected && (
                                                                    <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-125 animate-pulse" />
                                                                )}
                                                                <img
                                                                    src={CATEGORY_IMAGES[key]}
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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Player List */}
                <motion.div layout className="game-card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" /> {t("setup.players")}
                        </h3>
                        <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                            {room.players.length}/20
                        </span>
                    </div>

                    <div className="space-y-3">
                        {room.players.map((player) => (
                            <motion.div key={player.id} variants={slideUpItem} className="flex items-center gap-3 p-3 bg-background border border-white/5 rounded-2xl">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${player.ready || player.id === room.hostId ? 'bg-primary/20 border border-primary/30' : 'bg-muted border border-white/10'}`}>
                                    <UserIcon className={`w-5 h-5 ${player.ready || player.id === room.hostId ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold flex items-center gap-2">
                                        {player.name}
                                        {player.id === room.hostId && <ShieldCheck className="w-4 h-4 text-accent" />}
                                    </p>
                                    <p className={`text-[10px] uppercase font-black tracking-widest ${player.ready || player.id === room.hostId ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {player.id === room.hostId ? 'Host' : (player.ready ? t("setup.ready") : t("setup.notReady"))}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Host: Invite Link */}
                {isHost && (
                    <motion.div layout variants={slideUpItem} className="game-card">
                        <div className="flex items-center gap-2 mb-3">
                            <Link className="w-5 h-5 text-accent" />
                            <h3 className="text-lg font-bold">{t("setup.inviteLink") || "Invite Link"}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                            {t("setup.inviteLinkDesc") || "Share this link with friends to join your room"}
                        </p>
                        <motion.button
                            whileHover={hoverScale}
                            whileTap={tapScale}
                            onClick={copyInviteLink}
                            className="w-full py-3 px-4 bg-accent/10 border border-accent/30 rounded-2xl font-bold text-accent transition-all hover:bg-accent/20 flex items-center justify-center gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            {t("setup.copyInviteLink") || "Copy Invite Link"}
                        </motion.button>
                    </motion.div>
                )}

                {/* Info Box */}
                {!isHost && !everyoneReady && (
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-accent/10 border border-accent/20 rounded-2xl text-center">
                        <p className="text-sm font-bold text-accent italic">{t("setup.waitingForHost")}</p>
                    </motion.div>
                )}
            </motion.div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 inset-x-0 p-5 glass-panel bg-background/80 max-w-md mx-auto z-20 flex gap-3">
                {!isHost && (
                    <motion.button
                        whileHover={hoverScale} whileTap={tapScale}
                        onClick={handleToggleReady}
                        className={`flex-1 py-4 rounded-2xl font-bold text-lg shadow-game transition-all ${room.players.find(p => p.id === socket?.id)?.ready ? 'bg-muted text-muted-foreground' : 'glass-button'}`}
                    >
                        {room.players.find(p => p.id === socket?.id)?.ready ? t("setup.notReady") : t("setup.ready")}
                    </motion.button>
                )}

                {isHost && (
                    <motion.button
                        whileHover={hoverScale} whileTap={tapScale}
                        onClick={handleStart}
                        disabled={!everyoneReady}
                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-xl shadow-game transition-all ${everyoneReady ? 'glass-button' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'}`}
                    >
                        <Play className="w-6 h-6 fill-current" />
                        {t("setup.startGame")}
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default OnlineLobby;
