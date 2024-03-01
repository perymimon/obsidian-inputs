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


export async function asyncEval(code, fields = {}, api = {}, priority='api',debug = false) {
	const AsyncFunction = Object.getPrototypeOf(async function () {
	}).constructor
	const func = new AsyncFunction('dataFields', 'api','debug',`
		with(dataFields) with(api){
		 	if(debug) debugger; 
	    	return ${code} 
	    }
	`)

	if(priority == 'api')
		return await func.call(this, fields, api, debug)
	if(priority == 'fields')
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
	targetType: 'yaml' | 'field' | 'header' | 'text',
	path: string,
	method: 'append' | 'prepend' | 'replace'
}

export function parseTarget(target: string , pattern:string, defFile:string|TFile =''): Target {
	//https://regex101.com/r/Z0v3rv/1
	const catchSquareContent = /\[\[(.*)]]/
	const targetPattern = />([^:#?*<>"]+?)?(?:(::|:|#)([\w ]+?))?(append|replace|prepend)?$/
	const fields = target.trim()
		.replace(catchSquareContent, '$1')
		.match(targetPattern) ?? []
	var [, file = defFile, targetType = '', path = pattern, method = 'replace'] = fields
	path = path.trim()
	file = (typeof file == 'string')?file.trim():file
	const typeMap = {
		':': 'yaml',
		'::': 'field',
		'#': 'header',
		'': 'text'
	}
	targetType = typeMap[targetType] ?? ''
	return {file, targetType, path, method}
}

export function setPrototype(a: object, proto: object) {
	a.__proto__ = proto
	return a;
}

export function extractInlineField(key: string, content: string) {
	var fieldRegx = new RegExp(`(\\b|\\[|\\()\\s*(${key}\\s*::)`)
	const match = content.match(fieldRegx)
	if (!match) return null;
	var start = match.index || 0, i = start;
	const preChar = content[start - 1]
	const brackets = ['[]', '()']
	loop1: for (let [open, close] of brackets) {
		if (preChar != open) continue
		var counter = 0
		for (; i < content.length; i++) {
			let ch = content[i]
			if (ch == open) counter++
			if (ch == close) {
				counter--
				if (counter == 0) {
					i++
					break loop1;
				}
			}
		}

	}
	if (i == start)
		for (; i < content.length; i++) {
			let ch = content[i]
			if (ch == '\n') break
		}
	content = content.slice(start, i)
	{
		let [field, key, value] = content.match(/[\(|\[|\^]\s*(.*)\s*::(.*)[\)|\]|\$]/) || []
		const end = start + field.length
		return {field, key, value, startIndex: start, endIndex: end}
	}

}

// export async function extractInlineField(key: string, fileContent:string) {
// 	var startFieldNotation = new RegExp(`\\b(${key})\\s*::`)
// 	const match = fileContent.match(startFieldNotation)
// 	if (!match) return null;
// 	const startIndex = match.index || 0
// 	var {field, key, value} = getBracketContent(fileContent, startIndex)
//
// 	return {field, key, value, startIndex, endIndex}
// 	// for (let notation of findNotation) {
// 	// 	const match = content.match(notation)
// 	// 	if (match) {
// 	// 		const [field, key, value] = match
// 	// 		let textBefore = content.slice(0, match.index)
// 	//
// 	// 		let line = textBefore.match(/\n/g).length
// 	// 		let ch = match.index - textBefore.lastIndexOf('\n') - 1
// 	// 		return {
// 	// 			field,
// 	// 			key,
// 	// 			value,
// 	// 			start: {
// 	// 				line: line,
// 	// 				offset: match.index,
// 	// 				ch: ch
// 	// 			},
// 	// 			end: {
// 	// 				line: line + field.match(/\n/g)?.length ?? 0,
// 	// 				offset: match!.index + field.length,
// 	// 				ch: ch + field.length // can be worng if there \n in the match
// 	// 			}
// 	//
// 	// 		}
// 	// 	}
// 	// }
// 	// return null
//
// }

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
	var title =  `${fnName} ${varName}:`;
	console.log(title, ...varValue)
}
