import {TFile} from "obsidian";
import {getFileData, letTFile} from "./api";
import {Priority} from "./types";
import {setPrototype} from "./objects";
import {asyncEval} from "./internalApi";
import * as api from "./api";

export async function importJs(path: TFile | string): Promise<unknown> {
	var tFile = await letTFile(path)
	if (!TFile) throw `${path} file is not exist`
	path = tFile.path
	let fullPath = app.vault.adapter.getResourcePath(path);
	let timestamp = new Date().getTime();
	let busterPath = fullPath.replace(/\?.*$/, `?${timestamp}`)
	return import(busterPath);
}

export async function executeCode(code: string, vars, contextFile?: string | TFile, priority?: Priority, debug?: boolean) {
	var fileData = getFileData(contextFile, priority)
	var fields = setPrototype(vars, fileData)
	return await asyncEval(code, fields, api, 'api', debug)
}
