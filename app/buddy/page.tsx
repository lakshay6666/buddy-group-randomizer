"use client";

import { FormEvent, useCallback, useState } from "react";
import { LockKeyhole, RefreshCw, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Roster = { groupNo: number; groupName: string; students: { name: string }[] };
const COLORS = ["#EF6A5B", "#F4A340", "#E0C03A", "#47A977", "#3D9BC7", "#6D71D9", "#A45BB8"];

export default function BuddyPage() {
  const [groupNo, setGroupNo] = useState("1");
  const [code, setCode] = useState("");
  const [roster, setRoster] = useState<Roster | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadRoster = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/group", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupNo: Number(groupNo), code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not open this group.");
      setRoster(data);
    } catch (cause) {
      setRoster(null);
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally { setBusy(false); }
  }, [code, groupNo]);

  function submit(event: FormEvent) { event.preventDefault(); void loadRoster(); }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-white"><UsersRound size={20} /></span>Buddy groups</a>
          <a href="/" className="text-sm font-medium text-ink/60 hover:text-ink">Student check-in</a>
        </header>

        <section className="mt-10 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white shadow-[0_22px_70px_rgba(34,47,62,0.1)]">
          <div className="border-b border-ink/8 bg-canvas/45 p-6 sm:p-8">
            <div className="flex items-center gap-3 text-coral"><LockKeyhole size={20} /><p className="text-sm font-semibold uppercase tracking-[0.13em]">Buddy access</p></div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-ink">See your group</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-ink/55">Choose your group and enter the private code given to you by the organizer.</p>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={submit} className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2"><Label>Group</Label><Select value={groupNo} onValueChange={(value) => { setGroupNo(value); setRoster(null); }}><SelectTrigger className="h-12 w-full rounded-xl border-ink/15 bg-canvas/45 px-4 text-base"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 7 }, (_, index) => <SelectItem key={index + 1} value={String(index + 1)}>Group {index + 1}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="buddy-code">Access code</Label><Input id="buddy-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Enter your code" autoComplete="off" maxLength={12} required className="h-12 rounded-xl border-ink/15 bg-canvas/45 px-4 text-base uppercase tracking-wider" /></div>
              <Button disabled={busy || !code.trim()} className="h-12 rounded-xl bg-ink px-6 text-white hover:bg-ink/90">{busy ? "Opening…" : "Open group"}</Button>
            </form>
            {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            {roster && (
              <div className="mt-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl text-xl font-bold text-white" style={{ backgroundColor: COLORS[roster.groupNo - 1] }}>{roster.groupNo}</span><div><h2 className="text-2xl font-semibold tracking-tight">{roster.groupName}</h2><p className="text-sm text-ink/50">{roster.students.length} {roster.students.length === 1 ? "student" : "students"}</p></div></div>
                  <Button variant="outline" size="icon" className="rounded-xl" onClick={loadRoster} aria-label="Refresh group list"><RefreshCw /></Button>
                </div>
                {roster.students.length ? <ol className="mt-6 grid gap-3 sm:grid-cols-2">{roster.students.map((student, index) => <li key={`${student.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-canvas/40 p-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink/55 shadow-sm"><UserRound size={17} /></span><span className="font-medium">{student.name}</span></li>)}</ol> : <div className="mt-6 rounded-2xl border border-dashed border-ink/15 p-8 text-center text-ink/50">No students have joined this group yet.</div>}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
