'use client';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function LoginPageComponent() {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await login(username, password);
            router.push('/chat');
        } catch (err) {
            setError('Invalid username or password');
            console.error("login error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex w-full items-center justify-center bg-background">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-2 pb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <MessageSquare className="h-8 w-8 text-chart-6" />
                        <h1 className="text-4xl font-bold">ChatStack</h1>
                    </div>
                    <CardTitle className="text-2xl font-bold">Login</CardTitle>
                    <CardDescription className="text-base">
                        Enter your credentials to access your account.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5">
                        {error && (
                            <div className="rounded-md bg-destructive/15 p-3.5 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2.5">
                            <Label htmlFor="username" className="text-sm font-medium">
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="h-11"
                                required
                            />
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-chart-6 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11"
                                required
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pt-6">
                        <Button
                            className="h-11 w-full text-base"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Authenticating...' : 'Login'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/register"
                                className="text-chart-6 hover:underline font-medium"
                            >
                                Sign up here
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}