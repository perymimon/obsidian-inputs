// @ts-nocheck1
import {TFile, moment} from "obsidian";
import {setPrototype} from "./objects";
import * as api from './api';
import {log, parsePattern, parserTarget, Target} from "./internalApi";
import {stringTemplate} from "./strings";
import {Priority, CachedStructure, targetFile} from "./types";
import {
	getTFileContent, getTFile, letTFile,
	isFileNotation, modifyFileContent
} from "./files";
import {quickFile, quickHeader, quickText, setFrontmatter, setInlineField} from "./quicky.ts";
import {executeCode, importJs} from "./jsEngine";
import {PATTERN} from "./main";


var app = globalThis.app

export function link(path: TFile | string): string {
	var file = getTFile(path?.path || path)
	if (!file) return path as any
	var filename = app.metadataCache.fileToLinktext(file, '', true)
	return `[[${filename}]]`
}

/**
 * time calculation
 * @param start
 * @param end
 * @param format
 * @param as
 */
export function duration(start: string, end: string, format = 'HH:mm', as = 'hours') {
	var from = moment(start, format)
	var to = moment(end, format)
	return moment.duration(to.diff(from)).humanize()
}


// https://github.com/SilentVoid13/Templater/blob/26c35559bd63765f6078d43f6febd53435530741/src/core/Templater.ts#L110
/**
 *  create_running_config(
 *         template_file: TFile | undefined,
 *         target_file: TFile,
 *         run_mode: RunMode
 *     ): RunningConfig {
 *         const active_file = get_active_file(app);
 *
 *         return {
 *             template_file: template_file,
 *             target_file: target_file,
 *             run_mode: run_mode,
 *             active_file: active_file,
 *         };
 *     }
 */
export async function templater(templateContent: string, port? = {}, targetFile?: targetFile) {
	const {templater} = app.plugins.plugins['templater-obsidian'];
	targetFile = await letTFile(targetFile)
	const runningConfig = templater.create_running_config(void 0, targetFile, 0)
	const content = await templater.parse_template({...runningConfig, port}, templateContent)
	return content
}


//\[(.+?::.+?)\]|\((.+?::.+?)\)|\b(\S+?::.+?)$
// https://regex101.com/r/BExhmA/1

/**
 * text run over string template the reuslt is check again some rules
 * if expression surround by [[]] it is a file to import and run
 * if expression can run without exception it JS and evaluates value is return
 * if it throw it return as literal text
 * @param preExpression
 * @param priority
 * @param vars
 * @param file
 */
type decodeAndRunOpts = {
	priority?: Priority | string,
	vars?: {},
	file?: targetFile,
	// literalExpression?: boolean
	// notImport?: boolean,
	// allowImportedLinks?: boolean
}

export async function decodeAndRun(expression: string | undefined, opts: decodeAndRunOpts = {}) {
	if (!expression || expression.trim() == '') return ''
	const {vars = {}, file} = opts
	var result = '', type = ''

	try {
		var importTest = /^\s*import\s*/gm
		imported: if (importTest.test(expression)) {
			expression = expression.replace(importTest, '')
			if (!isFileNotation(expression)) break imported
			var tFile = getTFile(expression)
			if (!tFile) break imported
			globalThis.live = api
			if (tFile.path.endsWith('js')) {
				var result = await importJs(tFile)
				type = 'imported'
				return result.default ?? void 0
			} else if (tFile.path.endsWith('md')) {
				var content = await getTFileContent(tFile)
				type = 'templater'
				result = await templater(content, api)
				return result
			}
		}

		type = 'executed'
		result = await executeCode(expression, vars, file, void 0, false)
			.catch(e => (type = 'literal', expression))
		return result
	} finally {
		delete globalThis.live
		var strings = [`evaluate "${expression}"`]
		if (type == 'imported') strings.push(`\n import "${tFile.path}"`)
		if (type == 'templater') strings.push(`\n templater "${tFile.path}" content`)
		if (type == 'executed') strings.push(`\n return ${result} `)
		if (type == 'literal') strings.push(`\n return it as literal text`)

		log('decodeAndRun', strings.join(''), result)
	}
}

export async function saveValue(text: string | number, target: Target) {
	const {file, targetType, path, method} = target
	if (text == void 0) return `no save because value is undefined`
	// if (String(text).trim() == '' && !(targetType == 'file' || method == 'create')) {
	// 	return 'no save because text value is empty'
	// }
	switch (targetType) {
		case 'yaml':
			return await setFrontmatter(text, path, method, file)
		case 'file':
			return await quickFile(text, target, true)
	}
	var newContent = ''
	var tFile = await letTFile(file)
	var content = await getTFileContent(tFile)
	switch (targetType) {
		case 'field':
			newContent = setInlineField(content, text, target)
			break

		case 'header':
			newContent = quickHeader(content, text, target)
			break

		case 'pattern':
			newContent = quickText(content, text, target)
			break

	}
	await modifyFileContent(tFile, newContent)
	return
}

export async function processPattern(preExpression: string, preTarget: string, pattern: string, opts: decodeAndRunOpts = {}) {
	const {vars = {}, file} = opts

	let expression = await stringTemplate(preExpression, vars, file)
	let target = await stringTemplate(preTarget, vars, file)
	const targetObject = parserTarget(target)
	targetObject.pattern = pattern
	let text = await decodeAndRun(expression.trim(), {
		priority: targetObject.targetType,
		...opts
	})
	await saveValue(text, targetObject)

	return {
		targetObject, expression,
		value: text
	}
}

export async function runSequence(patterns: string, opts: decodeAndRunOpts = {}) {
	for (let pattern of patterns.matchAll(/\|[^|]+/g)) {
		let {expression, target} = parsePattern(String(pattern), PATTERN)!
		if (expression.trim() == '')
			if (opts.defaultExpertion) expression = opts.defaultExpertion
			else return null
		await processPattern(expression, target, String(pattern), opts)
	}
}
