const settingsSections = [
  { id: "security", num: "01", label: "Forensic Security" },
  { id: "api",      num: "02", label: "Source Integration" },
  { id: "alerts",   num: "03", label: "Danger Protocols" },
  { id: "display",  num: "04", label: "Terminal Display" },
];

export default function SettingsPage() {
  return (
    <main className="ml-64 min-h-screen p-12 max-w-7xl mx-auto bg-background">
      {/* Header */}
      <header className="mb-20">
        <div className="flex items-end justify-between border-b-2 border-on-background pb-6">
          <div>
            <span className="block text-[10px] font-bold tracking-[0.3em] uppercase mb-4 text-primary">
              System Configuration
            </span>
            <h2 className="text-6xl font-display text-on-background leading-none">
              Analyst Settings
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase">Auth-ID: 882-XQ-9</p>
            <p className="text-[10px] font-medium text-on-surface-variant uppercase">
              Last audit: 2023-10-24 14:02 UTC
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-12">
        {/* Nav Anchors */}
        <div className="col-span-3">
          <ul className="space-y-6 sticky top-12">
            {settingsSections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`block text-xs font-black tracking-widest uppercase border-l-4 pl-4 py-1 transition-all ${
                    i === 0
                      ? "border-primary"
                      : "border-transparent hover:border-outline-variant"
                  }`}
                >
                  {s.num}. {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Settings Content */}
        <div className="col-span-9 space-y-32">

          {/* 01 Security */}
          <section id="security">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-4xl font-display italic text-outline-variant">01.</span>
              <h3 className="text-2xl font-bold uppercase tracking-tighter">
                Forensic Account Security
              </h3>
            </div>
            <div className="space-y-12">
              <div className="bg-surface-container-low p-8 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2">
                      Multi-Factor Authentication
                    </label>
                    <p className="text-sm text-on-surface-variant mb-6">
                      Hardware key or biometric verification required for data export.
                    </p>
                    <button className="px-8 py-3 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
                      Configure YubiKey
                    </button>
                  </div>
                  <div className="flex flex-col justify-center items-end">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest mb-2">
                      Active
                    </span>
                    <p className="text-xs font-mono">Status: High-Integrity</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-12">
                {[
                  {
                    label: "Session Timeout Protocol",
                    type: "select",
                    opts: ["15 Minutes (Operational Standard)", "30 Minutes", "60 Minutes"],
                    hint: "Automatic termination upon inactivity.",
                  },
                  {
                    label: "IP Access Whitelist",
                    type: "text",
                    placeholder: "192.168.1.1, 10.0.0.*",
                    hint: "Restricts portal access to verified nodes.",
                  },
                ].map((field) => (
                  <div key={field.label} className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1">
                      {field.label}
                    </label>
                    {field.type === "select" ? (
                      <select className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-primary px-0 py-2 text-sm outline-none">
                        {field.opts?.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-primary px-0 py-2 text-sm font-mono outline-none"
                      />
                    )}
                    <p className="text-[10px] text-on-surface-variant italic">{field.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 02 API */}
          <section id="api">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-4xl font-display italic text-outline-variant">02.</span>
              <h3 className="text-2xl font-bold uppercase tracking-tighter">
                API Data Source Management
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {/* World Bank */}
              <div className="bg-surface-container-lowest border-l-4 border-tertiary-fixed p-8 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary-fixed">
                      account_balance
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold uppercase tracking-tight text-sm">
                      World Bank Open Data
                    </h4>
                    <p className="text-xs text-on-surface-variant">
                      Global Economic Indicators Pipeline
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-on-surface-variant">XXXX-XXXX-8271</span>
                  <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                    Revoke
                  </button>
                  <button className="px-4 py-2 border border-outline-variant text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors">
                    Update
                  </button>
                </div>
              </div>

              {/* NewsAPI */}
              <div className="bg-surface-container-lowest border-l-4 border-primary p-8 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">newspaper</span>
                  </div>
                  <div>
                    <h4 className="font-bold uppercase tracking-tight text-sm">
                      NewsAPI Forensic Feed
                    </h4>
                    <p className="text-xs text-on-surface-variant">
                      Real-time Global Sentiment Analysis
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-on-surface-variant">NOT_CONFIGURED</span>
                  <button className="px-4 py-2 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
                    Connect
                  </button>
                </div>
              </div>

              {/* Custom */}
              <div className="border-2 border-dashed border-outline-variant p-8 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-outline-variant mb-2">
                  add_circle
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Integrate Custom Data Source
                </p>
              </div>
            </div>
          </section>

          {/* 03 Alerts */}
          <section id="alerts">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-4xl font-display italic text-outline-variant">03.</span>
              <h3 className="text-2xl font-bold uppercase tracking-tighter">
                Danger Score Alerts
              </h3>
            </div>
            <div className="space-y-8">
              {[
                {
                  title: "Critical Danger Threshold",
                  desc: "Instant notification when any monitored entity score exceeds 85/100.",
                  checked: true,
                  activeColor: "peer-checked:bg-error",
                },
                {
                  title: "Trend Shift Sensitivity",
                  desc: "Notify when a volatility increase of >15% is detected within 6 hours.",
                  checked: true,
                  activeColor: "peer-checked:bg-primary",
                },
                {
                  title: "Forensic Report Digest",
                  desc: "Weekly summary of all archived investigations and status changes.",
                  checked: false,
                  activeColor: "peer-checked:bg-primary",
                },
              ].map((toggle) => (
                <div
                  key={toggle.title}
                  className="grid grid-cols-12 items-center py-6 border-b border-surface-container-highest"
                >
                  <div className="col-span-8">
                    <h4 className="font-bold text-sm uppercase">{toggle.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-1">{toggle.desc}</p>
                  </div>
                  <div className="col-span-4 flex justify-end">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={toggle.checked}
                        className="sr-only peer"
                      />
                      <div
                        className={`w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${toggle.activeColor}`}
                      ></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer actions */}
          <footer className="pt-20 pb-32 flex justify-between items-center border-t border-on-background">
            <button className="text-xs font-bold uppercase tracking-widest text-error hover:underline">
              Reset System Defaults
            </button>
            <div className="flex gap-4">
              <button className="px-10 py-4 bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors">
                Discard Changes
              </button>
              <button className="px-10 py-4 bg-inverse-surface text-background text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                Commit Configurations
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
    </main>
  );
}
