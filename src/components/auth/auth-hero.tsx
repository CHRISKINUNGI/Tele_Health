import { HeartPulse, ShieldCheck, Video } from 'lucide-react';

/**
 * Decorative illustration panel shown beside the auth forms on large screens.
 * Fully self-contained (inline SVG) — no external image assets.
 */
export function AuthHero() {
    return (
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white flex-col justify-between p-12">
            {/* Soft background blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            </div>

            {/* Brand */}
            <div className="relative z-10 flex items-center gap-2 text-xl font-bold">
                🏥 <span>Telehealth Portal</span>
            </div>

            {/* Illustration + headline */}
            <div className="relative z-10 flex flex-col items-center text-center">
                <TelehealthIllustration />
                <h2 className="mt-8 text-3xl font-black leading-tight">
                    Quality care, wherever you are
                </h2>
                <p className="mt-3 max-w-sm text-white/80">
                    Book appointments, message your doctor, and manage your care — all in one place.
                </p>
            </div>

            {/* Trust markers */}
            <div className="relative z-10 flex items-center gap-6 text-sm text-white/90">
                <span className="flex items-center gap-2">
                    <Video className="h-4 w-4" /> Virtual visits
                </span>
                <span className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4" /> Real-time queue
                </span>
                <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Secure &amp; private
                </span>
            </div>
        </div>
    );
}

function TelehealthIllustration() {
    return (
        <svg
            viewBox="0 0 320 260"
            className="w-full max-w-xs drop-shadow-xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Device / screen */}
            <rect x="40" y="30" width="240" height="170" rx="16" fill="#ffffff" fillOpacity="0.12" />
            <rect x="40" y="30" width="240" height="170" rx="16" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" />

            {/* Doctor avatar bubble */}
            <circle cx="110" cy="95" r="26" fill="#ffffff" fillOpacity="0.9" />
            <circle cx="110" cy="86" r="9" fill="#7c3aed" />
            <path d="M92 112c2-11 9-16 18-16s16 5 18 16z" fill="#7c3aed" />

            {/* Heartbeat line */}
            <path
                d="M52 150h40l10-22 14 44 12-30 8 14h60"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Medical cross badge */}
            <circle cx="240" cy="60" r="24" fill="#ffffff" />
            <rect x="235" y="48" width="10" height="24" rx="2" fill="#2563eb" />
            <rect x="228" y="55" width="24" height="10" rx="2" fill="#2563eb" />

            {/* Floating chat bubble */}
            <rect x="200" y="150" width="70" height="40" rx="12" fill="#ffffff" fillOpacity="0.9" />
            <circle cx="220" cy="170" r="3.5" fill="#7c3aed" />
            <circle cx="235" cy="170" r="3.5" fill="#7c3aed" />
            <circle cx="250" cy="170" r="3.5" fill="#7c3aed" />

            {/* Base shadow */}
            <ellipse cx="160" cy="225" rx="120" ry="10" fill="#000000" fillOpacity="0.08" />
        </svg>
    );
}
