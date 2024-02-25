import {Plugin, App,} from 'obsidian';
import {LiveFormSettingTab, DEFAULT_SETTINGS} from "./settings";
import {INPUT_PATTERN, replaceCode2Inputs} from "./inputs";
import {BUTTON_PATTERN, generateButtonNotation, replaceCode2Buttons} from "./buttons";
import {identifyAnnotation} from "./internalApi";

// https://regex101.com/r/FhEQ2Z/1
// https://regex101.com/r/jC824J/1

export let app: App
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
			// let reformatText = identifyAnnotation(INPUT_PATTERN, fileContent, textLine)
			let reformatText = identifyAnnotation(BUTTON_PATTERN, fileContent, textLine, generateButtonNotation)
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


