import type {CachedMetadata, TFile, App, moment} from "obsidian";

export type Priority = 'yaml' | 'field'
declare function moment(inp?: any, format?: moment.MomentFormatSpecification, strict?: boolean): moment.Moment;

declare global {
	const moment: typeof moment;
	const DataviewAPI: any;
	const app: ExtendedApp
}

export type simpleDicObject = Record<string, any>

export type InlineField = {
	outerField: string, innerField: string, key: string,
	value: string, fullKey: string, oldValue: string
	offset: [number, number],
	keyOffset: [number, number],
	valueOffset: [number, number],
	isRound: boolean,
	isSquare: boolean,
}

export type Pattern = {
	id: string,
	type: string,
	name: string,
	expression: string,
	options: string,
	target: string
}
export type fileDesc = {
	folders:string,
	file:string // filename+ext
	filename:string,
	extname:string,
	path:string // whole path folders+filename+ext
}
export type targetFile = TFile | string
export type CachedStructure = CachedMetadata & {
	allInlineFields?: InlineField[],
	dirty: boolean,
	inlineFields?: object
}
export type targetMethod = 'append' | 'prepend' | 'replace' | 'create' | 'remove' | 'clear' | 'rename'
export type targetType = 'yaml' | 'field' | 'header' | 'file' | 'pattern'
export type Target = {
	file?: targetFile,
	targetType: targetType,
	path: string,
	method: targetMethod,
	pattern: string
}
export type TargetArray = [string, Target['file'], targetType, Target['path'], targetMethod]

export type Expression = {
	execute: string,
	type: 'literal' | 'executed' | 'import' | 'template' | 'empty'
	file: string | null,
	result: string
}

export type fieldUpdate = { value: string, field: InlineField, method?: Target['method'] }

export type inputOption = { text: string, value: string }


export type decodeAndRunOpts = {
	priority?: Priority | string,
	vars?: {},
	file?: targetFile,
	// literalExpression?: boolean
	// notImport?: boolean,
	// allowImportedLinks?: boolean
	defaultExpiration?:string
}

export type Listener<K extends keyof DocumentEventMap> = (this: Document, ev: DocumentEventMap[K], delegateTarget: HTMLElement) => any
export type replacer = (substring: string, ...args: string[]) => Promise<string>

export interface DynamicModule {
	default?: any;
	[key: string]: any;
}

export  type resolve = ((value: T) => void) | undefined;
export type reject = ((reason: E) => void) | undefined;

interface ExtendedApp extends App {
	plugins: {
		plugins: { [key: string]: any }
	}
}
