import {getActiveFile, getStructure, getTFile} from "./api";

/**
 * @param location filename#heading | filename | #heading
 * @param method append|prepend
 */
export async function addLog(args){
	const {text,location, method = "append"} = args;
	const [filename,heading] = location.split(/#/)
	const file = getTFile(filename)
	if(heading){
		var {headings,sections, frontmatterPosition} = getStructure(file)
		var header = headings.find( item => item.heading == heading)
	}

	await app.vault.process(file, content=>{
		let lines = content.split('\n')
		var pos = 0;
		if(method == "prepend"){
			pos = header? header.position.start.line : frontmatterPosition.end.line
		}
		if(method == "append"){
			pos = header? header.position.end.line : lines.length;
		}
		lines.splice(pos + 1,0,text)
		return lines.join('\n')
	})
}
