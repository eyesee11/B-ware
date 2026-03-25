'use client';

import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialization: 'Data Integrity',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecializationClick = (unit: string) => {
    setFormData(prev => ({ ...prev, specialization: unit }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="antialiased bg-background text-on-surface">
      <TopNav />
      <main className="pt-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-8 py-20">

          {/* Header */}
          <div className="swiss-grid mb-24">
            <div className="col-span-12 lg:col-span-7">
              <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold mb-4 block">
                Institutional Access
              </span>
              <h1 className="text-6xl md:text-8xl font-display font-bold leading-[0.9] tracking-tighter text-on-surface mb-8 italic">
                The Forensic <br />Archive
              </h1>
              <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">
                Secure registration for certified forensic analysts. Access high-precision
                instrumentation, encrypted intelligence reports, and the central truth-status
                repository.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-5 flex flex-col justify-end">
              <div className="bg-surface-container-high p-8 border-l-4 border-primary">
                <p className="text-[11px] uppercase tracking-widest font-bold text-on-surface mb-2">
                  Protocol 04-A
                </p>
                <p className="text-sm italic font-display">
                  &quot;Accuracy is the only metric of authority.&quot;
                </p>
              </div>
            </div>
          </div>

          <div className="swiss-grid">
            {/* Progress Sidebar */}
            <aside className="col-span-12 lg:col-span-3">
              <div className="sticky top-24 space-y-12">
                <div className="space-y-6">
                  {[
                    { num: "01", label: "Identity", active: true },
                    { num: "02", label: "Credentials", active: false },
                    { num: "03", label: "Vetting", active: false },
                    { num: "04", label: "Encryption", active: false },
                  ].map((step) => (
                    <div key={step.num} className="flex items-center gap-4">
                      <span
                        className={`w-8 h-8 flex items-center justify-center font-bold text-xs ${
                          step.active
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        {step.num}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          step.active ? "text-on-surface" : "text-on-surface-variant"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-12 border-t border-outline-variant/20">
                  <h4 className="text-[11px] font-black uppercase mb-4 tracking-tighter">
                    Requirements
                  </h4>
                  <ul className="space-y-3 text-xs text-on-surface-variant uppercase tracking-widest font-medium">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Valid Forensic ID
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Institution Email
                    </li>
                    <li className="flex items-center gap-2 text-error">
                      <span className="material-symbols-outlined text-[14px]">priority_high</span>
                      Level 2 Clearance
                    </li>
                  </ul>
                </div>
              </div>
            </aside>

            {/* Form */}
            <div className="col-span-12 lg:col-span-9">
              <div className="bg-surface-container-lowest p-12 lg:p-20 shadow-[32px_32px_64px_rgba(0,0,0,0.03)]">
                <section>
                  <h2 className="text-4xl font-display mb-12">Verification of Identity</h2>
                  <form onSubmit={handleSubmit} className="space-y-12">
                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant block">
                          Full Legal Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="As per official documentation"
                          required
                          className="w-full bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-0 py-3 text-lg placeholder:text-surface-container-highest outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant block">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="name@example.com"
                          required
                          className="w-full bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-0 py-3 text-lg placeholder:text-surface-container-highest outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant block">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          className="w-full bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-0 py-3 text-lg placeholder:text-surface-container-highest outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant block">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          className="w-full bg-transparent border-0 border-b-2 border-outline focus:border-primary focus:ring-0 px-0 py-3 text-lg placeholder:text-surface-container-highest outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant block">
                        Specialization Unit
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["Data Integrity", "Forensic Audio", "Visual Truth", "Metadata"].map(
                          (unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => handleSpecializationClick(unit)}
                              className={`p-4 text-left border-2 font-bold text-xs uppercase tracking-tighter transition-all ${
                                formData.specialization === unit
                                  ? "border-primary bg-primary-container text-primary"
                                  : "border-surface-container-high hover:border-outline text-on-surface-variant"
                              }`}
                            >
                              {unit}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="pt-12 flex items-center justify-between border-t border-surface-container">
                      <div className="flex items-center gap-3 text-on-surface-variant">
                        <span className="material-symbols-outlined">verified_user</span>
                        <span className="text-xs uppercase tracking-widest font-bold">
                          256-bit AES Encryption Active
                        </span>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary-dim text-on-primary px-12 py-4 font-bold uppercase tracking-[0.2em] flex items-center gap-4 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <span className="animate-spin material-symbols-outlined">
                              autorenew
                            </span>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                              arrow_forward
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-6 text-center">
                      <p className="text-[11px] text-on-surface-variant uppercase tracking-widest">
                        Already registered?{" "}
                        <Link href="/login" className="text-primary font-bold hover:underline">
                          Login here
                        </Link>
                      </p>
                    </div>
                  </form>
                </section>
              </div>

              {/* Bento Grid */}
              <div className="mt-24 swiss-grid">
                <div className="col-span-12 md:col-span-8 bg-inverse-surface p-12 text-on-primary">
                  <h3 className="text-3xl font-display italic mb-6">The Analytical Standard</h3>
                  <p className="text-base text-outline-variant mb-8 leading-relaxed">
                    Our platform leverages the B-ware Protocol for immutable data verification.
                    Every investigation is timestamped on the global ledger, ensuring that forensic
                    truth remains undisputed.
                  </p>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <span className="block text-4xl font-bold tracking-tighter mb-1">99.9%</span>
                      <span className="text-[11px] uppercase tracking-widest opacity-60">
                        Verification Accuracy
                      </span>
                    </div>
                    <div>
                      <span className="block text-4xl font-bold tracking-tighter mb-1">0.02s</span>
                      <span className="text-[11px] uppercase tracking-widest opacity-60">
                        Latency on Truth Retrieval
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-4 bg-tertiary p-12 flex flex-col justify-between">
                  <span className="material-symbols-outlined text-on-tertiary text-5xl">
                    security
                  </span>
                  <div className="text-on-tertiary">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest mb-2">
                      Vetting Protocol
                    </h4>
                    <p className="text-sm opacity-80 leading-relaxed">
                      Mandatory background checks are executed within 24 hours of step 03
                      completion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
