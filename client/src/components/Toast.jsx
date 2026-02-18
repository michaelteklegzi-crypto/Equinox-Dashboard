import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const STYLES = {
    success: {
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        icon: 'text-emerald-400',
        text: 'text-emerald-100',
        bar: 'bg-emerald-500',
    },
    error: {
        bg: 'bg-red-500/10 border-red-500/30',
        icon: 'text-red-400',
        text: 'text-red-100',
        bar: 'bg-red-500',
    },
    warning: {
        bg: 'bg-amber-500/10 border-amber-500/30',
        icon: 'text-amber-400',
        text: 'text-amber-100',
        bar: 'bg-amber-500',
    },
    info: {
        bg: 'bg-blue-500/10 border-blue-500/30',
        icon: 'text-blue-400',
        text: 'text-blue-100',
        bar: 'bg-blue-500',
    },
};

export default function Toast({ message, type = 'info', duration = 3500, onClose }) {
    const [phase, setPhase] = useState('enter'); // enter → visible → exit
    const [progress, setProgress] = useState(100);
    const style = STYLES[type] || STYLES.info;
    const Icon = ICONS[type] || ICONS.info;

    useEffect(() => {
        // Entry animation
        requestAnimationFrame(() => setPhase('visible'));

        // Progress bar countdown
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) clearInterval(interval);
        }, 30);

        // Auto-dismiss
        const timer = setTimeout(() => {
            setPhase('exit');
            setTimeout(onClose, 350);
        }, duration);

        return () => { clearTimeout(timer); clearInterval(interval); };
    }, [duration, onClose]);

    const dismiss = () => {
        setPhase('exit');
        setTimeout(onClose, 350);
    };

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] transition-all duration-350 ease-out ${phase === 'enter' ? 'opacity-0 translate-y-4 scale-95' :
                phase === 'exit' ? 'opacity-0 translate-y-2 scale-95' :
                    'opacity-100 translate-y-0 scale-100'
            }`}>
            <div className={`${style.bg} backdrop-blur-xl border rounded-2xl shadow-2xl shadow-black/40 min-w-[340px] max-w-[420px] overflow-hidden`}>
                <div className="flex items-start gap-3 px-4 py-3.5">
                    <Icon className={`h-5 w-5 ${style.icon} mt-0.5 flex-shrink-0`} />
                    <p className={`flex-1 text-sm font-medium ${style.text}`}>{message}</p>
                    <button onClick={dismiss}
                        className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 -mr-1 mt-0.5">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
                {/* Progress bar */}
                <div className="h-[2px] bg-slate-800/50 w-full">
                    <div className={`h-full ${style.bar} transition-all duration-100 ease-linear`}
                        style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
}
