import {App, debounce} from "obsidian";
import {MyPluginSettings} from "./settings";
import {decodeAndRun, saveValue} from "./api";
import {log, parseTarget} from "./internalApi";

var app = global.app

export const UPDATE_PATTERN = /(?:^|`)update\|\s*?(?<expression>.*?)\s*?(?<target>>.*?)?(?:$|`)/i
// https://regex101.com/r/osbDKH/1

export async function update(fileContent: string, file: string | TFile) {
	for (let match of fileContent.matchAll(new RegExp(UPDATE_PATTERN, 'g'))) {
		const pattern = match[0]
		const {expression, target: targetDesc = ''} = match.groups
		var target = parseTarget(targetDesc, pattern, file)
		let newText = await decodeAndRun(expression, {
			priority: target.targetType
		})
		if (newText) {
			var isSaved = await saveValue(newText, target)
			log('update', 'isSaved', isSaved)
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

app.metadataCache.on("changed", async (file, content, cache) =>{
	// refresh(this.app)
	var viewMode = 	app.workspace.activeEditor?.getMode()
	if(viewMode == 'preview')
		await update(content,file)
})
