"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, PlusCircle, Clock, BarChart3, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "ホーム", icon: CalendarDays },
  { href: "/timeline", label: "時系列", icon: Clock },
  { href: "/new", label: "記録", icon: PlusCircle },
  { href: "/analysis", label: "分析", icon: BarChart3 },
  { href: "/settings", label: "設定", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 text-xs ${
                isActive ? "text-green-600 font-medium" : "text-gray-500"
              }`}
            >
              <Icon className={`w-6 h-6 ${item.href === "/new" ? "w-7 h-7" : ""}`} />
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
