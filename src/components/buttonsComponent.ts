// @ts-nocheck1
import {runSequence} from "../api";
import {patternToTitle} from "../internalApi";
import {Component} from "obsidian";

export class ButtonsComponent extends Component {
	async runSequence(e, delegateTarget) {
		await runSequence(delegateTarget.title.replaceAll('\n\t', '|'))
	}

	onload() {
		/* register events to global for avoid other plugins (like dataview)
 			to disrupt this plugin by replacing the dom */
		super.onload();
		globalThis.document.on('click', 'button.live-form', this.runSequence)
	}

	onunload() {
		super.onunload();
		globalThis.document.off('click', 'button.live-form', this.runSequence)

	}
}

export function generateButtonNotation(fields: Record<string, any>, id = 0) {
	const {name = '', expression = '', target = ''} = fields
	return `\`Button|${name}| ${expression} ${target} -${id}-\``
}

//  app: App, frontmatter:Record<string, any>
// https://regex101.com/r/AN0SOC/1
export function createButton(pattern: string, fields = {}) {
	const buttonEl = createEl('button', {cls: 'live-form'})
	const {name, target = ''} = fields
	buttonEl.textContent = name || target || 'no name'
	buttonEl.title = patternToTitle(pattern)
	return buttonEl
}




