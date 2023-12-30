import {CODE_MARK, INPUT_PATTERN} from "./main";
import {Editor, MarkdownView, TFile, Workspace} from "obsidian";
import {MyPluginSettings} from "./settings";


export function getNextId(fileContent: string) {
	let maxId = 1;
	fileContent.replace(CODE_MARK, (...args) => {
		const {id = ''} = args.at(-1)
		maxId = Math.max(id.match(/\d+/), maxId)
	})
	return maxId + 1;

}

/**
 * mark input user pattern with id `____ -id-`
 */
export function markInputNotations(editor: Editor, nextId: number) {
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

export function codesElements2Inputs(element: HTMLElement, settings: MyPluginSettings, workspace: Workspace) {
	const codes = element.findAll('code')

	for (let code of codes) {
		const text = code.innerText
		const inputNotation = text.match(INPUT_PATTERN)
		if (!inputNotation) continue;
		const pattern = `\`${text}\``
		createInput(pattern, code, settings, inputNotation.groups, workspace,)

	}
}

function createInput(textPattern:string, element: Element, settings: MyPluginSettings, notationAttributes, workspace) {
	let input = null
	if (notationAttributes.options) {
		input = createRadioElements(element, settings, notationAttributes)
	} else {
		input = createInputElement(element, settings, notationAttributes)
	}
	input.dataset.pattern = textPattern;
	input.addEventListener('change', async event => {
		await saveValue(event, workspace)
		await refresh(workspace)
	})
	element.replaceWith(input)
}
async function saveValue(event: Event, workspace: Workspace) {
	let file: TFile = workspace.activeEditor!.file!
	let {value} = event.target
	let {dataset: {pattern}} = event.currentTarget
	await this.app.vault.process(file, (data:string) => data.replace(pattern, value))
}

function createInputElement(baseElm:HTMLElement, settings, notationAttributes) {
	const {inputTypes} = settings;
	const {type = '', placeholder = ''} = notationAttributes
	debugger
	return baseElm.createEl('input', {
		cls: 'live-form',
		type: inputTypes[type],
		placeholder: `${type}${placeholder}`,
	})
}

function createRadioElements(element: HTMLElement, settings: MyPluginSettings, notationAttributes) {
	const {placeholder = '', options = '', id} = notationAttributes
	let opts = options.slice(1, -1).split(',')

	const form = element.createEl('form', {cls: 'live-form',title:placeholder})
	const type = 'radio'
	for (let option of opts) {
		let [text, value = text] = option.split('=')
		let label = form.createEl('label')
		label.createEl('input', {type, value})
		label.createSpan({text})
	}
	return form
}



export function refresh(workspace:Workspace) {
	workspace.updateOptions();
	// Trigger a re-render of the current note when the settings change
	// to force the registerMarkdownPostProcessor to reprocess the Markdown.
	const view = workspace.getActiveViewOfType(MarkdownView);
	if (view) {
		view.previewMode.rerender(true);
	}
}
