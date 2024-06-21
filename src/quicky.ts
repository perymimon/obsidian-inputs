// @ts-nocheck1
import {Target} from "./internalApi";
import {manipulateValue, sliceRemover, spliceString} from "./basics/strings";
import {createTFile, getTFile, letTFile, modifyFileContent, removeFile, renameFile} from "./files"
import type {TFile} from "obsidian";
import {objectSet} from "./basics/objects";
import {InlineField, targetFile} from "./types";
import {getFileStructure} from "./data";
import {log} from "./tracer";

const app = globalThis.app

export async function setFrontmatter(value: any, path: string, method: Target["method"] = 'replace', file: targetFile) {
	const tFile = await letTFile(file)
	// const frontmatter:FrontMatterInfo  = getFrontMatterInfo(content)
	// const {from, to} = frontmatter
	// yamlString = content.slice(from, to)
	// yaml = parseYaml(yamlString)
	// yaml = objectSet(obj, path, value, method)
	// yamlString = stringifyYaml(yaml)
	// content = spliceString2(content,from, to, yamlString)
	// return content
	await app.fileManager.processFrontMatter(tFile, obj => {
		return objectSet(obj, path, value, method)
	})
}

export function setInlineField(content: string, inlineField:InlineField | null,value:string, method: Target["method"] = 'replace'): string {
	var newContent = ''
	if (inlineField) { // field exist
		let {outerField, oldValue, offset} = inlineField
		let [startIndex, endIndex] = offset
		var newField
		if (method == 'remove') newField = ''
		else {
			value = manipulateValue(oldValue, value, method)
			newField = outerField.replace(`::${oldValue}`, `::${value}`)
		}
		if (outerField == newField) return content
		// log('setInlineField', `inline field update from "${outerField}" to "${newField}"`)
		newContent = [content.slice(0, startIndex), newField, content.slice(endIndex)].join('')
	} else { // create field it not exist
		if (method == 'remove') return content
		var {frontmatterPosition} = getFileStructure(tFile)
		var offset = frontmatterPosition?.end.offset + 1 ?? 0
		newContent = spliceString(content, offset, 0, `[${path}::${value}]\n`)
		// newContent = [content.slice(0, offset), field, content.slice(offset)].join('\n')
	}
	return newContent
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
 * @param content
 * @param text
 * @param target
 * @returns {Promise<string>}
 */
export function quickText(content: string, text: string, target: Target) {
	const {file, pattern, method = 'replace'} = target
	var escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	var eatSpaces = new RegExp(`\`\\s*${escaped}\\s*\``)
	if (method == "clear") {
		var startPatternIndex = content.match(eatSpaces)?.index
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

		var newContent = content.replace(eatSpaces, (match) => {
			if (method == "append") return `${match}${text}`
			if (method == "prepend") return `${text}${match}`
			if (method == "replace") return text
			if (method == "remove") return ''
			return `${method} method is not legal here`
		})
	}
	return newContent;
}


/**
 * can append to top of file or bottom of it
 * can create file and if file exist create another one
 *
 * @param text
 * @param target
 * @param createIfNotExist create if not exist
 */
export async function quickFile(text: string, target: Target, createIfNotExist = false) {
	var {file, method = 'append',} = target
	var tFile = getTFile(file) as TFile
	if (method == 'rename') {
		if (tFile) return await renameFile(tFile, text)
		log('quickFile', `file "${file}" is not exist for rename`)
		return null
	}
	if (!tFile)
		if (createIfNotExist) method = 'create'
		else return null

	if (method == 'create') return await createTFile(file, text)
	if (method == 'remove') return await removeFile(tFile)

	const {frontmatterPosition} = getFileStructure(tFile);
	var content = await app.vault.read(tFile)
	var offset = (frontmatterPosition?.end.offset || -1) + 1
	let lines = content.slice(offset).split("\n");

	// top,bottom, replace file content
	if (method == "prepend") lines.unshift(text)
	if (method == "replace") lines = [text]
	if (method == "append") lines.push(text)
	if (method == "clear") lines.length = 0
	await modifyFileContent(tFile, lines.join("\n"))
	return tFile
}

