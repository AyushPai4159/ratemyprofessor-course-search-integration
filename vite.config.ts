import webExtension from "vite-plugin-web-extension";
import {defineConfig} from "vite";

export default defineConfig({
    plugins: [webExtension()],
    build: {
        sourcemap: true,
    }
});