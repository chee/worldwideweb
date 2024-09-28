import {type PeerId} from "@automerge/automerge-repo/slim"
import {BrowserWebSocketClientAdapter} from "@automerge/automerge-repo-network-websocket"
import {IndexedDBStorageAdapter} from "@automerge/automerge-repo-storage-indexeddb"
import {Repo} from "@automerge/automerge-repo"

export default async function startAutomerge() {
	let idb = new IndexedDBStorageAdapter("bunkbed")
	let socky = new BrowserWebSocketClientAdapter("wss://galaxy.observer")
	let network = [socky]
	let storage = idb
	let repo = new Repo({
		network,
		storage,
		peerId: (localStorage.getItem("name") as PeerId) ?? undefined,
		enableRemoteHeadsGossiping: true,
	})
	window.repo = repo
	await repo.networkSubsystem.whenReady()
	return repo
}
