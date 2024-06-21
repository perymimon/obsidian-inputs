import {TFile} from "obsidian";
import {getTFile} from "../files";

var app = globalThis.app

export async function importJs(path: TFile | string): Promise<object> {
	var tFile = getTFile(path)
	if (!tFile) throw `${path} file is not exist`
	let fullPath = app.vault.adapter.getResourcePath(tFile.path);
	let timestamp = new Date().getTime();
	let busterPath = fullPath.replace(/\?.*$/, `?${timestamp}`)
	return import(busterPath);
}

export async function asyncEval(code: string, fields = {}, api = {}, debug = false) {
	const AsyncFunction = Object.getPrototypeOf(async function () {
	}).constructor
	const func = new AsyncFunction('fields', 'api', 'debug', `
		with(fields) with(api){
		 	if(debug) debugger; 
	    	return (${code}) 
	    }
	`)
	return await func.call(this, fields, api, debug)
}
