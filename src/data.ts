// update cache with inline-field meta data
import type {TFile} from "obsidian";
import {Priority, CachedStructure, targetFile} from "./types";
import {getTFile, lastCreatedFiles, lastTouchFiles} from "./files";
import {setPrototype} from "./basics/objects";
import {getInlineFields} from "./data.inlineFields";

/**
 * @param file
 * @param priority 'yaml'|'field'
 */
const app = globalThis.app;

export function getFileData(file?: targetFile, extraVars = {}, priority: Priority = 'field') {
	const context: any = {}
	for (let i in lastTouchFiles) context[`page${i}`] = lastTouchFiles[i]
	for (let i in lastCreatedFiles) context[`new${i}`] = lastCreatedFiles[i]
	let tFile = getTFile(file)
	if (!tFile) return context
	const {frontmatter = {}, inlineFields = {}, dirty} = getFileStructure(tFile)
	context.dirty = dirty
	if (priority == 'field') return setPrototype(extraVars, inlineFields, frontmatter, context)
	if (priority == 'yaml') return setPrototype(extraVars, frontmatter, inlineFields, context)
	return setPrototype(extraVars, inlineFields, frontmatter, context)
}

export function getFileStructure(file?: targetFile): CachedStructure {
	let tFile = getTFile(file)
	if (!tFile) return {dirty: true}
	var cache = app.metadataCache.getFileCache(tFile)
	if (!cache) return {dirty: true}
	return cache as CachedStructure
}


export async function waitFileStructureReady(tFile: TFile) {
	var time = 10
	do {
		await sleep(time)
		if (time > 2000) throw `more then 2s and the file ${tFile.path} not ready`
		var data = getFileStructure(tFile)
		time *= 2
	} while (data.dirty)
	return data
}

export async function refreshFileStructure(targetFile?: targetFile) {
	let tFile = getTFile(targetFile)
	let cache = await waitFileStructureReady(tFile)
	if (!cache) throw `No cache found. for ${tFile.path}`;

	const content = await app.vault.cachedRead(tFile)
	const inlineFields = getInlineFields(content)

	const fieldsObject: object = inlineFields.reduce(
		(obj, line) => (obj[line.key] = line.value, obj), {}
	)
	cache.allInlineFields = inlineFields
	cache.inlineFields = fieldsObject
	cache.dirty = false
	return cache as CachedStructure
}


