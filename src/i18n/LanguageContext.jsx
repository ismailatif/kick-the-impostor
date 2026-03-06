import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations } from "./translations";
const LanguageContext = createContext(null);
export const LanguageProvider = ({ children }) => {
    const [lang, setLangState] = useState(() => {
        const saved = localStorage.getItem("app-lang");
        return saved && ["ar", "en", "fr"].includes(saved) ? saved : "ar";
    });
    const isRTL = lang === "ar";
    const setLang = useCallback((l) => {
        setLangState(l);
        localStorage.setItem("app-lang", l);
    }, []);
    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = isRTL ? "rtl" : "ltr";
    }, [lang, isRTL]);
    const t = useCallback((key, vars) => {
        let str = translations[lang]?.[key] || translations["ar"]?.[key] || key;
        if (vars) {
            Object.entries(vars).forEach(([k, v]) => {
                str = str.replace(`{${k}}`, String(v));
            });
        }
        return str;
    }, [lang]);
    return (<LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>);
};
export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx)
        throw new Error("useLanguage must be used within LanguageProvider");
    return ctx;
};
