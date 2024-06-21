import {Priority, targetFile} from "../types";
import {TFile} from "obsidian";
import {Files} from "../../tests/assets/filesExample";
import {getActiveFile} from "../internalApi";
import {alignString} from "../../tests/assets/utils";
import {basename, relative} from "path";

export function getTFile(file?: targetFile): TFile | null {
	if (file instanceof TFile) return file as TFile;
	file = (file || '').trim()
	if (!file || file == 'activeFile') return getActiveFile()
	let path:string = (file.startsWith('[[') && file.endsWith(']]')) ? file.slice(2, -2) : file
	const extensionRegex = /\.[^\/.]+$/;
	file = !extensionRegex.test(file) ?`${file}.md` : file
	if (!Files[file]) return null;
	let tFile = new TFile()
	tFile.path = relative('', file)
	tFile.name = basename(file)
	return tFile
}

export async function createTFile(file: targetFile, content: string = ''): Promise<TFile> {
	const tFile = getTFile(file)!
	content = alignString(content)
	Files[tFile.path] = {content}
	//@ts-ignore
	tFile.content = content
	// console.log(`create a virtual file "${tFile?.path}"`)
	return tFile
}

export function getTFileContent(file: targetFile) :string{
	const tFile = getTFile(file)!
	if (!tFile) return ''
	const content = Files[tFile.path].content
	// console.log(`read file "${tFile.path}" \n\n  ${content}`)
	return content
}


export const getFileData = jest.fn().mockImplementation((file?: targetFile, priority: Priority = 'field') => {
	const filename = (file instanceof TFile) ? file.name : file as string
	return Files[filename]?.data;
})
