import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/*.ts"],
  format: "esm",
  dts: false,
  sourcemap: "inline",
  clean: true,
  splitting: false,
  target: "es2020",
  bundle: true,
  platform: "browser",
  treeshake: true,
  outDir: "dist",
  minify: false,
  noExternal: [/(.*)/],
});
