"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionConfig, motion } from "motion/react";
import { ChatDemo } from "./chat-demo";

const AVATARS = [
  { i: "JD", c: "from-rose-400 to-orange-400" },
  { i: "MK", c: "from-sky-400 to-indigo-400" },
  { i: "AL", c: "from-emerald-400 to-teal-400" },
  { i: "RS", c: "from-violet-400 to-fuschia-400" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Hero() {
  return (
    <MotionConfig reducedMotion="user">
      <section className="relative overflow-hidden bg-ink text-white">
        {/* Aurora */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="animate-aurora absolute -top-40 left-[15%] size-136 rounded-full bg-brand/40 blur-[130px]" />

          <div
            className="animate-aurora size-112 bg-brand-2/30 rounded-full blur-[130px] absolute -bottom-32 left-[8%]"
            style={{ animationDelay: "-6s" }}
          />
          <div
            className="animate-aurora absolute -bottom-32 left-[8%] size-112 rounded-full bg-brand-3/25 blur-[130px]"
            style={{ animationDelay: "-12s" }}
          />
        </div>
        {/* Dotgrid + Grain texture */}
        <div
          aria-hidden
          className="bg-dotgrid pointer-events-none absolute inset-0 opacity-[0.18] mask-[radial-gradient(60%_50%_at_50%_30%,black,transparent)]"
        />
        <div
          aria-hidden
          className="grain pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-soft-light"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-background"
        />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-5 py-32 pb-28 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-40 lb:pg-36">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="text-center lg:text-left"
          >
            <motion.div
              variants={item}
              className="flex justify-center lg:justify-start"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
                <Sparkles className="size-3.5 text-brand-2" />
                AI-native customer support
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-6 text-[2.7rem] font-semibold leading-[1.04] tracking-tight text-balance sm:text-6xl lg:text-[4.15rem]"
            >
              Customer support that{" "}
              <span className="text-gradient font-display text-[1.08em] font-normal italic">
                answers for itself
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mx-auto mt-6 max-w-xl text lg leading-relaxed text-pretty text-white/65 lg:mx-0 sm:text-xl"
            >
              My chat deploys an AI agent trained on your knowledge base,
              captures leads, and routes the hard questions to a shared inbox -
              where your team takes over. One widget. Live in minutes.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="flex-1 group gap-2 h-12 w-full rounded-full bg-linear-to-br from-brand to-brand-2 px-7 text-base text-white shadow-[0_10px_40px_-10px_var(--brand)] hover:opacity-95 sm:w-auto"
              >
                <Link href="/sign-up">
                  Start Free
                  <ArrowRight className="size-4 inline-flex transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 flex-1 rounded-full w-full border-white/20 bg-white/5 px-7 text-base text-white backdrop-blur hover:bg-white/20 hover:text-white sm:w-auto"
              >
                <Link href="#how">See how it works</Link>
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={item}
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-4 lg:justify-start"
            >
              <div className="flex -space-x-2.5">
                {AVATARS.map((a) => (
                  <span
                    key={a.i}
                    className={`flex size-8 items-center justify-center rounded-full bg-linear-to-br ${a.c} text-[10px] font-semibold text-white ring-2 rink-ink`}
                  >
                    {a.i}
                  </span>
                ))}
              </div>
              <div className="text-sm text-white/55">
                <span className="font-semibold text-white">2,000</span> support
                teams resolve faster with MyChat
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Floating widget + proof cards */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md"
          >
            <div className="absolute -inset-10 rounded-full bg-brand/25 blur-[90px]" />

            {/* Floating proof cards */}
            <motion.div className="absolute animate-float -left-6 top-10 z-20 hidden sm:block">
              <div
                aria-hidden
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <UserPlus className="size-4" />
                </span>
                <div className="text-left">
                  <p className="text-[11px] font-medium text-zinc-500">
                    New lead captured
                  </p>
                  <p className="text-xs font-semibold text-zinc-800">
                    alex@northwind.com
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="animate-float absolute -right-5 bottom-12 z-20 hidden sm:block"
              style={{ animationDelay: "-4.5s" }}
            >
              <div className="rounded-xl border border-white/10 bg-white/95 px-4 py-3 text-left backdrop-blur">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <p className="text-[11px] font-medium text-zinc-500">
                    Resolved by AI
                  </p>
                </div>
                <p className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900">
                  73%
                  <span className="ml-1.5 text-[11px] font-medium text-emerald-600">
                    +12%
                  </span>
                </p>
              </div>
            </motion.div>

            <div className="relative z-10">
              <ChatDemo />
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
