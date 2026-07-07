"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, motion, useReducedMotion } from "motion/react";
import { BookOpen, Send, Sparkles } from "lucide-react";
import { p } from "motion/react-client";
import { cn } from "@/lib/utils";

type Msg = {
  role: "user" | "bot" | "human" | "system";
  text: string;
  name?: string;
  chip?: string;
};

const SCRIPT: Msg[] = [
  { role: "user", text: "Do you have a free plan?" },
  {
    role: "bot",
    text: "Yes - Free includes 100 AI replies a month and the full embeddable widget",
    chip: "Pricing & plans",
  },
  { role: "user", text: "Can a human jump in if the AI gets stuck?" },
  {
    role: "bot",
    text: "Always. I'll bring a teammate in right now - they'll see the whole thread.",
  },
  {
    role: "system",
    text: "Sarah from MyChat joined",
  },
  {
    role: "human",
    name: "Sarah",
    text: "Hey! 👋 Happy to get you set up — what are you building?",
  },
];
const sleep = (ms: number, signal: { cancelled: boolean }) =>
  new Promise<void>((resolve) => {
    if (signal.cancelled) return resolve();
    const t = window.setTimeout(resolve, ms);
  });

export function ChatDemo() {
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<Msg[]>(reduce ? SCRIPT : []);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const signal = { cancelled: false };

    async function run() {
      // small loop so the demo replays for visitors who linger
      while (true) {
        setMessages([]);
        setTyping(false);
        await sleep(700, signal);
        for (const m of SCRIPT) {
          if (signal.cancelled) return;
          const needsThinking = m.role === "bot" || m.role === "human";
          if (needsThinking) {
            setTyping(true);
            await sleep(m.role === "human" ? 1500 : 1200, signal);
            if (signal.cancelled) return;
            setTyping(false);
          } else {
            await sleep(m.role === "system" ? 500 : 800, signal);
          }
          setMessages((prev) => [...prev, m]);
          await sleep(650, signal);
        }
        await sleep(3200, signal);
      }
    }
    run();

    return () => {
      signal.cancelled = true;
    };
  }, [reduce]);
  return (
    <div className="flex h-[420px] w-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white text-left shadow-[0_30px_80px_-30px_rgba(10,9,24,0.55)]">
      {/* Widget Header */}
      <div className="flex items-center gap-3 text-white bg-linear-to-br from-brand to-brand-2 px-4 py-3.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur">
          <Sparkles className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">MyChat Support</p>
          <p className="flex items-center gap-1.5 text-[11px] leading-tight text-white/85">
            <span className="inline-block size-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,0.25)]" />
            AI agent · replies instantly
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#fafafb] px-3.5 py-4">
        <AnimatePresence initial={false}>
          <p className="color-red-500">Hello moto</p>
          {messages.map((m, i) => (
            <Bubble key={`${i}-${m.role}`} msg={m} reduce={!!reduce} />
          ))}
          {typing && (
            <motion.div
              key="typing"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/5"
            >
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="size-1.5 rounded-full bg-brand/60"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: d * 0.15,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer (decorative) */}
      <div className="flex items-center gap-2 border-t border-black/5 bg-white px-3 py-2.5">
        <div className="flex h-9 flex-1 items-center rounded-full bg-black/4 px-3.5 text-[13px] text-zinc-400">
          Ask anything…
        </div>
        <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-brand to-brand-2 text-white">
          <Send className="size-4" />
        </span>
      </div>
    </div>
  );
}

function Bubble({ msg, reduce }: { msg: Msg; reduce: boolean }) {
  const anim = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 8, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
      };

  if (msg.role === "system") {
    return (
      <motion.div {...anim} className="flex justify-center py-1">
        <span className="rounded-full bg-zinc-200/70 px-3 py-1 text-[11px] font-medium text-zinc-500">
          {msg.text}
        </span>
      </motion.div>
    );
  }

  if (msg.role === "user") {
    return (
      <motion.div {...anim} className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-linear-to-br from-brand to-brand-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-sm">
          {msg.text}
        </div>
      </motion.div>
    );
  }

  //   Bot or Human
  return (
    <motion.div {...anim} className="flex items-end gap-2">
      <span
        className={`mb-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
          msg.role === "human"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-brand/10 text-brand"
        }`}
      >
        {msg.role === "human" ? "S" : <Sparkles className="size-3.5" />}
      </span>
      <div className="max-w-[82%]">
        {msg.name && (
          <p className="mb-1 pl-1 text-[11px] font-medium text-zinc-400">
            {msg.name}
          </p>
        )}
        <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-700 shadow-sm ring-1 ring-black/5">
          {msg.text}
        </div>
        {msg.chip && (
          <button className="mt-1.5 ml-1 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-2.5 py-1 text-[11px] font-medium text-brand">
            <BookOpen className="size-3" />
            {msg.chip}
          </button>
        )}
      </div>
    </motion.div>
  );
}
