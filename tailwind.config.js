/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#4CAF50',
                bgDark: '#0a0e1a',
                borderBlue: '#1e3a5f',
            },
            // Esto nos servirá para el diseño de botones que pediste
            flex: {
                '50': '0 0 50%',
                '20': '0 0 20%',
                '10': '0 0 10%',
            }
        },
    },
    plugins: [],
}
