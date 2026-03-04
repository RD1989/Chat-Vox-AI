import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
    size?: "sm" | "default";
}

export const ThemeToggle = ({ size = "default" }: ThemeToggleProps) => {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const iconSize = size === "sm" ? 15 : 16;
    const btnClass = size === "sm" ? "h-8 w-8" : "h-9 w-9";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`${btnClass} text-muted-foreground hover:text-foreground transition-colors`}
                    title="Alterar tema"
                >
                    {resolvedTheme === "dark" ? (
                        <Moon size={iconSize} />
                    ) : (
                        <Sun size={iconSize} />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="gap-2.5 cursor-pointer"
                >
                    <Sun size={14} />
                    <span className="text-sm">Claro</span>
                    {theme === "light" && (
                        <span className="ml-auto text-[10px] font-semibold text-primary">✓</span>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="gap-2.5 cursor-pointer"
                >
                    <Moon size={14} />
                    <span className="text-sm">Escuro</span>
                    {theme === "dark" && (
                        <span className="ml-auto text-[10px] font-semibold text-primary">✓</span>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="gap-2.5 cursor-pointer"
                >
                    <Monitor size={14} />
                    <span className="text-sm">Sistema</span>
                    {theme === "system" && (
                        <span className="ml-auto text-[10px] font-semibold text-primary">✓</span>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
