import {Plugin, App, TFile} from 'obsidian';

// import {LiveFormSettingTab, DEFAULT_SETTINGS} from "./settings";
import {replaceCode2Inputs} from "./inputs";
import {replaceCode2Buttons} from "./buttons";
import {getInlineFields} from "./internalApi";
import {getTFileContent} from "./api";
// import {replaceCode2Update, update} from "./update";
// import {MyPluginSettings} from "../settings";

// https://regex101.com/r/FhEQ2Z/1
// https://regex101.com/r/jC824J/1

export let app: App
export default class InputsPlugin extends Plugin {
	// settings :MyPluginSettings  = {};
	settings = {}
	id = 1;

	async onload() {
		app = this.app;
		console.log('loading Inputs plugin');
		// this.app.workspace.on('editor-change', async editor => {
		// 	let cur = editor.getCursor()
		// 	// let textLine = editor.getLine(cur.line)
		// 	let fileContent = editor.getValue()
		// 	// let reformatText = identifyAnnotation(INPUT_PATTERN, fileContent, textLine)
		// 	// let reformatText = identifyAnnotation(BUTTON_PATTERN, fileContent, textLine, generateButtonNotation)
		// 	// if (textLine === reformatText) return;
		// 	// editor.setLine(cur.line, reformatText)
		// 	// editor.setCursor(cur)
		// 	// MarkdownSourceView
		// })

		this.registerMarkdownPostProcessor(
			(root, ctx) => {
				replaceCode2Inputs(root, ctx, this.settings, this.app)
				replaceCode2Buttons(root, ctx, this.settings, this.app)
				// replaceCode2Update(root, ctx, this.settings, this.app)
			}
		)

		function updateStrucure(file:TFile, content:string, cache:any) {
			const inlineFields: any[] = getInlineFields(content)
			const fieldsObject: object = inlineFields.reduce(
				(obj, line) => (obj[line.key] = line.value, obj), {}
			)
			cache.inlineFields = fieldsObject
		}

		setTimeout(async () => {
			const mdFiles = app.vault.getMarkdownFiles()
			for (let file of mdFiles) {
				let content = await getTFileContent(file)
				let cache = app.metadataCache.getFileCache(file) ?? {}
				updateStrucure(file, content, cache)
			}
		}, 500)

		app.metadataCache.on("changed", updateStrucure)

		// await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new LiveFormSettingTab(this.app, this));

		// this.app.workspace.on('editor-change',(editor) => console.log('editor-change', editor) )


	}

	onunload() {

	}

	// async loadSettings() {
	// 	this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	// }

	// async saveSettings() {
	// 	await this.saveData(this.settings);
	// }
}


