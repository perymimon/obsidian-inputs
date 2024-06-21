import {Notice} from "obsidian";
import {Expression} from "./types";

export function traceExpression(expressionStatus:Expression){
	const {execute, type, file,result} = expressionStatus
	let text:string = '';
	if (type == 'import') text = `resolve "${execute}" by import "${file}" file`
	if (type == 'template') text = `resolve "${execute}" by import content of "${file}" to templater`
	if (type == 'executed') text = `executed "${execute}" and got "${result}" `
	if (type == 'literal') text = `return "${execute}" as literal text`
	if (type == 'empty') text = `try to resolve "${execute}" but it consider empty `
	return log('', text, result)
}

export function log(funcName: string, message: string, ...exteraData: any[]) {
	var text = `${message}\n( ${funcName} )`;
	console.log(text, ...exteraData)
	return new Notice(text, 10_000)
}
