import Link from "next/link";
import TopNav from "@/components/TopNav";
import HeroVideoBackground from "@/components/HeroVideoBackground";
import FadeInSection from "@/components/FadeInSection";

export default function LandingPage() {
  return (
    <div className="bg-background text-on-background relative">
      <HeroVideoBackground />
      <TopNav />
      <main className="pt-16 relative">

        {/* ── Hero (Video Only) ────────────────────────────────────────── */}
        <section className="min-h-screen relative overflow-hidden"></section>

        {/* ── Hero Content ──────────────────────────────────────────────── */}
        <FadeInSection className="bg-white py-32 px-8 md:px-24 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-7xl md:text-7xl font-display italic leading-[0.9] tracking-tighter text-zinc-900 mb-12">
              The truth <br />is a{" "}
              <span className="font-headline not-italic font-black text-primary">variable.</span>
            </h2>
            <div className="space-y-12">
              <p className="text-lg text-on-surface-variant leading-relaxed mx-auto max-w-2xl">
                B-ware is the forensic engine for the modern era. We decompose complex economic
                narratives into atomic data points, verifying reality with surgical precision. No
                fluff, no bias, just the raw architecture of fact.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="bg-inverse-surface text-surface px-10 py-4 font-bold uppercase text-xs tracking-[0.2em] hover:opacity-90 transition-opacity"
                >
                  Explore the Engine
                </Link>
                <div className="border border-outline-variant px-10 py-4 font-bold uppercase text-xs tracking-[0.2em] hover:bg-surface-container-low transition-colors">
                  <Link href="#case-study">
                    View Methodology
                  </Link>
                </div>
              </div>
              <div className="flex flex-wrap gap-12 justify-center mt-16">
                {[
                  { val: "99.8%", label: "Extraction Accuracy" },
                  { val: "1.2ms", label: "Latency Threshold" },
                  { val: "42k+", label: "Verified Vectors" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <span className="block text-4xl font-display italic text-primary mb-2">{stat.val}</span>
                    <span className="text-[11px] uppercase tracking-widest text-on-surface-variant">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* ── Forensic Engine Overview ─────────────────────────────────── */}
        <FadeInSection className="bg-surface-container-low py-32 px-8 border-y border-zinc-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 gap-8">
              <h2 className="text-4xl md:text-5xl font-display italic tracking-tight max-w-2xl">
                A systematic approach to{" "}
                <span className="font-headline not-italic font-black">Forensic Validation.</span>
              </h2>
              <p className="max-w-xs text-sm text-on-surface-variant font-medium leading-relaxed uppercase tracking-wide">
                Our engine cross-references real-time data streams against 150+ verified historical
                archives.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-200 border border-zinc-200">
              {[
                {
                  icon: "query_stats",
                  title: "Neural Scraping",
                  body: "Multimodal agents crawl global datasets, identifying claims in plain text, PDFs, and sensory logs.",
                },
                {
                  icon: "account_tree",
                  title: "Context Mapping",
                  body: "Every claim is nested within its historical and political context to prevent truth manipulation via omission.",
                },
                {
                  icon: "gavel",
                  title: "Final Verdict",
                  body: "Our final output provides a probabilistic truth score grounded in verifiable cryptographic proofs.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white p-12 transition-all hover:bg-surface-container-lowest"
                >
                  <span className="material-symbols-outlined text-4xl text-primary mb-8 block">
                    {card.icon}
                  </span>
                  <h3 className="text-xl font-headline font-bold uppercase tracking-widest mb-4">
                    {card.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>

        {/* ── Case Study ───────────────────────────────────────────────── */}
        <FadeInSection className="py-32 px-8 bg-white" id="case-study">
          <div className="max-w-7xl mx-auto">
            <div className="mb-24 text-center">
              <span className="inline-block px-4 py-1 bg-primary text-white text-[10px] font-bold tracking-[0.3em] uppercase mb-8">
                Case Study: 24-089-A
              </span>
              <h2 className="text-5xl md:text-7xl font-display italic max-w-5xl mx-auto leading-tight">
                &quot;The national GDP grew by{" "}
                <span className="font-headline not-italic font-black text-tertiary">12.4%</span>{" "}
                last fiscal quarter, the highest in the region&apos;s history.&quot;
              </h2>
              <div className="mt-12 h-20 w-[1px] bg-primary mx-auto"></div>
            </div>

            {/* Tier 1 */}
            <div className="mb-32">
              <div className="flex items-center justify-between mb-12 border-b border-zinc-100 pb-4">
                <h2 className="text-3xl font-display italic">
                  Tier 01:{" "}
                  <span className="font-headline not-italic font-black uppercase tracking-tighter">
                    Quantitative Audit
                  </span>
                </h2>
                <span className="text-[11px] font-bold text-on-surface-variant tracking-widest">
                  SOURCE: WORLD BANK IBRD
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 bg-surface-container-lowest p-12 border-l-[6px] border-primary">
                  <div className="grid grid-cols-2 gap-12 mb-16">
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-4 block">
                        Claimed Value
                      </span>
                      <div className="text-6xl font-display italic text-zinc-900">12.4%</div>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-4 block">
                        Verified Value
                      </span>
                      <div className="text-6xl font-display italic text-primary">3.1%</div>
                    </div>
                  </div>
                  <div className="relative pt-8 border-t border-zinc-100">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-6 block">
                      Deviation Scale
                    </span>
                    <div className="h-12 bg-surface-container-low relative w-full">
                      <div className="absolute inset-y-0 left-0 bg-primary/20 h-full w-[31%]"></div>
                      <div className="absolute inset-y-0 left-[31%] w-1 bg-primary h-full z-10"></div>
                      <div className="absolute inset-y-0 left-[31%] bg-error/10 h-full w-[69%]"></div>
                      <div className="absolute inset-y-0 right-0 w-1 bg-error h-full"></div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-4 bg-surface-container-low p-12 flex flex-col justify-center">
                  <h3 className="font-headline font-bold uppercase text-xs tracking-[0.2em] mb-6">
                    Statistical Variance
                  </h3>
                  <div className="text-7xl font-display italic text-error mb-4">+300%</div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    The discrepancy suggests a deliberate use of unadjusted nominal figures to
                    inflate perceived economic performance. Verified data shows a 9.3 percentage
                    point variance.
                  </p>
                </div>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="mb-32">
              <div className="flex items-center justify-between mb-12 border-b border-zinc-100 pb-4">
                <h2 className="text-3xl font-display italic">
                  Tier 02:{" "}
                  <span className="font-headline not-italic font-black uppercase tracking-tighter">
                    Narrative Cross-Reference
                  </span>
                </h2>
                <span className="text-[11px] font-bold text-on-surface-variant tracking-widest">
                  API: GOOGLE FACT CHECK / REUTERS
                </span>
              </div>
              <div className="space-y-6">
                {[
                  {
                    border: "border-error",
                    tag: "Contradiction",
                    tagColor: "text-error",
                    source: "Reuters Fact Check • 2h ago",
                    quote:
                      '"Official treasury reports indicate real GDP growth is stable at 3%, contradicting viral social media posts claiming double-digit surges."',
                  },
                  {
                    border: "border-tertiary",
                    tag: "Neutral / Entailment",
                    tagColor: "text-tertiary",
                    source: "Economic Times • 1d ago",
                    quote:
                      '"Government spokesperson highlights 12.4% nominal increase in industrial output, though economic analysts warn of inflation impact."',
                  },
                ].map((ev, i) => (
                  <div
                    key={i}
                    className={`group flex flex-col md:flex-row bg-white border border-zinc-100 hover:${ev.border} transition-colors`}
                  >
                    <div className={`w-2 ${ev.border.replace("border-", "bg-")}`}></div>
                    <div className="p-10 flex-grow">
                      <div className="flex justify-between items-start mb-6">
                        <span className={`text-[11px] font-bold ${ev.tagColor} tracking-[0.2em] uppercase`}>
                          {ev.tag}
                        </span>
                        <span className="text-[11px] text-on-surface-variant italic">{ev.source}</span>
                      </div>
                      <p className="text-2xl font-display italic leading-snug text-zinc-900 mb-6">
                        {ev.quote}
                      </p>
                      <a href="#" className="text-primary font-bold text-[11px] uppercase tracking-[0.2em] hover:underline inline-flex items-center">
                        View Source{" "}
                        <span className="material-symbols-outlined text-xs ml-2">open_in_new</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier 3 */}
            <section className="bg-inverse-surface text-surface p-16 md:p-24 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <span className="material-symbols-outlined text-[10rem]">security</span>
              </div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-16">
                  <div className="w-16 h-16 bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-3xl">bolt</span>
                  </div>
                  <div>
                    <h2 className="text-4xl md:text-5xl font-display italic leading-none mb-2">
                      Tier 03:{" "}
                      <span className="font-headline not-italic font-black uppercase">
                        Forensic Synthesis
                      </span>
                    </h2>
                    <span className="text-[11px] text-primary uppercase tracking-[0.3em] font-bold">
                      Engine: B-WARE Core v4.2
                    </span>
                  </div>
                </div>
                <div className="max-w-4xl">
                  <p className="text-2xl md:text-3xl font-display italic leading-relaxed text-zinc-300 mb-16">
                    The claim operates on a &quot;Half-Truth&quot; architecture. By selecting the{" "}
                    <span className="text-white font-headline not-italic font-bold">Nominal Growth</span>{" "}
                    index instead of the standard{" "}
                    <span className="text-white font-headline not-italic font-bold">Real GDP</span>{" "}
                    index, the claimant leverages a technically accurate number to create a false
                    perception of historical prosperity.
                  </p>
                  <div className="h-px bg-white/10 mb-16"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div>
                      <h4 className="text-primary font-bold uppercase text-xs mb-8 tracking-[0.2em]">
                        Logic Breakdown
                      </h4>
                      <ul className="space-y-8">
                        {[
                          'The input string explicitly uses "GDP Grew", which in standard economic reporting implies inflation-adjusted real terms.',
                          "Cross-referencing World Bank Data Set 882-B shows Nominal increase of 12.4% vs Real increase of 3.1%.",
                          'The phrase "highest in region\'s history" is debunked by the 1994 growth peak of 4.2% (Real).',
                        ].map((item, i) => (
                          <li key={i} className="flex gap-4">
                            <span className="text-primary font-black">0{i + 1}.</span>
                            <p className="text-sm leading-relaxed text-zinc-400 uppercase tracking-widest">
                              {item}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-primary font-bold uppercase text-xs mb-8 tracking-[0.2em]">
                        Intent Assessment
                      </h4>
                      <p className="text-sm leading-loose text-zinc-400 uppercase tracking-widest">
                        High probability of administrative propaganda. The timing of the claim
                        coincides with the upcoming fiscal policy review, suggesting a strategic
                        dissemination of optimistic but misleading data points.
                      </p>
                      <div className="mt-12 p-6 border border-white/10 bg-white/5">
                        <span className="text-[11px] text-white/40 block mb-2">PROBABILITY SCORE</span>
                        <div className="text-3xl font-display italic text-white">0.88 / 1.0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </FadeInSection>

        {/* ── Discrepancy Visual ───────────────────────────────────────── */}
        <FadeInSection className="py-32 bg-surface-container-highest px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
              <div>
                <h3 className="text-5xl font-display italic mb-12">
                  Visualizing the{" "}
                  <span className="font-headline not-italic font-black">Discrepancy.</span>
                </h3>
                <div className="space-y-12">
                  <div className="p-8 bg-white relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                      Nominal Projection
                    </h4>
                    <div className="h-4 bg-surface-container w-full mb-2">
                      <div className="h-full bg-error w-[85%]"></div>
                    </div>
                    <span className="text-sm font-bold text-error">12.4% Growth (Raw Data)</span>
                  </div>
                  <div className="p-8 bg-white relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#22C55E]"></div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                      Inflation Adjusted
                    </h4>
                    <div className="h-4 bg-surface-container w-full mb-2">
                      <div className="h-full bg-[#22C55E] w-[8%]"></div>
                    </div>
                    <span className="text-sm font-bold text-[#22C55E]">0.8% Growth (Forensic Audit)</span>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-900 aspect-square overflow-hidden relative group">
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 opacity-80"></div>
                <div className="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
                <div className="absolute bottom-10 left-10 right-10 p-8 border border-white/20 backdrop-blur-md bg-black/40">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white font-bold mb-4 block">
                    Archive Capture
                  </span>
                  <p className="text-white/80 text-xs leading-relaxed uppercase tracking-widest">
                    Snapshot taken from Central Bank terminal 09-F at 04:12 GMT.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <FadeInSection className="bg-inverse-surface py-32 px-8 text-surface">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-8xl font-display italic mb-12 leading-tight">
              Demand the <br />
              <span className="font-headline not-italic font-black text-primary">Absolute.</span>
            </h2>
            <p className="text-lg opacity-60 max-w-2xl mx-auto mb-16">
              Join the ranks of investigative journalists, financial analysts, and risk officers who
              rely on B-ware for objective reality.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
              <Link
                href="/register"
                className="bg-primary text-on-primary w-full md:w-auto px-12 py-5 font-bold uppercase text-xs tracking-[0.3em] hover:bg-primary-dim transition-all"
              >
                Request API Access
              </Link>
              <button className="border border-white/20 w-full md:w-auto px-12 py-5 font-bold uppercase text-xs tracking-[0.3em] hover:bg-white/10 transition-all">
                Contact Forensic Unit
              </button>
            </div>
          </div>
        </FadeInSection>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="bg-black py-20 px-8 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-8 max-w-sm">
            <div className="text-3xl font-black tracking-tighter text-white uppercase">B-ware</div>
            <p className="text-xs text-white/40 uppercase tracking-widest leading-loose">
              The Forensic Archive is a subsidiary of the B-ware Network. All data processed is
              subject to high-rigor cryptographic verification protocols.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
            {[
              { title: "Ecosystem", links: ["Engine", "Network", "Nodes", "Registry"] },
              { title: "Transparency", links: ["Methodology", "Data Integrity", "Compliance"] },
            ].map((col) => (
              <div key={col.title}>
                <h5 className="text-[11px] font-bold text-white uppercase tracking-widest mb-8">
                  {col.title}
                </h5>
                <ul className="space-y-4 text-xs uppercase tracking-widest text-white/50">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="hover:text-primary transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-2 md:col-span-1">
              <h5 className="text-[11px] font-bold text-white uppercase tracking-widest mb-8">Terminal</h5>
              <div className="flex items-center gap-4 text-xs text-white/30 tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Status: Operational
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <span className="text-[10px] text-white/30 uppercase tracking-[0.4em]">
            © 2024 B-WARE FORENSICS. ALL RIGHTS RESERVED.
          </span>
          <div className="flex gap-8">
            {["Privacy", "Terms", "Security"].map((l) => (
              <a key={l} href="#" className="text-[10px] text-white/30 hover:text-white uppercase tracking-[0.2em]">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
