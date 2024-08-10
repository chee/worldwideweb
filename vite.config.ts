import {
	defineConfig,
	type Plugin,
	type PluginOption,
	type UserConfig,
} from "vite"
import wasm from "vite-plugin-wasm"
import * as path from "path"
import * as esbuild from "esbuild"
import fs from "node:fs"

export const config: UserConfig = {
	define: {
		"import.meta.env.AUTOMERGE_SYNC_SERVER": JSON.stringify(
			'"' +
				(process.env.AUTOMERGE_SYNC_SERVER ||
					"wss://autosync-rdd6.onrender.com") +
				'"'
		),
	},
	plugins: [
		wasm() as PluginOption,
		{
			name: "build-service-worker",
			enforce: "post",
			transformIndexHtml(f, ctx) {
				esbuild.buildSync({
					// minify: true,
					define: {
						"import.meta.env.FILES": JSON.stringify(
							fs
								.readdirSync(path.join(process.cwd(), "output"), {
									recursive: true,
									encoding: "utf-8",
								})
								.filter(path => !path.endsWith(".map"))
						),
					},
					bundle: true,
					entryPoints: [path.join(process.cwd(), "src", "service-worker.js")],
					outfile: path.join(process.cwd(), "output", "service-worker.js"),
				})
			},
		} as Plugin,
	],
	build: {
		outDir: "output",
		emptyOutDir: true,
		sourcemap: "hidden",
		minify: true,
		target: ["firefox127", "safari17"],
		rollupOptions: {
			input: {
				main: path.resolve(import.meta.dirname, "index.html"),
			},
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				includePaths: ["node_modules"],
			},
		},
	},
	worker: {
		plugins() {
			return [wasm()]
		},
	},
	optimizeDeps: {
		// This is necessary because otherwise `vite dev` includes two separate
		// versions of the JS wrapper. This causes problems because the JS
		// wrapper has a module level variable to track JS side heap
		// allocations, and initializing this twice causes horrible breakage
		exclude: [
			"@automerge/automerge-wasm",
			"@automerge/automerge-wasm/bundler/bindgen_bg.wasm",
			"@syntect/wasm",
		],
	},
}

export default defineConfig(config)
