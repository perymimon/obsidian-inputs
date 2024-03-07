// @ts-nocheck
import {App, Editor, MarkdownPostProcessorContext, TFile} from "obsidian";
import {MyPluginSettings} from "../draft/settings";
import {InputSuggest} from "./FileSuggester";
import {objectGet} from "./objects";
import {modifications, stringTemplate, typeMap} from "./strings";
import {decodeAndRun, getPlugin, saveValue, setFrontmatter} from "./api";
import {parseTarget} from "./internalApi";
import {BUTTON_PATTERN} from "./buttons";

var app = global.app

export const INPUT_PATTERN = new RegExp([
	/(?:`|^)/,
	/(?<type>\w+?)\|/,
	/(?<expression>.*?__+(?<placeholder>.*?)__+.*?)/,
	/(?:\|(?<options>.+?))?/,
	/(?<target>>.*?)?/,
	/(?<id>-\d+-)?/,
	/(?:$|`)/
].map(r => r.source).join(''), '')

//https://regex101.com/r/ouJ4cb/1
/**
 * mark input Anotation pattern with -id- if need : `____ -id-`
 */
export function replaceCode2Inputs(rootEl: HTMLElement, ctx:MarkdownPostProcessorContext, settings: MyPluginSettings, app: App) {
	const codesEl = rootEl.findAll('code')
	for (let codeEl of codesEl) {
		const pattern = codeEl.innerText
		const inputNotation = pattern.trim().match(INPUT_PATTERN)
		if (!inputNotation) continue;
		const fields = inputNotation.groups;
		createForm(codeEl, app, ctx.frontmatter, pattern, fields)
	}
}


const cbTriggerSave = (e, delegateTarget:HTMLInputElement) => e.target.trigger('save', e)
global.document.on('change', 'form.live-form', cbTriggerSave)
global.document.on('select', 'form.live-form', cbTriggerSave)
global.document.on('submit', 'form.live-form', e => e.preventDefault())
global.document.on('keydown', 'form.live-form', (e, delegateTarget:HTMLInputElement) => {
	if (!(e.key == "Enter" && (e.metaKey || e.ctrlKey))) return
	cbTriggerSave(e, delegateTarget)
})

global.document.on('save', 'form.live-form', async function (e, delegateTarget) {
	const pattern = delegateTarget.title
	const fields = pattern.match(INPUT_PATTERN).groups;
	let {expression, options, target = ''} = fields
	var targetObject = parseTarget(target, pattern)
	let {value} = e.target
	if (value == '') return;
	e.target.value = ''
	const run = expression.replace(/__+.*?__+/, `{input}`)
	const text = await decodeAndRun(run, {
		priority: targetObject.targetType,
		importJs: false,
		vars: {input: value}
	})
	if (text) await saveValue(text, targetObject)
	setTimeout(_ => document.getElementById(fields.id)?.focus(), 10)
})
global.document.on('remove', 'form.live-form', async function (e, delegateTarget) {
	const pattern = delegateTarget.title
	saveValue('', {path: pattern, method: 'replace', targetType: 'text'})
})

function createForm(rootEl, app: App, frontmatter, pattern, fields) {
	const formEl = createEl('form', {cls: 'live-form', title: ''})
	let {expression, options, target = ''} = fields
	var targetObject = parseTarget(target, pattern)
	formEl.title = pattern

	const {textsValues, queries} = parseOptions(options)
	formEl.append(createRadioEls(textsValues))
	if (queries.length || textsValues.length == 0) {
		const inputEl = createInputEl(fields, queries)
		formEl.append(inputEl)
	}
	if (targetObject.method != 'replace')
		formEl.append(createHelperButtons())

	rootEl.replaceWith(formEl)
}

function createInputEl(fields, queries) {
	const {type, expression, id, placeholder} = fields
	const inputEl = createEl(
		type == 'textarea' ? 'textarea' : 'input', {type}
	)
	inputEl.style.setProperty('--widther', expression.match(/_/g).length)
	inputEl.id = id
	inputEl.placeholder = placeholder || expression.replace(/^_+$/, '')
	if (queries.length) new InputSuggest(app, inputEl, queries)
	return inputEl
}

function createRadioEls(pairs) {
	const fragment = createFragment()
	for (const {text, value} of pairs) {
		let label = fragment.createEl('label')
		label.createEl('input', {type: 'radio', value})
		label.createSpan({text})
	}
	return fragment
}

function createHelperButtons() {
	let divEl = createEl('div', {cls: 'buttons'})
	let submitEl = divEl.createEl('input', {cls: 'submit', value: 'save', type: 'submit'})
	submitEl.tabIndex = -1
	let btnEl = divEl.createEl('button', {title: 'close', cls: 'close', text: '🗑'})
	btnEl.tabIndex = -1
	btnEl.addEventListener('click', e => e.target.trigger('remove'))
	return divEl
}

function parseOptions(options: string) {
	const dv = getPlugin('dataview')?.api
	const queryPrefix = dv?.settings.inlineQueryPrefix
	const queries = []
	const textsValues = []
	if (!options) return {textsValues, queries}
	for (let opt of options.split(',')) {
		opt = opt.trim()
		if (queryPrefix && opt.startsWith(queryPrefix)) {
			let query = opt.replace(queryPrefix, '')
			queries.push(query)
		} else {
			let [text, value = text] = opt.split(/:/)
			textsValues.push({text, value})

		}
	}
	return {textsValues, queries}
}


function generatePlaceholder(inputFields, frontmatterValues) {
	let {type, placeholder, yaml, continues} = inputFields
	let yamlPlaceholder = ''
	if (inputFields.yaml) {
		let yamlValue = JSON.stringify(objectGet(frontmatterValues, inputFields.yaml))
		yamlPlaceholder = `:${yaml} (= ${yamlValue ?? 'empty'})`
	}
	let typeAndHolder = [typeMap[type], placeholder].filter(Boolean).join(' ')
	return `${typeAndHolder} ${yamlPlaceholder} ${continues ? '+' : ''}`
}

function generateTitle(inputFields) {
	let {pattern} = inputFields
	return pattern
}

async function remove(event, app, inputFields) {
	const {pattern, delimiter = ''} = inputFields
	let file: TFile = app.workspace.activeEditor!.file!
	await app.vault.process(file, (data: string) => {
		return data.replace(delimiter + pattern, '')
	})
}

