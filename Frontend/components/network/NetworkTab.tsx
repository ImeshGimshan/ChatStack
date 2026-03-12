"use client";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Search, Sparkles, UserCircle, Send } from "lucide-react";
import ProfileView from "./ProfileView";
import MyConnections from "./MyConnections";
import PendingRequests from "./PendingRequests";
import SentRequests from "./SentRequests";
import DiscoverDevelopers from "./DiscoverDevelopers";
import Suggestions from "./Suggestions";

export default function NetworkTab() {
    const [activeSection, setActiveSection] = useState("profile");

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar navigation */}
            <aside className="hidden md:flex w-60 flex-col border-r border-border/60 bg-card/70">
                <div className="px-4 py-3 border-b border-border/60">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Network
                    </h2>
                </div>
                <nav className="p-2 space-y-0.5">
                    {[
                        { id: "profile", label: "My Profile", icon: UserCircle },
                        { id: "connections", label: "My Connections", icon: Users },
                        { id: "pending", label: "Pending Requests", icon: UserPlus },
                        { id: "sent", label: "Sent Requests", icon: Send },
                        { id: "discover", label: "Discover", icon: Search },
                        { id: "suggestions", label: "People You May Know", icon: Sparkles },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
                                ${activeSection === item.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main content */}
            <ScrollArea className="flex-1">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    {/* Mobile tab selector */}
                    <div className="md:hidden mb-4">
                        <Tabs value={activeSection} onValueChange={setActiveSection}>
                            <TabsList className="w-full grid grid-cols-3 h-auto">
                                <TabsTrigger value="profile" className="text-xs py-1.5">Profile</TabsTrigger>
                                <TabsTrigger value="connections" className="text-xs py-1.5">Network</TabsTrigger>
                                <TabsTrigger value="discover" className="text-xs py-1.5">Discover</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {activeSection === "profile" && <ProfileView />}
                    {activeSection === "connections" && <MyConnections />}
                    {activeSection === "pending" && <PendingRequests />}
                    {activeSection === "sent" && <SentRequests />}
                    {activeSection === "discover" && <DiscoverDevelopers />}
                    {activeSection === "suggestions" && <Suggestions />}
                </div>
            </ScrollArea>
        </div>
    );
}
