// @ts-nocheck1
import {InputSuggest} from "./InputSuggest";
import {processPattern, saveValue} from "./api";
import {parsePattern, parserTarget} from "./internalApi";
import {PATTERN} from "./main";

var app = globalThis.app


export function createForm(pattern: string, fields: Record<string, string>) {
	const formEl = createEl('form', {cls: 'live-form', title: ''})
	let {options, name} = fields
	// var targetObject = parserTarget(pattern)
	formEl.title = pattern
	const {opts, queries} = parseOptions(options)
	formEl.append(createRadioEls(name, opts))
	if (queries.length || opts.length == 0) {
		const inputEl = createInputEl(fields, queries)
		formEl.append(inputEl)
		formEl.append(createHelperButtons())
	}
	return formEl
}

globalThis.document.on('change', 'form.live-form', triggerSave)
globalThis.document.on('select', 'form.live-form', triggerSave)
globalThis.document.on('submit', 'form.live-form', e => e.preventDefault())
globalThis.document.on('save', 'form.live-form', triggerSave)
globalThis.document.on('click', 'form.live-form', async (e:InputEvent, delegateTarget) => {
	if (e.target!.tagName == 'BUTTON') {
		var target = parserTarget(delegateTarget.title)
		var button = e.target!
		if (button.name == 'clear') target.method = 'clear'
		if (button.name == 'remove') target.method = 'remove'
		await saveValue('', target)
	}
	if (e.target!.tagName == 'INPUT' && e.target.type =='radio') {
		return triggerSave(e,delegateTarget)
	}
})
globalThis.document.on('keydown', 'form.live-form', (e:InputEvent, delegateTarget: HTMLInputElement) => {
	if (!(e.key == "Enter" && (e.metaKey || e.ctrlKey))) return
	triggerSave(e, delegateTarget)
})

async function triggerSave (e:InputEvent, delegateTarget:HTMLElement) {
	if (e!.target.value == '') return;
	const patterns = delegateTarget.title.trim().split('\n')
	for (let pattern of patterns) {
		let {expression, id, target} = parsePattern(pattern, PATTERN)
		expression = expression.replace(/____+/, `{{input}}`)
		if(!expression.trim()) expression = '{{input}}'
		const {targetObject} = await processPattern(expression, target, pattern, {
			allowImportedLinks: false,
			vars: {input: e?.target.value}
		})
	}
	if (/append|prepend/.test(targetObject.method)) e.target!.value = ''
	setTimeout(_ => {
		document.querySelector('[title="${pattern}"]')
	}, 10)
}

function createInputEl(fields: Record<string, string>, queries: string[]) {
	const {type, expression, id, name, target} = fields
	var inputType = type == 'textarea' ? 'textarea' : 'input'
	const inputEl = createEl(inputType, {type})
	inputEl.style.setProperty('--widther', expression.match(/_/g)?.length || 4)
	inputEl.id = id
	inputEl.placeholder = name || target
	if (queries.length) new InputSuggest(app, inputEl, queries)
	return inputEl
}

function createRadioEls(label:string, pairs:Record<string, string>[]) {
	const fragment = createFragment()
	if(!pairs.length) return fragment
	if(label.trim()) fragment.createEl('label', {text:label+ ": "})
	const name = Date.now()
	for (const {text, value} of pairs) {
		let label = fragment.createEl('label')
		label.createEl('input', {type: 'radio', attr:{name, value}})
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
	const queries: string[] = []
	const opts: string[] = []
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

