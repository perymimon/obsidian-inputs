import {asyncEval, replaceAsync} from "./internalApi";
import {TFile} from "obsidian";
import {getFileData} from "./api";
import {Priority} from "./types";
type Dictionary = {[any:string]:any}
declare const moment: (...args: any[]) => any;

export async function stringTemplate(template: string, fields:Dictionary, file?: string | TFile, priority?:Priority) {
	if (!String.isString(template)) return template;
	fields = {...await getFileData(file, priority), ...fields}
	return await replaceAsync(template, /\{(?<key>[^}]+)}/g, async (_, expr) => {
		let [exec, arg] = expr.split(':')
		var replacement: any = await asyncEval(exec, fields, modifications)
			.catch(e => `<error>${String(e)}</error>`)
		return typeof replacement == 'function' ? replacement(arg) : replacement;
	})

}

export const modifications = {
	date: (format = 'yyyy-MM-DD') => moment().format(format),
	time: (format = 'HH:mm') => moment().format(format)
}

export const typeMap = {
	date: '📅',
	number: '🔢',
	textarea: '💬',
	time: '⌚'
}
