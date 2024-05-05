import {getTFile, getTFileContent, modifyFileContent} from "./files";
import {refreshFileStructure} from "./fileData";
import inputModal from "./inputModal";
import {CachedStructure, fieldUpdate, TRIGGER_PAGE_DATA_OPEN, VIEW_TYPE_PAGE_DATA_VIEW} from "./types";
import {setInlineField} from "./quicky";
import {
	Component,
	ItemView,
	stringifyYaml,
	TFile,
	WorkspaceLeaf
} from "obsidian";
import {app} from "./main";

export class GlobalComponent extends Component{
	onload() {
		/* register events to global for avoid other plugins (like dataview)
 			to disrupt this plugin by replacing the dom */
		super.onload();
		globalThis.document.on('click', '.dataview.inline-field',openInlineFieldModal)
	}
	onunload(){
		super.onunload();
		globalThis.document.off('click', '.dataview.inline-field',openInlineFieldModal)

	}
}

function queryInlineFieldsElInDoc() {
	//@ts-ignore
	var root = app!.workspace.activeEditor.contentEl
	var rootContent = root.querySelector('.markdown-reading-view')
	return Array.from(rootContent.querySelectorAll('.inline-field'))
}



async function openInlineFieldModal(e: MouseEvent, delegateTarget:HTMLBodyElement ) {
	//@ts-ignore
	var mode = app!.workspace.activeEditor.getMode()
	if (mode == 'source') return
	var allFieldsEl = queryInlineFieldsElInDoc()
	var tFile = getTFile()
	var {allInlineFields = []} = await refreshFileStructure(tFile)
	var selectedInlineFieldsEl = delegateTarget.matchParent('li')?.querySelectorAll('.inline-field') ?? [delegateTarget];
	// find index of html element
	var indexes:number[] = Array.from(selectedInlineFieldsEl).map(fieldEl => {
		var index = allFieldsEl.indexOf(fieldEl)
		var compensation = allInlineFields.slice(0, index)
			.filter(field => !(field.isRound || field.isSquare))
			.length
		return index + compensation
	})
	let modal = new inputModal(app, allInlineFields, indexes)
	modal.open()
	//@ts-ignore
	var result = (await modal)
	let newContent = result.reduce((content: string, change: fieldUpdate) => {
		let {field, value, method} = change
		return setInlineField(content, value, {file: tFile, method}, field)
	}, await getTFileContent(tFile))
	await modifyFileContent(tFile, newContent)

}

export default class PageDataView extends ItemView {
	pageData: CachedStructure

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		// this.registerEvent();
		this.navigation = false;
		//@ts-ignore
		this.registerEvent(leaf.workspace.on('active-leaf-change', () => {
			// const tFile = activeLeaf.workspace.lastActiveFile
			const tFile = app.workspace.getActiveFile()
			this.render(tFile)
		}))
		this.registerEvent(app.metadataCache.on("changed", (targetFile) => {
			this.render(targetFile)
		}))
	}

	getViewType(): string {
		return VIEW_TYPE_PAGE_DATA_VIEW;
	}

	getDisplayText(): string {
		return "Page Data";
	}

	getIcon(): string {
		return "database";
	}

	onClose(): Promise<void> {
		return Promise.resolve();
	}

	async onOpen(): Promise<void> {
		// Integration point: external plugins can listen for `calendar:open`
		// to feed in additional sources.

	}

	async render(tFile: TFile | null ) {
		if (!tFile) return null;
		const {contentEl,} = this;
		contentEl.empty()
		contentEl.classList.add('page-data-view');
		var pageData = await refreshFileStructure(tFile)
		const {allInlineFields, frontmatter} = pageData

		const h1 = contentEl.createEl('h1', {text: 'Page Input Data for '})
		h1.createEl('span', {text: tFile.name})
		contentEl.createEl('h2', {text: 'inline field'})
		{
			var index = 0
			for (let inlineField of allInlineFields!) {
				let dl = contentEl.createEl('dl', {cls: 'page-data-list'})
				dl.createEl('dt', {cls: 'dataview inline-field-key', text: String(index++)})
				dl.createEl('dt', {cls: 'dataview inline-field-key', text: inlineField.key})
				dl.createEl('dd', {cls: 'dataview inline-field-value', text: inlineField.value ?? '-'})
				// dl.addEventListener('click', (e) => {
				// 	let view = app.workspace.getLeaf().view
				// if(view instanceof MarkdownView ) {
				// 	debugger
				// 	let editor = view.editor
				// 	if(!editor) return null
				// 	let {offset} = inlineField
				// 	let poses = offset.map(o => editor.offsetToPos(o))
				// 	editor.scrollIntoView({from:poses[0], to:poses[1]}, true)
				// }
				// })
			}
		}
		{
			contentEl.createEl('h2', {text: 'front matter'})
			let dl = contentEl.createEl('dl', {cls: 'page-data-list'})
			for (let key in frontmatter!) {
				dl.createEl('dt', {cls: 'dataview inline-field-key', text: ''})
				dl.createEl('dt', {cls: 'dataview inline-field-key', text: key})
				dl.createEl('dd', {cls: 'dataview inline-field-value', text: stringifyYaml(frontmatter[key] ?? '-')})
			}
		}
	}


}
