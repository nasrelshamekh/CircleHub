/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react"

export const themeContext = createContext(null)

export default function ThemeContextProvider({ children }) {

    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem("app-theme");
        if (savedTheme)
            return savedTheme

        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        return systemPrefersDark ? "dark" : "light"
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);

        localStorage.setItem("app-theme", theme);
    }, [theme])

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"))
    }

    return (
        <>
            <themeContext.Provider value={{ theme, toggleTheme }}>
                {children}
            </themeContext.Provider>
        </>
    )
}
