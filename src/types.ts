import {CachedMetadata, TFile} from "obsidian";

export type Priority = 'yaml' | 'field'
declare const moment: (...args: any[]) => any;

export type InlineField = {
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
export type CachedStructure = CachedMetadata & {
	allInlineFields?: InlineField[],
	dirty:boolean,
	inlineFields?:object
}

export type Target = {
	file?: targetFile,
	targetType: 'yaml' | 'field' | 'header' | 'file' | 'pattern',
	path: string,
	method: 'append' | 'prepend' | 'replace' | 'create' | 'remove' | 'clear' | 'rename'
	pattern: string
}

export type fieldUpdate = { value: string, field: InlineField, method?: Target['method'] }

export type inputOption = { text: string, value: string }[]

export const VIEW_TYPE_PAGE_DATA_VIEW = 'page-data'
export const TRIGGER_PAGE_DATA_OPEN = "page-data:open";
