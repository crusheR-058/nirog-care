import {
  LayoutGrid,
  Users,
  ShieldCheck,
  Settings,
  TriangleAlert,
  Video,
  Sparkles,
} from "lucide-react";

/** A crisp mini-dashboard mockup — the hero's product visual, on-brand. */
export function ProductWindow() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-panel shadow-float ring-1 ring-black/[0.03]">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-hairline bg-panel-2 px-4 py-3">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red/70" />
          <span className="size-2.5 rounded-full bg-amber/70" />
          <span className="size-2.5 rounded-full bg-green/70" />
        </span>
        <span className="mx-auto flex items-center gap-1.5 rounded-full bg-panel px-3 py-1 text-[11px] font-medium text-ink-faint shadow-quiet">
          <ShieldCheck className="size-3 text-green" /> drconnect-nirog.vercel.app
        </span>
      </div>

      <div className="flex">
        {/* rail */}
        <div className="flex flex-col items-center gap-3 bg-ink px-3 py-4">
          <span className="grid size-8 place-items-center rounded-xl bg-blue text-white">
            <LayoutGrid className="size-4" />
          </span>
          {[Users, ShieldCheck, Settings].map((Icon, i) => (
            <span key={i} className="grid size-8 place-items-center rounded-xl text-white/40">
              <Icon className="size-4" />
            </span>
          ))}
        </div>

        {/* content */}
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm font-extrabold text-ink">
                Good morning, Dr. Rao
              </p>
              <p className="text-[10px] text-ink-soft">2 waiting · 1 urgent</p>
            </div>
            <span className="grid size-7 place-items-center rounded-full bg-soft-blue text-[10px] font-bold text-blue">
              DA
            </span>
          </div>

          {/* stat tiles */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { l: "Waiting", v: "2", t: "text-blue bg-soft-blue" },
              { l: "Urgent", v: "1", t: "text-red bg-soft-red" },
              { l: "Avg wait", v: "6m", t: "text-amber bg-soft-amber" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-hairline bg-panel p-2 shadow-quiet">
                <span className={`inline-grid size-5 place-items-center rounded-md ${s.t}`}>
                  <span className="size-1.5 rounded-full bg-current" />
                </span>
                <p className="tnum mt-1 text-lg font-bold leading-none text-ink">{s.v}</p>
                <p className="text-[9px] text-ink-faint">{s.l}</p>
              </div>
            ))}
          </div>

          {/* queue card */}
          <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-red/20 bg-panel p-2.5 shadow-quiet ring-1 ring-red/10">
            <span className="h-8 w-1 rounded-full bg-red" />
            <span className="grid size-8 place-items-center rounded-full bg-soft-red text-[10px] font-bold text-red">RY</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">Rahul Yadav</p>
              <p className="truncate text-[10px] text-ink-soft">Breathlessness · chest pressure</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-soft-red px-1.5 py-0.5 text-[9px] font-semibold text-red">
              <TriangleAlert className="size-2.5" /> Now
            </span>
          </div>

          {/* aria mini */}
          <div className="mt-2 rounded-xl bg-soft-purple p-2.5">
            <p className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-aria">
              <Sparkles className="size-2.5" /> ARIA handover
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="rounded-md bg-panel/70 px-1.5 py-0.5 text-[9px] font-medium text-aria">SpO₂ 93%</span>
              <span className="rounded-md bg-panel/70 px-1.5 py-0.5 text-[9px] font-medium text-aria">Pulse 104</span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-blue px-1.5 py-0.5 text-[9px] font-semibold text-white">
                <Video className="size-2.5" /> Start
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
