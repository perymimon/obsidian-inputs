import {App, MarkdownView, TFile} from "obsidian";
import {modifications, stringTemplate} from "./strings";

export function getMaxAnnotationId(pattern: RegExp, fileContent: string) {
	let maxId = 1;
	for (let annotation of fileContent.matchAll(pattern)) {
		let inputFields = annotation.groups
		let id = inputFields.id?.match(/\d+/) ?? 0
		maxId = Math.max(id, maxId)
	}
	return maxId;
}
export function identifyAnnotation(pattern :RegExp, fileContent: string, textLine: string) {
	let maxId = 0
	// const openalId = new RegExp(pattern.source.replace(/\??$/,'?' ))
	return textLine.replace(pattern, (...match) => {
		let group = match.at(-1)
		if (group.id) return match[0]
		let content = match[0].slice(1, -1)
		maxId = 1 + (maxId || getMaxAnnotationId(pattern, fileContent))
		return `\`${content} -${maxId}-\``
	})
}
export async function replaceAndSave(pattern: string|RegExp, value:string, file?:TFile) {
	file = file ?? app.workspace.activeEditor!.file!
	return await app.vault.process(file, (data: string) => {
		value = stringTemplate(value, modifications)
		return data.replace(pattern, value)
	})
}

export async function refresh() {
	let focusElement = document.activeElement;
	app.workspace.updateOptions();
	// Trigger a re-render of the current note when the settings change
	// to force the registerMarkdownPostProcessor to reprocess the Markdown.
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (view) {
		await view.previewMode.rerender(true);
		focusElement?.focus()
	}
}
