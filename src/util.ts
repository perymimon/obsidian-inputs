import {CODE_MARK, INPUT_PATTERN} from "./main";
import {App, Editor, MarkdownView, TFile, Workspace, AbstractTextComponent, DropdownComponent} from "obsidian";
import {MyPluginSettings} from "./settings";
import {FileSuggest, InputSuggest} from "./FileSuggester";


export function getNextId(fileContent: string) {
	let maxId = 1;
	fileContent.replace(CODE_MARK, (...args) => {
		const {id = ''} = args.at(-1)  //groups
		maxId = Math.max(id.match(/\d+/), maxId)
	})
	return maxId + 1;

}

/**
 * mark input user pattern with id `____ -id-`
 */
export function identifyInputNotations(editor: Editor, nextId: number) {
	let cur = editor.getCursor()
	let text = editor.getLine(cur.line)
	let dirt = false

	let reformatText = text.replace(CODE_MARK, (...args) => {
		const {type = '', placeholder = '', options = '', id} = args.at(-1)
		if (id) return args[0]

		dirt = true
		let reformat = `\`${type}__${placeholder}__${options} -${nextId++}-\``;
		return reformat
	})
	if (dirt) {
		editor.setLine(cur.line, reformatText)
		editor.setCursor(cur)
	}

	return nextId
}

export function code2Inputs(element: HTMLElement, settings: MyPluginSettings, app: App) {
	const codes = element.findAll('code')
	const {workspace} = app
	for (let code of codes) {
		const text = code.innerText
		const inputNotation = text.match(INPUT_PATTERN)
		if (!inputNotation) continue;
		const input = createInput(code, settings, inputNotation.groups, app)
		input.dataset.pattern = '`' + text + '`'
		input.addEventListener('save', async event => {
			await saveValue(event, app)
			await refresh(app)
		})
	}
}


async function createInput(element: Element, settings: MyPluginSettings, fields, app) {
	let input = null

	if (fields.options) {
		if (fields.options.startsWith(DataviewAPI.settings.inlineQueryPrefix)) {
			input = await CreateInputSuggester(app, element, settings, fields)
		} else {
			input = createRadioElements(element, settings, fields)
		}
	} else {
		input = createInputElement(element, settings, fields)
	}

	element.replaceWith(input)
	return input
}

async function saveValue(event: Event, app) {
	let workspace = app.workspace
	let file: TFile = workspace.activeEditor!.file!
	let {value} = event.target
	let {dataset: {pattern}} = event.currentTarget
	await app.vault.process(file, (data: string) => data.replace(pattern, value))
}

function CreateInputSuggester(app, baseElm: HTMLElement, settings, fields) {
	let options = fields.options
	let query = options.replace(DataviewAPI.settings.inlineQueryPrefix, '')

	let input = createInputElement(baseElm, settings, fields)
	let inputSuggest = new InputSuggest(app, input, query)
	input.addEventListener('change', event => event.target.value = '')
	input.addEventListener('select', event => event.target.trigger("save"))
	return input
}

function createInputElement(baseElm: HTMLElement, settings: MyPluginSettings, fields) {
	const {inputTypes} = settings;
	const {type = '', placeholder = ''} = fields
	const input = baseElm.createEl('input', {
		cls: 'live-form',
		type: inputTypes[type],
		placeholder: `${type}${placeholder}`,
	})
	input.addEventListener('change', event => event.target.trigger('save'))
	return input
}

function createRadioElements(element: HTMLElement, settings: MyPluginSettings, fieldNotations: any) {
	const {placeholder = '', options = '', id} = fieldNotations
	let opts = options.split(',')

	const form = element.createEl('form', {cls: 'live-form', title: placeholder})
	const type = 'radio'
	for (let option of opts) {

		let [text, value = text] = option.split('=')
		let label = form.createEl('label')
		label.createEl('input', {type, value})
		label.createSpan({text})
	}
	form.addEventListener('change', event => event.target.trigger('save'))
	return form
}


export function refresh(app: App) {
	app.workspace.updateOptions();
	// Trigger a re-render of the current note when the settings change
	// to force the registerMarkdownPostProcessor to reprocess the Markdown.
	const view = workspace.getActiveViewOfType(MarkdownView);
	if (view) {
		view.previewMode.rerender(true);
	}
}
