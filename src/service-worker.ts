import {
	isValidDocumentId,
	type AnyDocumentId,
} from "@automerge/automerge-repo/slim"
import {BrowserWebSocketClientAdapter} from "@automerge/automerge-repo-network-websocket"
import {IndexedDBStorageAdapter} from "@automerge/automerge-repo-storage-indexeddb"
import {automergeWasmBase64} from "@automerge/automerge/automerge.wasm.base64.js"
import {next as Automerge} from "@automerge/automerge/slim"
import {Repo} from "@automerge/automerge-repo/slim"

Automerge.initializeBase64Wasm(automergeWasmBase64)

let repo = new Repo({
	network: [
		new BrowserWebSocketClientAdapter(`wss://galaxy.observer`),
	],
	storage: new IndexedDBStorageAdapter("bunkbed"),
})
self.repo = repo

interface Window extends ServiceWorkerGlobalScope {}

self.addEventListener("install", event => {
	self.skipWaiting()
	event.waitUntil(
		caches.open("snacks").then(cache => {
			return cache.addAll(import.meta.env.FILES)
		})
	)
})

self.addEventListener("activate", event => {
	self.skipWaiting()
	self.clients.claim()
})

let types: [RegExp, string][] = [
	[/\.html$/, "text/html"],
	[/\.css$/, "text/css"],
	[/\.js$/, "application/javascript"],
]

self.addEventListener("fetch", (event: FetchEvent) => {
	let url = new URL(event.request.url)
	let [, documentId, ext] =
		url.pathname.match(/\/([A-Za-z0-9]+)\.([A-Za-z0-9]+)/) ?? []

	if (documentId && ext && isValidDocumentId(documentId)) {
		try {
			let handle = repo.find<{text: string}>(documentId as AnyDocumentId)
			event.respondWith(
				handle.doc().then(async doc => {
					await repo.networkSubsystem.whenReady()
					return new Response(doc?.text, {
						headers: {
							"content-type":
								types.find(([r]) => r.exec(url.pathname))?.[1] ?? "text/plain",
						},
						status: 200,
						statusText: "yay!",
					})
				})
			)
		} catch {}
	}
	event.respondWith(
		caches.open("snacks").then(cache => {
			return cache.match(event.request).then(cr => {
				return (
					cr ||
					fetch(event.request.url).then(fr => {
						cache.put(event.request, fr.clone())
						return fr
					})
				)
			})
		})
	)
})
