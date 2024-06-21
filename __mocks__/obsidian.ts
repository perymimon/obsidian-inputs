import {mock} from 'jest-mock-extended'
import {App} from "obsidian";

export app = globalThis.app = mock<App>()
import {extractFrontmatter, extractHeadings} from "./_parsers";
import {targetFile} from "../src/types";
import {getTFileContent} from "../src/__mocks__/files";


export class Notice {
	constructor(message: string | DocumentFragment, duration?: number) {
		return {message, duration}
	}
}

export class TAbstractFile {
	path: string;
	name: string;
	parent: TFolder | null;

}

export class TFile extends TAbstractFile {
	stat: FileStats;
	basename: string;
	extension: string;
}

export interface FileStats {
	ctime: number;
	mtime: number;
	size: number;
}

export class TFolder extends TAbstractFile {
	children: TAbstractFile[];
	isRoot(): boolean;
}

app.metadataCache.getFileCache = function (file: TFile) {
	const content = getTFileContent(file as targetFile)
	const frontmatter = extractFrontmatter(content);
	const headings = extractHeadings(content, frontmatter.length);
	const frontmatterPosition = frontmatter.position;

	return {
		frontmatter: frontmatter.data,
		headings,
		frontmatterPosition,
		sections: [], // Add logic to extract sections if needed
		links: [], // Add logic to extract links if needed
	};
}



