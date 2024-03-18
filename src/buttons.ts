// @ts-nocheck
import {App, MarkdownPostProcessorContext} from "obsidian";
import {MyPluginSettings} from "../draft/settings";
import {processPattern} from "./api";
import {parsePattern} from "./internalApi";

export const BUTTON_PATTERN = /(?:^|`)(?<id>-\w+-)?\s*button\|(?<name>.*)\|\s*(?<expression>.+?)\s*(?<target>>.*?)?\s*(?:$|`)/i

// https://regex101.com/r/osbDKH/1

export function generateButtonNotation(fields: Record<string, any>, id = 0) {
	const {name = '', expression = '', target = ''} = fields
	return `\`Button|${name}| ${expression} ${target} -${id}-\``
}

//  app: App, frontmatter:Record<string, any>
// https://regex101.com/r/AN0SOC/1
export function replaceCode2Buttons(root: HTMLElement, ctx: MarkdownPostProcessorContext, settings: MyPluginSettings, app: App) {
	const codesEl = root.findAll('code')
	for (let codeEl of codesEl) {
		const pattern = codeEl.innerText
		const fields = parsePattern(pattern, BUTTON_PATTERN)
		if (!fields) continue;
		createButton(codeEl, pattern, fields)
	}
}

function createButton(rootEl: HTMLElement, pattern: string, fields) {
	const buttonEl = rootEl.createEl('button', {cls: 'live-form'})
	const {name, target = ''} = fields
	buttonEl.textContent = name || target || 'no name'
	buttonEl.title = pattern
	rootEl.replaceWith(buttonEl)
}

global.document.on('click', 'button.live-form', async function (e, delegateTarget) {
	var pattern = delegateTarget.title
	const {expression, target} = pattern.match(BUTTON_PATTERN)!.groups;
	await processPattern(expression, target, pattern)
})


