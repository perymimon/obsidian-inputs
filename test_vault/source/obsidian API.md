```js
app.commands.executeCommandById("obsidian-linter:lint-file");
let content = await app.vault.read(activeView.file);

app.fileManager.processFrontMatter(file, front=> front )
app.fileManager.renameFile(file, newPath)

// find a file
app.metadataCache.getFirstLinkpathDest('dcba.md',"")

app.fileManager.createNewMarkdownFile(folder,filename ?? "Untitled")
```

> MetadataCache
> https://docs.obsidian.md/Reference/TypeScript+API/MetadataCache

https://docs.obsidian.md/Reference/TypeScript+API/Vault

```js
function getAllCommands(){
	app.commands.listCommands();
}

function getFiles(){
	app.vault.getAllLoadedFiles().filter(file => file instanceof TFile) as TFile[];
}

fucntion getFolders(){
	app.vault.getAllLoadedFiles().filter(file => file instanceof TFolder) as TFolder[];
}



export function getFileTags(app: App, file: TFile) {
    const cache = app.metadataCache.getFileCache(file);
    const tags: string[] = uniqueArray(getAllTags(cache)); // If a tag is defined multiple times in the same file, getTags() returns it multiple times, so use uniqueArray() to iron out duplicates.

    // Remove preceding hash characters. E.g. #tag becomes tag
    tags.forEach((tag: string, index) => {
        tags[index] = tag.replace("#", "");
    });
    return tags;
}
```
# obsidian API input components
https://docs.obsidian.md/Reference/TypeScript+API/Setting

```js

	const textSetting = new Setting(this.contentEl);
	textSetting.setName(this.subTitle);
	textSetting.setDesc(this.description);
	textSetting.addText(component => {
		component.setValue(this.value);
		component.setPlaceholder(this.subTitle);
		component.onChange(value => {
			this.value = value;
		});
	});
	
	const buttonSetting = new Setting(this.contentEl);
		buttonSetting.addButton(component => {
			component.setButtonText('Apply');
			component.setCta();
			component.onClick(() => {
				this.onSubmit(this.value);
				this.close();
			});
		});
	