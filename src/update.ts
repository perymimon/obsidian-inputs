import {App, debounce} from "obsidian";
import {MyPluginSettings} from "./settings";
import {decodeAndRun, saveValue} from "./api";
import { parseTarget } from "./internalApi";

export const UPDATE_PATTERN = /(?:^|`)update\|\s*?(?<expression>.*?)\s*?(?<target>>.*?)?(?:$|`)/i
// https://regex101.com/r/osbDKH/1

export const delegateUpdate = update

async function update(fileContent: string, file: string | TFile) {
	for (let match of fileContent.matchAll(new RegExp(UPDATE_PATTERN, 'g'))) {
		const pattern = match[0]
		const {expression, target: targetDesc = ''} = match.groups
		var target = parseTarget(targetDesc)
		target.path ??= pattern
		target.file ??= file
		let newText = await decodeAndRun(expression, target.targetType)
		if (newText) {
			await saveValue(newText, target)
		}
	}

}

export async function replaceCode2Update(root: HTMLElement, ctx, settings: MyPluginSettings, app: App) {
	const codesEl = root.findAll('code')
	for (let codeEl of codesEl) {
		const text = codeEl.innerText.trim()
		const buttonNotation = text.match(UPDATE_PATTERN)
		if (!buttonNotation) continue;
		const {expression, target} = buttonNotation.groups
		codeEl.classList.add('live-form-update')
		codeEl.textContent = `🧮 ${expression} ${target}`
	}
}
