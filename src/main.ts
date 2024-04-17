// @ts-nocheck1
import {Plugin, App, TFile, MarkdownPostProcessorContext, Notice} from 'obsidian';
import {createForm} from "./inputs";
import {createButton} from "./buttons";
import {parsePattern} from "./internalApi";
import inputModal from './inputModal'
import {setInlineField} from "./quicky";
import {getTFile, getTFileContent, modifyFileContent} from "./files";
import {updateFileStructure} from "./fileData";

export let app: App
// https://regex101.com/r/FhEQ2Z/1
// https://regex101.com/r/jC824J/1
// https://regex101.com/r/GiYmUD/1
export const PATTERN = new RegExp([
	/(?:`|^)/,
	/(?<id>-\w+-)?\s*/,
	/(?:(?<type>[\w-]*?))?/,
	/(?::(?<name>.*?))?/,
	/\|/,
	/\s*(?<expression>.*?)/,
	/(?:,(?<options>.+?))?/,
	/\s*(?<target>>.*?)?/,
	/\s*(?:$|`)/
].map(r => r.source).join(''), 'i')


export default class InputsPlugin extends Plugin {
	// settings :MyPluginSettings  = {};
	settings = {}
	id = 1;

	async onload() {
		app = this.app;
		console.log('loading Inputs plugin');
		this.registerMarkdownPostProcessor(
			(rootEl: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				const codesEl = rootEl.findAll('code')
				for (const codeEl of codesEl) {
					var element = this.postProcess(codeEl.innerText)
					if (!element) continue
					codeEl.replaceWith(element)
				}
			}
		)

		this.registerMarkdownCodeBlockProcessor("inputs", (source, el, ctx) => {
			const element = this.postProcess(source)
			if (!element) return
			el.replaceWith(element)
		});

		setTimeout(async () => {
			const mdFiles = app.vault.getMarkdownFiles()
			for (const tFile of mdFiles) {
				// let content = await getTFileContent(file)
				await updateFileStructure(tFile).catch( e => console.error(e) );
			}
		}, 500)

		app.metadataCache.on("changed", updateFileStructure)
		// app.metadataCache.on("resolve", updateStructure)

		// await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new LiveFormSettingTab(this.app, this));
		// this.app.workspace.on('editor-change',(editor) => console.log('editor-change', editor) )

	}

	postProcess(codeSource: string) {
		if (!codeSource.trim()) return null
		const patterns = codeSource.split("\n").filter((row) => row.trim().length > 0);
		const pattern = patterns[0]
		const fields = parsePattern(pattern, PATTERN)
		if (!fields?.type) return null;
		var element: HTMLElement
		if (fields?.type == 'button') {
			element = createButton(codeSource, fields)
		} else {
			element = createForm(codeSource, fields)
		}
		return element
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


globalThis.document.on('click', '.dataview.inline-field', async (e: MouseEvent, delegateTarget) => {
	var mode = app!.workspace.activeEditor.getMode()
	if (mode == 'source') return
	var root = app!.workspace.activeEditor.contentEl
	var rootContent = root.querySelector('.markdown-reading-view')
	var allFieldsEl = Array.from(rootContent.querySelectorAll('.inline-field'))
	var tFile = getTFile()
	var {allInlineFields = []} = await updateFileStructure(tFile)
	var fieldsEl = delegateTarget.matchParent('li')?.querySelectorAll('.inline-field') ?? [delegateTarget];
	// find index of html element
	var indexs = Array.from(fieldsEl).map(fieldEl => {
		var index = allFieldsEl.indexOf(fieldEl)
		if (index == -1) return
		var compensation = allInlineFields.slice(0, index)
			.filter(field => !(field.isRound || field.isSquare))
			.length
		return index + compensation
	})
	let modal = new inputModal(app, allInlineFields, indexs)
	modal.open()
	var result = (await modal)
	var content = await getTFileContent(tFile)
	var newContent = content
	for (const field of result) {
		newContent = setInlineField(newContent, field.value, {file: tFile, method: 'replace'}, field)
	}
	if (content == newContent) return
	await modifyFileContent(tFile, newContent)

})

