import {CODE_ELEMENT_MARK, INPUT_PATTERN_MARK} from "./main";
import {App, Editor, MarkdownView, TFile, Workspace, AbstractTextComponent, DropdownComponent} from "obsidian";
import {MyPluginSettings} from "./settings";
import {FileSuggest, InputSuggest} from "./FileSuggester";
import {objectGet, objectPush, objectSet} from "./objects";
import {modifications, stringTemplate, typeMap} from "./strings";

export const BASE_MARK = new RegExp([
	/(?<pretext>.*)\b(?<type>[^_`]*?)/, 	 			// input type
	/(?<input>__+(?<placeholder>[^_`]*)__+)/, 			// mandatory input pattern
	/(?<continues>(?<delimiter>.+(?=\+\+))?(\+\+))?/,	// continue mark
	// /(?<options>,[-\w= ,#@$]+)?/,
	/(?<options>,.+?)?/,
	/(?<yaml>:[\w.]+)?/,
	/(?<id> -\d+-)/
].map(r => r.source).join('\\s*?'), '')

export const INPUT_PATTERN = new RegExp(`${BASE_MARK.source}$`)
export const INPUT_PATTERN_MARK = new RegExp(`\`${BASE_MARK.source}\``, 'g')

/**
 * mark input Anotation pattern with -id- if need : `____ -id-`
 */
export function replaceCode2Inputs(root: HTMLElement, ctx, settings: MyPluginSettings, app: App) {
	const codesEl = root.findAll('code')
	for (let codeEl of codesEl) {
		const text = codeEl.innerText.trim()
		const inputNotation = text.match(INPUT_PATTERN)
		if (!inputNotation) continue;
		const fields = inputNotation.groups;
		fields!.pattern = '`' + text + '`'
		const formEl = createForm(app, ctx.frontmatter, fields)
		formEl.addEventListener('save', async event => {
			if (event.target.value == '') return;
			let {value} = event.target
			event.target.value = ''
			await saveValue(value, app, fields)
			setTimeout(_ => {
				let {id} = fields
				let element = document.getElementById(id)
				element?.focus()
			}, 10)

		})
		codeEl.replaceWith(formEl)
	}
}

function createForm(app: App, frontmatter, inputFields) {
	const DataviewAPI = app.plugins!.plugins.dataview
	inputFields.yaml = inputFields.yaml?.replace(/^:/, '')
	const formEl = createEl('form', {cls: 'live-form', title: ''})
	let {options = '', type, continues, input, id} = inputFields

	const inputEl = createEl(
		type == 'textarea' ? 'textarea' : 'input', {type}
	)
	inputEl.style.setProperty('--widther', input.match(/_/g).length)
	inputEl.id = id
	inputEl.placeholder = generatePlaceholder(inputFields, frontmatter)
	inputEl.title = generateTitle(inputFields)

	const queries = []
	const {inlineQueryPrefix} = DataviewAPI.settings
	options = options.slice(1).trim()
	if (options) {
		const inputOptions = options.split(',')
		for (let opt of inputOptions) {
			opt = opt.trim()
			if (opt.startsWith(inlineQueryPrefix)) {
				let query = opt.replace(DataviewAPI.settings.inlineQueryPrefix, '')
				queries.push(query)
			} else {
				let [text, value = text] = opt.split('=')
				let label = formEl.createEl('label')
				label.createEl('input', {type: 'radio', value})
				label.createSpan({text})
			}
		}
	}

	if (queries.length) {
		new InputSuggest(app, inputEl, queries)
	}
	if (queries.length || !options) {
		formEl.append(inputEl)
	}
	if (continues) {
		let divEl = formEl.createEl('div', {cls: 'buttons'})
		// close btn
		let submitEl = divEl.createEl('input', {
			cls: 'submit', value: 'save', type: 'submit'
		})
		submitEl.tabIndex = -1
		let btnEl = divEl.createEl('button', {
			cls: 'close', text: '🗑', title: 'close'
		})
		btnEl.tabIndex = -1
		btnEl.addEventListener('click', event => remove(event, app, inputFields))
	}

	formEl.addEventListener('change', event => event.target.trigger('save'))
	formEl.addEventListener('select', event => event.target.trigger('save'))
	formEl.addEventListener('submit', event => event.preventDefault())
	formEl.addEventListener('keydown', event => {
		if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
			event.target.trigger('save')
		}
	})
	return formEl
}

async function saveValue(value:string, app, inputFields) {
	const {pattern, continues, delimiter, yaml, type, pretext} = inputFields
	let file: TFile = app.workspace.activeEditor!.file!

	if (yaml) {
		await app.fileManager.processFrontMatter(file, front => {
			let key = inputFields.yaml
			objectSet(front, key, value, !!continues)
			return front
		})
	} else {
		await app.vault.process(file, (data: string) => {
			// let line = data.split('\n').filter( line => line.contains(pattern) ).pop()
			// let beforePattern = line.split(pattern).shift()
			// let endWithDelimiter = beforePattern.endsWith(delimiter)
			// let thereIsDelimiter = !!beforePattern.match(delimiter)
			// let isTheFirstOne = !thereIsDelimiter

			if (pretext) value = stringTemplate(pretext, modifications) + value
			if (delimiter) value += delimiter
			if (type == 'textarea') value += '\n'
			if (continues) value += pattern

			return data.replace(pattern, value)
		})
	}
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

