import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextProps>({
    theme: "system",
    setTheme: () => { },
    resolvedTheme: "light",
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem("chatvox-theme");
        if (stored === "dark" || stored === "light" || stored === "system") return stored;
        return "system";
    });

    const getSystemTheme = (): "dark" | "light" => {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const resolvedTheme: "dark" | "light" = theme === "system" ? getSystemTheme() : theme;

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("dark", "light");
        root.classList.add(resolvedTheme);
    }, [resolvedTheme]);

    // Listen for system changes if theme === "system"
    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => {
            const root = window.document.documentElement;
            root.classList.remove("dark", "light");
            root.classList.add(getSystemTheme());
        };
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, [theme]);

    const setTheme = (t: Theme) => {
        localStorage.setItem("chatvox-theme", t);
        setThemeState(t);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
