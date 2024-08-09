import {register} from "register-service-worker"
register(`/service-worker.js?${Math.random().toString(36).slice(2)}`)

let [, path] = location.pathname.split("/")

if (path.length == 0) {
	import("./ways/editor.ts")
}
