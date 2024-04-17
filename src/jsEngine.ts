import {TFile} from "obsidian";
import {getFileData, letTFile} from "./api";
import {Priority} from "./types";
import {setPrototype} from "./objects";
import {asyncEval} from "./internalApi";
import * as api from "./api";
import {getTFile} from "./files";
var app = globalThis.app

export async function importJs(path: TFile | string): Promise<unknown> {
	var tFile = getTFile(path)
	if (!TFile) throw `${path} file is not exist`
	let fullPath = app.vault.adapter.getResourcePath(tFile.path);
	let timestamp = new Date().getTime();
	let busterPath = fullPath.replace(/\?.*$/, `?${timestamp}`)
	return import(busterPath);
}

export async function executeCode(code: string, vars, contextFile?: string | TFile, priority?: Priority, debug?: boolean) {
	var fileData = getFileData(contextFile, priority)
	var fields = setPrototype(vars, fileData)
	return await asyncEval(code, fields, api, 'api', debug)
}
