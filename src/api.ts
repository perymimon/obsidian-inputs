// @ts-nocheck1
import * as api from './api';
import {parseExpression, parsePattern, parserTarget} from "./internalApi";

export {stringTemplate, link} from "./basics/strings";
import {decodeAndRunOpts, DynamicModule, Expression, Target, targetFile} from "./types";
import {
	getTFileContent, letTFile,
	modifyFileContent
} from "./files";
import {quickFile, quickText, setFrontmatter, setInlineField} from "./quicky";
import {importJs, asyncEval} from "./basics/jsEngine";
import {PATTERN} from "./consts";
import {getFileData} from "./data";
import {traceExpression} from "./tracer";
import {getClosesInlineFieldToPattern, getInlineFields} from "./data.inlineFields";
import {quickHeader} from "./data.headers";
import { stringTemplate } from './basics/strings';

var app = globalThis.app

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
export async function templater(templateContent: string, port = {}, targetFile?: targetFile) {
	//@ts-ignore
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
 * @param expression
 * @param data
 */



export async function resolveExpression(data = {}, expression: string): Promise<Expression> {
	const status = parseExpression(expression)
	const {execute, type, file} = status

	if (type == 'import') {
		let object: DynamicModule = await importJs(file!)
		status.result = object?.default ?? void 0
	} else if (type == 'template') {
		var content = await getTFileContent(file!)
		status.result = await templater(content, api)
	} else if (type == 'executed') {
		try {
			//@ts-ignore
			globalThis.input = api
			status.result = await asyncEval(execute, data, api, false)
		} catch (e) {
			status.type = 'literal'
			status.result = execute
		} finally {
			//@ts-ignore
			delete globalThis.input
		}

	}
	return status

}

export async function saveValue(textValue: string | number, target: Target) {
	if (textValue == void 0) return `no save because value is undefined`
	// if (String(text).trim() == '' && !(targetType == 'file' || method == 'create')) {
	// 	return 'no save because text value is empty'
	// }
	textValue = String(textValue)
	const {file, targetType, path, method, pattern} = target
	switch (targetType) {
		case 'yaml':
			return await setFrontmatter(textValue, path, method, file)
		case 'file':
			return await quickFile(textValue, target, true)
	}
	var newContent = ''
	var tFile = await letTFile(file)
	var content = await getTFileContent(tFile)
	switch (targetType) {
		case 'field':
			var inlineFields = getInlineFields(content, path)
			var targetOffset = (content).indexOf(pattern)
			var inlineField = getClosesInlineFieldToPattern(inlineFields, targetOffset)
			newContent = setInlineField(content, inlineField, textValue, method)
			break

		case 'header':
			newContent = await quickHeader(textValue, target)
			break

		case 'pattern':
			newContent = quickText(content, textValue, target)
			break

	}
	if (content == newContent) return;
	await modifyFileContent(tFile, newContent)
	return
}

export async function processPattern(preExpression: string, preTarget: string, pattern: string, data = {}) {
	let expression = await stringTemplate(preExpression, data)
	let target = await stringTemplate(preTarget, data)

	const targetObject = parserTarget(target)
	targetObject.pattern = pattern
	let expressionObject = await resolveExpression(data, expression.trim())
	traceExpression(expressionObject)
	await saveValue(expressionObject.result, targetObject)

}
// patterns is a string of execution>target|execution>target|
export async function runSequence(patterns: string, opts: decodeAndRunOpts = {}) {
	const {vars = {}, file} = opts
	const data = await getFileData(file, vars)
	// type:setting | exe > trgt | exe>trgt
	const patterns1 = patterns.split('|').slice(1)

	for (let pattern of patterns1) {
		let {expression, target} = parsePattern('|' + String(pattern), PATTERN)!
		expression = (expression.trim() == '' && opts.defaultExpiration) ? opts.defaultExpiration : expression.trim()
		await processPattern(expression, target, String(pattern), data)
	}
}

