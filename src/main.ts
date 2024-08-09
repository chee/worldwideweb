import {register} from "register-service-worker"
let [, path] = location.pathname.split("/")
register("/service-worker.js", {
	ready() {
		if (path.length) {
			location.reload()
		}
	},
	updated() {
		if (path.length) {
			location.reload()
		}
	},
})

path.length || import("./ways/editor.ts")
