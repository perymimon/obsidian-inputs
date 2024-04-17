import {CachedMetadata, TFile} from "obsidian";

export type Priority = 'yaml' | 'field'
declare const moment: (...args: any[]) => any;

export type Field = {
	outerField: string, innerField: string, key: string,
	value: string, fullKey: string, oldValue: string
	offset: [number, number],
	keyOffset: [number, number],
	valueOffset: [number, number],
	isRound:boolean,
	isSquare:boolean,
}

export type Pattern = {
	id: string,
	type: string,
	name: string,
	expression: string,
	options: string,
	target: string
}

export type targetFile = TFile | string
export type reachStructure = CachedMetadata & {
	allInlineFields?: Field[],
	dirty:boolean,
	inlineFields?:object
}
