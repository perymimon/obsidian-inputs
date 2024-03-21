// @ts-nocheck
import {App, MarkdownPostProcessorContext} from "obsidian";
import {MyPluginSettings} from "../draft/settings";
import {processPattern} from "./api";
import {parsePattern} from "./internalApi";
import {PATTERN} from "./main";

export function generateButtonNotation(fields: Record<string, any>, id = 0) {
	const {name = '', expression = '', target = ''} = fields
	return `\`Button|${name}| ${expression} ${target} -${id}-\``
}
//  app: App, frontmatter:Record<string, any>
// https://regex101.com/r/AN0SOC/1
export function createButton(pattern: string, fields) {
	const buttonEl = createEl('button', {cls: 'live-form'})
	const {name, target = ''} = fields
	buttonEl.textContent = name || target || 'no name'
	buttonEl.title = pattern
	return buttonEl
}

global.document.on('click', 'button.live-form', async function (e, delegateTarget) {
	var pattern = delegateTarget.title
	const {expression, target} = parsePattern(pattern, PATTERN)
	await processPattern(expression, target, pattern)
})


