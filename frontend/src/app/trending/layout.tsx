"use client";

import AppHeader from "@/components/AppHeader";
import SideNav from "@/components/SideNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-on-surface min-h-screen">
      <AppHeader />
      <SideNav />
      {children}
    </div>
  );
}
