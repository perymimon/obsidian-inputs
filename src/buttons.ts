import {App, setTooltip} from "obsidian";
import {MyPluginSettings} from "./settings";
import {importJs} from "./api";
import * as api from "./api"

const BUTTON_MARK = /button(?<name>\[[^]+])\s(?<path>.+)/

export function replaceCode2Buttons(root: HTMLElement, ctx, settings: MyPluginSettings, app: App){
	const codesEl = root.findAll('code')
	for (let codeEl of codesEl) {
		const text = codeEl.innerText.trim().toLowerCase()
		const buttonNotation = text.match(BUTTON_MARK)
		if (!buttonNotation) continue;
		const fields = buttonNotation.groups;
		fields!.pattern = '`' + text + '`'
		createButton(codeEl, app, ctx.frontmatter, fields)
	}
}
function createButton(rootEl, app:App, frontmatter, fields ){
	const buttonEl = rootEl.createEl('button',{cls:'live-form'})
	const {name, path} = fields
	buttonEl.textContent = name
	buttonEl.addEventListener( 'click', async (event)=>{
		global.live = api
		const instrunction = await importJs(path)
		delete global.live
		debugger
	})
	rootEl.replaceWith(buttonEl)
}

