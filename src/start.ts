import {type PeerId} from "@automerge/automerge-repo/slim"
import {BrowserWebSocketClientAdapter} from "@automerge/automerge-repo-network-websocket"
import {BroadcastChannelNetworkAdapter} from "@automerge/automerge-repo-network-broadcastchannel"
import {IndexedDBStorageAdapter} from "@automerge/automerge-repo-storage-indexeddb"
import {Repo} from "@automerge/automerge-repo"

export default async function startAutomerge() {
	let idb = new IndexedDBStorageAdapter("bunkbed")
	let socky = new BrowserWebSocketClientAdapter(
		import.meta.env.AUTOMERGE_SYNC_SERVER
	)
	let tabby = new BroadcastChannelNetworkAdapter()
	let network = [socky, tabby]
	let storage = idb
	let repo = new Repo({
		network,
		storage,
		peerId: (localStorage.getItem("name") as PeerId) ?? undefined,
	})
	window.repo = repo
	// await new Promise<void>(yay => repo.networkSubsystem.once("ready", yay))
	return repo
}
