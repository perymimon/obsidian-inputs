// @ts-nocheck1
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
	method: 'append' | 'prepend' | 'replace' | 'create' | 'remove' | 'clear'
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

export type Field = {
	outerField: string, innerField: string, key: string,
	value: string, fullKey: string, oldValue: string
	offset: [number, number],
	keyOffset: [number, number],
	valueOffset: [number, number],
	isRound:boolean,
	isSquare:boolean,
}

export function getInlineFields(content: string, key?: string): Field[] {
	// const regex = /\[\s*(.*?)\s*::(.*?)]|\b(.*?)::(.*?)$|\(\s*(.*?)\s*::(.*?)\)/gm
	var def = '.*?', freeDef = '[^\\s]+'
	// const regex = new RegExp(`(\\[)(\\s*${key || def}\\s*)::(.*?)(\\])|(\\()(\\s*${key || def}\\s*)::(.*?)(\\))|()(${key ||freeDef})::(.*?)()$`, 'gm')
	var cleanContent = cleanString(content, {inlineField: false})
	const patterns = [
		new RegExp(`(\\[)(\\s*${key || def}\\s*)::(.*?)(\\])`,'gm'),
		new RegExp(`(\\()(\\s*${key || def}\\s*)::(.*?)(\\))`,'gm'),
			new RegExp(`()(${key ||freeDef})::(.*?)()$`,'gm')
	]
	const fields: Field[] = [];
	let match;
	for(let inlinePattern of patterns){
		cleanContent = cleanContent.replace(inlinePattern,(...match)=>{
			const [field] = Array.from(match).filter(Boolean);
			const index = match.at(-2)
			var [startOffset, endOffset] = [index, index + field.length]
			var outerField = content.slice(startOffset, endOffset)
			var innerField = outerField.replace(/^[(\[]|[)\]]$/g, '')
			var [fullKey = '', fullValue = ''] = innerField.split('::')
			let [key, value] = [fullKey, fullValue].map(t => t.trim())
			let withBracket = !(outerField.length == innerField.length)

			let startKey = startOffset + (withBracket as unknown as number),
				endKey = startKey + fullKey.length,
				startValue = endKey + 2,
				endValue = startValue + fullValue.length
			fields.push({
				isRound:outerField[0] == '[',
				isSquare:outerField[0] == '(',
				outerField, innerField, key, value, fullKey, oldValue: fullValue,
				offset: [startOffset, endOffset],
				keyOffset: [startKey, endKey],
				valueOffset: [startValue, endValue]
			})
			return '_'.repeat(field.length)
		})
	}
	// while ((match = regex.exec(cleanContent)) !== null) {
	// 	// note to myself: don't take values from clean content
	//
	// }

	return fields.sort( (f1,f2)=> f1.offset[0] - f2.offset[0] )
}

export function log(funcName: string, message: string, ...exteraData: any[]) {
	var text = `${message} \n( ${funcName} )`;
	console.log(text, ...exteraData)
	new Notice(text, 10_000)
}

export function isFileNotation(path: string) {
	if (path.startsWith('[[') && path.endsWith(']]')) return true
	return /\.(js|md)$/.test(path);

}
