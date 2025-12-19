"use client";

import { FloatingDock } from "../aceternity/floating-dock";
import {
  Home,
  Search,
  History,
  Download,
  User,
} from "lucide-react";

export function EnvielFloatingDock() {
  const links = [
    {
      title: "Home",
      icon: (
        <Home className="h-full w-full text-neutral-300 dark:text-neutral-300" />
      ),
      href: "/",
    },
    {
      title: "Search",
      icon: (
        <Search className="h-full w-full text-neutral-300 dark:text-neutral-300" />
      ),
      href: "/search",
    },
    {
      title: "History",
      icon: (
        <History className="h-full w-full text-neutral-300 dark:text-neutral-300" />
      ),
      href: "/history",
    },
    {
      title: "Downloads",
      icon: (
        <Download className="h-full w-full text-neutral-300 dark:text-neutral-300" />
      ),
      href: "/downloads",
    },
    {
      title: "Profile",
      icon: (
        <User className="h-full w-full text-neutral-300 dark:text-neutral-300" />
      ),
      href: "/profile",
    },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex items-center justify-center md:hidden pointer-events-none">
       {/* Pointer events auto for children */}
       <div className="pointer-events-auto">
         <FloatingDock items={links} />
       </div>
    </div>
  );
}
