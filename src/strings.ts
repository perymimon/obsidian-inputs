import {asyncEval, replaceAsync} from "./internalApi";

export async function stringTemplate(template: string, fields) {
	if (!String.isString(template)) return template;
	return await replaceAsync(template, /\{(?<key>[^}]+)}/g, async (_, expr) => {
		let [exec, arg] = expr.split(':')
		var replacement:any = await asyncEval(exec, fields, modifications)
			.catch(e => `<error>${String(e)}</error>`)
		let value = typeof replacement == 'function' ? replacement(arg) : replacement;

		return value
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
