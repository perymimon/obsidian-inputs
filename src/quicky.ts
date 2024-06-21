// @ts-nocheck1
import {
	getFrontMatterPosition,
	manipulateStringifyValue,
	sliceRemover,
	spliceString,
	spliceString2
} from "./basics/strings";
import {createTFile, letTFile, modifyFileContent, removeFile, renameFile} from "./files"
import {objectSet} from "./basics/objects";
import {InlineField, Target, targetFile, targetMethod} from "./types";
import {getFileStructure} from "./data";
import {log} from "./tracer";
import {getInlineFields} from "./data.inlineFields";

const app = globalThis.app

export async function setFrontmatter(value: any, path: string, method: Target["method"] = 'replace', file?: targetFile) {
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

export function setInlineField(content: string, inlineField: InlineField | null, value: string, method: targetMethod = 'replace'): string {
	var newContent = ''
	if (inlineField) { // field exist
		const {outerField, value: currentValue, offset: [startIndex, endIndex]} = inlineField
		let newField
		if (method == 'remove') newField = ''
		else {
			value = manipulateStringifyValue(currentValue, value, method)
			newField = outerField.replace(`::${currentValue}`, `::${value}`)
		}
		if (outerField == newField) return content
		newContent = spliceString2(content, startIndex, endIndex, newField)
	} else { // create field it not exist
		if (method == 'remove') return content
		const [, end] = getFrontMatterPosition(content)
		// @ts-ignore object is Possibly undefined but it takes care
		newContent = spliceString(content, end, 0, `[${path}::${value}]\n`)
	}
	return newContent
}


export function quickText(content: string, text: string, target: Target): string {
	const {pattern, method = 'replace'} = target
	var patternEscaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	var eatSpaces = new RegExp(`\`\\s*${patternEscaped}\\s*\``)
	if (method == "clear") {
		var startPatternIndex:number = content.match(eatSpaces)?.index!
		if(!startPatternIndex) throw 'pattern not found into the content'
		var startLineIndex:number = content.lastIndexOf('\n', startPatternIndex) + 1
		var line = content.slice(startLineIndex, startPatternIndex)
		var field = getInlineFields(line).pop()
		var slice = [startLineIndex, startPatternIndex]
		if (field) {
			let {offset, valueOffset} = field
			let stopPoints = [offset[1], valueOffset[0], offset[0], 0]
			slice = [
				(stopPoints.find(stop => stop <= line.length) ?? 0) + startLineIndex,
				startPatternIndex
			]
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
	var tFile = await letTFile(file)
	if (method == 'rename') {
		if (tFile) return await renameFile(tFile, text)
		log('quickFile', `file "${file}" is not exist for rename`)
		return null
	}
	if (!tFile)
		if (createIfNotExist) method = 'create'
		else return null

	if (method == 'create') return await createTFile(tFile, text)
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

