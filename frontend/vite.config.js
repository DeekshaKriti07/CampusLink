import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function inlineInitialStyles() {
  return {
    name: 'inline-initial-styles',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      html.source = String(html.source).replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, tag => {
        const href = tag.match(/href="([^"]+)"/)?.[1];
        const css = href && bundle[href.replace(/^\//, '')];
        if (!css || css.type !== 'asset') return tag;
        return `<style>${String(css.source).replace(/<\/style/gi, '<\\/style')}</style>`;
      });
      // Fonts are emitted with content hashes. Discover them from the output so preloads
      // never reference development URLs or stale filenames after an upgrade.
      const fonts = Object.keys(bundle).filter(name => /(?:dm-sans|bricolage-grotesque)-latin-wght-normal-.*\.woff2$/.test(name));
      html.source = String(html.source).replace('<head>', '<head>\n    '+fonts.map(name => `<link rel="preload" href="/${name}" as="font" type="font/woff2" crossorigin>`).join('\n    ')+'\n');
    },
  };
}
export default defineConfig({
  plugins: [react(), inlineInitialStyles()],
  server: { proxy: { '/api': 'http://localhost:5001' } },
  build: { sourcemap: false },
});
