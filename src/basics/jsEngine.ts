import type {TFile} from "obsidian";
import {Priority, targetFile} from "../types";
import {setPrototype} from "./objects";
import {asyncEval} from "../internalApi";
import * as api from "../api";
import {getTFile} from "../files";
import {getFileData} from "../data";
var app = globalThis.app

export async function importJs(path: TFile | string): Promise<object> {
	var tFile = getTFile(path)
	if (!TFile) throw `${path} file is not exist`
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
