import {App, TFile} from "obsidian";
import {objectSet} from "./objects";
import * as api from './api';
import {asyncEval, getActiveFile, getDVInlineFields, parseTarget, setPrototype} from "./internalApi";
import {stringTemplate} from "./strings";

var app = global.app


export function getLinkToFile(file: TFile) {
	return app.metadataCache.fileToLinktext(file, '', true)
}


export function getTFile(path?: TFile | string): TFile {
	if (!path) return getActiveFile()
	if (path instanceof TFile) return path as TFile;
	path = (path.startsWith('[[') && path.endsWith(']]')) ? path.slice(2, -2) : path
	let tFile = app.metadataCache.getFirstLinkpathDest(path, "")
	if (!tFile) throw `"${path}" file is not exist`
	return tFile
}

export function getStructure(path?: string | TFile) {
	let file = getTFile(path)
	return this.app.metadataCache.getFileCache(file)
	// if (path instanceof TFile)
	// 	return this.app.metadataCache.getFileCache(path)
	// if (!path.endsWith('.md')) path += '.md'
	// return app.metadataCache.getCache(path)
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

export async function executeCode(code: string, contextFile?: string | TFile, priority?: string) {
	var fields = await getFileData(contextFile, priority)
	return asyncEval(code, fields, api)
}

/**
 *
 * @param file
 * @param priority 'yaml'|'field'
 */
export async function getFileData(file?: string | TFile, priority?: 'yaml' | 'field' | string = 'field') {
	const dv = getPlugin('dataview')
	file = getTFile(file)
	if (dv) {
		return dv.api.page(file.path)
	}
	const {frontmatter} = getStructure(file)
	const inlineFields = await getDVInlineFields(file)
	const fieldsObject = inlineFields.reduce((obj, line) => (obj[line.key] = line.content, obj), {})
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

export async function setFrontmatter(value, path, method, file) {
	file = getTFile(file)
	await app.fileManager.processFrontMatter(file, obj => {
		return objectSet(obj, path, value, method)
	})
}

//\[(.+?::.+?)\]|\((.+?::.+?)\)|\b(\S+?::.+?)$
// https://regex101.com/r/BExhmA/1
export async function setDVInlineFields(value, key, method = 'replace', file?) {
	file = getTFile(file)
	const findNotation = [
		new RegExp(`\\[(${key})::(.*?)\\]`),
		new RegExp(`\\((${key})::(.*?)\\)`),
		new RegExp(`\\b(${key})::(.*?)$`, 'm')
	]

	await app.vault.process(file, (content: string) => {
		for (let notation of findNotation) {
			const match = content.match(notation)
			if (!match) continue
			const [field, key, oldValue] = match
			switch (method) {
				case 'replace':
				case 'append':
				case 'prepend':
					let demi = {[key]: oldValue.split(',').filter(Boolean)}
					objectSet(demi, key, value, method)
					value = demi[key].join(',')
					break;
				case 'delete':
					return content.replace(field, '')
				case 'clear':
					value = ''
					break;
				default:
					throw new Error('Invalid method');
			}
			const newField = field.replace(/(?<=::).*?(?=\]|\)|$)/, value)
			return content.replace(field, newField)
		}
		// not found case, so add new field on top of the file
		var {frontmatterPosition} = getStructure(file)
		var offset = frontmatterPosition.end.offset
		return [
			content.slice(0, offset),
			`\n[${key}::${value}]`,
			content.slice(offset)
		].join('\n')
	})
}


/**
 * @param text
 * @param location filename#heading | filename | #heading | pattern
 * @param method append|prepend|replace
 * @param file
 */
async function quickText(text: string, location: string, method = "append", file?) {
	if (method == 'replace') {
		return await app.vault.process(file, (content: string) => {
			return content.replace(location, text)
		})
	}
	const [filename, heading] = location.split(/#/);
	file = getTFile(filename);
	if (heading) {
		var {headings, sections, frontmatterPosition} = getStructure(file);
		var header = headings.find((item) => item.heading == heading);
	}
	return await app.vault.process(file, (content) => {
		let lines = content.split("\n");
		var pos = 0;
		if (method == "prepend") {
			pos = header ? header.position.start.line : frontmatterPosition.end.line;
		}
		if (method == "append") {
			pos = header ? header.position.end.line : lines.length;
		}
		lines.splice(pos + 1, 0, text);
		return lines.join("\n");
	});
}

/**
 * text run over string template the reuslt is check again some rules
 * if expression surround by [[]] it is a file to import and run
 * if expression can run without exception it JS and evaluates value is return
 * if it throw it return as literal text
 * @param expression
 * @param file
 */
export async function decodeAndRun(expression: string, priority: string, file?: TFile,) {
	const data = await getFileData(file, priority)
	const prerun = (await stringTemplate(expression.trim(), data)).trim()
	try {
		if (prerun.startsWith('[[') && prerun.endsWith(']]')) {
			global.live = api
			const ret = await importJs(prerun)
			return ret.default ?? void 0
		}
		return await executeCode(prerun, file)
	} catch {
		// literal string
		return prerun
	} finally {
		delete global.live
	}
}

export async function saveValue(value: string, target: string = "", file?: TFile) {
	file = getTFile(file)
	target = target.trim()
	const {targetType, path, method} = parseTarget(target)
	switch (targetType) {
		case 'field':
			return await setDVInlineFields(value, path, method, file)
		case 'yaml':
			return await setFrontmatter(value, path, method, file)
		case 'header':
		default:
			return await quickText(value, path, method, file)
	}
}
