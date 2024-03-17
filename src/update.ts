import {App, MarkdownPostProcessorContext, MarkdownView, TFile} from "obsidian";
import {MyPluginSettings} from "../draft/settings";
import {decodeAndRun, saveValue} from "./api";
import {getInlineFields, log, parserTarget} from "./internalApi";

var app = global.app

export const UPDATE_PATTERN = /(?:^|`)update\|\s*?(?<expression>.*?)\s*?(?<target>>.*?)?(?:$|`)/i

// https://regex101.com/r/osbDKH/1

async function update(fileContent: string, file: string | TFile) {
	for (let match of fileContent.matchAll(new RegExp(UPDATE_PATTERN, 'g'))) {
		const pattern = match[0]
		var target = parserTarget(pattern, file)
		let newText = await decodeAndRun(match.groups?.expression, {
			priority: target.targetType
		})
		if (newText) {
			var isSaved = await saveValue(newText, target)
			log('update', 'isSaved', isSaved)
		}
	}
}

export async function replaceCode2Update(root: HTMLElement, ctx: MarkdownPostProcessorContext, settings: MyPluginSettings, app: App) {
	const codesEl = root.findAll('code')
	for (let codeEl of codesEl) {
		const text = codeEl.innerText.trim()
		const buttonNotation = text.match(UPDATE_PATTERN)
		if (!buttonNotation) continue;
		const {expression, target} = buttonNotation.groups!
		codeEl.classList.add('live-form-update')
		codeEl.textContent = `🧮 ${expression} ${target}`
	}
}

app.metadataCache.on("changed", async (file, content, cache) => {
	// refresh(this.app)
	var editor = app.workspace.activeEditor as MarkdownView
	var viewMode = editor?.getMode()
	if (viewMode == 'preview')
		await update(content, file)
})
