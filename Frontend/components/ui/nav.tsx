"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { MessagesSquare, Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useEffect, useState } from "react";

export default function Nav() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => setMounted(true), []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 backdrop-blur-sm bg-background/20">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <MessagesSquare className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold">ChatStack</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        Features
                    </a>
                    <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        About
                    </a>
                </nav>

                <div className="flex items-center gap-2">
                    {mounted && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-4 w-4" />
                            ) : (
                                <Moon className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/login">Sign In</Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href="/register">Register</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}