import { motion } from "framer-motion";
import { Users, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { hoverScale, tapScale, slideUpItem, staggerContainer } from "@/lib/animations";

const ModeSelection = ({ onSelect, onBack }) => {
    const { t, isRTL } = useLanguage();
    const BackIcon = isRTL ? ChevronRight : ChevronLeft;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
            <div className="absolute top-6 left-5">
                <motion.button
                    whileHover={hoverScale}
                    whileTap={tapScale}
                    onClick={onBack}
                    className="w-12 h-12 rounded-xl bg-card border border-white/20 shadow-sm flex items-center justify-center transition-colors">
                    <BackIcon className="w-6 h-6 text-primary" />
                </motion.button>
            </div>

            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-12">
                <h1 className="text-4xl font-black text-primary mb-2 uppercase tracking-tight">{t("mode.title")}</h1>
                <p className="text-muted-foreground font-bold">{t("mode.subtitle")}</p>
            </motion.div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">

                {/* Local Mode */}
                <motion.button
                    variants={slideUpItem}
                    whileHover={hoverScale}
                    whileTap={tapScale}
                    onClick={() => onSelect("local")}
                    className="group relative overflow-hidden p-8 rounded-3xl bg-card border border-white/10 shadow-lg hover:border-primary/50 transition-all text-center flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Users className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black mb-1">{t("mode.local")}</h3>
                        <p className="text-sm text-muted-foreground font-semibold leading-tight">{t("mode.localDesc")}</p>
                    </div>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-24 h-24 -mr-8 -mt-8 rotate-12 text-primary" />
                    </div>
                </motion.button>

                {/* Online Mode */}
                <motion.button
                    variants={slideUpItem}
                    whileHover={hoverScale}
                    whileTap={tapScale}
                    onClick={() => onSelect("online")}
                    className="group relative overflow-hidden p-8 rounded-3xl bg-card border border-white/10 shadow-lg hover:border-blue-500/50 transition-all text-center flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <Globe className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black mb-1">{t("mode.online")}</h3>
                        <p className="text-sm text-muted-foreground font-semibold leading-tight">{t("mode.onlineDesc")}</p>
                    </div>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Globe className="w-24 h-24 -mr-8 -mt-8 rotate-12 text-blue-500" />
                    </div>
                    <div className="bg-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full absolute top-4 right-4 animate-pulse">
                        Beta
                    </div>
                </motion.button>

            </motion.div>
        </div>
    );
};

export default ModeSelection;
