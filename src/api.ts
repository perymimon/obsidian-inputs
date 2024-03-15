// @ts-nocheck1
import {normalizePath, TFile, moment, PopoverState} from "obsidian";
import {objectSet} from "./objects";
import * as api from './api';
import {
	asyncEval, Field,
	getActiveFile,
	getInlineFields, isFileNotation, log, logDecodeAndRun, parseTarget,
	setPrototype, Target
} from "./internalApi";
import {manipulateValue, sliceRemover, spliceString, stringTemplate} from "./strings";
import {Priority} from "./types";
// declare const moment: (...args: any[]) => any;
const context: {
	lastCreatedFile: TFile | null
} = {
	lastCreatedFile: null
}

var app = global.app

export function link(path: TFile | string) {
	var file = getTFileIfExist(path?.path || path)
	if(!file) return path
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

export function getTFileIfExist(path: string): TFile | null {
	path = (path.startsWith('[[') && path.endsWith(']]')) ? path.slice(2, -2) : path
	let tFile = app.metadataCache.getFirstLinkpathDest(path, "")
	return tFile;
}

export function getTFileSync(path?: targetFile): TFile | null {
	if (path instanceof TFile) return path as TFile;
	path = (path || '').trim()
	if (!path || path == 'activeFile') return getActiveFile()
	return getTFileIfExist(path)
}

export async function getTFile(path?: targetFile, autoCreate = true): Promise<TFile | null> {
	let tFile = getTFileSync(path)
	if (tFile) return tFile
	if (!autoCreate) return null
	return await createTFile(path)
}

export async function createTFile(path: targetFile, text: string = '') {
	if (path instanceof TFile) path = path.path;
	let index = 0, pathName;
	do {
		pathName = index ? `${path} ${index}` : path
		pathName = pathName.replace(/(\.md)?$/, '.md')
		index++
		var file = app.vault.getFileByPath(pathName)
	} while (file)
	var folders = path.split('/').slice(0, -1).join('/')
	// if(!app.vault.getFolderByPath(folders))
	await app.vault.createFolder(folders).catch(_ => _)
	const tFile = await app.vault.create(pathName, String(text))
	context[lastCreated]
	return tFile

}

export async function removeFile(path: targetFile) {
	var tFile = getTFileSync(path)
	if (!tFile) return
	await app.vault.delete(tFile!)
}

export async function getTFileContent(tFile: TFile) {
	return await app.vault.read(tFile)
}

export async function getStructure(path?: string | TFile) {
	let file = await getTFile(path)
	return this.app.metadataCache.getFileCache(file) ?? {}
}

export async function importJs(path: TFile | string): Promise<unknown> {
	var tFile = await getTFile(path)
	if (!TFile) throw `${path} file is not exist`
	path = tFile.path
	let fullPath = app.vault.adapter.getResourcePath(path);
	let timestamp = new Date().getTime();
	let busterPath = fullPath.replace(/\?.*$/, `?${timestamp}`)
	return import(busterPath);
}

export async function executeCode(code: string, vars, contextFile?: string | TFile, priority?: Priority, debug?: boolean) {
	var fields = await getFileData(contextFile, priority)
	for (let k in fields) fields[k] = Number(fields[k]) || fields[k]
	return asyncEval(code, {...fields, ...vars}, api, 'api', debug)
}

/**
 * @param file
 * @param priority 'yaml'|'field'
 */
export async function getFileData(file?: string | TFile, priority: Priority  = 'field') {
	// const dv = getPlugin('dataview')
	let tFile = await getTFile(file)
	// if (dv) {
	// 	return dv.api.page(file.path)
	// }
	const content = await this.app.vault.cachedRead(tFile);
	const {frontmatter = {}} = getStructure(tFile)
	const inlineFields = await getInlineFields(content)
	const fieldsObject = inlineFields.reduce((obj, line) => (obj[line.key] = line.value, obj), {})
	if (priority == 'field') return setPrototype(fieldsObject, frontmatter)
	if (priority == 'yaml') return setPrototype(frontmatter, fieldsObject)
	return setPrototype(fieldsObject, frontmatter)
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
	const {templater} = app.plugins.getPlugin['templater-obsidian'];
	targetFile = await getTFile(targetFile)
	const runningConfig = templater.create_running_config(void 0, targetFile, 0)
	const content = await templater.parse_template({...runningConfig, port}, templateContent)
	return content
}

export async function setFrontmatter(value, path, method = 'replace', file) {
	file = await getTFile(file)
	await app.fileManager.processFrontMatter(file, obj => {
		return objectSet(obj, path, value, method)
	})
}

//\[(.+?::.+?)\]|\((.+?::.+?)\)|\b(\S+?::.+?)$
// https://regex101.com/r/BExhmA/1
export async function setInlineField(value: string, key: string, method = 'replace', file?: targetFile) {
	const tFile = (await getTFile(file))!
	var content = await app.vault.read(tFile)
	var fieldDesc = getInlineFields(content, key)
	var newContent = ''
	if (fieldDesc.length) { // field exist
		let {outerField, fullValue, offset} = fieldDesc.at(0) as Field
		let [startIndex, endIndex] = offset
		var newField
		if (method == 'remove') newField = ''
		else {
			value = manipulateValue(fullValue, value, method)
			newField = outerField.replace(`::${fullValue}`, `::${value}`)
		}
		if (outerField == newField) return false
			`inline field update from "${outerField}" to "${newField}"`
		newContent = [content.slice(0, startIndex), newField, content.slice(endIndex)].join('')
	} else { // create field it not exist
		if (method == 'remove') return 'no field detected'
		var {frontmatterPosition} = await getStructure(file)
		var offset = frontmatterPosition?.end.offset + 1 ?? 0
		newContent = spliceString(content, offset, 0, `[${key}::${value}]\n`)
		// newContent = [content.slice(0, offset), field, content.slice(offset)].join('\n')
	}
	await app.vault.modify(tFile, newContent)
}

/**
 * - if there is no header or file method related to textInput|button himself
 * append - add text after the current textInput|button
 * prepend - add text before the current textInput|button
 * replace - replace the notation of textInput|button with the given text
 *
 * - if there is header without file. file implicit is activefile
 * append - add text at the end of the header section
 * prepend - add text at the top of the header section
 * replace - replace the text of the under the section header
 * - if there is file without header.
 * append - add text at the bottom of the file
 * prepend - add text at the top of the file, under the section of frontmatter
 * replace - not care what it's do
 * @param text
 * @param target
 * @returns {Promise<string>}
 */

async function quickText(text: string, target: Target) {
	const {file, pattern, method = 'replace'} = target
	const tFile = await getTFile(file)
	var content = await app.vault.read(tFile)

	if (method == "clear") {
		var startPatternIndex = content.indexOf(pattern)
		var startLineIndex = content.lastIndexOf('\n', startPatternIndex) + 1
		var line = content.slice(startLineIndex, startPatternIndex)
		var field = getInlineFields(line).pop()
		var slice = [startLineIndex, startPatternIndex]
		if (field) {
			let {offset, valueOffset, value} = field
			let stopPoints = [
				[offset[1]], valueOffset, [offset[0]], [0]
			]
			slice = stopPoints.find(slice => slice[0] < line.length).map(i => i + startLineIndex)
		}
		let [indexStart, indexEnd = startPatternIndex] = slice
		newContent = sliceRemover(content, indexStart, indexEnd)
	} else {
		var newContent = content.replace(pattern, (match) => {
			if (method == "append") return `${match}${text}`
			if (method == "prepend") return `${text}${match}`
			if (method == "replace") return text
			if (method == "remove") return ''
			return `${method} method is not legal here`
		})
	}
	if (newContent == content) return;
	await app.vault.modify(tFile, newContent)
}

/**
 * can append to top of file or bottom of it
 * can create file and if file exist create another one
 *
 * @param text
 * @param target
 * @param create create if not exist
 */
async function quickFile(text: string, target: Target, create = false) {
	var {file, method = 'append',} = target
	var tFile = await getTFile(file, false) as TFile
	if (!tFile && create) method = 'create'

	if (method == 'create')
		return await createTFile(file, text)
	if (method == 'remove')
		return await removeFile(file)

	const {frontmatterPosition} = await getStructure(file);
	var content = await app.vault.read(tFile)
	var offset = (frontmatterPosition?.end.offset || -1) + 1
	let lines = content.slice(offset).split("\n");

	// top,bottom, replace file content
	if (method == "prepend") lines.unshift(text)
	if (method == "replace") lines = [text]
	if (method == "append") lines.push(text)
	if (method == "clear") lines.length = 0
	await app.vault.modify(tFile, lines.join("\n"))
	return tFile
}

/**
 * prepend or append or replace content under header
 * if header not exist stuff start be intersting
 * 1) append: create the header with the text on top file
 * 2) prepend: create the header iwht the text on bottom file
 * 3) replace : changed to prepend
 * @param text
 * @param target
 */
async function quickHeader(text: string, target: Target) {
	var {file, path, method = 'append'} = target;
	const {headings = [], frontmatterPosition} = await getStructure(file);
	const tFile = (await getTFile(file))!;
	var content = await app.vault.read(tFile);

	var iHeader = headings?.findIndex((item) => item.heading == path.trim());
	// If header not exist default is to add to start of file,unless method is append
	if (iHeader == -1) text = `## ${path}\n${text}`;
	if (iHeader == -1 && method == 'replace') method = 'prepend';
	if (iHeader == -1 && method == 'append') iHeader = headings.length - 1;
	if (iHeader == -1 && method == 'remove') return;

	let [h, hNext] = headings.slice(iHeader)
	let [startOffset, endOffset] = [
		(h?.position.end.offset ?? frontmatterPosition?.end.offset ?? -1) + 1,
		(hNext?.position.start.offset ?? content.length)
	];
	if (method == 'remove') startOffset = h?.position.start.offset;

	const headerContent = content.slice(startOffset, endOffset).replace(/\n\s*$/g, '');
	const headerContentLines = headerContent.split('\n')

	if (method == "append") headerContentLines.push(text)
	if (method == "prepend") headerContentLines.unshift(text)
	if (method == "clear") headerContentLines.length = 0
	if (method == "replace") headerContentLines.splice(0, Infinity, text)
	if (method == "remove") headerContentLines.length = 0

	content = spliceString(content, startOffset, headerContent.length, headerContentLines.join('\n'))

	await app.vault.modify(tFile, content);
	log('quickHeader', `${file} ${path} ${method}`);
}

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
	priority?: Priority,
	vars?: {},
	file?: targetFile,
	literalExpression?: boolean
	notImport?: boolean,
	allowImportedLinks?: boolean

}

export async function decodeAndRun(expression: string | undefined, opts: decodeAndRunOpts = {}) {
	if (!expression || expression.trim() == '') return ''
	const {vars = {}, file, literalExpression = false, allowImportedLinks = true} = opts
	var result = '', type = ''
	try {
		if (literalExpression) throw 'ask for literal expression string'
		imported: if (allowImportedLinks) {
			if (!isFileNotation(expression)) break imported
			const tFile = await getTFile(expression)
			if (!tFile) break imported
			global.live = api
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

		type = 'excuted'
		result = await executeCode(expression, vars, file)
		return result
	} catch (e) {
		// literal string
		type = 'literal'
		return expression
	} finally {
		delete global.live
		logDecodeAndRun(expression, expression, type, result)
	}
}

export async function saveValue(text: string, target: Target) {
	const {file, targetType, path, method} = target
	if (!text && !(targetType == 'file' || method == 'create')) {
		return 'no save because text is empty'
	}
	switch (targetType) {
		case 'field':
			return await setInlineField(text, path, method, file)
		case 'yaml':
			return await setFrontmatter(text, path, method, file)
		case 'text':
			if (!method) {
				console.log('save', text, target)
				break;
			}
			break
		case 'header':
			return await quickHeader(text, target)
		case 'file':
			return await quickFile(text, target, true)
		case 'pattern':
			return await quickText(text, target)

	}
}

export async function processPattern(expression: string, target: string, opts: decodeAndRunOpts  = {}) {
	const {priority, vars = {}, file} = opts
	expression = await stringTemplate(expression, vars, file)
	target = await stringTemplate(target, vars, file)
	const targetObject = parseTarget(target)
	(await stringTemplate(expression, vars, file, priority)).trim()
	let text = await decodeAndRun(expression, {
		priority: targetObject.targetType,
		...opts
	})
	await saveValue(text, targetObject)
}
