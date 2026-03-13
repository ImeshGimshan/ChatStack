"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { updateMyProfile } from "@/lib/auth-client";

export default function RegisterProfilePage() {
  const router = useRouter();
  const { token, status } = useAuth();

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!token) {
      router.replace("/login");
    }
  }, [router, status, token]);

  const canSubmit = useMemo(() => {
    return !isSubmitting && token !== null;
  }, [isSubmitting, token]);

  const actionButtonClass =
    "h-11 w-full rounded-xl text-sm font-semibold transition-all duration-300";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !token) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const skills = skillsText
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      await updateMyProfile(
        {
          headline: headline.trim(),
          bio: bio.trim(),
          githubUsername: githubUsername.trim(),
          skills,
          address: {
            city: city.trim(),
            country: country.trim()
          },
          socialLinks: {
            linkedin: linkedin.trim(),
            github: github.trim()
          }
        },
        token
      );

      setNotice("Profile details saved. You are ready to explore ChatStack.");
      setTimeout(() => router.push("/"), 800);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to save profile.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Complete your profile"
      description="Add a few details to personalize your ChatStack experience."
      maxWidthClassName="max-w-2xl"
      footer={
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-300">
          <span>Want to do this later?</span>
          <Button asChild variant="ghost" className="h-8 rounded-lg px-3 text-sm text-white hover:bg-white/10 hover:text-white">
            <Link href="/">Skip for now</Link>
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2.5 sm:col-span-2">
            <Label htmlFor="headline" className="text-zinc-200">
              Headline
            </Label>
            <Input
              id="headline"
              type="text"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="e.g. Full-stack developer"
              className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
            />
          </div>

          <div className="space-y-2.5 sm:col-span-2">
            <Label htmlFor="bio" className="text-zinc-200">
              Bio
            </Label>
            <Input
              id="bio"
              type="text"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Tell people a bit about yourself"
              className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="githubUsername" className="text-zinc-200">
              GitHub username
            </Label>
            <Input
              id="githubUsername"
              type="text"
              value={githubUsername}
              onChange={(event) => setGithubUsername(event.target.value)}
              placeholder="Your GitHub handle"
              className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="skills" className="text-zinc-200">
              Skills (comma separated)
            </Label>
            <Input
              id="skills"
              type="text"
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              placeholder="React, NestJS, PostgreSQL"
              className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="city" className="text-zinc-200">
              City
            </Label>
            <Input
              id="city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Your city"
              className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="country" className="text-zinc-200">
              Country
            </Label>
            <Input
              id="country"
              type="text"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Your country"
              className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="linkedin" className="text-zinc-200">
              LinkedIn URL
            </Label>
            <Input
              id="linkedin"
              type="url"
              value={linkedin}
              onChange={(event) => setLinkedin(event.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="github" className="text-zinc-200">
              GitHub URL
            </Label>
            <Input
              id="github"
              type="url"
              value={github}
              onChange={(event) => setGithub(event.target.value)}
              placeholder="https://github.com/..."
              className="h-11 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:border-indigo-300/80 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/30"
            />
          </div>
        </div>

        {error ? (
          <Alert className="border-red-300/30 bg-red-500/10 text-red-100">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {notice ? (
          <Alert className="border-green-300/30 bg-green-500/10 text-green-100">
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          disabled={!canSubmit}
          className={`${actionButtonClass} bg-linear-to-r from-indigo-500 via-indigo-600 to-blue-500 text-white hover:from-indigo-400 hover:via-indigo-500 hover:to-blue-400`}
        >
          {isSubmitting ? "Saving profile..." : "Finish registration"}
        </Button>
      </form>
    </AuthShell>
  );
}
