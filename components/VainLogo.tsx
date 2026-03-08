
import React from 'react';

interface VainLogoProps {
    className?: string;
    light?: boolean;
    showSubtitle?: boolean;
}

export const VainLogo: React.FC<VainLogoProps> = ({
    className = "w-32",
    light = false,
    showSubtitle = true
}) => {
    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            {/* Minimalist Premium Crown */}
            <div className="mb-1">
                <svg
                    viewBox="0 0 100 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-auto ${light ? 'text-stone-300' : 'text-amber-600'}`}
                >
                    <path
                        d="M20 35 L10 10 L30 20 L50 5 L70 20 L90 10 L80 35 Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {/* Official VAIN Wordmark Image */}
            <div className="w-full px-1">
                <img
                    src="/Logo-Vain.webp"
                    alt="VAIN"
                    className={`h-auto w-full object-contain ${light ? 'invert brightness-200' : ''}`}
                />
            </div>

            {/* Subtitle */}
            {showSubtitle && (
                <div className={`mt-1 text-[8px] tracking-[0.7em] uppercase font-light ${light ? 'text-stone-400' : 'text-stone-500'}`}>
                    Boutique Hotel
                </div>
            )}
        </div>
    );
};
