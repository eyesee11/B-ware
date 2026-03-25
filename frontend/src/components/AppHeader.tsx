"use client";

export default function AppHeader() {
  return (
    <header className="fixed top-0 z-50 flex justify-between items-center w-full px-8 h-16 bg-white border-b border-slate-100">
      <div className="flex items-center gap-8">
        <div className="text-2xl font-black tracking-tighter text-slate-900 uppercase">B-WARE</div>
        <div className="hidden md:flex items-center bg-surface-container-low px-3 py-1.5 gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
          <input
            className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-on-surface-variant"
            placeholder="Global Archive Search..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
        <div className="h-8 w-8 bg-surface-container-highest overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAg57JHPNtlrH1PvOYARLi2aRjdxYXGIk-XVQ3H7gp6ar4P9VwLbk8-vOGvXMd8udoT6w7VGVAooIw8sdqv_7t1BK2L0hquP9w8aGPm78aDxWl55ZSMQLMrLIphlCBOgzdGIf4yiJm52E7deq9m5kK9R-ZHgc9fNtWdSof3WNX0S88wCwnUSVR3PewMiEcRuNh_uKoF1mdmOKxKuuIT0bcvff_wmkG3p9WYqxgKofus40kRVe_Ohn89ndCT8cC_PwVF6rUlRQ0kdHRf"
            alt="Analyst Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
