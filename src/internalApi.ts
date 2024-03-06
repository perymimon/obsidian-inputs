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


export async function asyncEval(code, fields = {}, api = {}, priority = 'api', debug = false) {
	const AsyncFunction = Object.getPrototypeOf(async function () {
	}).constructor
	const func = new AsyncFunction('dataFields', 'api', 'debug', `
		with(dataFields) with(api){
		 	if(debug) debugger; 
	    	return ${code} 
	    }
	`)

	if (priority == 'api')
		return await func.call(this, fields, api, debug)
	if (priority == 'fields')
		return await func.call(this, api, fields)
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
	targetType: 'yaml' | 'field' | 'header' | 'text' | 'file' | 'pattern',
	path: string,
	method: 'append' | 'prepend' | 'replace' | 'create'
	pattern: string
}

export function parseTarget(target: string, pattern: string, defFile: string | TFile = ''): Target {
	//https://regex101.com/r/Z0v3rv/1
	const eliminateSquareContent = /\[\[(.*)]]/
	const targetPattern = />([^:#?*<>"]+?)?(?:(::|:|#)([\w ]+?))?(append|replace|prepend|create)?$/
	const fields = target.trim()
		.replace(eliminateSquareContent, '$1')
		.match(targetPattern) ?? []
	const tag = '`'
	var [, file, targetType = '', path = '', method] = fields
	path = path.trim()
	file = (typeof file == 'string') ? file.trim() : file
	const typeMap = {
		':': 'yaml',
		'::': 'field',
		'#': 'header',
	}
	targetType = typeMap[targetType] ?? (file ? 'file' : 'pattern')
	return {
		file: file ?? defFile, targetType, path, method,
		pattern: `${tag}${pattern}${tag}`
	}
}

export function setPrototype(a: object, proto: object) {
	a.__proto__ = proto
	return a;
}

export function getInlineFields(content: string, key?: string = '.*?') {
	// const regex = /\[\s*(.*?)\s*::(.*?)]|\b(.*?)::(.*?)$|\(\s*(.*?)\s*::(.*?)\)/gm
	const regex = new RegExp(`\\[\\s*(${key})\\s*::(.*?)]|\\b(${key})::(.*?)$|\\(\\s*(${key})\\s*::(.*?)\\)`, 'gm')
	var cleanContent = content
		.replace(/`[^`]+`/g, m => '_'.repeat(m.length)) // remove inline code
		.replace(/\[\[.*?]]/g, m => '_'.repeat(m.length)) // remove wiki links

	const fields = [];

	let match;
	while ((match = regex.exec(cleanContent)) !== null) {
		const pair = Array.from(match).filter(Boolean).map(t => t.trim())
		const [field] = pair;
		var [startIndex, endIndex] = [match.index, match.index + field.length]
		var outerField = content.slice(startIndex, endIndex)
		var innerField = outerField.replace(/^[(\[]|[)\]]$/g, '')
		let [key, value] = innerField.split('::').map(t => t.trim())
		fields.push({outerField, innerField, key, value, startIndex, endIndex})
	}

	return fields;
}


export function manipulateValue(oldValue, value: string, method: string) {
	var array = oldValue.split(',').map((t: string) => t.trim()).filter(Boolean)
	switch (method) {
		case 'replace':
			array = [value]
			break;
		case 'append':
			array.push(value);
			break;
		case 'prepend':
			array.unshift(value)
			break;
		case 'clear':
			array = []
			break;
		default:
			throw new Error('Invalid method');
	}
	return array.join(',')
}

export function log(fnName: string, varName: string, ...varValue: any[]) {
	var title = `${fnName} ${varName}:`;
	console.log(title, ...varValue)
}

export function logDecodeAndRun(preExpression, expression, type, result) {
	var strings = []
	if (preExpression != expression)
		strings.push(`template "${preExpression}" converted to "${expression}"`)
	if (type == 'imported') strings.push(` and import`)
	if (type == 'templater') strings.push(` and templater`)
	if (type =='excuted') strings.push(` and executed to `)
	if(type=='literal') strings.push(` and return as literal text`)

	log('decodeAndRun', strings.join(''), result)
}

export function isFileNotation(path){
	if( path.startsWith('[[') && path.endsWith(']]')) return true
	if(/\.(js|md)$/.test(path)) return true
	return false
}
