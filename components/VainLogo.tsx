
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
    const color = light ? "text-white" : "text-stone-900";
    const subColor = light ? "text-stone-400" : "text-stone-500";

    return (
        <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
            {/* Crown Icon */}
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`w-6 h-6 ${color}`}
            >
                <path d="M3 19h18L19 7l-4 5-3-8-3 8-4-5L3 19z" fill="currentColor" />
            </svg>

            {/* VAIN Wordmark */}
            <div className={`text-4xl font-extrabold tracking-[0.2em] leading-none ${color} font-sans`}>
                VAIN
            </div>

            {/* Subtitle */}
            {showSubtitle && (
                <div className={`text-[8px] tracking-[0.5em] uppercase font-light ${subColor}`}>
                    Boutique Hotel
                </div>
            )}
        </div>
    );
};
