import {
	MarkdownView,
	Plugin,
	App,
} from 'obsidian';
import {LiveFormSettingTab, DEFAULT_SETTINGS} from "./settings";
import {replaceCode2Inputs, reformatAnotation, getMaxAnotationId, refresh} from "./util";
import {replaceCode2Buttons} from "./buttons";

// https://regex101.com/r/FhEQ2Z/1
// https://regex101.com/r/jC824J/1

/*
missing:
1) x for list
-- buttons for add text



*/
const BASE_MARK = new RegExp([
	/(?<pretext>.*)\b(?<type>[^_`]*?)/, 	 		// input type
	/(?<input>__+(?<placeholder>[^_`]*)__+)/, 			// mandatory input pattern
	/(?<continues>(?<delimiter>.+(?=\+\+))?(\+\+))?/,	// continue mark
	// /(?<options>,[-\w= ,#@$]+)?/,
	/(?<options>,.+?)?/,
	/(?<yaml>:[\w.]+)?/,
	/(?<id> -\d+-)?/

].map(r => r.source).join('\\s*?'), '')

export const CODE_ELEMENT_MARK = new RegExp(`${BASE_MARK.source}$`)
export const INPUT_PATTERN = new RegExp(`\`${BASE_MARK.source}\``, 'g')
console.log('INPUT_PATTERN',INPUT_PATTERN)

export let app:App
export default class LiveFormPlugin extends Plugin {
	settings = {};
	id = 1;

	async onload() {
		app = this.app;
		console.log('loading live-form plugin');
		this.app.workspace.on('editor-change', async editor => {
			let cur = editor.getCursor()
			let textLine = editor.getLine(cur.line)
			let fileContent = editor.getValue()
			let reformatText = reformatAnotation(fileContent, textLine)
			if (textLine === reformatText) return;
			editor.setLine(cur.line, reformatText)
			editor.setCursor(cur)
		})

		this.registerMarkdownPostProcessor(
			(root, ctx) => {
				replaceCode2Inputs(root, ctx, this.settings, this.app)
				replaceCode2Buttons(root, ctx, this.settings, this.app)
			}
		)
		// this.registerEvent(this.app.metadataCache.on("changed",
		// 	(path, data, cache) => refresh(this.app)
		// ))

		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LiveFormSettingTab(this.app, this));

		// this.app.workspace.on('editor-change',(editor) => console.log('editor-change', editor) )
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


