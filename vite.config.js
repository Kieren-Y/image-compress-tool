const { defineConfig } = require('vite');
const path = require('path');

module.exports = defineConfig({
  root: path.join(__dirname, 'src'),
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true
  },
  server: {
    port: 5173,
    hmr: true
  },
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment'
  },
  publicDir: path.join(__dirname, 'public')
}); 