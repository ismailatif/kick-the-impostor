import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, slideUpItem, hoverScale, pulseGlow } from "@/lib/animations";
import { X, Users, Eye, Play, MessageSquare, UserX, MessageCircle, Vote, Video } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAudio } from "@/hooks/useAudio";
const HowToPlay = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { sfx } = useAudio();
  const steps = [
    { number: 1, icon: Users, text: t("how.step1"), color: "bg-primary/10 text-primary", numBg: "bg-primary" },
    { number: 2, icon: Eye, text: t("how.step2"), color: "bg-success/10 text-success", numBg: "bg-success" },
    { number: 3, icon: Play, text: t("how.step3"), color: "bg-muted text-muted-foreground", numBg: "bg-muted-foreground" },
    { number: 4, icon: MessageSquare, text: t("how.step4"), color: "step-card-green text-success", numBg: "bg-success" },
    { number: 5, icon: UserX, text: t("how.step5"), color: "step-card-red text-destructive", numBg: "bg-destructive" },
    { number: 6, icon: MessageCircle, text: t("how.step6"), color: "step-card-pink text-game-pink", numBg: "bg-game-pink" },
    { number: 7, icon: Vote, text: t("how.step7"), color: "step-card-yellow text-accent", numBg: "bg-accent text-accent-foreground" },
  ];
  return (<AnimatePresence>
    {isOpen && (<>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 150 || info.velocity.y > 500) {
            onClose();
          }
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 glass-panel max-h-[85vh] overflow-y-auto touch-none">
        <div className="sticky top-0 bg-card/40 backdrop-blur-xl border-b border-white/10 pt-3 pb-2 px-6 rounded-t-3xl z-10 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { sfx.click(); onClose(); }} onMouseEnter={() => sfx.hover()} className="p-2 transition-transform hover:scale-110">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{t("how.title")}</h2>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center p-0">
                <span className="text-primary text-xl font-bold leading-none mb-0.5">©</span>
              </div>
            </div>
          </div>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="px-6 py-6 space-y-4">
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={slideUpItem}
              whileHover={hoverScale}
              onHoverStart={() => sfx.hover()}
              onViewportEnter={() => { if (step.number === 7) sfx.success(); }}
              className={`step-card ${step.color} ${step.number === 7 ? 'ring-2 ring-accent/50 shadow-[0_0_20px_rgba(242,196,39,0.2)] bg-accent/5 overflow-hidden relative' : ''}`}>

              {step.number === 7 && (
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0"
                />
              )}

              <div className="flex items-center gap-4 w-full relative z-10">
                <p className="text-base font-semibold flex-1 text-start leading-relaxed">{step.text}</p>
                <div className="relative flex-shrink-0">
                  <motion.div
                    animate={pulseGlow}
                    className={`w-12 h-12 rounded-full ${step.number === 7 ? 'bg-accent/20' : 'bg-muted/50'} flex items-center justify-center`}>
                    <step.icon className="w-6 h-6" />
                  </motion.div>
                  <span className={`absolute -top-1 -end-1 w-6 h-6 ${step.numBg} text-card rounded-full text-xs flex items-center justify-center font-bold shadow-sm`}>
                    {step.number}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div variants={slideUpItem} whileHover={hoverScale} onHoverStart={() => sfx.hover()} className="step-card bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-4 w-full">
              <p className="text-base font-semibold flex-1 text-start leading-relaxed">{t("how.share")}</p>
              <motion.div animate={pulseGlow} className="w-12 h-12 rounded-full bg-game-orange/20 flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-game-orange" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>)}
  </AnimatePresence>);
};
export default HowToPlay;
