import {
	type DocHandle,
	type DocumentId,
	type Repo,
} from "@automerge/automerge-repo/slim"

type TextDocument = {text: string}

export function getHashParts(): [DocumentId | undefined, string | undefined] {
	let [, documentId, ext] =
		location.hash.match(/#([A-Za-z0-9]+)\.([A-Za-z0-9]+)/) ?? []
	return [documentId as DocumentId, ext]
}

async function getDocHandleFromHash(
	repo: Repo
): Promise<DocHandle<TextDocument>> {
	let [documentId] = getHashParts()
	if (!documentId) {
		documentId = repo.create({text: ""}).documentId
		let url = new URL(location + "")
		url.hash = documentId + ".html"
		history.replaceState(null, "", url)
	}

	let docHandle = repo.find<TextDocument>(documentId)
	await docHandle.whenReady()

	return docHandle
}

export default class HashFollower {
	#doc: DocHandle<TextDocument> | undefined
	get docHandle() {
		return this.#doc
	}
	readonly ready: Promise<void>
	#subs = new Set<() => void>()
	constructor(repo: Repo) {
		this.ready = new Promise(yay => {
			getDocHandleFromHash(repo).then(doc => {
				this.#doc = doc
				yay()
			})
		})
		window.addEventListener("hashchange", async () => {
			this.#doc?.removeAllListeners("change")
			this.#doc = await getDocHandleFromHash(repo)
			for (let sub of this.#subs) {
				sub()
			}
		})
	}
	sub(fn: () => void) {
		this.#subs.add(fn)
		fn()
		return () => this.#subs.delete(fn)
	}
}
