"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "home_max" },
    { name: "Training", href: "/challenges", icon: "fitness_center", mobileName: "Workout" },
    { name: "Community", href: "/feed", icon: "groups", mobileName: "Feed" },
    { name: "Leaderboard", href: "/leaderboard", icon: "military_tech", mobileName: "Ranks" },
    { name: "Profile", href: "/profile", icon: "person", mobileOnly: true },
  ];

  return (
    <>
      {/* TopAppBar (Web) */}
      <header className="hidden md:flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto bg-zinc-950/80 dark:bg-black/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(255,90,31,0.15)] sticky top-0 z-50">
        <Link href="/dashboard" className="text-2xl font-black italic text-orange-600 dark:text-orange-500 tracking-widest font-h1 uppercase">
          PEAKPACK
        </Link>
        <nav className="flex gap-6 font-inter font-black uppercase tracking-tighter text-label-bold">
          {navItems.filter(item => !item.mobileOnly).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`transition-all active:scale-95 duration-200 pb-1 ${
                  isActive
                    ? "text-orange-600 dark:text-orange-500 border-b-2 border-orange-600 dark:border-orange-500"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4 text-orange-600 dark:text-orange-500">
          <button className="active:scale-95 duration-200 hover:bg-white/5 transition-all p-2 rounded-full">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="active:scale-95 duration-200 hover:bg-white/5 transition-all p-2 rounded-full">
            <span className="material-symbols-outlined">local_fire_department</span>
          </button>
          <Link href="/profile">
            <img
              alt="User profile"
              className="w-10 h-10 rounded-full border border-white/10 object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC54hBjZ5O51zqjO1SkluIrxv3rkoVelN2ahHR8KS2Q4nK_IDj83O7kbHG_gdi_i-_0tR9mcZPSXKjVkVDydYUXJWk7WQTUJnaxuCWi_7oupDUWfk3WFpi_cy74B-kLWGH8twaCTdFTrafacLNs-aiftWgcOE1dHiPDF-DSaSsD0ZvuqY_Gtb6TUQmbR_JyyOmatEcIb6us53iIR6XZjOUxsiZOryb5Y99wnorjp_a9ZZ5JqO9u6EsaKYqqq8NGKw0QuUS1HRuKfqI"
            />
          </Link>
        </div>
      </header>

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-8 bg-zinc-950/90 dark:bg-zinc-950/90 backdrop-blur-lg shadow-[0_-10px_40px_rgba(0,0,0,0.8)] rounded-t-2xl border-t border-white/10">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center tap-highlight-transparent transition-colors ${
                isActive
                  ? "text-orange-600 dark:text-orange-500 scale-110 animate-pulse-subtle"
                  : "text-zinc-600 dark:text-zinc-500 active:bg-orange-500/10"
              }`}
            >
              <span 
                className="material-symbols-outlined mb-1 text-2xl" 
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-inter text-[10px] font-bold uppercase tracking-wider">
                {item.mobileName || item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
