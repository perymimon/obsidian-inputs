import {App} from "obsidian";
import {MyPluginSettings} from "./settings";
import {decodeAndRun, saveValue} from "./api";
import {parseTarget} from "./internalApi";

const $BUTTONS_MAP = new WeakMap()

export const BUTTON_PATTERN = /(?:^|`)button\|(?<name>.*)\|\s*(?<expression>.+?)\s*(?<target>>.*?)?\s*(?<id>-\d+-)?(?:$|`)/i
// https://regex101.com/r/osbDKH/1
export function generateButtonNotation(fields, id = 0) {
	const {name = '', expression = '', target = ''} = fields
	return `\`Button|${name}| ${expression} ${target} -${id}-\``
}

// https://regex101.com/r/AN0SOC/1
export function replaceCode2Buttons(root: HTMLElement, ctx, settings: MyPluginSettings, app: App) {
	const codesEl = root.findAll('code')
	for (let codeEl of codesEl) {
		const pattern = codeEl.innerText.trim()
		const buttonNotation = pattern.match(BUTTON_PATTERN)
		if (!buttonNotation) continue;
		const fields = buttonNotation.groups;
		// fields!.pattern = '`' + pattern + '`'
		createButton(codeEl, app, ctx.frontmatter, pattern, fields)
	}
}
function createButton(rootEl, app: App, frontmatter, pattern,  fields) {
	const buttonEl = rootEl.createEl('button', {cls: 'live-form'})
	const {name, expression, target = ''} = fields
	buttonEl.textContent = name || target || 'no name'
	buttonEl.title = pattern
	rootEl.replaceWith(buttonEl)
}

global.document.on('click','button.live-form',async function(e, delegateTarget){
	const pattern = delegateTarget.title
	const fields = pattern.match(BUTTON_PATTERN).groups;
	const {expression, target = ''} = fields
	var targetObject = parseTarget(target , pattern)
	let newText = await decodeAndRun(expression, {priority: targetObject.targetType})
	if (newText) await saveValue(newText, targetObject)
})


