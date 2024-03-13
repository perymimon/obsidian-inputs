// @ts-nocheck
import {App, MarkdownPostProcessorContext} from "obsidian";
import {MyPluginSettings} from "../draft/settings";
import {decodeAndRun, saveValue} from "./api";
import {parsePattern, parseTarget} from "./internalApi";
import {INPUT_PATTERN} from "./inputs";

const $BUTTONS_MAP = new WeakMap()

export const BUTTON_PATTERN = /(?:^|`)(?<id>-\w+-)?\s*button\|(?<name>.*)\|\s*(?<expression>.+?)\s*(?<target>>.*?)?\s*(?:$|`)/i
// https://regex101.com/r/osbDKH/1

export function generateButtonNotation(fields:Record<string, any>, id = 0) {
	const {name = '', expression = '', target = ''} = fields
	return `\`Button|${name}| ${expression} ${target} -${id}-\``
}
//  app: App, frontmatter:Record<string, any>
// https://regex101.com/r/AN0SOC/1
export function replaceCode2Buttons(root: HTMLElement, ctx:MarkdownPostProcessorContext, settings: MyPluginSettings, app: App) {
	const codesEl = root.findAll('code')
	for (let codeEl of codesEl) {
		const pattern = codeEl.innerText
		const fields = parsePattern(pattern, BUTTON_PATTERN)
		if (!fields) continue;
		createButton(codeEl, pattern, fields)
	}
}
function createButton(rootEl:HTMLElement, pattern:string , fields) {
	const buttonEl = rootEl.createEl('button', {cls: 'live-form'})
	const {name, target = ''} = fields
	buttonEl.textContent = name || target || 'no name'
	buttonEl.title = pattern
	rootEl.replaceWith(buttonEl)
}

global.document.on('click','button.live-form',async function(e, delegateTarget){
	const pattern = delegateTarget.title
	const fields = pattern.match(BUTTON_PATTERN).groups;
	var targetObject = parseTarget(pattern)
	let newText = await decodeAndRun(fields.expression, {priority: targetObject.targetType})
	if (newText) await saveValue(newText, targetObject)
})


