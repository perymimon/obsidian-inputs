// @ts-nocheck
import {MarkdownView, TFile, Notice} from "obsidian";
import {targetFile} from "./api";
import {objectGet} from "./objects";
import {Pattern} from "./main";
import {cleanString, lastSliceFrom} from "./strings";

var app = globalThis.app
var proxyTFileHandler = {
	get(target, prop, receiver) {
		return Reflect.get(target, prop) ?? objectGet(target, prop)
	}
}

export function addToContextList(tFile: TFile, array: Array) {
	let proxyTfile = new Proxy(tFile, proxyTFileHandler)
	array.unshift(proxyTfile)
	array.splice(10, Infinity)
}

export function getMaxAnnotationId(pattern: RegExp, fileContent: string) {
	let maxId = 1;
	pattern = new RegExp(pattern, 'gim')
	for (let annotation of fileContent.matchAll(pattern)) {
		let inputFields = annotation.groups
		// @ts-ignore
		let id = (/\d+/.exec(inputFields?.id) ?? 0) as number
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
	return app.workspace.activeEditor?.file ?? app.workspace.getActiveFile() as TFile;
}


export async function asyncEval(code: string, fields = {}, api = {}, priority = 'api', debug = false) {
	const AsyncFunction = Object.getPrototypeOf(async function () {
	}).constructor
	const func = new AsyncFunction('fields', 'api', 'debug', `
		with(fields) with(api){
		 	if(debug) debugger; 
	    	return (${code}) 
	    }
	`)

	if (priority == 'api')
		return await func.call(this, fields, api, debug)
	if (priority == 'fields')
		return await func.call(this, api, fields, debug)
}

type replacer = (substring: string, ...args: any[]) => Promise<string>

export async function replaceAsync(string: string, regexp: RegExp, replacer: replacer) {
	const replacements = await Promise.all(
		Array.from(string.matchAll(regexp),
			match => replacer(...match)));
	let i = 0;
	return string.replace(regexp, () => replacements[i++]);
}

export type Target = {
	file?: targetFile,
	targetType: 'yaml' | 'field' | 'header' | 'file' | 'pattern',
	path: string,
	method: 'append' | 'prepend' | 'replace' | 'create' | 'remove' | 'clear' | 'rename'
	pattern: string
}
type TargetArray = [string, Target['file'], Target['targetType'], Target['path'], Target['method']]

export function parserTarget(pattern: string = '', defFile: targetFile = ''): Target {
	//https://regex101.com/r/Z0v3rv/1
	var targetPattern = lastSliceFrom(pattern || '', ">", false)
	var [leftPattern = '', method] = targetPattern
		.split(/ (append|replace|prepend|create|clear|remove|rename)$/)
	const fields = leftPattern
		.match(/(^[^:#?*<>"]+?)?(?:(::|:|#)(.+?))?$/) || []

	var [, file, targetType = '', path = ''] = fields as TargetArray
	path = path.trim()
	file = (typeof file == 'string') ? file.trim() : file
	const typeMap: Record<string | undefined, string> = {
		':': 'yaml',
		'::': 'field',
		'#': 'header',
	}
	var type = (typeMap[targetType] ?? (file ? 'file' : 'pattern')) as Target['targetType']
	const tag = '`'
	return {
		file: file ?? defFile,
		targetType: type,
		path,
		method,
		pattern: `${pattern}`
	}
}

export function parsePattern(pattern: string, regexParser): Pattern | null {
	return pattern.trim().match(regexParser)?.groups as Pattern || null
}


export function log(funcName: string, message: string, ...exteraData: any[]) {
	var text = `${message} \n( ${funcName} )`;
	console.log(text, ...exteraData)
	new Notice(text, 10_000)
}

