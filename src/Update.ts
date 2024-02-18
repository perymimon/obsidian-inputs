import {App, setTooltip, TFile} from "obsidian";
import {MyPluginSettings} from "./settings";
import {executeCode, importJs} from "./api";
import * as api from "./api"
import {refresh, replaceAndSave} from "./internalApi";

export const UPDATE_PATTERN = /UPDATE(?<name>\[[^\]]+])\s*(?<path>.+?)?/i
export const UPDATE_PATTERN_TEXT = new RegExp(`\`${UPDATE_PATTERN.source}?\``, 'ig')

// https://regex101.com/r/AN0SOC/1
export function replaceCode2Buttons(root: HTMLElement, ctx, settings: MyPluginSettings, app: App) {
	const codesEl = root.findAll('code')
	for (let codeEl of codesEl) {
		const text = codeEl.innerText.trim()
		const updateNotation = text.match(UPDATE_PATTERN)
		if (!updateNotation) continue;
		const fields = updateNotation.groups;
		fields!.pattern = '`' + text + '`'
		createButton(codeEl, app, ctx.frontmatter, fields)
	}
}

function createButton(rootEl, app: App, frontmatter, fields) {
	const buttonEl = rootEl.createEl('button', {cls: 'live-form'})
	const {name, path, literal, pattern} = fields
	buttonEl.textContent = name
	rootEl.replaceWith(buttonEl)
	buttonEl.addEventListener('click', async (event) => {
		global.live = api
			let value = await executeCode(path)
		setDVInlineFields(key,value)
			return
		delete global.live
	})
}

