import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, User, Hash, Globe, Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
import { useSocket } from "@/hooks/useSocket";
import { hoverScale, tapScale, slideUpItem, staggerContainer } from "@/lib/animations";
import { toast } from "sonner";

const OnlineSetup = ({ onBack }) => {
    const { t, isRTL } = useLanguage();
    const { sfx } = useAudio();
    const { createRoom, joinRoom } = useSocket();
    const [playerName, setPlayerName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [view, setView] = useState("choice"); // choice, create, join

    const BackIcon = isRTL ? ChevronRight : ChevronLeft;

    const handleCreate = () => {
        if (!playerName.trim()) {
            toast.error(t("setup.errorName"));
            return;
        }
        sfx.click();
        createRoom(playerName);
    };

    const handleJoin = () => {
        if (!playerName.trim()) {
            toast.error(t("setup.errorName"));
            return;
        }
        if (!roomCode.trim()) {
            toast.error(t("setup.errorCode"));
            return;
        }
        sfx.click();
        joinRoom(roomCode, playerName);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-20">
                <motion.button
                    whileHover={hoverScale}
                    whileTap={tapScale}
                    onClick={() => view === "choice" ? onBack() : setView("choice")}
                    className="w-10 h-10 rounded-xl bg-card border border-white/20 shadow-sm flex items-center justify-center">
                    <BackIcon className="w-5 h-5 text-primary" />
                </motion.button>
                <h1 className="text-xl font-black text-primary">{t("mode.online")}</h1>
                <div className="w-10"></div>
            </div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="w-full max-w-sm space-y-6"
            >
                {view === "choice" && (
                    <>
                        <motion.div variants={slideUpItem} className="text-center mb-4">
                            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-inner">
                                <Globe className="w-10 h-10 text-blue-500" />
                            </div>
                            <h2 className="text-3xl font-black mb-2">{t("mode.online")}</h2>
                            <p className="text-muted-foreground font-semibold">{t("mode.onlineDesc")}</p>
                        </motion.div>

                        <motion.button
                            variants={slideUpItem}
                            whileHover={hoverScale}
                            whileTap={tapScale}
                            onClick={() => { sfx.click(); setView("create"); }}
                            className="w-full game-card py-6 flex flex-col items-center gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
                        >
                            <Plus className="w-8 h-8 text-primary" />
                            <span className="text-xl font-bold">{t("setup.hostRoom")}</span>
                        </motion.button>

                        <motion.button
                            variants={slideUpItem}
                            whileHover={hoverScale}
                            whileTap={tapScale}
                            onClick={() => { sfx.click(); setView("join"); }}
                            className="w-full game-card py-6 flex flex-col items-center gap-2 border-white/20"
                        >
                            <Hash className="w-8 h-8 text-blue-500" />
                            <span className="text-xl font-bold">{t("setup.joinRoom")}</span>
                        </motion.button>
                    </>
                )}

                {(view === "create" || view === "join") && (
                    <motion.div variants={slideUpItem} className="space-y-6">
                        <div className="game-card">
                            <label className="block text-sm font-black text-muted-foreground uppercase mb-2 ml-1">
                                {t("setup.playerName")}
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder={t("setup.playerName")}
                                    className="w-full bg-background border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-primary transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        {view === "join" && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="game-card">
                                <label className="block text-sm font-black text-muted-foreground uppercase mb-2 ml-1">
                                    {t("setup.roomCode")}
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/50" />
                                    <input
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="ABCD"
                                        maxLength={4}
                                        className="w-full bg-background border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-blue-500 transition-all shadow-inner text-xl tracking-[0.5em] uppercase"
                                    />
                                </div>
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={hoverScale}
                            whileTap={tapScale}
                            onClick={view === "create" ? handleCreate : handleJoin}
                            className={`w-full py-5 rounded-2xl text-xl font-bold transition-shadow shadow-lg ${view === "create" ? "glass-button" : "bg-blue-600 text-white hover:bg-blue-500"}`}
                        >
                            {view === "create" ? t("setup.create") : t("setup.join")}
                        </motion.button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default OnlineSetup;
