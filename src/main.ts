import {
	MarkdownView,
	Plugin,
} from 'obsidian';
import {LiveFormSettingTab, DEFAULT_SETTINGS} from "./settings";
import {code2Inputs, getNextId, identifyInputNotations} from "./util";
// test pattern : https://regex101.com/r/OvbwyE/1
export const INPUT_PATTERN = /(?<type>[^_`]*?)__+(?<placeholder>[^_`]*)__+(\((?<options>[^)]+?)\))?(?<id> -\d+-)?/
export const CODE_MARK = new RegExp(`\`${INPUT_PATTERN.toString().slice(1,-1)}\``, 'g')

console.log(CODE_MARK)
/*
לבדוק אם מותקן dataview
אם כן לקחת ממנו את התבנית של שאילתה
להשתמש בזה כדי לזהות אופציות כאלו.

להריץ אותם כדי לקבל את הפלט ( רשימה של קבצים)
להשתמש ברשימה כדי ליצור autocomplate או בעזרת dataset אם אי אפשר ליצור בapi

האם אפשר לקבל שורות מרשימות ישר מquert ?
איך עושים input שהיוזר רק מסמן עבור dataview
*/

export default class LiveFormPlugin extends Plugin {
	settings = {};
	id = 1;

	async onload() {
		console.log('loading live-form plugin');

		/* find the higher id in open file and save it */
		this.registerEvent(this.app.workspace.on('file-open', async (file) => {
			let content = await this.app.vault.read(file);
			this.id = getNextId(content)
			console.log('next id for file', file.name, ':', this.id)
		}))

		this.registerEvent(this.app.workspace.on('editor-change',
			editor => this.id = identifyInputNotations(editor, this.id))
		)

		this.registerMarkdownPostProcessor(
			editor => code2Inputs(editor, this.settings, this.app)
		)

		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LiveFormSettingTab(this.app, this));

		// this.app.workspace.on('editor-change',(editor) => console.log('editor-change', editor) )
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


