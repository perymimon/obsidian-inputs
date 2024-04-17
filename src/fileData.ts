// update cache with inline-field meta data
import {CachedMetadata, TFile} from "obsidian";
import {cleanString} from "./strings";
import {Field, reachStructure} from "./types";
import {app} from "./main";
import {getTFile} from "./files";
import {setPrototype} from "./objects";

export function getFileStructure(path?: string | TFile): reachStructure {
	let file = getTFile(path)
	if (!file) return {dirty: true}
	var cache = app.metadataCache.getFileCache(file)
	if (!cache) return {dirty: true}
	return cache as reachStructure
}


export async function waitFileStructure(tFile: TFile) {
	var time = 10
	do {
		await sleep(time)
		if (time > 2000) throw `more then 2s and the file ${tFile.path} not ready`
		var data = getFileStructure(tFile)
		time *= 2
	} while (data.dirty)
	return data
}

export async function updateFileStructure(tFile: TFile) {
	let cache = await waitFileStructure(tFile)
	if (!cache) throw `No cache found. for ${tFile.path}`;

	const content = await app.vault.cachedRead(tFile)
	const inlineFields = getInlineFields(content)

	const fieldsObject: object = inlineFields.reduce(
		(obj, line) => (obj[line.key] = line.value, obj), {}
	)
	cache.allInlineFields = inlineFields
	cache.inlineFields = fieldsObject
	cache.dirty = false
	return cache as reachStructure
}


export function getInlineFields(content: string, key?: string): Field[] {
	// const regex = /\[\s*(.*?)\s*::(.*?)]|\b(.*?)::(.*?)$|\(\s*(.*?)\s*::(.*?)\)/gm
	var def = '.*?', freeDef = '[^\\s]+'
	// const regex = new RegExp(`(\\[)(\\s*${key || def}\\s*)::(.*?)(\\])|(\\()(\\s*${key || def}\\s*)::(.*?)(\\))|()(${key ||freeDef})::(.*?)()$`, 'gm')
	var cleanContent = cleanString(content, {inlineField: false})
	const patterns = [
		new RegExp(`(\\[)(\\s*${key || def}\\s*)::(.*?)(\\])`, 'gm'),
		new RegExp(`(\\()(\\s*${key || def}\\s*)::(.*?)(\\))`, 'gm'),
		new RegExp(`()(${key ||freeDef})::(.*?)()$`, 'gm')
	]
	const fields: Field[] = [];
	let match;
	for (let inlinePattern of patterns) {
		cleanContent = cleanContent.replace(inlinePattern, (...match) => {
			const [field] = Array.from(match).filter(Boolean);
			const index = match.at(-2)
			var [startOffset, endOffset] = [index, index + field.length]
			var outerField = content.slice(startOffset, endOffset)
			var innerField = outerField.replace(/^[(\[]|[)\]]$/g, '')
			var [fullKey = '', fullValue = ''] = innerField.split('::')
			let [key, value] = [fullKey, fullValue].map(t => t.trim())
			let withBracket = !(outerField.length == innerField.length)

			let startKey = startOffset + (withBracket as unknown as number),
				endKey = startKey + fullKey.length,
				startValue = endKey + 2,
				endValue = startValue + fullValue.length
			fields.push({
				isRound: outerField[0] == '[',
				isSquare: outerField[0] == '(',
				outerField, innerField, key, value, fullKey, oldValue: fullValue,
				offset: [startOffset, endOffset],
				keyOffset: [startKey, endKey],
				valueOffset: [startValue, endValue]
			})
			return '_'.repeat(field.length)
		})
	}
	// while ((match = regex.exec(cleanContent)) !== null) {
	// 	// note to myself: don't take values from clean content
	//
	// }

	return fields.sort((f1, f2) => f1.offset[0] - f2.offset[0])
}
