import {App, DropdownComponent, Modal, Setting} from "obsidian";
import {Field} from "./internalApi";

export default class extends Modal {
	result: string;
	chanchesPairs:{ value: string, field: Field }[] =  new Set()
	pageInlineFields = []

	resolve = (a: any) => {
	}
	reject = (e: any) => {
	}

	then(onFulfilled, onRejected) {
		this.resolve = onFulfilled
		this.reject = onRejected
	}

	setting

	constructor(app: App, pageFields: Field[], indexes = []) {
		super(app);
		// this.pairs.push({key, value})
		this.pageInlineFields = pageFields
		const {contentEl} = this;

		contentEl.createEl("h1", {text: "What's your mind?"});

		new Setting(contentEl)
			.setName('Update inline field')

		for (let index of indexes) {
			let field = pageFields[Number(index)]
			let setting = new Setting(contentEl)
				.setName(field.key || 'not selected')
				.setDesc(`offset ${field.offset[0]}, ${field.outerField}`)
				.addDropdown((dropdown: DropdownComponent) => {
					for (let [index, field] of pageFields.entries()) {
						dropdown.addOption(String(index), field.key)
					}
					dropdown.setValue(String(index))
					dropdown.onChange((index: string) => {
						let field = pageFields[Number(index)]
						// dropdown.setValue(String(index))
						setting
							.setName(field.key)
							.setDesc(`offset ${field.offset[0]}, ${field.outerField}`)
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

		return this
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
