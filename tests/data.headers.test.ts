import {quickHeader} from "../src/data.headers";
import {parserTarget} from "../src/internalApi";
import {createTFile} from "files";
import {alignString} from "./assets/utils";

jest.mock("../src/files");
const EXAMPLE_MD_BASE = alignString(`
	---
	title: My Markdown Document
	date: 2024-05-30
	tags: [markdown, example]
	---
	____REPLACETHIS____
	
	## Header 2
	content 2
	
	# Header 3
	content 3
`);

function exampleMD(header: string): string {
	return EXAMPLE_MD_BASE.replace('____REPLACETHIS____', alignString(header));
}

describe('quickHeader', () => {
	beforeEach(async () => {
		await createTFile('example.md', exampleMD(`
			# Header 1
			This is an example Markdown content.
        `));
	})

	async function runTest(description: string, command: string, newContent: string, expectedHeader: string) {
		test(description, async () => {
			const target = parserTarget(command)
			const result = await quickHeader(newContent, target)
			expect(result).toEqual(exampleMD(expectedHeader))
		})
	}
	runTest('>example#Header (default append)', '>example#Header 1', 'New Content', `
        # Header 1
        This is an example Markdown content.
        New Content
    `);

	runTest('>example#Header append', '>example#Header 1 append', 'New Header Content', `
		# Header 1
		This is an example Markdown content.
		New Header Content
	`)
	runTest('>example#Header remove', '>example#Header 1 remove', 'New Content', ``);

	runTest('>example#Header clear', '>example#Header 1 clear', 'New Content', `
        # Header 1
    `);

	runTest('>example#Header replace', '>example#Header 1 replace', 'New Content', `
        # Header 1
        New Content
    `);

	runTest('>example#Header prepend', '>example#Header 1 prepend', 'New Content', `
        # Header 1
        New Content
        This is an example Markdown content.
    `);

	runTest('>example#Header rename', '>example#Header 1 rename', 'Header 4', `
        # Header 4
        This is an example Markdown content.
    `);


})



