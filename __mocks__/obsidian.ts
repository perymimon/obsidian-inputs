import {mock} from 'jest-mock-extended'
import {App, CachedMetadata, HeadingCache, Pos, TFolder} from "obsidian";
import {extractFrontmatter, extractHeadings} from "./_parsers";
import {targetFile} from "../src/types";
import {getTFileContent} from "../src/__mocks__/files";


export const app = globalThis.app = mock<App>()


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

// export class TFolder extends TAbstractFile {
// 	children: TAbstractFile[];
// 	isRoot(): boolean;
// }

app.metadataCache.getFileCache = function (file: TFile):CachedMetadata | null {
	const content = getTFileContent(file as targetFile)
	const frontmatter = extractFrontmatter(content);
	const headings = extractHeadings(content, frontmatter.length) as HeadingCache[];
	const frontmatterPosition = frontmatter.position as Pos;

	return {
		frontmatter: frontmatter.data,
		headings,
		frontmatterPosition,
		sections: [], // Add logic to extract sections if needed
		links: [], // Add logic to extract links if needed
	};
}



