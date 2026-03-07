'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordForm() {
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) { setError('Email is required.'); return; }
        setError(null);
        setIsLoading(true);

        try {
            const res = await authApi.post('/api/auth/forgotPassword', { email });
            setSuccess(res.data.message || 'OTP sent to your email.');
            setStep(2);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const d = err.response.data;
                setError(d?.Error || d?.error || d?.message || 'Failed to send OTP.');
            } else {
                setError('Failed to send OTP. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!otp) { setError('OTP is required.'); return; }
        if (!newPassword || newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

        setIsLoading(true);

        try {
            const res = await authApi.post('/api/auth/resetPassword', {
                email,
                code: otp,
                newPassword,
            });
            setSuccess(res.data.message || 'Password reset successfully!');
            setTimeout(() => router.push('/login'), 3000);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const d = err.response.data;
                setError(d?.Error || d?.error || d?.message || 'Failed to reset password.');
            } else {
                setError('Failed to reset password. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex w-full items-center justify-center bg-background min-h-screen">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-2 pb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <MessageSquare className="h-8 w-8 text-chart-6" />
                        <h1 className="text-3xl font-bold">ChatStack</h1>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {step === 1 ? 'Forgot Password' : 'Reset Password'}
                    </CardTitle>
                    <CardDescription className="text-base">
                        {step === 1
                            ? 'Enter your email and we\'ll send you a reset code.'
                            : `Enter the OTP sent to ${email} and choose a new password.`}
                    </CardDescription>
                </CardHeader>

                <form onSubmit={step === 1 ? handleSendOtp : handleResetPassword}>
                    <CardContent className="space-y-5">
                        {error && (
                            <div className="rounded-md bg-destructive/15 p-3.5 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        {success && step === 1 && (
                            <div className="rounded-md bg-green-500/15 p-3.5 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                {success}
                            </div>
                        )}
                        {success && step === 2 && (
                            <div className="rounded-md bg-green-500/15 p-3.5 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                {success} Redirecting to login...
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-2.5">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11"
                                    required
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <>
                                <div className="space-y-2.5">
                                    <Label htmlFor="otp" className="text-sm font-medium">
                                        Reset Code (OTP)
                                    </Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        disabled={isLoading}
                                        className="h-11"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="newPassword" className="text-sm font-medium">
                                        New Password
                                    </Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="Min 8 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="h-11"
                                        required
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Repeat new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="h-11"
                                        required
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pt-6">
                        <Button className="h-11 w-full text-base" type="submit" disabled={isLoading || (step === 2 && !!success)}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading
                                ? step === 1 ? 'Sending...' : 'Resetting...'
                                : step === 1 ? 'Send Reset Code' : 'Reset Password'}
                        </Button>
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to login
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
