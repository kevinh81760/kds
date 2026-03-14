export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <p className="inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-200">
            Option A Bootstrap
          </p>
          <h1 className="text-3xl font-bold tracking-tight">BurgerBot KDS</h1>
          <p className="max-w-3xl text-slate-300">
            This app is the KDS UI/control plane. OrangePi remains the real-time edge orchestrator,
            and the connector contract stays stable.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-cyan-200">Stack</h2>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>Next.js + React + Tailwind</li>
              <li>Tauri desktop shell</li>
              <li>Supabase (Postgres/Auth/Realtime)</li>
            </ul>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-cyan-200">Keep Stable</h2>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>GetOrder(tray_number)</li>
              <li>CompleteOrder(order_id, client_id)</li>
              <li>MarkFailedOrder(...)</li>
            </ul>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-cyan-200">Communication</h2>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>OrangePi ↔ local connector (gRPC)</li>
              <li>Connector ↔ KDS integration (events)</li>
              <li>KDS app ↔ Supabase (DB/Auth)</li>
            </ul>
          </article>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Next Steps</h2>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-300">
            <li>Copy <code>.env.example</code> to <code>.env.local</code> and fill Supabase values.</li>
            <li>Model order and order command tables in Supabase.</li>
            <li>Build operator views: queue, tray lookup, start/complete/fail actions.</li>
            <li>Add a worker service that translates between Supabase state and connector events.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
