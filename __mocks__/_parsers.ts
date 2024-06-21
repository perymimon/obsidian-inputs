// Function to extract frontmatter from markdown content
export function extractFrontmatter(content:string) {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
	const match = content.match(frontmatterRegex);
	const result = {
		data: {},
		length: 0,
		position: null,
	};

	if (match) {
		result.length = match[0].length;
		result.position = {
			start: { offset: 0 },
			end: { offset: result.length },
		};

		const frontmatterContent = match[1];
		frontmatterContent.split('\n').forEach(line => {
			const [key, ...rest] = line.split(':');
			if (key && rest.length > 0) {
				result.data[key.trim()] = rest.join(':').trim();
			}
		});
	}

	return result;
}

// Function to extract headings from markdown content
export function extractHeadings(content, offset) {
	const headingRegex = /^(#+)\s(.+)$/gm;
	const headings = [];
	let match;

	while ((match = headingRegex.exec(content)) !== null) {
		const [fullMatch, hashes, heading] = match;
		const level = hashes.length;
		const position = {
			start: { offset: match.index },
			end: { offset: match.index + fullMatch.length },
		};

		headings.push({ heading, level, position });
	}

	return headings;
}

