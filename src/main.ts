// @ts-nocheck1
import {Plugin, App, MarkdownPostProcessorContext, Notice, WorkspaceLeaf, ItemView} from 'obsidian';
import {createForm} from "./inputs";
import {createButton} from "./buttons";
import {parsePattern} from "./internalApi";
import {freshFileStructure} from "./fileData";
import "./ui"
import {VIEW_TYPE_PAGE_DATA_VIEW} from "./types";
import PageDataView from "./ui";

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
	view: ItemView

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
				await freshFileStructure(tFile).catch(e => console.error(e));
			}
		}, 500)

		app.metadataCache.on("changed", freshFileStructure)
		// app.metadataCache.on("resolve", updateStructure)

		// await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new LiveFormSettingTab(this.app, this));
		this.registerView(
			VIEW_TYPE_PAGE_DATA_VIEW,
			(leaf: WorkspaceLeaf) => (this.view = new PageDataView(leaf))
		);

		this.addCommand({
			id: "show-pageData-view",
			name: "Open pageData view",
			checkCallback: (checking: boolean) => {
				if (checking) {
					return (
						this.app.workspace.getLeavesOfType(VIEW_TYPE_PAGE_DATA_VIEW).length === 0
					);
				}
				this.initPageDataViewLeaf();
			},
		});
		app.workspace.onLayoutReady(() => this.initPageDataViewLeaf())
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

	initPageDataViewLeaf() {
		if (app.workspace.getLeavesOfType(VIEW_TYPE_PAGE_DATA_VIEW).length) {
			return;
		}
		app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_PAGE_DATA_VIEW,
		});
	}

	// async loadSettings() {
	// 	this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	// }

	// async saveSettings() {
	// 	await this.saveData(this.settings);
	// }
}


