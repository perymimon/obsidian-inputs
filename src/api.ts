import {normalizePath, TFile} from "obsidian";
import {objectSet} from "./objects";
import * as api from './api';
import {
	asyncEval,
	getActiveFile,
	getInlineFields, log, manipulateValue,
	setPrototype,
	Target
} from "./internalApi";
import {stringTemplate} from "./strings";

var app = global.app

export function link(file: TFile | string) {
	file = getTFile(file?.path || file)
	var filename = app.metadataCache.fileToLinktext(file, '', true)
	return `[[${filename}]]`
}

export function duration(start, end, format = 'HH:mm', as = 'hours') {
	var from = moment(start, format)
	var to = moment(end, format)
	return moment.duration(to.diff(from)).humanize()
}

export function getTFile(path?: TFile | string): TFile {
	if (String.isString(path)) path = path.trim()
	if (!path || path == 'activeFile') return getActiveFile()
	if (path instanceof TFile) return path as TFile;
	path = (path.startsWith('[[') && path.endsWith(']]')) ? path.slice(2, -2) : path
	let tFile = app.metadataCache.getFirstLinkpathDest(path, "")
	if (!tFile) throw `"${path}" file is not exist`
	return tFile
}

export function getStructure(path?: string | TFile) {
	let file = getTFile(path)
	return this.app.metadataCache.getFileCache(file)
}

export async function importJs(path: string): Promise<unknown> {
	if (path.startsWith('[[') && path.endsWith(']]')) {
		path = path.slice(2, -2)
		let TFile = app.metadataCache.getFirstLinkpathDest(path, "")
		if (!TFile) throw `${path} file is not exist`
		path = TFile.path
	}
	let fullPath = app.vault.adapter.getResourcePath(path);
	let timestamp = new Date().getTime();
	let busterPath = fullPath.replace(/\?.*$/, `?${timestamp}`)
	return import(busterPath);
}

export async function executeCode(code: string, vars, contextFile?: string | TFile, priority?: string, debug?: boolean) {
	var fields = await getFileData(contextFile, priority)
	for (let k in fields) fields[k] = Number(fields[k]) || fields[k]
	return asyncEval(code, {...fields, ...vars}, api, 'api', debug)
}

/**
 * @param file
 * @param priority 'yaml'|'field'
 */
export async function getFileData(file?: string | TFile, priority?: 'yaml' | 'field' | string = 'field') {
	// const dv = getPlugin('dataview')
	file = getTFile(file)
	// if (dv) {
	// 	return dv.api.page(file.path)
	// }
	const content = await this.app.vault.cachedRead(file);
	const {frontmatter = {}} = getStructure(file)
	const inlineFields = await getInlineFields(content)
	const fieldsObject = inlineFields.reduce((obj, line) => (obj[line.key] = line.value, obj), {})
	if (priority == 'field') return setPrototype(fieldsObject, frontmatter)
	if (priority == 'yaml') return setPrototype(frontmatter, fieldsObject)
	return setPrototype(fieldsObject, frontmatter)
}

// https://github.com/SilentVoid13/Templater/blob/26c35559bd63765f6078d43f6febd53435530741/src/core/Templater.ts#L110
export async function templater(template: string, filename: string, port = {}) {
	const templ = getPlugin('templater-obsidian').templater;
	const targeTFile = await app.fileManager.createNewMarkdownFile("", filename ?? "Untitled")
	const templateFile = getTFile(template)
	const runningConfig = templ.create_running_config(templateFile, targeTFile, 0)
	const content = await templ.read_and_parse_template({...runningConfig, port})
	await app.vault.modify(targeTFile, content);
	return targeTFile
}

export async function createNoteFromTemplate(template, filename = "", folder = "", openNewNote) {
	const templater = getPlugin('templater-obsidian').templater;
	const templateFile = getTFile(template)
	return await templater.create_new_note_from_template(templateFile, folder, filename, openNewNote)
}

export async function appendTemplateToActiveFile(templateFile) {
	const templater = getPlugin('templater-obsidian').templater;
	return await templater.append_template_to_active_file(templateFile)
}

export async function getNewFileTemplateForFolder(folder) {
	const templater = getPlugin('templater-obsidian').templater;
	return await templater.create_new_note_from_template(template, folder, filename, openNewNote)
}

export function getPlugin(pluginId: string) {
	return app.plugins.getPlugin(pluginId);
}

export async function setFrontmatter(value, path, method = 'replace', file) {
	file = getTFile(file)
	await app.fileManager.processFrontMatter(file, obj => {
		return objectSet(obj, path, value, method)
	})
}
//\[(.+?::.+?)\]|\((.+?::.+?)\)|\b(\S+?::.+?)$

// https://regex101.com/r/BExhmA/1
export async function setInlineField(value: string, key: string, method = 'replace', file?) {
	const tFile = getTFile(file)
	var content = await app.vault.read(tFile)
	var fieldDesc = getInlineFields(content, key)
	var newContent = ''
	if (fieldDesc) { // field exist
		let {outerField, value: oldValue, startIndex, endIndex} = fieldDesc.at(0)
		var newField
		if (method == 'delete') newField = ''
		else {
			value = manipulateValue(oldValue, value, method)
			newField = outerField.replace(`::${oldValue}`, `::${value}`)
		}
		if (outerField == newField) return false
		newContent = [content.slice(0, startIndex), newField, content.slice(endIndex)].join('')
	} else { // field not exist, create one
		if (method == 'delete') return 'no field detected'
		var {frontmatterPosition} = getStructure(file)
		var offset = frontmatterPosition?.end.offset ?? 0
		let field = `[${key}::${value}]`
		newContent = [content.slice(0, offset), field, content.slice(offset)].join('\n')
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
// location: string, method = "append"
async function quickText(text: string, target: Target) {
	const {file, path, method = 'replace', targetType} = target
	const {headings = [], sections, frontmatterPosition} = getStructure(file);
	const tFile = getTFile(file)
	var content = await app.vault.read(tFile)
	let lines = content.split("\n");
	var pos, delCount = 0;
	if (file) {// top,bottom, replace file content
		if (method == "prepend") pos = frontmatterPosition.end.line
		if (method == "append") pos = lines.length
		content = lines.toSpliced(pos + 1, delCount, text).join("\n");
	} else { // append,prepend,replace pattern content
		content = content.replace(path, (match) => {
			if (method == "append") return `${match}${text}`
			if (method == "prepend") return `${text}${match}`
			if (method == "replace") return text
			return `${method} method is not legal here`
		})
	}
	await app.vault.modify(tFile, content)
}

/**
 * can append to top of file or bottom of it
 * can create file and if file exist create another one
 *
 * @param text
 * @param target
 * @param create create if not exist
 */
async function quickFile(text, target: Target, create = false) {
	var {file, method = 'append',} = target
	const {frontmatterPosition} = getStructure(file);
	try {
		var tFile = getTFile(file)
	} catch (e) {
		if (e.contains('file is not exist') && create) {
			method = 'create'
		} else throw e
	}
	if (method == 'create') {
		let index = 0;
		const pathName = file?.path ?? file
		do {
			var path = index ? `${file} ${index}` : pathName
			path = path.replace(/(\.md)?$/,'.md')
			tFile = await app.vault.getFileByPath(path, text)
			index++
		} while (tFile)

		return await app.vault.create(path, text)
	}

	var content = await app.vault.read(tFile)
	let lines = content.split("\n");
	var [line , delCount] = [
		(frontmatterPosition?.end.line + 1) || 0,
		0
	]

	// top,bottom, replace file content
	// if (method == "prepend") 'it is the default;
	if (method == "replace" ) delCount = lines.length - line
	if (method == "append") line = lines.length
	content = lines.toSpliced(line, delCount, text).join("\n");
	await app.vault.modify(tFile, content)
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
	var {file, path, method = 'append'} = target
	const {headings = [], frontmatterPosition} = getStructure(file);
	const tFile = getTFile(file)
	var content = await app.vault.read(tFile)
	let lines = content.split("\n");
	var pos, delCount = 0;

	var index = headings?.findIndex((item) => item.heading == path.trim())
	//if header not exist default is to add to start of file,unless method is append
	if (index == -1) text = `## ${path}\n${text}`
	if (index == -1 && method == 'replace') method = 'prepend'
	if (index == -1 && method == 'append') index = headings.length - 1
	const [startLine, endLine] = [
		(headings[index]?.position.end.line ?? frontmatterPosition?.end.line ?? -1) + 1,
		(headings[index + 1]?.position.start.line ?? lines.length) - 1
	]
	const headerContentLines = lines.slice(startLine, endLine + 1)
	while (headerContentLines.length) {
		let line = headerContentLines.at(-1).trim()
		if (line) break;
		headerContentLines.pop()
	}

	if (["prepend", "replace"].includes(method)) pos = startLine
	if (method == "append") pos = startLine + headerContentLines.length
	if (method == "replace") delCount = headerContentLines.length

	content = lines.toSpliced(pos, delCount, text).join("\n");
	await app.vault.modify(tFile, content)
	log('quickHeader', `${file} ${path} ${method}`)
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
	priority?: string,
	vars?: {},
	file?: TFile | string,
	literalExpression?: boolean
	notImport: boolean
}

export async function decodeAndRun(preExpression: string, opts: decodeAndRunOpts = {}) {
	const {priority, vars = {}, file, literalExpression = false, importJs = true} = opts
	if (preExpression.trim() == '') return ''
	log('decodeAndRun', 'preExpression', preExpression)
	const data = {...await getFileData(file, priority), ...vars}
	const expression = (await stringTemplate(preExpression.trim(), data)).trim()
	log('decodeAndRun', 'expression', expression)
	try {
		if (literalExpression) throw 'ask for literal expression string'
		if (importJs && expression.startsWith('[[') && expression.endsWith(']]')) {
			global.live = api
			log('decodeAndRun', 'importJs', expression)
			const ret = await importJs(expression)
			return ret.default ?? void 0
		}
		log('decodeAndRun', 'executeCode', expression, vars, file)
		return await executeCode(expression, vars, file)
	} catch {
		// literal string
		log('decodeAndRun', 'ret literal string', expression)
		return expression
	} finally {
		delete global.live
	}
}


export async function saveValue(text: string, target: Target) {
	const {file, targetType, path, method} = target
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
			return await quickFile(text, target)
		default:

	}
}
