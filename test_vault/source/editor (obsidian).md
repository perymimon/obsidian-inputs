
```js
view.editor.getCursor()
editor.setCursor({line:0, ch:5})  // move cursor 
editor.setSelection({line:0, ch:10}, {line:0, ch:2} ) // change selection
editor.getLine(row) // return line text
editor.setLine(row, text) // set line text     
editor.replaceRange('new line',{line:15, ch:0}) // if one range only it act as insert
editor.lastLine() // get number of last text line
editor.getSelection(); // return text selcted
editor.getValue() // get whole file content

app.workspace.on('editor-change',(editor) => console.log('editor-change', editor) )
```

```js
this.app.fileManager.generateMarkdownLink(file,"");
```

```js
// in plugi
onload() { 
	this.registerEditorExtension([examplePlugin, exampleField]); 
}
```
> cache
```js
	app.metadataCache.getFileCache(file) #some structure of the file
```

```js
insertLine(row: number, line: string){  
	if (row > this.getLastRow()) {  
		this.editor.replaceRange('\n' + line, { line: row, ch: 0 });  
	} else {  
		this.editor.replaceRange(line + '\n', { line: row, ch: 0 });  
	}  
};
```

```js
deleteLine(row: number) {  
// If on the last line of the file, we cannot replace to the next row.  
// Instead, replace all the contents of this line.  
if (row === this.getLastRow()) {  
	const rowContents = this.getLine(row);  
	this.editor.replaceRange(  
		'',  
		{ line: row, ch: 0 },  
		{ line: row, ch: rowContents.length },  
	);  
} else {  
	this.editor.replaceRange(  
		'',  
		{ line: row, ch: 0 },  
		{ line: row + 1, ch: 0 },  
		);  
	}  
};
```
