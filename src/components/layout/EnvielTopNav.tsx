"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Home, Layers, Video, Zap } from "lucide-react";
import { EnvielSearch } from "../ui/EnvielSearch";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Ongoing", href: "/#ongoing", icon: Zap },
  { name: "Complete", href: "/#complete", icon: Layers },
];

export function EnvielTopNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 enviel-glass border-b border-white/5"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
           <Video className="w-8 h-8 text-enviel-500" />
           <span className="text-xl font-bold tracking-tight text-white">
             Enviel<span className="text-enviel-500">Stream</span>
           </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-enviel-300",
                  isActive ? "text-enviel-500" : "text-white/70"
                )}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Search & Profile */}
        <div className="flex items-center gap-4">
          <EnvielSearch />
        </div>
      </div>
    </motion.nav>
  );
}
