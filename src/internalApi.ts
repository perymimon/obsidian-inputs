import {MarkdownView, TFile} from "obsidian";
import {getTFile} from "./api";
var app = global.app

export function getMaxAnnotationId(pattern: RegExp, fileContent: string) {
	let maxId = 1;
	pattern = new RegExp(pattern, 'gim')
	for (let annotation of fileContent.matchAll(pattern)) {
		let inputFields = annotation.groups
		let id = /\d+/.exec(inputFields?.id) ?? 0
		maxId = Math.max(id, maxId)
	}
	return maxId;
}

export function identifyAnnotation(pattern: RegExp, fileContent: string, textLine: string, genNotation) {
	let maxId = 0
	// const PATTERN_MARK = new RegExp(`\`${pattern.source.replace(ID_MARK,ID_MARK+'?')}\``, 'ig')
	// const openalId = new RegExp(pattern.source.replace(/\??$/,'?' ))
	return textLine.replace(pattern, (...match) => {
		let fields = match.at(-1)
		if (fields.id) return match[0]
		maxId = 1 + (maxId || getMaxAnnotationId(pattern, fileContent))
		return genNotation(fields, maxId)
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

export function getActiveFile(): TFile {
	return app.workspace.activeEditor?.file ?? app.workspace.getActiveFile();
}

export async function getDVInlineFields(file: TFile) {
	if (!file) file = getActiveFile()

	const content = await this.app.vault.cachedRead(file);
	const regex = /\[(.*)::(.*)]|\((.*)::(.*)\)|(\w+?)::(.*?)$/g;
	const properties = [];

	let match;
	while ((match = regex.exec(content)) !== null) {
		const key: string = match[1].trim();
		const value: string = match[2].trim();
		const array = value
			.replace(/\s*,\s*/, ',')
			.split(',')
		properties.push({key, content: array.length > 1 ? array : value});
	}

	return properties;
}


export async function asyncEval(code, fields = {}, api = {}) {
	const AsyncFunction = Object.getPrototypeOf(async function () {
	}).constructor
	const func = new AsyncFunction('dataFields', 'api', `with(api) with(dataFields){ return ${code} }`)
	return await func.call(this, fields, api)
}

type replacer = (substring: string, ...args: any[]) => string

export async function replaceAsync(string: string, regexp: RegExp, replacer: replacer) {
	const replacements = await Promise.all(
		Array.from(string.matchAll(regexp),
			match => replacer(...match)));
	let i = 0;
	return string.replace(regexp, () => replacements[i++]);
}
export type Target = {
	file: TFile | string,
	targetType: 'yaml' | 'field' | 'header' | 'text',
	path: string,
	method: 'append' | 'prepend' | 'replace'
}

export function parseTarget(target: string):Target {
	const catchSquareContent = /\[\[(.*)]]/
	const targetPattern = />(?:(?:\[\[)?([\w.\s]*?)(::|:|#)(.*?)(?:]])?)?(?:\s*(append|prepend|replace))?$/
	const fields = target
		.replace(catchSquareContent,'$1')
		.match(targetPattern) ?? []
	var [,file, targetType='', path, method = 'replace'] = fields
	const typeMap = {
		':': 'yaml',
		'::': 'field',
		'#': 'header',
		'':'text'
	}
	targetType = typeMap[targetType] ?? ''
	return {file,targetType, path, method}
}

export function setPrototype(a:object, proto:object) {
	a.__proto__ = proto
	return a;
}

