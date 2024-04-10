// @ts-nocheck
import {TFile, moment} from "obsidian";
import {setPrototype} from "./objects";
import * as api from './api';
import {
	getActiveFile, log, parserTarget, addToContextList,
	Target
} from "./internalApi";
import {stringTemplate} from "./strings";
import {Priority} from "./types";
import {
	getFreeFileName,
	waitFileIsReady,
	markFileAsDirty,
	getTFileContent,
	isFileNotation
} from "./files";
import {quickFile, quickHeader, quickText, setFrontmatter, setInlineField} from "./quicky.ts";
import {executeCode, importJs} from "./jsEngine";

// context
const lastTouchFiles: TFile[] = []
const lastCreatedFiles: TFile[] = []


var app = globalThis.app

export function link(path: TFile | string): string {
	var file = getTFileIfExist(path?.path || path)
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

export type targetFile = TFile | string

export async function updateFile(path: targetFile, content: string) {
	let tFile = await letTFile(path);
	await app.vault.modify(tFile, content)
	markFileAsDirty(tFile)
	await waitFileIsReady(tFile)
	addToContextList(tFile, lastTouchFiles)
}

export function getTFile(path?: targetFile): TFile {
	if (path instanceof TFile) return path as TFile;
	path = (path || '').trim()
	if (!path || path == 'activeFile') return getActiveFile()
	path = (path.startsWith('[[') && path.endsWith(']]')) ? path.slice(2, -2) : path
	return app.metadataCache.getFirstLinkpathDest(path, "")
}

export async function letTFile(path?: targetFile): Promise<TFile> {
	let tFile = getTFile(path)
	if (tFile) return tFile
	// if (!autoCreate) return null
	return await createTFile(path)
}

export async function createTFile(path: targetFile, text: string = '') {
	var pathName = getFreeFileName(path)
	var folders = path.split('/').slice(0, -1).join('/')
	await app.vault.createFolder(folders).catch(_ => _)
	const tFile = await app.vault.create(pathName, String(text))
	await waitFileIsReady(tFile)
	addToContextList(tFile, lastCreatedFiles)
	addToContextList(tFile, lastTouchFiles)
	return tFile
}


export function getStructure(path?: string | TFile) {
	let file = getTFile(path)
	if (!file) return {dirty: true}
	return app.metadataCache.getFileCache(file) ?? {dirty: true}
}

/**
 * @param file
 * @param priority 'yaml'|'field'
 */
export function getFileData(file?: targetFile, priority: Priority = 'field') {
	const context: any = {}
	for (let i in lastTouchFiles) context[`page${i}`] = lastTouchFiles[i]
	for (let i in lastCreatedFiles) context[`new${i}`] = lastCreatedFiles[i]
	let tFile = getTFile(file)
	if (!tFile) return context
	const {frontmatter = {}, inlineFields = {}, dirty} = getStructure(tFile)
	context.dirty = dirty
	if (priority == 'field') return setPrototype(inlineFields, frontmatter, context)
	if (priority == 'yaml') return setPrototype(frontmatter, inlineFields, context)
	return setPrototype(inlineFields, frontmatter, context)
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
				result = await importJs(tFile)
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
			newContent = quickText(text, target)
			break

	}
	await updateFile(tFile, newContent)
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
