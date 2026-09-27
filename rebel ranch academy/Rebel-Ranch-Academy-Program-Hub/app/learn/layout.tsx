import type { Metadata } from "next";
import LearnShell from "./shell";

// Learner area v1 (structure: RRA UI Direction 1 concept, approved 2026-09-27).
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
export const metadata: Metadata = {
  title: "Library | Rebel Ranch Academy",
  description: "Everything you can learn at Rebel Ranch Academy, starting with free activities.",
  alternates: { canonical: "/learn/library" },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <LearnShell>{children}</LearnShell>;
}
