// @ts-nocheck1
import {asyncEval, replaceAsync} from "./internalApi";
import {TFile} from "obsidian";
import {getFileData} from "./api";
import {Priority} from "./types";
import {objectGet, setPrototype} from "./objects";

type Dictionary = { [any: string]: any }
declare const moment: (...args: any[]) => any;

export async function stringTemplate(template: string, customfields: Dictionary = {}, file?: string | TFile, priority?: Priority): Promise<string> {
	if (!String.isString(template)) return template;
	var fileData = await getFileData(file, priority)
	var fields = setPrototype(customfields, fileData)
	//&varname or {{varname}}
	return await replaceAsync(template, /\{\{([^}]+)}}|&(.*?)(?:\s|`|$)/g, async (_, expr0, expr1) => {
		//exec:arg|mods
		let [, exec, args, modifiers] = (expr0 || expr1).match(/(.+?)(?::(.*?))?(?:\|(.*?))?\s*$/)
		var replacement =
			 modifications[exec]
			?? await objectGet(fields, exec)
			?? await asyncEval(exec, fields, modifications, void 0, false)
				// .catch(e => `<error>${String(e)}</error>`)
				.catch(e => e)

		let value = typeof replacement == 'function' ? await replacement(...(args?.split(',') ?? [])) : replacement;

		if (modifiers && value instanceof Error) value = ''
		if (modifiers == 'field') return `[${exec}::${value}]`
		if (modifiers == 'field-round') return `(${exec}::${value})`
		// }

		if (value instanceof Error) return `<error>${String(value)}</error>`
		return value
	})

}

export const modifications: any = {
	'@date': (format = 'yyyy-MM-DD') => {
		return moment().format(format)
	},
	'@time': (format = 'HH:mm') => moment().format(format)
}

export function spliceString(string: string, index: number, del: number = 0, text: string = '') {
	return [string.slice(0, index), text, string.slice(index + del)].join('')
}

export function sliceRemover(string: string, indexStart: number, indexEnd: number, inject: string = '') {
	return [string.slice(0, indexStart), inject, string.slice(indexEnd)].join('')
}

export function manipulateValue(oldValue: string, value: string, method: string) {
	var array = oldValue.split(',').map((t: string) => t.trim()).filter(Boolean)
	switch (method) {
		case 'replace':
			array = [value]
			break;
		case 'append':
			array.push(value);
			break;
		case 'prepend':
			array.unshift(value)
			break;
		case 'clear':
			array = []
			break;
		default:
			throw new Error('Invalid method');
	}
	return array.join(',')
}

export const typeMap = {
	date: '📅',
	number: '🔢',
	textarea: '💬',
	time: '⌚'
}

export function cleanString(string: string, opts = {}) {
	const {
		wikiLink = true,
		inlineField = true,
		inlineFieldSquare = true,
		inlineCode = true,
		inlineFieldRound = true
	} = opts
	string = String(string)
	const eliminateSquareContent = /\[\[(.*)]]/
	if (inlineCode) string = string.replace(/`+[^`]+`+/g, m => '_'.repeat(m.length))
	if (wikiLink) string = string.replace(/\[\[.*?]]/g, m => '_'.repeat(m.length))
	if (inlineField && inlineFieldSquare) string = string.replace(/\[.*?::.*?]/, m => '_'.repeat(m.length))
	if (inlineField && inlineFieldRound) string = string.replace(/\(.*?::.*?\)/, m => '_'.repeat(m.length))
	return string
}

//matcher must be well grouped as https://stackoverflow.com/a/1985709/1919821
export function cleanMatch(string: string, matcher: RegExp, opts = {}): string[][] {
	const clean = cleanString(string, opts)
	const orginals = []
	const matches = matcher.global ? clean.matchAll(matcher) : [clean.match(matcher)]
	for (let match of matches) {
		if (!match) continue
		let len = 0
		let subMatchIndex = []
		subMatchIndex.push([match.index, match.index! + match![0].length])
		for (let substr of match.slice(1)) {
			subMatchIndex.push([len, len + (substr || '').length])
			len += substr.length
		}
		let subMatch: string[] = subMatchIndex.map(([str, end]) => string.slice(str, end))
		orginals.push(subMatch)
	}

	return orginals
}

export function sliceFrom(string: string, subString: string, include = true) {
	let i = string.indexOf(subString)
	if (i == -1) return ''
	return string.slice(i + (include ? 0 : subString.length))
}

export function lastSliceFrom(string: string, subString: string, include = true) {
	let i = string.lastIndexOf(subString)
	if (i == -1) return ''
	return string.slice(i + (include ? 0 : subString.length))
}


