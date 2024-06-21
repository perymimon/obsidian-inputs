import {getFileStructure} from "./data";
import {spliceString, spliceString2} from "./basics/strings";
import {log} from "./tracer";
import {Target} from "./types";
import {getTFileContent} from "./files";

/**
 * prepend or append or replace content under header
 * if header not exist stuff start be intersting
 * 1) append: create the header with the text on top file
 * 2) prepend: create the header iwht the text on bottom file
 * 3) replace : changed to prepend
 * @param content
 * @param text
 * @param target
 */
export async function quickHeader(text: string, target: Target): Promise<string> {
	var {file, path, method , pattern} = target;
	method = method || 'append'
	var content = await getTFileContent(file)
	const {headings = [], frontmatterPosition} = getFileStructure(file);
	var indexHeader = headings
		?.findIndex((item) => item.heading.replace(`\`${pattern}\``, '').trim() == path.trim());
	// Handle the case where the header does not exist
	// If header not exist default is to add to start of file,unless method is append
	let startOffset, endOffset

	if (indexHeader == -1) {
		if (method == 'rename') text = `## ${text}\n`
		else text = `## ${path}\n${text}`;
		if (method == 'replace') method = 'prepend';
		if (method == 'append') indexHeader = headings.length - 1;
		if (method == 'remove') return content;

		let beginOffset = frontmatterPosition?.end.offset ?? -1
		let latestOffset = headings.at(-1)?.position.end.offset ?? content.length
		startOffset = method == 'append' ? latestOffset : beginOffset;
		endOffset = startOffset
	} else {
		let [header, nextHeader] = headings.slice(indexHeader, indexHeader + 2)
		endOffset = nextHeader?.position.start.offset ?? content.length
		// +1 Move to the character right after the end of the header
		startOffset = (method == 'remove') ? header?.position.start.offset : (header.position.end.offset + 1)
		if( method== 'rename') {
			startOffset = header.position.start.offset
			endOffset = header.position.end.offset
			const headerContent = content.slice(startOffset, endOffset).trimEnd();
			const catchContent = /(?<=#{1,6} )[\w\s]+/
			text = headerContent.replace(catchContent, text)
			return spliceString2(content, startOffset, endOffset, text)
		}
	}

	const headerContent = content.slice(startOffset, endOffset).trimEnd();
	endOffset = startOffset + headerContent.length + Number(method == "clear"); // if clear take the last new line

	let headerContentLines = headerContent.split('\n')

	if (method == "append") headerContentLines.push(text)
	if (method == "prepend") headerContentLines.unshift(text)
	if (method == "clear") headerContentLines = [];
	if (method == "remove") headerContentLines = []
	if (method == "replace") headerContentLines = [text]

	return spliceString2(content, startOffset, endOffset, headerContentLines.join('\n'))
}
