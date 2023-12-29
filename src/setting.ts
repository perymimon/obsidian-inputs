import {App, Modal, PluginSettingTab, Setting} from "obsidian";
import LiveFormPlugin from "./main";

export const DEFAULT_SETTINGS = {
	inputTypes: {
		'': 'text',
		'//': 'date',
		'#': 'number',
	}
}

export class LiveFormSettingTab extends PluginSettingTab {
	plugin: LiveFormPlugin;

	constructor(app: App, plugin: LiveFormPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		const {inputTypes} = this.plugin.settings
		// Create a setting for each prefix in inputTypes
		Object.keys(inputTypes).forEach((prefix) => {
			new Setting(containerEl)
				.setName(`Edit type for '${prefix}' prefix`)
				.setDesc(`Edit the type for input fields with the '${prefix}' prefix`)
				.addText((text) =>
					text
						.setPlaceholder('Prefix for the type (e.g. //)')
						.setValue(prefix || 'default')
						.onChange(async (newPrefix) => {
							inputTypes[newPrefix] =  inputTypes[prefix]
							delete inputTypes[prefix]
							await this.plugin.saveSettings();
						})
				)
				.addText((text) =>
					text
						.setPlaceholder('Type (e.g., text, date, number)')
						.setValue(inputTypes[prefix])
						.onChange(async (value) => {
							inputTypes[prefix] = value;
							await this.plugin.saveSettings();
						})
				)
				.addButton(button=>{
					button.setIcon('delete')
						.onClick(async ()=>{
							delete inputTypes[prefix]
							await this.plugin.saveSettings()
							this.display()
						})
				})

		});

		// Add a button to dynamically add more prefixes
		new Setting(containerEl)
			.setName('Add Prefix')
			.setDesc('Click to add a new prefix to add new inputTypes')
			.addButton((button) =>
				button.setButtonText('Add Prefix').onClick(async () => {
					inputTypes['--'] = '';
					await this.plugin.saveSettings();
					this.display(); // Refresh the display to reflect the new prefix
				})
			);
	}
}
