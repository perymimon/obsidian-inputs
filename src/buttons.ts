import {App, setTooltip, TFile} from "obsidian";
import {MyPluginSettings} from "./settings";
import {decodeAndRun, executeCode, getFileData, importJs, saveValue} from "./api";
import * as api from "./api"
import {parseTarget, refresh, replaceAndSave} from "./internalApi";
import {stringTemplate} from "./strings";

// export const BUTTON_PATTERN = /button\|(?<name>.+)\|(?<expression>.+?)(?<target>(?::|::|##).+)?(?<id> -\d+-)/i
export const BUTTON_PATTERN = /(?:^|`)button\|(?<name>.+)\|\s*(?<expression>.+?)\s*(?<target>>(?::|::|##)\D.*?)?\s*(?<id>-\d+-)?(?:$|`)/i

export function generateButtonNotation(fields, id = 0){
	const {name = '', expression = '', target = ''} = fields
	return `\`Button|${name}| ${expression} ${target} -${id}-\``
}
// https://regex101.com/r/AN0SOC/1
export function replaceCode2Buttons(root: HTMLElement, ctx, settings: MyPluginSettings, app: App) {
	const codesEl = root.findAll('code')
	for (let codeEl of codesEl) {
		const text = codeEl.innerText.trim()
		const buttonNotation = text.match(BUTTON_PATTERN)
		if (!buttonNotation) continue;
		const fields = buttonNotation.groups;
		fields!.pattern = '`' + text + '`'
		createButton(codeEl, app, ctx.frontmatter, fields)
	}
}

function createButton(rootEl, app: App, frontmatter, fields) {
	const buttonEl = rootEl.createEl('button', {cls: 'live-form'})
	const {name, expression, target = '', pattern} = fields
	buttonEl.textContent = name
	buttonEl.title = pattern
	rootEl.replaceWith(buttonEl)

	buttonEl.onclick = async (event) => {
		var {targetType} = parseTarget(target)
		let textValue = await decodeAndRun(expression, targetType)
		if (textValue) await saveValue(textValue, target.trim() || `${pattern} replace`)
	}

}

