import {CODE_ELEMENT_MARK, INPUT_PATTERN} from "./main";
import {App, Editor, MarkdownView, TFile, Workspace, AbstractTextComponent, DropdownComponent} from "obsidian";
import {MyPluginSettings} from "./settings";
import {FileSuggest, InputSuggest} from "./FileSuggester";
import {objectGet, objectSet} from "./objects";


export function getMaxAnotationId(fileContent: string) {
	let maxId = 1;
	for (let anotation of fileContent.matchAll(INPUT_PATTERN)) {
		let inputFields = anotation.groups
		let id = inputFields.id?.match(/\d+/) ?? 0
		maxId = Math.max(id, maxId)
	}
	return maxId;
}

/**
 * mark input Anotation pattern with -id- if need : `____ -id-`
 */
export function reformatAnotation(fileContent: string, textLine: string) {
	let maxId = 0
	return textLine.replace(INPUT_PATTERN, (...match) => {
		let group = match.at(-1)
		if (group.id) return match[0]
		let content = match[0].slice(1, -1)
		maxId = 1 + (maxId || getMaxAnotationId(fileContent))
		return `\`${content} -${maxId}-\``
	})
}

export function replaceCode2Inputs(root: HTMLElement, ctx, settings: MyPluginSettings, app: App) {
	const codesEl = root.findAll('code')
	const {workspace} = app
	for (let codeEl of codesEl) {
		const text = codeEl.innerText.trim()
		const inputNotation = text.match(CODE_ELEMENT_MARK)
		if (!inputNotation) continue;
		const inputFields = inputNotation.groups;
		const formEl = createForm(app, ctx.frontmatter, inputFields)
		inputFields!.pattern = '`' + text + '`'
		formEl.addEventListener('save', async event => {
			await saveValue(event, app, inputFields)
		})
		codeEl.replaceWith(formEl)
	}
}

function generatePlaceholder(inputFields, frontmatter) {
	let {type, placeholder, yaml} = inputFields
	let yamlPlaceholder = ''
	if (inputFields.yaml) {
		let yamlValue = JSON.stringify(objectGet(frontmatter, inputFields.yaml))
		yamlPlaceholder = `:${yaml} (= ${yamlValue ?? 'empty'})`
	}
	let typeAndHolder = [type.slice(0, 3), placeholder].filter(Boolean).join(', ')
	return `${typeAndHolder} ${yamlPlaceholder}`
}

function createForm(app: App, frontmatter, inputFields) {
	const DataviewAPI = app.plugins!.plugins.dataview
	inputFields.yaml = inputFields.yaml?.replace(/^:/, '')
	const formEl = createEl('form', {cls: 'live-form', title: ''})
	let {options = '', isTextarea = false, type, placeholder, yaml} = inputFields
	const inputEl =
		createEl(
			isTextarea ? 'textarea' : 'input',
			{type: 'text', placeholder: generatePlaceholder(inputFields, frontmatter)}
		)

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

	formEl.addEventListener('change', event => event.target.trigger('save'))
	formEl.addEventListener('select', event => event.target.trigger('save'))
	formEl.addEventListener('submit', event => {
		event.preventDefault();
	})
	return formEl
}

async function saveValue(event: Event, app, inputFields) {
	const {pattern, continues, delimiter, yaml, isTextarea} = inputFields
	let workspace = app.workspace
	let file: TFile = workspace.activeEditor!.file!
	let {value} = event.target
	if (yaml) {
		await app.fileManager.processFrontMatter(file, front => {
			let key = inputFields.yaml
			objectSet(front, key, value)
			return front
		})
	} else {
		await app.vault.process(file, (data: string) => {
			if (delimiter) value += delimiter
			if (continues) value += pattern

			return data.replace(pattern, value)
		})
	}
}


export function refresh(app: App) {
	app.workspace.updateOptions();
	// Trigger a re-render of the current note when the settings change
	// to force the registerMarkdownPostProcessor to reprocess the Markdown.
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (view) {
		view.previewMode.rerender(true);
	}
}
