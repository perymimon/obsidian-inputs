// @ts-nocheck
import {App, DropdownComponent, Modal, Setting} from "obsidian";
import {Field} from "./internalApi";
import {fieldUpdate, Target} from "./types";

export default class extends Modal {
	result: string;
	pageFields = []
	workingFields: fieldUpdate[]
	indexes: number[]
	setting

	constructor(app: App, pageFields: Field[], indexes:number[] = []) {
		super(app);
		// this.pairs.push({key, value})
		this.pageFields = pageFields
		this.indexes = indexes
		this.workingFields = this.pageFields
			.map((field) => ({value: field.value, method: 'replace', field}))
		this.render()

	}

	render() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h1", {text: "What's your mind?"});
		contentEl.createEl("h3", {text: 'Update inline field'});

		for (let index of this.indexes) {
			this.createFieldInput(index)
		}

		new Setting(contentEl)
			.addButton((btnSubmit) => {
				var {indexes, workingFields} = this
				btnSubmit
					.setButtonText("Submit")
					.setCta()
					.onClick(() => {
						var changed = indexes.map(i => workingFields[i])
							.filter(wf => wf.value != wf.field.value)
						this.resolve(changed)
						this.close();
					})
			})
	}

	fillWithFieldList(dropDown: DropdownComponent) {
		for (let [index, field] of this.pageFields.entries()) {
			dropDown.addOption(String(index), field.key)
		}
	}

	createFieldInput(index: number) {
		var {contentEl, workingFields, indexes} = this
		var workingField = workingFields[index]
		var field = workingField.field
		const settingLine = new Setting(contentEl)
			.setName(field.key || 'not selected')
			.setDesc(`offset ${field.offset[0]}, ${field.outerField}`)
			.setClass(`method-${workingField.method}`)

			.addDropdown((changerField: DropdownComponent) => {
				this.fillWithFieldList(changerField)
				changerField.setValue(String(index))
				changerField.onChange((newIndex: string) => {
					var i = indexes.indexOf(index)
					indexes[i] = newIndex
					this.render()
				})
			})

			.addText((text) => {
				text.inputEl.type = 'search'
				text
					.setValue(workingField.value)
					.onChange((value) => {
						workingField.value = value
						workingField.method = 'replace'
						let parent = text.inputEl.matchParent('.setting-item')
						parent.classList.remove('method-remove')
						parent.classList.remove('method-clear')
					})

			})
			.addExtraButton((button) => {
				button
					.setIcon('eraser')
					.onClick(() => {
						workingField.method = 'clear'
						this.render()
					})
			})
			.addExtraButton((button) => {
				button
					.setIcon('trash-2')
					.onClick(() => {
						workingField.method = 'remove'
						this.render()
					})
			})

	}

	onOpen() {
		return this
	}

	onClose() {
		let {contentEl} = this;
		// contentEl.empty();
		this.reject('close')
	}

	resolve = (a: any) => {
	}
	reject = (e: any) => {
	}

	then(onFulfilled, onRejected) {
		this.resolve = onFulfilled
		this.reject = onRejected
	}

}
