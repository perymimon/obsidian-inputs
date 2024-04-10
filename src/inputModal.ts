// @ts-nocheck
import {App, DropdownComponent, Modal, Setting} from "obsidian";
import {Field} from "./internalApi";

export default class extends Modal {
	result: string;
	chanchesPairs:{ value: string, field: Field }[] =  new Set()
	pageFields = []
	indexs:number[]
	setting

	resolve = (a: any) => {
	}
	reject = (e: any) => {
	}

	then(onFulfilled, onRejected) {
		this.resolve = onFulfilled
		this.reject = onRejected
	}


	constructor(app: App, pageFields: Field[], indexs = []) {
		super(app);
		// this.pairs.push({key, value})
		this.pageFields = pageFields
		this.indexs = indexs
		this.generateUI()

	}
	generateUI(){
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h1", {text: "What's your mind?"});

		new Setting(contentEl)
			.setName('Update inline field')

		for (let index of this.indexs) {
			this.createFieldInput(index)
		}


		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setButtonText("Submit")
					.setCta()
					.onClick(() => {
						this.resolve(this.chanchesPairs)
						this.close();
					})
			})
	}

	createFieldInput(index:number){
		var {contentEl, pageFields} = this
		var field = pageFields[index]
		new Setting(contentEl)
			.setName(field.key || 'not selected')
			.setDesc(`offset ${field.offset[0]}, ${field.outerField}`)
			.addDropdown((dropdown: DropdownComponent) => {
				for (let [index, field] of pageFields.entries()) {
					dropdown.addOption(String(index), field.key)
				}
				dropdown.setValue(String(index))
				dropdown.onChange((newIndex: string) => {
					var i = this.indexs.indexOf(index)
					this.indexs.splice(i,1, newIndex)
					this.generateUI()
				})
			})
			.addText((text) => {
				text
					.setValue(field.value)
					.onChange((value) => {
						field.value = value
						this.chanchesPairs.add(field)
					})
			});
	}

	onOpen() {
		return this
	}

	onClose() {
		let {contentEl} = this;
		// contentEl.empty();
		this.reject('close')
	}


}
