// @ts-nocheck1
// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import type {App, TFile, SearchResult} from "obsidian";
import {AbstractInputSuggest, prepareFuzzySearch} from "obsidian";
import {link} from "../api";
import {resolveOptions} from "../internalApi";
import {inputOption} from "../types";

export enum FileSuggestMode {
	TemplateFiles,
	ScriptFiles,
}

type Choice = SearchResult & inputOption
export class InputSuggest extends AbstractInputSuggest<TFile> {
	options: string

	constructor(app: App, textInputEl: HTMLInputElement | HTMLDivElement, options: string) {
		super(app, textInputEl);

		this.options = options
		// textInputEl.addEventListener('change', (event) => event.stopPropagation())
	}

	renderSuggestion(choice:Choice, el: HTMLElement) {
		let {text, value, matches, score} = choice
		for (let vec of matches.reverse()) {
			text = text.slice(0, vec[0]) + '<b>' + text.slice(vec[0], vec[1]) + '</b>' + text.slice(vec[1])
		}
		if ('path' in Object(value))
			el.innerHTML = (link(value));
		else
			el.innerHTML = (text)
	}

	selectSuggestion(choice): void {
		let {text, value, matches, score} = choice
		var v = 'path' in Object(value) ? link(value) : value
		this.setValue(v)
		this.textInputEl.trigger("change");
		this.setValue('')
		// this.close();
	}

	async getSuggestions(input_str: string) {
		let fuzzy = prepareFuzzySearch(input_str.toLowerCase())
		let choices = await resolveOptions(this.options)
		return choices.map(({text, value}) => {
			let {score, matches} = fuzzy(text) ?? {score: Infinity, matches: []};
			return {text, value, matches, score};
		})
			.filter(c => Math.abs(c.score) < Infinity)
			.sort(c => c.score ?? -Infinity)

	}

}

// export class FileSuggest extends TextInputSuggest<TFile> {
//
// 	getSuggestions(input_str: string, all_files=[]): TFile[] {
// 		const files: TFile[] = [];
// 		const lower_input_str = input_str.toLowerCase();
//
// 		all_files.forEach((file: TAbstractFile) => {
// 			if (
// 				file instanceof TFile &&
// 				file.extension === "md" &&
// 				file.path.toLowerCase().contains(lower_input_str)
// 			) {
// 				files.push(file);
// 			}
// 		});
//
// 		return files;
// 	}
//
// 	renderSuggestion(file: TFile, el: HTMLElement): void {
// 		el.setText(file.path);
// 	}
//
// 	selectSuggestion(file: TFile): void {
// 		this.inputEl.value = file.path;
// 		this.inputEl.trigger("input");
// 		this.close();
// 	}
// }
