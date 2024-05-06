// @ts-nocheck1
import {Plugin, App, MarkdownPostProcessorContext, Notice, WorkspaceLeaf, ItemView, PluginManifest} from 'obsidian';
import {createForm, InputsComponent} from "./inputsComponent";
import {ButtonsComponent, createButton} from "./buttonsComponent";
import {parsePattern} from "./internalApi";
import {refreshFileStructure} from "./fileData";
import "./ui"
import {VIEW_TYPE_PAGE_DATA_VIEW} from "./types";
import PageDataView, {GlobalComponent} from "./ui";

export let app: App
// https://regex101.com/r/FhEQ2Z/1
// https://regex101.com/r/jC824J/1
// https://regex101.com/r/GiYmUD/1
export const PATTERN = new RegExp([
	/(?:`|^)/,
	/(?<id>-\w+-)?\s*/,
	/(?:(?<type>[\w-]*?))?/,
	/(?::(?<name>.*?))?/,
	/(?:\?(?<options>.+?))?/,
	/\|/,
	/\s*(?<expression>.*?)/,
	/\s*(?<target>>.*?)?/,
	/\s*(?:$|`)/
].map(r => r.source).join(''), 'i')


export default class InputsPlugin extends Plugin {
	// settings :MyPluginSettings  = {};
	settings = {}
	id = 1;
	view: ItemView

	constructor(app:App, manifest:PluginManifest) {
		super(app, manifest);
		this.addChild(new InputsComponent)
		this.addChild(new ButtonsComponent)
		this.addChild(new GlobalComponent)
	}

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
				await refreshFileStructure(tFile).catch(e => console.error(e));
			}
		}, 500)

		this.registerEvent(app.metadataCache.on("changed", refreshFileStructure))
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
		// pattern text until first |
		const pattern = codeSource.match(/^[^|]+\|/)
		const fields = parsePattern(String(pattern) || '', PATTERN)
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


