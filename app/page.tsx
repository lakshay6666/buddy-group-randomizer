"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Dices, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Assignment = { name: string; groupNo: number; groupName: string };

const GROUP_STYLES = ["#EF6A5B", "#F4A340", "#E0C03A"];

export default function Home() {
  const [name, setName] = useState("");
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("buddy-participant-token");
    if (!token) return;
    fetch(`/api/assign?token=${encodeURIComponent(token)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data?.assignment && setAssignment(data.assignment))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const context = (document as Document & {
      modelContext?: { registerTool: (tool: object, options?: { signal?: AbortSignal }) => void | Promise<void> };
    }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "assign_buddy_group",
      title: "Assign buddy group",
      description: "Assign a student by name to a random, evenly balanced buddy group.",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string", minLength: 2, maxLength: 80 } },
        required: ["name"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        const value = input as { name?: unknown };
        if (typeof value.name !== "string" || value.name.trim().length < 2) throw new Error("A student name is required.");
        let token = localStorage.getItem("buddy-participant-token");
        if (!token) { token = crypto.randomUUID(); localStorage.setItem("buddy-participant-token", token); }
        const response = await fetch("/api/assign", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: value.name, token }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Assignment failed.");
        setAssignment(data.assignment);
        return data.assignment;
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    let token = localStorage.getItem("buddy-participant-token");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("buddy-participant-token", token);
    }
    try {
      const response = await fetch("/api/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not assign a group.");
      setAssignment(data.assignment);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-white shadow-sm"><UsersRound size={20} aria-hidden="true" /></span>
            Buddy groups
          </a>
          <nav className="flex items-center gap-4 text-sm font-medium text-ink/60">
            <a className="transition hover:text-ink" href="/buddy">Buddy view</a>
            <a className="hidden transition hover:text-ink sm:block" href="/organizer">Organizer view</a>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_0.86fr] lg:py-16">
          <div className="max-w-xl">
            <div className="mb-7 flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-sm font-medium text-ink/70 shadow-sm">
              <Dices size={15} aria-hidden="true" /> Fair, balanced, and random
            </div>
            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl">Meet your buddy group.</h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-ink/62">Enter your name once. We’ll place you in one of three evenly sized groups for today’s university welcome.</p>
            <div aria-hidden="true" className="mt-10 flex items-center gap-2">
              {GROUP_STYLES.map((color, index) => (
                <span key={color} className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white shadow-sm ring-4 ring-canvas" style={{ backgroundColor: color, marginLeft: index ? "-8px" : 0 }}>{index + 1}</span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 -z-10 rotate-2 rounded-[2rem] bg-sun/40" />
            <div className="rounded-[1.75rem] border border-ink/10 bg-white p-6 shadow-[0_24px_80px_rgba(34,47,62,0.12)] sm:p-8">
              {assignment ? <AssignmentCard assignment={assignment} /> : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div><p className="text-sm font-semibold uppercase tracking-[0.13em] text-coral">Check in</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Find your group</h2></div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Morgan" autoComplete="name" maxLength={80} required className="h-12 rounded-xl border-ink/15 bg-canvas/45 px-4 text-base" />
                  </div>
                  {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                  <Button disabled={busy || !name.trim()} className="h-13 w-full rounded-xl bg-ink text-base font-semibold text-white shadow-sm hover:bg-ink/90">{busy ? "Finding your group…" : "Assign my group"}</Button>
                  <p className="text-center text-xs leading-5 text-ink/42">One assignment per phone. Refreshing will not change it.</p>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const color = GROUP_STYLES[(assignment.groupNo - 1) % GROUP_STYLES.length];
  return (
    <div className="text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-50 text-green-700"><Check size={28} strokeWidth={2.5} aria-hidden="true" /></div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.13em] text-ink/45">You’re checked in, {assignment.name}</p>
      <div className="mx-auto my-7 grid h-36 w-36 place-items-center rounded-[2rem] text-white shadow-lg" style={{ backgroundColor: color }}><span className="text-7xl font-bold tracking-tight">{assignment.groupNo}</span></div>
      <h2 className="text-3xl font-semibold tracking-tight text-ink">{assignment.groupName}</h2>
      <p className="mt-3 text-base leading-6 text-ink/55">Show this screen to a buddy, then head to your group meeting point.</p>
    </div>
  );
}
