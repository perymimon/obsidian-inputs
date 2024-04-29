import {getTFile, getTFileContent, modifyFileContent} from "./files";
import {freshFileStructure} from "./fileData";
import inputModal from "./inputModal";
import {CachedStructure, fieldUpdate, TRIGGER_PAGE_DATA_OPEN, VIEW_TYPE_PAGE_DATA_VIEW} from "./types";
import {setInlineField} from "./quicky";
import {App, getIcon, ItemView, stringifyYaml, TFile, WorkspaceLeaf} from "obsidian";
import {app} from "./main";

function queryAllActiveInlineFieldElementsInDoc(){
	var root = app!.workspace.activeEditor.contentEl
	var rootContent = root.querySelector('.markdown-reading-view')
	return Array.from(rootContent.querySelectorAll('.inline-field'))
}

globalThis.document.on('click', '.dataview.inline-field', async (e: MouseEvent, delegateTarget) => {
	var mode = app!.workspace.activeEditor.getMode()
	if (mode == 'source') return
	var allFieldsEl = queryAllActiveInlineFieldElementsInDoc()
	var tFile = getTFile()
	var {allInlineFields = []} = await freshFileStructure(tFile)
	var selectedInlineFieldsEl = delegateTarget.matchParent('li')?.querySelectorAll('.inline-field') ?? [delegateTarget];
	// find index of html element
	var indexes = Array.from(selectedInlineFieldsEl).map(fieldEl => {
		var index = allFieldsEl.indexOf(fieldEl)
		if (index == -1) return
		var compensation = allInlineFields.slice(0, index)
			.filter(field => !(field.isRound || field.isSquare))
			.length
		return index + compensation
	})
	let modal = new inputModal(app, allInlineFields, indexes)
	modal.open()
	var result = (await modal)
	let newContent = result.reduce((content:string,change:fieldUpdate)=>{
		let {field,value, method} = change
		return setInlineField(content, value, {file: tFile, method}, field)
	}, await getTFileContent(tFile))
	await modifyFileContent(tFile, newContent)

})


export default class PageDataView extends ItemView {
	pageData:CachedStructure
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		// this.registerEvent();
		this.navigation = false;
		this.registerEvent(leaf.workspace.on('active-leaf-change',(activeLeaf)=>{
			// const tFile = activeLeaf.workspace.lastActiveFile
			const tFile = app.workspace.getActiveFile()
			this.render(tFile)
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
	async render(tFile: TFile){
		if(!tFile) return null;
		const {contentEl, } = this;
		contentEl.empty()
		contentEl.classList.add('page-data-view');
		var pageData = await freshFileStructure(tFile)
		const {allInlineFields,frontmatter} = pageData

		const h1 = contentEl.createEl('h1',{text:'Page Input Data for '})
		h1.createEl('span',{text:tFile.name})
		contentEl.createEl('h2',{text:'inline field'})
		{
			let dl = contentEl.createEl('dl', {cls: 'page-data-list'})
			var index = 0
			for (let inlineField of allInlineFields!) {
				dl.createEl('dt', {cls: 'dataview inline-field-key', text: String(index++)})
				dl.createEl('dt', {cls: 'dataview inline-field-key', text: inlineField.key})
				dl.createEl('dd', {cls: 'dataview inline-field-value', text: inlineField.value ?? '-'})
			}
		}
		{
			contentEl.createEl('h2', {text: 'front matter'})
			let dl = contentEl.createEl('dl',{cls:'page-data-list'})
			for (let key in frontmatter!) {
				dl.createEl('dt', {cls: 'dataview inline-field-key', text: ''})
				dl.createEl('dt', {cls: 'dataview inline-field-key', text: key})
				dl.createEl('dd', {cls: 'dataview inline-field-value', text: stringifyYaml(frontmatter[key] ?? '-')})
			}
		}
	}


}
