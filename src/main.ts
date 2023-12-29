import {
	MarkdownView,
	Plugin,
} from 'obsidian';
import {LiveFormSettingTab, DEFAULT_SETTINGS} from "./setting";
const INPUT_PATTERN = /\s*(?<type>.*?)__+(?<placeholder>.*?)__+(\((?<options>[^)]+?)\))?\s*/

export default class LiveFormPlugin extends Plugin {
	settings = {};

	async onload() {
		console.log('loading live-form plugin');
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		debugger
		await this.loadSettings();
		this.registerMarkdownPostProcessor(this.codes2Inputs.bind(this))
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LiveFormSettingTab(this.app, this));

		// this.app.workspace.on('editor-change',(editor) => console.log('editor-change', editor) )
	}

	refresh() {
		this.app.workspace.updateOptions();
		// Trigger a re-render of the current note when the settings change
		// to force the registerMarkdownPostProcessor to reprocess the Markdown.
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			view.previewMode.rerender(true);
		}
	}

	codes2Inputs(element, context) {
		const codes = element.findAll('code')
		debugger
		const {inputTypes} = this.settings;

		for (let [index, code] of codes.entries()) {
			const text = code.innerText
			const inputNotation = text.match(INPUT_PATTERN)
			if (inputNotation) {
				const {type, placeholder, options} = inputNotation.groups

				if (options) {

					let opts = options.split(',')
					this.createRadioOptions(code, opts, index, placeholder)

				} else {

					let input = code.createEl('input', {
						cls:'live-form',
						type: inputTypes[type],
						placeholder: `${type}${placeholder}`,
						attr: {name: index}
					})
					input.addEventListener('change', this.saveValue.bind(this))
					code.replaceWith(input)

				}
			}

		}
	}

	createRadioOptions(element, options, index, placeholder) {
		const form = element.createEl('form',{cls:'live-form'})
		if(placeholder) form.createSpan({text:placeholder, cls:'placeholder'})
		const type = 'radio'
		for (let option of options) {
			let [text, value] = option.split('=')
			let label = form.createEl('label')
			label.createEl('input', {type, attr: {name: index}, value: value ?? text})
			label.createSpan({text})
		}
		form.addEventListener('change', this.saveValue.bind(this))
		element.replaceWith(form)
	}

	async saveValue(event) {
		let file = this.app.workspace.activeEditor.file
		let index = event.target.name
		let value = event.target.value
		let isCodeMark = /`([^`\n]+)`/g
		await this.app.vault.process(file, data => {
			let count = -1;
			return data.replace(isCodeMark, (match,text) => {
				if(!INPUT_PATTERN.test(text)) return match
				count++
				return count == index ? value : match;
			})
		})
		this.refresh()

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


