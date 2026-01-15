import { defineConfig } from "vite";

export default defineConfig(async () => {
    // Cargar el plugin React de forma dinámica para evitar problemas con ESM-only
    const pluginReact = (await import("@vitejs/plugin-react")).default;

    return {
        plugins: [pluginReact()],
                            server: {
                                port: 5173,
                            },
    };
});
