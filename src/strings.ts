// @ts-nocheck1
import {asyncEval, replaceAsync} from "./internalApi";
import {TFile} from "obsidian";
import {Priority} from "./types";
import {objectGet, setPrototype} from "./objects";
import {getFileData} from "./fileData";

type Dictionary = { [any: string]: any }
declare const moment: (...args: any[]) => any;

export const modifications: any = {
	'@date': (format = 'yyyy-MM-DD') => {
		return moment().format(format)
	},
	'@time': (format = 'HH:mm') => moment().format(format)
}

function processPattern(exp: string, fields: Dictionary = {}) {
	const [, exec, arg] = exp.match(/(.+?)(?::(.*?))?\s*$/) ?? []
	const replacement = modifications[exec] ?? objectGet(fields, exec)
	const args = arg?.split(',') ?? []
	const value = typeof replacement == 'function' ? replacement(...args) : replacement;
	return {value, key: exec}
}

export async function stringTemplate(template: string, customFields: Dictionary = {}, file?: string | TFile, priority?: Priority): Promise<string> {
	if (!String.isString(template)) return template;
	const fileData = await getFileData(file, priority)
	const fields = setPrototype(customFields, fileData)
	//&varname or {{varname}}
	template = template
		.replaceAll(/\(.*?\)/g, (exp) => {
			const {value, key} = processPattern(exp.slice(1,-1), fields)
			return `(${key}::${value ?? ''})`
		})
		.replaceAll(/\[.*?\]/g, (exp) => {
			const {value, key} = processPattern(exp.slice(1,-1), fields)
			return `[${key}::${value ?? ''}]`
		})

	return await replaceAsync(template, /\{\{([^}]+)}}|&(.*?)(?:\s|`|$)/g, async (_, expr0, expr1) => {
		//exec:arg|mods
		const {value, key} = processPattern(expr0 || expr1, fields)
		return value ?? await asyncEval(key, fields, modifications, void 0, false)
			.catch(e => `<error>${String(e)}</error>`)
			// .catch(e => e)

		// if (modifiers && value instanceof Error) value = ''
		// if (modifiers == 'field') return `[${exec}::${value}]`
		// if (modifiers == 'field-round') return `(${exec}::${value})`
		// if (value instanceof Error) return `<error>${String(value)}</error>`
		// return value
	})

}


export function spliceString(string: string, index: number, del = 0, text = '') {
	return [string.slice(0, index), text, string.slice(index + del)].join('')
}

export function sliceRemover(string: string, indexStart: number, indexEnd: number, inject = '') {
	return [string.slice(0, indexStart), inject, string.slice(indexEnd)].join('')
}

export function manipulateValue(oldValue: string, value: string, method: string) {
	let array = oldValue.split(',').map((t: string) => t.trim()).filter(Boolean)
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

export function cleanString(string: string, opts:Dictionary = {}) {
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
	for (const match of matches) {
		if (!match) continue
		let len = 0
		const subMatchIndex = []
		subMatchIndex.push([match.index, match.index! + match![0].length])
		for (const substr of match.slice(1)) {
			subMatchIndex.push([len, len + (substr || '').length])
			len += substr.length
		}
		const subMatch: string[] = subMatchIndex.map(([str, end]) => string.slice(str, end))
		orginals.push(subMatch)
	}

	return orginals
}

export function sliceFrom(string: string, subString: string, include = true) {
	const i = string.indexOf(subString)
	if (i == -1) return ''
	return string.slice(i + (include ? 0 : subString.length))
}

export function lastSliceFrom(string: string, subString: string, include = true) {
	const i = string.lastIndexOf(subString)
	if (i == -1) return ''
	return string.slice(i + (include ? 0 : subString.length))
}


