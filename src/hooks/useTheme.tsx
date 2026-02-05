 import { createContext, useContext, useEffect, useState } from "react";
 
 type Theme = "dark" | "light" | "system";
 
 interface ThemeContextType {
   theme: Theme;
   setTheme: (theme: Theme) => void;
   resolvedTheme: "dark" | "light";
 }
 
 const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
 
 export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
   const [theme, setThemeState] = useState<Theme>(() => {
     if (typeof window !== "undefined") {
       const stored = localStorage.getItem("theme") as Theme;
       if (stored && ["dark", "light", "system"].includes(stored)) {
         return stored;
       }
     }
     return "system";
   });
 
   const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light");
 
   useEffect(() => {
     const root = window.document.documentElement;
     
     const applyTheme = () => {
       let resolved: "dark" | "light";
       
       if (theme === "system") {
         resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
       } else {
         resolved = theme;
       }
       
       setResolvedTheme(resolved);
       root.classList.remove("light", "dark");
       root.classList.add(resolved);
     };
 
     applyTheme();
 
     // Listen for system preference changes
     const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
     const handleChange = () => {
       if (theme === "system") {
         applyTheme();
       }
     };
 
     mediaQuery.addEventListener("change", handleChange);
     return () => mediaQuery.removeEventListener("change", handleChange);
   }, [theme]);
 
   const setTheme = (newTheme: Theme) => {
     localStorage.setItem("theme", newTheme);
     setThemeState(newTheme);
   };
 
   return (
     <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
       {children}
     </ThemeContext.Provider>
   );
 };
 
 export const useTheme = () => {
   const context = useContext(ThemeContext);
   if (!context) {
     throw new Error("useTheme must be used within a ThemeProvider");
   }
   return context;
 };