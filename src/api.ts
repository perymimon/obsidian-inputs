export async function importJs(path: string): Promise<unknown> {
	debugger
	if(path.startsWith('[[') && path.endsWith(']]')){
		path = path.slice(2,-2)
		let Tfile = app.metadataCache.getFirstLinkpathDest(path,"")
		if(!Tfile) throw `${path} file is not exist`
		path = Tfile.path
	}

	let fullPath = app.vault.adapter.getResourcePath(path);
	if (!fullPath.includes('?')) {
		const scriptFile = this.app.metadataCache.getFirstLinkpathDest(path, '');
		if (scriptFile) {
			fullPath += '?' + scriptFile.stat.mtime;
		}
	}
	return import(fullPath);
}
export function createNewNoteFromTemplate(template, folder, filename, openNewNote) {
	const templater = getPlugin('templater-obsidian').templater;
	templater.create_new_note_from_template(template, folder, filename, openNewNote)
}

export function appendTemplateToActiveFile(templateFile) {
	const templater = getPlugin('templater-obsidian').templater;
	templater.append_template_to_active_file(templateFile)
}
export function getNewFileTemplateForFolder(folder) {
	const templater = getPlugin('templater-obsidian').templater;
	templater.create_new_note_from_template(template, folder, filename, openNewNote)
}

export function getPlugin(pluginId: string): Plugin {
	return app.plugins.getPlugin(pluginId);
}


