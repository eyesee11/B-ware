export default function Footer() {
  return (
    <footer className="bg-inverse-surface py-20 px-8 text-on-primary">
      <div className="max-w-[1440px] mx-auto swiss-grid">
        <div className="col-span-12 md:col-span-4">
          <div className="text-3xl font-black tracking-tighter uppercase mb-6">B-ware</div>
          <p className="text-outline-variant text-sm max-w-xs uppercase tracking-widest font-medium">
            Central Intelligence Unit <br />
            Forensic Archive Division <br />
            Global HQ, Sector 07
          </p>
        </div>
        <div className="col-span-6 md:col-span-2">
          <h5 className="text-[11px] font-bold uppercase tracking-widest mb-6">Network</h5>
          <ul className="space-y-4 text-sm text-outline-variant">
            <li><a href="#" className="hover:text-primary transition-colors">Nodes</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Latency Map</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Uptime</a></li>
          </ul>
        </div>
        <div className="col-span-6 md:col-span-2">
          <h5 className="text-[11px] font-bold uppercase tracking-widest mb-6">Legal</h5>
          <ul className="space-y-4 text-sm text-outline-variant">
            <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Usage Rights</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Compliance</a></li>
          </ul>
        </div>
        <div className="col-span-12 md:col-span-4 flex flex-col justify-between items-end">
          <p className="text-xs font-serif italic text-outline-variant">
            &quot;In data we trust, in forensics we verify.&quot;
          </p>
          <p className="text-[11px] text-outline-variant opacity-40 uppercase tracking-[0.3em]">
            © 2024 B-WARE CORP
          </p>
        </div>
      </div>
    </footer>
  );
}
