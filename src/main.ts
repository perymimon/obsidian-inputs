import {Plugin, App, TFile, MarkdownPostProcessorContext, Notice} from 'obsidian';
import {createForm} from "./inputs";
import {createButton} from "./buttons";
import {getInlineFields, parsePattern} from "./internalApi";
import inputModal from './inputModal'
import {setInlineField} from "./quicky";
import {getStructure, getTFile, letTFile, updateFile} from "./api";
import {getTFileContent} from "./files";

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
export type Pattern = {
	id: string,
	type: string,
	name: string,
	expression: string,
	options: string,
	target: string
}

// update cache with inline-field meta data
function updateStrucure(file: TFile, content: string, cache: any) {
	const inlineFields: any[] = getInlineFields(content)
	const fieldsObject: object = inlineFields.reduce(
		(obj, line) => (obj[line.key] = line.value, obj), {}
	)
	cache.allInlineFields = inlineFields
	cache.inlineFields = fieldsObject
	cache.dirty = false
}


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
				for (let codeEl of codesEl) {
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
			for (let tFile of mdFiles) {
				// let content = await getTFileContent(file)
				let cache = app.metadataCache.getFileCache(tFile)
				if (!cache) continue
				const content = await app.vault.cachedRead(tFile)
				updateStrucure(tFile, content, cache)
			}
		}, 500)

		app.metadataCache.on("changed", updateStrucure)

		// await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new LiveFormSettingTab(this.app, this));
		// this.app.workspace.on('editor-change',(editor) => console.log('editor-change', editor) )

	}

	postProcess(source: string) {
		if (!source.trim()) return null
		const patterns = source.split("\n").filter((row) => row.trim().length > 0);
		const pattern = patterns[0]
		const fields = parsePattern(pattern, PATTERN)
		if (!fields?.type) return null;
		var element: HTMLElement
		if (fields?.type == 'button') {
			element = createButton(source, fields)
		} else {
			element = createForm(source, fields)
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
	// var {allInlineFields = []} = getStructure(tFile)
	var tFile = getTFile()
	var {allInlineFields = [], dirty} = getStructure(tFile)
	if (dirty) return
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
	var tFile = getTFile()
	var content = await getTFileContent(tFile)
	var newContent = content
	for (let field of result) {
		newContent = setInlineField(newContent, field.value, {file: tFile, method: 'replace'}, field)
	}
	if (content == newContent) return
	await updateFile(tFile, newContent)

})

