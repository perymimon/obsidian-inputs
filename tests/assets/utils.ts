export function alignString(content: string) {
	// Split the content into lines
	const lines = content.split('\n');
	const firstContentLineIndex = lines.findIndex(line => line.trim() !== '');
	const lastContentLineIndex = lines.findLastIndex(line => line.trim() !== '');
	// Remove the lines before the first non-empty line
	const cleanedLines = lines.slice(firstContentLineIndex, lastContentLineIndex + 1);
	// Find the minimum indentation (leading spaces) across all lines that are not empty
	const minIndentation = cleanedLines
		.filter((line: string) => line.trim().length > 0)
		.reduce((minIndent: number, line: string) => {
			const leadingSpaces = line.match(/^\s*/)![0].length;
			return Math.min(minIndent, leadingSpaces);
		}, Infinity);

	// Remove the minimum indentation from each line
	const adjustedLines = cleanedLines.map((line: string) => line.slice(minIndentation) );

	// Join the adjusted lines back into a single string
	return adjustedLines.join('\n');
}
