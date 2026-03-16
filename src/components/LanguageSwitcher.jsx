import { useLanguage } from "@/i18n/LanguageContext";
const LANGUAGES = [
    { code: "ar", label: "عربي" },
    { code: "en", label: "EN" },
    { code: "fr", label: "FR" },
];
const LanguageSwitcher = () => {
    const { lang, setLang } = useLanguage();
    return (<div className="flex items-center gap-1 bg-card rounded-full p-1 shadow-game border border-border" dir="ltr">
      {LANGUAGES.map((l) => (<button key={l.code} onClick={() => setLang(l.code)} className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${lang === l.code
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"}`}>
          {l.label}
        </button>))}
    </div>);
};
export default LanguageSwitcher;
