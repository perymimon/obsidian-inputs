import {App, TFile} from "obsidian";

export * from "./logs";
var app = global.app


export function getLinkToFile(file: TFile) {
	return app.metadataCache.fileToLinktext(file, '', true)
}

function getActiveFile(): TFile {
	return app.workspace.activeEditor?.file ?? app.workspace.getActiveFile();
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

export async function executeCode(code, fileContext?: string | TFile) {
	const AsyncFunction = Object.getPrototypeOf(async function () {
	}).constructor
	const getDataFields = getDataFields(fileContext)
	const func = new AsyncFunction('dataFields', `with(dataFields){ return ${code} }`)
	return await func.call(this, getDataFields)
}

export async function getDataFields(file: string | TFile) {
	const dv = getPlugin('dataview')
	file = getTFile(file)
	if (dv) {
		return dv.api.page(file.path)
	}
	const {frontmatter} = getStructure(file)
	const inlineFields = getDVInlineFields(file)
	return {...frontmatter, ...inlineFields}
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


export async function getDVInlineFields(file: TFile) {
	if (!file) file = getActiveFile()

	const content = await this.app.vault.cachedRead(file);
	const regex = /[\[\(]?([^\n\r\(\[]*)::[ ]*([^\)\]\n\r]*)[\]\)]?/g;
	const properties = [];

	let match;
	while ((match = regex.exec(content)) !== null) {
		const key: string = match[1].trim();
		const value: string = match[2].trim();

		properties.push({key, content: value});
	}

	return properties;
}

//\[(.+?::.+?)\]|\((.+?::.+?)\)|\b(\S+?::.+?)$
// https://regex101.com/r/BExhmA/1
export async function setDVInlineFields(key, value, file?) {
	file = getTFile(file)
	const findNotation = [
		new RegExp(`\\[(${key})::(.+?)\\]`),
		new RegExp(`\\((${key})::(.+?)\\)`),
		new RegExp(`\\b(${key})::(.+?)$`)
	]

	await app.vault.process(file, (content: string) => {
		for( let notation of findNotation){
			const match = content.match(notation)
			if(!match ) continue
			const [field,key] = match
			const newField = field.replace(/(?<=::).*?(?=[\])])/, value)
			return content.replace(field, newField)
		}
		var {frontmatterPosition} = getStructure(file)
		var offset = frontmatterPosition.end.offset
		// append to top of file.
		return [content.slice(0,offset),`\n[${key}::${value}]`,content.slice(offset)].join('\n')
	})
}
