// @ts-nocheck1
import {InputSuggest} from "./InputSuggest";
import {loopPatterns, runSequence, saveValue} from "../api";
import {
	parserTarget,
	patternToTitle,
	resolveOptions,
	titleToPattern,
} from "../internalApi";
import {app} from "../main";
import {Component} from "obsidian";
import {setIcon} from "obsidian";

import {inputOption, Pattern} from "../types";


export class InputsComponent extends Component {
	preventDefault(e: Event): void {
		e.preventDefault()
	}

	ctrlAndEnterToSave(e: KeyboardEvent, delegateTarget: HTMLInputElement): void {
		if (!(e.key == "Enter" && (e.metaKey || e.ctrlKey))) return
		this.runSequence(e, delegateTarget)
	}

	clickOnHelperButton(e: MouseEvent, delegateTarget: HTMLElement): void {

		if (e.target!.tagName == 'BUTTON') {
			const target = parserTarget(delegateTarget.title)
			const button: HTMLButtonElement = e.target as HTMLButtonElement;
			if (button.name == 'clear') target.method = 'clear'
			if (button.name == 'remove') target.method = 'remove'
			target.targetType = 'pattern'
			saveValue('', target)
		}
	}

	async runSequence(e: UIEvent, delegateTarget: HTMLElement) {
		var target = e.target as HTMLInputElement;
		const {value} = target
		if(target.type == 'text'){
			if (target.value == '') return;
			target.value = ''
		}
		if (target.type == 'radio'){
			if(!target.checked) return
			target.checked = false
		}
		const patterns = titleToPattern(delegateTarget.title)
		await runSequence(patterns, {
			defaultExpertion: '{{input}}',
			vars: {input: value}
		})

		setTimeout(_ => {
			document.querySelector('[title="${delegateTarget.title}"]')
		}, 10)
	}

	onload() {
		/* register events to global for avoid other plugins (like dataview)
 			to disrupt this plugin by replacing the dom */
		super.onload();
		globalThis.document.on('change', 'form.live-form', this.runSequence)
		// globalThis.document.on('select', 'form.live-form', this.runSequence)
		globalThis.document.on('submit', 'form.live-form', this.preventDefault)
		globalThis.document.on('keydown', 'form.live-form', this.ctrlAndEnterToSave)
		globalThis.document.on('click', 'form.live-form', this.clickOnHelperButton)
	}

	onunload() {
		super.onunload();
		globalThis.document.off('change', 'form.live-form', this.runSequence)
		// globalThis.document.off('select', 'form.live-form', this.runSequence)
		globalThis.document.off('submit', 'form.live-form', this.preventDefault)
		globalThis.document.off('keydown', 'form.live-form', this.ctrlAndEnterToSave)
		globalThis.document.off('click', 'form.live-form', this.clickOnHelperButton)

	}
}

export function createForm(pattern: string, patternFields: Pattern) {
	const formEl = createEl('form', {cls: 'live-form', title: ''})
	const {type, name, options} = patternFields
	formEl.title = patternToTitle(pattern)

	if (type == 'radio') {
		resolveOptions(options).then((choices) => {
			formEl.append(createRadioEls(name, choices))
		})
	} else{
		formEl.append(createInputEl(patternFields ))
	}
	return formEl

		// 	return loopPatterns(pattern, async (patternFields: Pattern) => {
		// 		const {options} = patternFields
		// 		if(!options) return
		// 		const [fixOptions, queries] = parseOptions(options)
		// 		const results = await dataviewQuery(queries)
		// 		formEl.empty()
		// 		formEl.append(createRadioEls(name, [...fixOptions, ...results]))
		// 		const [event, delegateTarget] = await globalWaitFor(formEl,'change', 'form.live-form') as UIEvent
		// 		const {value} = event.target as HTMLInputElement
		// 		return {
		// 			defaultExpertion: '{{input}}',
		// 			vars: {input: value}
		// 		}
		//
		// 	})
}
function createRadioEls(label: string, pairs: inputOption) {
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

/**
 * take input patterns from title, split it to pattern. parser them and run them one by one
 * @param patternFields
 * @param queries
 */

function createInputEl(patternFields: Pattern, ) {
	const {type, id, name, options} = patternFields
	const inputType = type == 'textarea' ? 'textarea' : 'input'
	const inputEl = createEl(inputType, {type})
	inputEl.id = id
	inputEl.placeholder = name
	if (options) new InputSuggest(app, inputEl, options)
	return inputEl
}


function createHelperButtons() {

	// const conenaier = createEl('div', {cls: 'buttons'})
	const divEl = createEl('div', {cls: 'buttons'})

	const submitEl = divEl.createEl('button', {title: 'submit', cls: 'submit'})
	submitEl.tabIndex = -1
	submitEl.name = 'submit'
	setIcon(submitEl, 'hard-drive-download')

	const removeBtn = divEl.createEl('button', {title: 'remove', cls: 'close', text: '🗑'})
	removeBtn.tabIndex = -1
	removeBtn.name = 'remove'
	setIcon(removeBtn, 'trash-2')


	const cleanBtn = divEl.createEl('button', {title: 'erase value', cls: 'erase', text: '🧹'})
	cleanBtn.tabIndex = -1
	cleanBtn.name = 'clear'
	setIcon(cleanBtn, 'eraser')

	return divEl
}

function parseOptions(optionsNotation: string) {
	const queries: string[] = []
	const fixOptions: { text: string, value: string }[] = []
	if (!optionsNotation) return [fixOptions, queries]
	const dv = app.plugins.plugins['dataview']?.api
	const queryPrefix = dv?.settings.inlineQueryPrefix
	for (let opt of optionsNotation.split(',')) {
		opt = opt.trim()
		if (queryPrefix && opt.startsWith(queryPrefix)) {
			const query = opt.replace(queryPrefix, '')
			queries.push(query)
		} else {
			const [text, value = text] = opt.split(/:/)
			fixOptions.push({text, value})

		}
	}
	return [fixOptions, queries]
}

