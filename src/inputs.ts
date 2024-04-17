// @ts-nocheck1
import {InputSuggest} from "./InputSuggest";
import {processPattern, saveValue} from "./api";
import {parsePattern, parserTarget} from "./internalApi";
import {PATTERN} from "./main";

const app = globalThis.app


export function createForm(pattern: string, fields: Record<string, string>) {
	const formEl = createEl('form', {cls: 'live-form', title: ''})
	const {options, name} = fields
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

globalThis.document.on('change', 'form.live-form', save)
globalThis.document.on('select', 'form.live-form', save)
globalThis.document.on('submit', 'form.live-form', e => e.preventDefault())
// globalThis.document.on('save', 'form.live-form', triggerSave)
globalThis.document.on('click', 'form.live-form', async (e: MouseEvent, delegateTarget) => {
	if (e.target!.tagName == 'BUTTON') {
		const target = parserTarget(delegateTarget.title)
		const button = e.target!
		if (button.name == 'clear') target.method = 'clear'
		if (button.name == 'remove') target.method = 'remove'
		target.targetType = 'pattern'
		await saveValue('', target)
	}
	// if (e.target!.tagName == 'INPUT' && e.target.type =='radio') {
	// 	return save(e,delegateTarget)
	// }
})
globalThis.document.on('keydown', 'form.live-form', (e: KeyboardEvent, delegateTarget: HTMLInputElement) => {
	if (!(e.key == "Enter" && (e.metaKey || e.ctrlKey))) return
	save(e, delegateTarget)
})

async function save(e: InputEvent, delegateTarget: HTMLElement) {
	if (e!.target.value == '') return;
	if (e!.target.checked == 'false') return;
	const {value} = e!.target
	if (e.target.type == 'radio') e.target.checked = false
	else e.target!.value = ''

	const patterns = delegateTarget.title.trim().split('\n')
	for (const pattern of patterns) {
		let {expression, id, target} = parsePattern(pattern, PATTERN)
		expression = expression.replace(/____+/, `{{input}}`)
		if (!expression.trim()) expression = '{{input}}'
		const {targetObject} = await processPattern(expression, target, pattern, {
			allowImportedLinks: false,
			vars: {input: value}
		})

	}

	setTimeout(_ => {
		document.querySelector('[title="${pattern}"]')
	}, 10)
}

function createInputEl(fields: Record<string, string>, queries: string[]) {
	const {type, expression, id, name, target} = fields
	const inputType = type == 'textarea' ? 'textarea' : 'input'
	const inputEl = createEl(inputType, {type})
	inputEl.style.setProperty('--widther', expression.match(/_/g)?.length || 4)
	inputEl.id = id
	inputEl.placeholder = name || target
	if (queries.length) new InputSuggest(app, inputEl, queries)
	return inputEl
}

function createRadioEls(label: string, pairs: Record<string, string>[]) {
	const fragment = createFragment()
	if (!pairs.length) return fragment
	if (label.trim()) fragment.createEl('label', {text: label + ": "})
	const name = Date.now()
	for (const {text, value} of pairs) {
		const label = fragment.createEl('label')
		label.createEl('input', {type: 'radio', attr: {name, value}})
		label.createSpan({text})
	}
	return fragment
}

function createHelperButtons() {
	const divEl = createEl('div', {cls: 'buttons'})

	const submitEl = divEl.createEl('input', {cls: 'submit', value: 'save', type: 'submit'})
	submitEl.tabIndex = -1

	const removeBtn = divEl.createEl('button', {title: 'remove', cls: 'close', text: '🗑'})
	removeBtn.tabIndex = -1
	removeBtn.name = 'remove'

	const clearBtn = divEl.createEl('button', {title: 'clear', cls: 'clear', text: '🧹'})
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
			const query = opt.replace(queryPrefix, '')
			queries.push(query)
		} else {
			const [text, value = text] = opt.split(/:/)
			opts.push({text, value})

		}
	}
	return {opts, queries}
}

