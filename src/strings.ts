import {asyncEval, replaceAsync} from "./internalApi";
import {TFile} from "obsidian";
import {getFileData} from "./api";
import {Priority} from "./types";

type Dictionary = { [any: string]: any }
declare const moment: (...args: any[]) => any;

export async function stringTemplate(template: string, fields: Dictionary = {}, file?: string | TFile, priority?: Priority) {
	if (!String.isString(template)) return template;
	fields = {...await getFileData(file, priority), ...fields}
	return await replaceAsync(template, /\{(?<key>[^}]+)}/g, async (_, expr) => {
		let [exec, arg] = expr.split(':')
		var replacement =
			fields[exec]
			?? modifications[exec]
			?? await asyncEval(exec, fields, modifications, void 0, true)
			.catch(e => `<error>${String(e)}</error>`)

		return typeof replacement == 'function' ? replacement(arg) : replacement;
	})

}

export const modifications = {
	date: (format = 'yyyy-MM-DD') => moment().format(format),
	time: (format = 'HH:mm') => moment().format(format)
}

export function spliceString(string: string, index: number, del: number = 0, text: string = '') {
	return [string.slice(0, index), text, string.slice(index + del)].join('')
}

export function sliceRemover(string: string, indexStart: number, indexEnd: number, inject: string) {
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
