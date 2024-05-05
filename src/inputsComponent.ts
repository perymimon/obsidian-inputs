// @ts-nocheck1
import { InputSuggest } from "./InputSuggest";
import { runSequence, saveValue } from "./api";
import { parserTarget } from "./internalApi";
import { app } from "./main";
import { Component, setIcon } from "obsidian";



export class InputsComponent extends Component{
	preventDefault(e:Event):void {
		e.preventDefault()
	}
	ctrlAndEnterToSave(e:KeyboardEvent, delegateTarget:HTMLInputElement):void {
		if (!(e.key == "Enter" && (e.metaKey || e.ctrlKey))) return
		this.runSequence(e, delegateTarget)
	}
	clickOnHelperButton(e:MouseEvent, delegateTarget:HTMLElement):void {

		if (e.target!.tagName == 'BUTTON') {
			const target = parserTarget(delegateTarget.title)
			const button :HTMLButtonElement =  e.target as HTMLButtonElement;
			if (button.name == 'clear') target.method = 'clear'
			if (button.name == 'remove') target.method = 'remove'
			target.targetType = 'pattern'
			saveValue('', target)
		}
	}
	async runSequence(e: UIEvent, delegateTarget: HTMLElement) {
		var target = e.target as HTMLInputElement;
		if (target.value == '') return;
		if (target.checked == 'false') return;
		const {value} = target
		if (target!.type == 'radio') target!.checked = false
		else target!.value = ''

		const patterns = delegateTarget.title.replaceAll('\n\t','|')
		await runSequence(patterns, {
			defaultExpertion:'{{input}}',
			vars: {input: value}
		})
		// expression = expression.replace(/____+/, `{{input}}`)

		// for (const pattern of patterns) {
		// 	let {expression, id, target} = parsePattern(pattern, PATTERN)!
		// 	expression = expression.replace(/____+/, `{{input}}`)
		// 	if (!expression.trim()) expression = '{{input}}'
		// 	await processPattern(expression, target, pattern, {
		// 		vars: {input: value}
		// 	})
		// }

		setTimeout(_ => {
			document.querySelector('[title="${delegateTarget.title}"]')
		}, 10)
	}

	onload() {
		/* register events to global for avoid other plugins (like dataview)
 			to disrupt this plugin by replacing the dom */
		super.onload();
		globalThis.document.on('change', 'form.live-form', this.runSequence)
		globalThis.document.on('select', 'form.live-form', this.runSequence)
		globalThis.document.on('submit', 'form.live-form', this.preventDefault )
		globalThis.document.on('keydown', 'form.live-form', this.ctrlAndEnterToSave )
		globalThis.document.on('click', 'form.live-form',this.clickOnHelperButton)
	}
	onunload(){
		super.onunload();
		globalThis.document.off('change', 'form.live-form', this.runSequence)
		globalThis.document.off('select', 'form.live-form', this.runSequence)
		globalThis.document.off('submit', 'form.live-form', this.preventDefault)
		globalThis.document.off('keydown', 'form.live-form', this.ctrlAndEnterToSave )
		globalThis.document.off('click', 'form.live-form',this.clickOnHelperButton)

	}
}

export function createForm(pattern: string, fields: Record<string, string>) {
	const formEl = createEl('form', {cls: 'live-form', title: ''})
	const {options, name} = fields
	// var targetObject = parserTarget(pattern)
	formEl.title = pattern.replaceAll('\n','').replaceAll('|','\n\t')
	const {opts, queries} = parseOptions(options)
	formEl.append(createRadioEls(name, opts))
	if (queries.length || opts.length == 0) {
		const inputEl = createInputEl(fields, queries)
		formEl.append(inputEl)
		formEl.append(createHelperButtons())
	}
	return formEl
}

/**
 * take input patterns from title, split it to pattern. parser them and run them one by one
 * @param e
 * @param delegateTarget
 */

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

	// const conenaier = createEl('div', {cls: 'buttons'})
	const divEl = createEl('div', {cls: 'buttons'})

	const submitEl = divEl.createEl('button', {title: 'submit', cls: 'submit'})
	submitEl.tabIndex = -1
	submitEl.name = 'submit'
	setIcon(submitEl,'hard-drive-download')

	const removeBtn = divEl.createEl('button', {title: 'remove', cls: 'close', text: '🗑'})
	removeBtn.tabIndex = -1
	removeBtn.name = 'remove'
	setIcon(removeBtn,'trash-2')


	const cleanBtn = divEl.createEl('button', {title: 'erase value', cls: 'erase', text: '🧹'})
	cleanBtn.tabIndex = -1
	cleanBtn.name = 'clear'
	setIcon(cleanBtn,'eraser')

	return divEl
}

function parseOptions(optionsNotation: string) {
	const dv = app.plugins.plugins['dataview']?.api
	const queryPrefix = dv?.settings.inlineQueryPrefix
	const queries: string[] = []
	const opts: string[] = []
	if (!optionsNotation) return {opts, queries}
	for (let opt of optionsNotation.split(',')) {
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

