// @ts-nocheck
import {App, Editor, MarkdownPostProcessorContext, TFile} from "obsidian";
import {MyPluginSettings} from "../draft/settings";
import {InputSuggest} from "./InputSuggest";
import {link, processPattern, saveValue} from "./api";
import {parsePattern, parserTarget} from "./internalApi";

var app = global.app

export const INPUT_PATTERN = new RegExp([
	/(?:`|^)/,
	/(?<id>-\w+-)?\s*/,
	/(?<type>[\w-]+?)\|/,
	/(?<expression>.*?__+(?<placeholder>.*?)__+.*?)/,
	/(?:,(?<options>.+?))?/,
	/(?<target>>.*?)?/,
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
		const fields = parsePattern(pattern, INPUT_PATTERN)
		if (!fields) continue;
		createForm(codeEl, pattern, fields)
	}
}

function createForm(rootEl:HTMLElement, pattern:string, fields:Record<string, string>) {
	const formEl = createEl('form', {cls: 'live-form', title: ''})
	let { options} = fields
	// var targetObject = parserTarget(pattern)
	formEl.title = pattern

	const {opts, queries} = parseOptions(options)
	formEl.append(createRadioEls(opts))
	if (queries.length || opts.length == 0) {
		const inputEl = createInputEl(fields, queries)
		formEl.append(inputEl)
	}
	// if (targetObject.method != 'replace')
		formEl.append(createHelperButtons())

	rootEl.replaceWith(formEl)
}

const cbTriggerSave = (e, delegateTarget:HTMLInputElement) => e.target.trigger('save', e)
global.document.on('change', 'form.live-form', cbTriggerSave)
global.document.on('select', 'form.live-form', cbTriggerSave)
global.document.on('submit', 'form.live-form', e => e.preventDefault())
global.document.on('click', 'form.live-form', async (e,delegateTarget) => {
	if(e.target.tagName == 'BUTTON') {
		var target = parserTarget(delegateTarget.title)
		var button = e.target
		if (button.name == 'clear') target.method = 'clear'
		if (button.name == 'remove') target.method = 'remove'
		await saveValue('', target)
	}
})
global.document.on('keydown', 'form.live-form', (e, delegateTarget:HTMLInputElement) => {
	if (!(e.key == "Enter" && (e.metaKey || e.ctrlKey))) return
	cbTriggerSave(e, delegateTarget)
})

global.document.on('save', 'form.live-form', async function (e, delegateTarget) {
	if (e!.target.value == '') return;
	const pattern = delegateTarget.title
	let {expression, id, target} = pattern.trim().match(INPUT_PATTERN)!.groups
	const run = expression.replace(/__+.*?__+/, `{{input}}`)
	const {value} = e?.target
	await processPattern(run,target,pattern, {
		allowImportedLinks: false,
		vars: {input: (await link(value)) || value}
	})
	e.target!.value = ''
	setTimeout(_ => document.getElementById(id)?.focus(), 10)
})



function createInputEl(fields:Record<string, string>, queries:string[]) {
	const {type, expression, id, placeholder} = fields
	const inputEl = createEl(
		type == 'textarea' ? 'textarea' : 'input', {type}
	)
	inputEl.style.setProperty('--widther', expression.match(/_/g).length)
	inputEl.id = id
	inputEl.placeholder = placeholder || expression.replace(/__+/, '')
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

	let removeBtn = divEl.createEl('button', {title: 'remove', cls: 'close', text: '🗑'})
	removeBtn.tabIndex = -1
	removeBtn.name = 'remove'

	let clearBtn = divEl.createEl('button', {title: 'clear', cls: 'clear', text: '🧹'})
	clearBtn.tabIndex = -1
	clearBtn.name = 'clear'

	return divEl
}

function parseOptions(options: string) {
	const dv = app.plugins.plugins['dataview']?.api
	const queryPrefix = dv?.settings.inlineQueryPrefix
	const queries:string[]= []
	const opts:string[] = []
	if (!options) return {opts, queries}
	for (let opt of options.split(',')) {
		opt = opt.trim()
		if (queryPrefix && opt.startsWith(queryPrefix)) {
			let query = opt.replace(queryPrefix, '')
			queries.push(query)
		} else {
			let [text, value = text] = opt.split(/:/)
			opts.push({text, value})

		}
	}
	return {opts, queries}
}

