// @ts-nocheck1
import {objectGet} from "./basics/objects";
import {lastSliceFrom, stringTemplate} from "./basics/strings";
import {decodeAndRunOpts, Expression, inputOption, Pattern, Target, targetFile} from "./types";
import {PATTERN} from "./consts";
import {processPattern} from "./api";
import type {TFile} from "obsidian";
import {getFileData} from "./data";
import {isFileNotation} from "./files";

var app = globalThis.app
var proxyTFileHandler = {
	get(target: TFile, prop: string) {
		return Reflect.get(target, prop) ?? objectGet(target, prop)
	}
}

export function addToContextList(tFile: TFile, array: any[]) {
	let proxyTFile = new Proxy(tFile, proxyTFileHandler)
	array.unshift(proxyTFile)
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

// export function identifyAnnotation(pattern: RegExp, fileContent: string, textLine: string, genNotation) {
// 	let maxId = 0
// 	// const PATTERN_MARK = new RegExp(`\`${pattern.source.replace(ID_MARK,ID_MARK+'?')}\``, 'ig')
// 	// const openalId = new RegExp(pattern.source.replace(/\??$/,'?' ))
// 	return textLine.replace(pattern, (...match) => {
// 		let fields = match.at(-1)
// 		if (fields.id) return match[0]
// 		maxId = 1 + (maxId || getMaxAnnotationId(pattern, fileContent))
// 		return genNotation(fields, maxId)
// 	})
// }

// export async function refresh() {
// 	let focusElement = document.activeElement;
// 	app.workspace.updateOptions();
// 	// Trigger a re-render of the current note when the settings change
// 	// to force the registerMarkdownPostProcessor to reprocess the Markdown.
// 	const view = app.workspace.getActiveViewOfType(MarkdownView);
// 	if (view) {
// 		await view.previewMode.rerender(true);
// 		if('focus' in focusElement)
// 			focusElement?.focus()
// 	}
// }

export function getActiveFile(): TFile {
	return app.workspace.activeEditor?.file ?? app.workspace.getActiveFile() as TFile;
}


type replacer = (substring: string, ...args: any[]) => Promise<string>

export async function replaceAsync(string: string, regexp: RegExp, replacer: replacer) {
	const replacements = await Promise.all(
		Array.from(string.matchAll(regexp),
			match => replacer(...match)));
	let i = 0;
	return string.replace(regexp, () => replacements[i++]);
}


type TargetArray = [string, Target['file'], Target['targetType'], Target['path'], Target['method']]

export function parserTarget(pattern: string = '', defFile: targetFile = ''): Target {
	//https://regex101.com/r/Z0v3rv/1
	var targetPattern = lastSliceFrom(pattern, ">", false)
	var [leftPattern = '', method = ''] = targetPattern
		.split(/ (append|replace|prepend|create|clear|remove|rename)$/)
	const fields = leftPattern
		.match(/(^[^:#?*<>"]+?)?(?:(::|:|#)(.+?))?$/) || []

	var [, file, targetType = '', path = ''] = fields as TargetArray
	path = path.trim()
	file = (typeof file == 'string') ? file.trim() : file
	const typeMap: Record<string, string> = {
		':': 'yaml',
		'::': 'field',
		'#': 'header',
	}
	var type = (typeMap[targetType] ?? (file ? 'file' : 'pattern')) as Target['targetType']
	// const tag = '`'
	return {
		file: file ?? defFile,
		targetType: type,
		path,
		method,
		pattern: `${pattern}`
	}
}

// export async function parseToAst(pattern: string, data = {}, defaultExpertion: string = '') {
// 	let tokens = parsePattern(String(pattern), PATTERN)!
// 	let {expression, target} = tokens
// 	expression = (expression.trim() == '' && defaultExpertion) ?
// 		defaultExpertion : expression.trim()
//
// 	expression = await stringTemplate(expression, data)
// 	target = await stringTemplate(target, data)
//
// 	const targetObject = parserTarget(target)
//
// }

export function parsePattern(pattern: string, regexParser: RegExp): Pattern | null {
	const tokens: any = pattern.trim().match(regexParser)?.groups as Pattern || null
	for (let k in tokens)
		if (tokens[k] == undefined) tokens[k] = ''
	return tokens
}

export function parseExpression(expression: string): Expression {
	var importKeyword = /^\s*import\s*/gm
	var status: Expression = {
		execute: expression, type: 'executed', file: null, result: ''
	}
	if (!expression || expression.trim() == '')
		return {...status, type: 'empty'}

	if (!importKeyword.test(expression)) return status
	expression = expression.replace(importKeyword, '')
	const file = isFileNotation(expression)
	if (!file) return {...status, type: 'empty'}

	if (file.endsWith('js')) return {...status, file, type: 'import'}
	if (file.endsWith('md')) return {...status, file, type: 'template'}

	return status
}


export function patternToTitle(pattern: string) {
	return pattern.replaceAll('\n', '').replaceAll('|', '\n\t')
}

export function titleToPattern(title: string) {
	return title.replaceAll('\n\t', '|')
}


export async function dataviewQuery(queries: string[]) {
	let querying = queries.map((query: string) => DataviewAPI.query(`list from ${query}`))
	let results = await Promise.all(querying)
	return results.map(result => {
		result = result.value;
		const primaryMeaning = result.primaryMeaning.type
		return result.values.map((ft: any) => ft[primaryMeaning])
	})
}

export async function loopPatterns(patterns: string, callback: (a: Pattern) => decodeAndRunOpts) {
	var lastOpts = {}
	for (let pattern of patterns.matchAll(/\|[^|]+/g)) {
		let patternFields = parsePattern(String(pattern), PATTERN)!
		let opts: decodeAndRunOpts = await callback(patternFields)
		lastOpts = opts || lastOpts
		const {vars = {}, file} = opts
		const data = await getFileData(file, vars)
		const {expression, target} = patternFields
		await processPattern(expression, target, patterns, data)
	}
	return loopPatterns(patterns, callback)
}

export async function resolveOptions(options: string) {
	const optionsResults: inputOption = []
	if (!options) return optionsResults
	const prefix = DataviewAPI.settings.inlineQueryPrefix
	for (let opt of options.split(',')) {
		opt = opt.trim()
		if (prefix && opt.startsWith(prefix)) {
			const {value} = await DataviewAPI.query(`list from ${opt.slice(prefix.length)}`)
			const primaryMeaning = value.primaryMeaning.type
			optionsResults.push(
				...value.values.map((ft: any) => ({text: ft[primaryMeaning], value: ft}))
			)
		} else {
			const [text, value = text] = opt.split(/:/)
			optionsResults.push({text, value})
		}

	}
	return optionsResults
}

