import {Editor} from "obsidian";
import {CODE_ELEMENT_MARK} from "./main";

export function identifyInputNotations(editor: Editor, nextId: number) {
	let cur = editor.getCursor()
	let text = editor.getLine(cur.line)
	let dirt = false

	let reformatText = text.replace(CODE_ELEMENT_MARK, (...args) => {
		const {type = '', placeholder = '', options = '', id} = args.at(-1)
		if (id) return args[0]

		dirt = true
		let reformat = `\`${type}__${placeholder}__${options} -${nextId++}-\``;
		return reformat
	})
	if (dirt) {
		editor.setLine(cur.line, reformatText)
		editor.setCursor(cur)
	}

	return nextId
}
