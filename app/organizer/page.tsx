"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Clipboard, Download, RefreshCw, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type Group = { groupNo: number; groupName: string; count: number };
const COLORS = ["#EF6A5B", "#F4A340", "#E0C03A"];

export default function OrganizerPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [qrUrl, setQrUrl] = useState("");
  const [studentUrl, setStudentUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/stats", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setGroups(data.groups); setTotal(data.total); setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the live totals.");
    }
  }, []);

  useEffect(() => {
    const url = `${location.origin}/`;
    setStudentUrl(url);
    QRCode.toDataURL(url, { width: 720, margin: 2, color: { dark: "#22303D", light: "#FFFFFF" }, errorCorrectionLevel: "H" }).then(setQrUrl).catch(() => setError("Could not create the QR code."));
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function copyLink() {
    await navigator.clipboard.writeText(studentUrl); setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const displayGroups = groups.length ? groups : Array.from({ length: 3 }, (_, index) => ({ groupNo: index + 1, groupName: `Group ${index + 1}`, count: 0 }));

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-white"><UsersRound size={20} /></span>Buddy groups</a>
          <a href="/" className="text-sm font-medium text-ink/60 hover:text-ink">Open student check-in</a>
        </header>

        <div className="mt-10 grid gap-7 lg:grid-cols-[0.72fr_1.28fr]">
          <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_rgba(34,47,62,0.09)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.13em] text-coral">Student QR</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Scan to join a group</h1>
            <div className="mt-6 aspect-square overflow-hidden rounded-2xl border border-ink/10 bg-white p-3">
              {qrUrl ? <img src={qrUrl} alt="QR code for the student group check-in" className="h-full w-full" /> : <div className="h-full animate-pulse rounded-xl bg-canvas" />}
            </div>
            <p className="mt-4 break-all text-sm leading-5 text-ink/50">{studentUrl}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-11 rounded-xl" onClick={copyLink}>{copied ? <Check /> : <Clipboard />}{copied ? "Copied" : "Copy link"}</Button>
              <Button asChild className="h-11 rounded-xl bg-ink text-white hover:bg-ink/90"><a href={qrUrl} download="buddy-groups-qr.png"><Download />Download QR</a></Button>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_rgba(34,47,62,0.09)] sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-sm font-semibold uppercase tracking-[0.13em] text-coral">Live overview</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{total} students assigned</h2></div>
              <Button variant="outline" size="icon" className="rounded-xl" onClick={refresh} aria-label="Refresh totals"><RefreshCw /></Button>
            </div>
            {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {displayGroups.map((group) => (
                <div key={group.groupNo} className="flex items-center gap-4 rounded-2xl border border-ink/8 bg-canvas/40 p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white" style={{ backgroundColor: COLORS[group.groupNo - 1] }}>{group.groupNo}</span>
                  <div><p className="font-semibold">{group.groupName}</p><p className="text-sm text-ink/50">{group.count} {group.count === 1 ? "student" : "students"}</p></div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-6 text-ink/50">Totals update automatically every five seconds. Each student is randomly placed among the currently smallest groups.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
