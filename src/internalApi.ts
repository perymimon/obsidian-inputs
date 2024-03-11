// @ts-nocheck
import {MarkdownView, TFile} from "obsidian";

var app = global.app

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

type replacer = (substring: string, ...args: any[]) => Promise<string>

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
	method: 'append' | 'prepend' | 'replace' | 'create' | 'remove' | 'clear'
	pattern: string
}
type TargetArray = [string, Target['file'], Target['targetType'], Target['path'], Target['method']]

export function parseTarget(pattern: string, defFile: string | TFile = ''): Target {
	//https://regex101.com/r/Z0v3rv/1
	const eliminateSquareContent = /\[\[(.*)]]/
	var [garage, leftPattern = '', method] = pattern
		.split(/(>.*)(append|replace|prepend|create|clear|remove)/)
		.filter(Boolean)
	const fields = leftPattern.trim()
		.replace(eliminateSquareContent, '$1')
		.match(/>([^:#?*<>"]+?)?(?:(::|:|#)([\w -]+?))?$/) || []

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
		pattern: `${tag}${pattern}${tag}`
	}
}

export function setPrototype(a: object, proto: object) {
	// @ts-ignore
	a.__proto__ = proto
	return a;
}
export type Field = {
	outerField:string, innerField:string, key:string,
	value:string,fullKey:string,fullValue:string
	offset: [number, number],
	keyOffset: [number, number],
	valueOffset: [number, number]
}
export function getInlineFields(content: string, key: string = '.*?'):Field[] {
	// const regex = /\[\s*(.*?)\s*::(.*?)]|\b(.*?)::(.*?)$|\(\s*(.*?)\s*::(.*?)\)/gm
	const regex = new RegExp(`\\[(\\s*${key}\\s*)::(.*?)\\]|\\((\\s*${key}\\s*)::(.*?)\\)|\\b(${key})::(.*?)$`, 'gm')
	var cleanContent = content
		.replace(/`[^`]+`/g, m => '_'.repeat(m.length)) // remove inline code
		.replace(/\[\[.*?]]/g, m => '_'.repeat(m.length)) // remove wiki links

	const fields = [];

	let match;
	while ((match = regex.exec(cleanContent)) !== null) {
		const [field, fullKey = '', fullValue = ''] = Array.from(match).filter(Boolean);
		var [startOffset, endOffset] = [match.index, match.index + field.length]
		var outerField = content.slice(startOffset, endOffset)
		var innerField = outerField.replace(/^[(\[]|[)\]]$/g, '')
		let [key, value] = [fullKey, fullValue].map(t => t.trim())
		let withBracket = !(outerField.length == innerField.length)

		let startKey = startOffset + (withBracket as unknown as number),
			endKey = startKey + fullKey.length,
			startValue = endKey + 2,
			endValue = startValue + fullValue.length
		fields.push({
			outerField, innerField, key, value,fullKey,fullValue,
			offset: [startOffset, endOffset],
			keyOffset: [startKey, endKey],
			valueOffset: [startValue, endValue]
		})
	}

	return fields;
}


export function manipulateValue(oldValue: string, value: string, method: string) {
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
	new Notice(title)
}

export function logDecodeAndRun(preExpression: string, expression: string, type: string, result: any) {
	var strings = []
	if (preExpression != expression)
		strings.push(`template "${preExpression}" converted to "${expression}"`)
	if (type == 'imported') strings.push(` and import`)
	if (type == 'templater') strings.push(` and templater`)
	if (type == 'excuted') strings.push(` and executed to `)
	if (type == 'literal') strings.push(` and return as literal text`)

	log('decodeAndRun', strings.join(''), result)

}

export function isFileNotation(path: string) {
	if (path.startsWith('[[') && path.endsWith(']]')) return true
	return /\.(js|md)$/.test(path);

}

export function spliceString(string: string, index: number, del: number = 0, text: string = '') {
	return [string.slice(0, index), text, string.slice(index + del)].join('')
}

export function sliceRemover(string:string, indexStart:number,indexEnd:number,inject:string){
	return [string.slice(0, indexStart), inject, string.slice(indexEnd)].join('')
}
