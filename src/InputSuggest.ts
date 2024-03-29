// @ts-nocheck
// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import {AbstractInputSuggest, App, TFile, prepareFuzzySearch} from "obsidian";
import {link} from "./api";

export enum FileSuggestMode {
	TemplateFiles,
	ScriptFiles,
}

export class InputSuggest extends AbstractInputSuggest<TFile> {
	query: string

	constructor(app: App, textInputEl: HTMLInputElement | HTMLDivElement, queries: string[]) {
		super(app, textInputEl);

		this.queries = queries.map(q => q.trim());
		textInputEl.addEventListener('change', (event) => event.stopPropagation())
	}

	async renderSuggestion(file, el: HTMLElement) {
		let {matches = [], path} = file
		for (let vec of matches.reverse()) {
			path = path.slice(0, vec[0]) + '<b>' + path.slice(vec[0], vec[1]) + '</b>' + path.slice(vec[1])
		}
		el.setHTML(link(file));
	}

	selectSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent): void {
		this.setValue(link(file))
		// this.textInputEl.value = file.path;
		// this.textInputEl.trigger("input");
		this.textInputEl.trigger("select");
		this.setValue('')
		// this.close();
	}

	async getSuggestions(input_str: string) {
		let fuzzy = prepareFuzzySearch(input_str.toLowerCase())
		let querying = this.queries.map(query => DataviewAPI.query(`list from ${query}`))
		let results = await Promise.all(querying)
		let sorted = results.flatMap(result => {
			const primaryMeaning = result.value.primaryMeaning.type
			return result.value.values
				.map(ft => {
					let result = fuzzy(ft[primaryMeaning]);
					// console.log(ft.path, result?.score ?? -Infinity);
					//todo:filter out infinity
					let [, extension] = ft.path.match(/\.(.*)$/) ?? ''
					return {...ft, primaryMeaning, extension, ...result};
				})
		})
			.filter(ft => Math.abs(ft.score) < Infinity)
			.sort(ft => ft?.score ?? -Infinity)
		// console.log('----------');
		return sorted

		// return result.value.values.filter( ft=> ft.path.contains(input_str))
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
