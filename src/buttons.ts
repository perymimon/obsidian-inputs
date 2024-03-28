// @ts-nocheck1
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

globalThis.document.on('click', 'button.live-form', async function (e, delegateTarget) {
	var patterns = delegateTarget.title.trim().split('\n')
	for (let pattern of patterns) {
		const {expression, target} = parsePattern(pattern, PATTERN)
		await processPattern(expression, target, pattern)
	}
})


