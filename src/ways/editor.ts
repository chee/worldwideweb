import {automergeSyncPlugin} from "@automerge/automerge-codemirror"
import {
	Decoration,
	drawSelection,
	EditorView,
	highlightActiveLine,
	highlightSpecialChars,
	keymap,
	lineNumbers,
	type DecorationSet,
	type ViewUpdate,
} from "@codemirror/view"
import {html} from "@codemirror/lang-html"
import {css} from "@codemirror/lang-css"
import {javascript} from "@codemirror/lang-javascript"
import {dracula} from "@uiw/codemirror-theme-dracula"
import {bracketMatching, foldGutter, indentOnInput} from "@codemirror/language"
import {
	defaultKeymap,
	history,
	historyKeymap,
	indentWithTab,
} from "@codemirror/commands"
import {StateField, EditorState, Compartment} from "@codemirror/state"
import {githubLight as github} from "@uiw/codemirror-theme-github"
import {
	closeBrackets,
	autocompletion,
	closeBracketsKeymap,
	completionKeymap,
} from "@codemirror/autocomplete"
import startAutomerge from "../start.ts"
import HashFollower, {getHashParts} from "../follow.ts"
import "./editor.css"

let place = document.getElementById("window")!

let repo = await startAutomerge()
let hash = new HashFollower(repo)
await hash.ready

type Range = {
	from: number
	to: number
	head: number
	anchor: number
}

type RangeMessage = Range & {$type: "range"}
type HelloMessage = {$type: "hello"}
type AnyMessage = RangeMessage | HelloMessage

function broadcast(state: EditorState) {
	for (let range of state.selection.ranges) {
		hash.docHandle?.broadcast({
			$type: "range",
			from: range.from,
			to: range.to,
			head: range.head,
			anchor: range.anchor,
		} satisfies RangeMessage)
	}
}

function ephemera(update: ViewUpdate) {
	if (update.selectionSet) {
		broadcast(update.state)
	}
}

function cursors() {
	let friends: Record<string, Range & {time: number}> = {}
	let friendRangeMark = Decoration.mark({
		class: "cm-friend cm-friend-range",
	})
	let friendPointMark = Decoration.widget({
		widget: {
			eq(widget) {
				return widget == this
			},
			updateDOM(_dom, _view) {
				return true
			},
			ignoreEvent(_event) {
				return true
			},
			estimatedHeight: -1,
			lineBreaks: 0,
			coordsAt(_dom, _pos, _side) {
				return {bottom: 0, left: 0, right: 0, top: 0}
			},
			toDOM(_view) {
				let span = document.createElement("span")
				span.className = "cm-friend cm-friend-point"
				return span
			},
			destroy() {
				return
			},
			compare(w) {
				return w == this
			},
		},
	})
	friendPointMark.point = true

	return StateField.define<DecorationSet>({
		create(state) {
			hash.docHandle?.on("ephemeral-message", payload => {
				let id = payload.senderId
				let message = payload.message as AnyMessage
				if (message.$type == "range") {
					friends[id] = {
						...message,
						time: Date.now(),
					}
				}
				if (message.$type == "hello") {
					broadcast(state)
				}
			})
			hash.docHandle?.broadcast({type: "$hello"})
			return Decoration.none
		},

		update(marks, tr) {
			marks = marks.update({
				filter() {
					return false
				},
			})

			for (let [id, range] of Object.entries(friends)) {
				if (Date.now() - range.time > 2000) {
					delete friends[id]
					continue
				}
				let mark =
					range.from == range.to
						? friendPointMark.range(range.from)
						: friendRangeMark.range(range.from, range.to)
				mark.value.spec.id = id
				marks = marks.update({
					add: [mark],
				})
			}

			marks = marks.update({
				filter(from, to, value) {
					if (value.spec.id in friends) {
						return true
					}
					return false
				},
			})

			return marks
		},

		provide: f => EditorView.decorations.from(f),
	})
}

let darkmatch = window.matchMedia("(prefers-color-scheme: dark)")
let theme = new Compartment()
function getSchemeTheme() {
	return darkmatch.matches ? dracula : github
}
function onschemechange(event: MediaQueryListEvent) {
	view?.dispatch({
		effects: theme.reconfigure(getSchemeTheme()),
	})
}
darkmatch.addEventListener("change", onschemechange)

let [, ext] = getHashParts() || "html"
let syntax = {
	html: html(),
	css: css(),
	js: javascript({typescript: false, jsx: false}),
}[ext || "html"]

function setupView() {
	return new EditorView({
		doc: hash.docHandle!.docSync()!.text,
		extensions: [
			theme.of(getSchemeTheme()),
			EditorView.lineWrapping,
			EditorView.updateListener.of(ephemera),
			cursors(),
			automergeSyncPlugin({
				handle: hash.docHandle!,
				path: ["text"],
			}),
			indentOnInput(),
			bracketMatching(),
			highlightSpecialChars(),
			history(),
			drawSelection(),
			autocompletion(),
			closeBrackets(),
			highlightActiveLine(),
			lineNumbers(),
			foldGutter(),
			EditorState.allowMultipleSelections.of(true),
			keymap.of([
				...closeBracketsKeymap,
				...defaultKeymap,
				...historyKeymap,
				...defaultKeymap,
				...historyKeymap,
				...completionKeymap,
			]),
			syntax,
			dracula,
			keymap.of([indentWithTab]),
		],
		parent: place,
	})
}

let view = setupView()

hash.sub(() => {
	view.destroy()
	view = setupView()
})

setInterval(() => {
	broadcast(view.state)
}, 5000)

view.focus()

window.addEventListener("click", () => view.focus())
