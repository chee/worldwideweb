import HashFollower from "../follow.ts"
import startAutomerge from "../start.ts"
let repo = await startAutomerge()
let hash = new HashFollower(repo)
await hash.ready
let place = document.getElementById("window")!

hash.sub(() => {
	place.innerHTML = hash.docHandle?.docSync()?.text ?? ""
	hash.docHandle?.on("change", () => {
		place.innerHTML = hash.docHandle?.docSync()?.text ?? ""
	})
})
