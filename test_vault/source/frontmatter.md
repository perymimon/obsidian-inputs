# intersting direct imports
```js
import {parseYaml} from 'obsidina'

parseYaml(yaml: string):any

```
```js
async parseFrontmatter(file: TFile): Promise<Property[]> {
        const fileCache = this.app.metadataCache.getFileCache(file);
        const frontmatter = fileCache?.frontmatter;
        if (!frontmatter) return [];

        //@ts-ignore - this is part of the new Obsidian API as of v1.4.1
        const {start, end} = fileCache?.frontmatterPosition;
        const filecontent = await this.app.vault.cachedRead(file);

        const yamlContent: string = filecontent.split("\n").slice(start.line, end.line).join("\n");
        const parsedYaml = parseYaml(yamlContent);

        let metaYaml: Property[] = [];

        for (const key in parsedYaml) {
            metaYaml.push({key, content: parsedYaml[key], type: MetaType.YAML});
        }

        return metaYaml;
    }

```
# smart editing file
```js
app.fileManager.processFrontMatter(file, front=> {
    console.log(front) 
    return front
}) 
```

```js
	app.metadataCache.getFileCache(file) #some structure of the file

```

