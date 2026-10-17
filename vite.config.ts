import { defineConfig, type Plugin } from "vite";

// The stylesheet is small; inlining it removes the only render-blocking request.
function inlineCss(): Plugin {
  return {
    name: "inline-css",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const html = Object.values(bundle).find((a) => a.type === "asset" && a.fileName.endsWith(".html"));
      if (!html || html.type !== "asset") return;
      for (const [key, asset] of Object.entries(bundle)) {
        if (asset.type !== "asset" || !asset.fileName.endsWith(".css")) continue;
        const tag = new RegExp(`<link[^>]+href="/${asset.fileName}"[^>]*>`);
        const source = String(html.source);
        if (!tag.test(source)) continue;
        html.source = source.replace(tag, () => `<style>${asset.source}</style>`);
        delete bundle[key];
      }
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [inlineCss()],
  build: { target: "es2020", cssMinify: true, assetsInlineLimit: 0 },
});
