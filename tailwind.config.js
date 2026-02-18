/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                heading: ['var(--font-heading)', 'serif'],
                body: ['var(--font-body)', 'sans-serif'],
            },
            colors: {
                // VAIN Hotel Brand Colors
                vain: {
                    dark: '#171717', // neutral-900
                    'dark-soft': '#262626', // neutral-800
                    stone: '#292524', // stone-800
                },
            },
        },
    },
    plugins: [],
}
