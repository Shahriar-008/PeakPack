'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Users, CalendarCheck, Zap, Flame, Trophy, ChevronRight } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useUserStore();
  
  const { scrollYProgress } = useScroll();
  const opacityBg = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      if (!user.onboardingDone) {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || (isAuthenticated && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0A0A0A] text-on-surface">
      {/* Dynamic Backgrounds */}
      <motion.div 
        style={{ opacity: opacityBg }}
        className="pointer-events-none fixed inset-0 z-0"
      >
        <Image 
          src="/bg_energy.png" 
          alt="Energy Background" 
          fill 
          className="object-cover opacity-20 mix-blend-screen"
          priority
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-container/10 via-[#0A0A0A] to-[#0A0A0A]" />
      </motion.div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between p-6 sm:px-8">
          <div className="text-2xl font-black italic tracking-widest text-primary-container font-h1 uppercase">
            PEAKPACK
          </div>
          <Link
            href="/sign-in"
            className="rounded-full border border-white/10 bg-surface/40 px-6 py-2.5 text-sm font-label-bold backdrop-blur-md transition-all hover:bg-white/10 text-on-surface"
          >
            Sign In
          </Link>
        </nav>

        {/* Hero Section */}
        <section className="mx-auto flex min-h-[90vh] w-full max-w-7xl flex-col items-center justify-center px-6 pt-10 sm:px-8 lg:flex-row lg:justify-between lg:pt-0">
          <motion.div 
            className="max-w-2xl text-center lg:text-left"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-container/30 bg-primary-container/10 px-4 py-1.5 text-xs font-label-bold uppercase tracking-widest text-primary-container shadow-[0_0_15px_rgba(255,90,31,0.3)]">
              <Flame className="h-4 w-4 text-primary-container" />
              <span>Built for long-term consistency</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-balance text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl font-h1">
              Your motives become <span className="text-primary-container drop-shadow-[0_4px_20px_rgba(255,90,31,0.3)]">habits</span> when your pack shows up.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="mt-6 max-w-xl text-lg leading-relaxed text-on-surface-variant sm:text-xl lg:mx-0 mx-auto font-body-lg">
              PeakPack is built for people who want energy and consistency, not short bursts of motivation. Set shared goals, check in daily, and transform effort into visible progress.
            </motion.p>
            
            <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start justify-center">
              <Link
                href="/sign-in"
                className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-primary-container px-8 py-4 text-base font-label-bold text-black uppercase tracking-wider transition-all hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.4)] active:scale-95 shadow-[0_0_30px_rgba(255,90,31,0.3)]"
              >
                <span className="relative z-10">Start free and build my pack</span>
                <ChevronRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              </Link>
            </motion.div>
            
            <motion.p variants={itemVariants} className="mt-4 text-[12px] font-label-bold uppercase tracking-wider text-on-surface-variant/80">
              No credit card • Setup in 60 seconds
            </motion.p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
            className="relative mt-16 hidden w-full max-w-[500px] lg:block"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <Image 
                src="/hero.png" 
                alt="Pack working out together" 
                fill 
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80" />
            </div>

            {/* Floating Glassmorphic Elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -left-12 bottom-24 flex items-center gap-4 rounded-xl border border-white/10 bg-surface/40 p-4 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container/20 text-secondary">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="font-label-bold text-white">Workout Complete!</p>
                <p className="text-[12px] font-label-bold text-secondary">+50 XP Earned</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute -right-8 top-32 flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-surface/40 px-6 py-4 backdrop-blur-xl shadow-[0_0_30px_rgba(255,90,31,0.15)]"
            >
              <Flame className="h-8 w-8 text-primary-container animate-pulse" />
              <p className="font-h1 text-4xl text-white">7</p>
              <p className="text-[10px] font-label-bold uppercase tracking-widest text-on-surface-variant">Day Streak</p>
            </motion.div>
          </motion.div>
        </section>

        {/* Core Pillars Section */}
        <section className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="font-h2 text-3xl sm:text-5xl">The system for <span className="text-secondary">growth</span></h2>
            <p className="mt-4 text-on-surface-variant font-body-md sm:text-lg">Willpower is finite. Systems are forever.</p>
          </div>

          <div className="grid gap-md md:grid-cols-3">
            {[
              {
                icon: CalendarCheck,
                title: "Daily Rhythm",
                desc: "Build daily discipline with frictionless check-ins. Keep the momentum going.",
                color: "text-primary-container",
                bg: "bg-primary-container/10",
                glow: "group-hover:shadow-[0_0_30px_rgba(255,90,31,0.15)]"
              },
              {
                icon: Users,
                title: "Pack Accountability",
                desc: "Your squad expects you to show up. Use friendly pressure to stay on track.",
                color: "text-tertiary",
                bg: "bg-tertiary/10",
                glow: "group-hover:shadow-[0_0_30px_rgba(74,225,118,0.15)]"
              },
              {
                icon: Trophy,
                title: "Progress Signal",
                desc: "Earn XP, unlock badges, and level up. Transform invisible effort into visible results.",
                color: "text-secondary",
                bg: "bg-secondary-container/20",
                glow: "group-hover:shadow-[0_0_30px_rgba(173,198,255,0.15)]"
              }
            ].map((pillar, i) => (
              <motion.div 
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#1A1A1A] to-[#121212] p-8 transition-shadow ${pillar.glow}`}
              >
                <div className={`mb-6 inline-flex rounded-full p-4 ${pillar.bg}`}>
                  <pillar.icon className={`h-8 w-8 ${pillar.color}`} />
                </div>
                <h3 className="mb-3 font-h3 text-xl">{pillar.title}</h3>
                <p className="font-body-md text-on-surface-variant">{pillar.desc}</p>
                
                {/* Hover gradient effect */}
                <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* The Vibe & Goal Section */}
        <section className="relative my-24 overflow-hidden border-y border-white/5 bg-surface-container-lowest/50 py-32">
          <div className="absolute inset-0 bg-[url('/bg_energy.png')] bg-cover bg-center opacity-5 mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-[#0A0A0A]" />
          
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <motion.p 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-balance font-h1 text-4xl leading-tight sm:text-5xl lg:text-6xl"
            >
              Feel <span className="text-primary-container">stronger</span> in your body and <span className="text-secondary">calmer</span> in your mind.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-8 font-body-lg text-on-surface-variant"
            >
              PeakPack isn't just about fitness. It's about taking back control of your routine alongside people who want to see you win.
            </motion.p>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="mx-auto mb-24 max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border border-primary-container/20 bg-primary-container/5 p-12 sm:p-20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary-container/10 to-transparent opacity-50" />
            <h2 className="relative z-10 font-h2 text-4xl sm:text-5xl">Ready to assemble your Pack?</h2>
            <p className="relative z-10 mt-6 font-body-md text-on-surface-variant">It takes less than a minute to join.</p>
            
            <div className="relative z-10 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/sign-in"
                className="rounded-lg bg-primary-container px-8 py-4 font-label-bold uppercase tracking-wider text-black shadow-[0_0_30px_rgba(255,90,31,0.3)] transition-all hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.4)] active:scale-95"
              >
                Join PeakPack
              </Link>
            </div>
          </motion.div>
        </section>
        
        <footer className="border-t border-white/10 py-10 text-center font-body-md text-[12px] text-on-surface-variant">
          <p>© {new Date().getFullYear()} PeakPack. Ignite your inner fire.</p>
        </footer>
      </div>
    </main>
  );
}
