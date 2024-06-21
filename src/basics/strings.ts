// @ts-nocheck1
import type {TFile} from "obsidian";
import {replacer, targetFile} from "../types";
import {objectGet} from "./objects";
import {getTFile} from "../files";
import {asyncEval} from "./jsEngine";

type Dictionary = { [any: string]: any }

export const internalFunctions: any = {
	'@date': (format = 'yyyy-MM-DD') => {
		return moment().format(format)
	},
	'@time': (format = 'HH:mm') => moment().format(format)
}

function processPattern(exp: string, fields: Dictionary = {}) {
	// split field to exec and argument by ':'
	const [, path, arg] = exp.match(/(.+?)(?::(.*?))?\s*$/) ?? []
	const replacement = internalFunctions[path] ?? objectGet(fields, path)
	const args = arg?.split(',') ?? []
	const value = typeof replacement == 'function' ? replacement(...args) : replacement;
	return {value, key: path}
}

export async function stringTemplate(template: string | any, fields: Dictionary = {}): Promise<string> {
	// if (!String.isString(template)) return template;
	if (typeof template != 'string') return template

	//&varname or {{varname}}

	template = template
		// replace (key) => (key::value)
		.replaceAll(/\(.*?\)/g, (exp) => {
			const {value, key} = processPattern(exp.slice(1, -1), fields)
			return `(${key}::${value ?? ''})`
		})
		// replace [key] to [key::value]
		.replaceAll(/\[.*?\]/g, (exp) => {
			const {value, key} = processPattern(exp.slice(1, -1), fields)
			return `[${key}::${value ?? ''}]`
		})

	// run expression in {{exp}} or &exp
	return await replaceAsync(template, /\{\{([^}]+)}}|&(.*?)(?:\s|`|$)/g, async (_: string, expr0: string, expr1: string) => {
		//exec:arg|mods
		const {value, key} = processPattern(expr0 || expr1, fields)
		return value ?? await asyncEval(key, fields, internalFunctions, false)
			.catch(e => `<error>${String(e)}</error>`)
	})

}

export function manipulateStringifyValue(currentValue: string, value: string, method: string) {
	let array = currentValue.split(',').map((t: string) => t.trim()).filter(Boolean)
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

export function cleanString(string: string, opts: Dictionary = {}) {
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
	if (i == -1) return string
	return string.slice(i + (include ? 0 : subString.length))
}

export function lastSliceFrom(string: string, subString: string, include = true) {
	const i = string.lastIndexOf(subString)
	if (i == -1) return string
	return string.slice(i + (include ? 0 : subString.length))
}

export function link(path: targetFile): string {
	var file = getTFile((path as TFile)?.path || path)
	if (!file) return path as any
	var filename = app.metadataCache.fileToLinktext(file, '', true)
	return `[[${filename}]]`
}

export function spliceString(string: string, index: number, del = 0, text = '') {
	return [string.slice(0, index), text, string.slice(index + del)].join('')
}

export function spliceString2(string: string, fromIndex: number, toIndex: number, text = '') {
	return [string.slice(0, fromIndex), text, string.slice(toIndex)].join('')
}

export function sliceRemover(string: string, indexStart: number, indexEnd: number, inject = '') {
	return [string.slice(0, indexStart), inject, string.slice(indexEnd)].join('')
}

export async function replaceAsync(string: string, regexp: RegExp, replacer: replacer) {
	const replacements = await Promise.all(
		Array.from(string.matchAll(regexp), (match:string[]) => replacer(match[0],...match.slice(1)))
	)
	let i = 0;
	return string.replace(regexp, () => replacements[i++]);
}

export function getFrontMatterPosition(content: string): [number, number] {
	const regex = /^---\s*([\s\S]*?)\s*^---$/dm;
	const match = content.match(regex);

	if (match) {
		const [start, end] = match.indices![0]
		return [start, end];
	}

	return [0, 0];
}
