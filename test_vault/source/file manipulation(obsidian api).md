[https://docs.obsidian.md/Reference/TypeScript+API/MetadataCache](https://docs.obsidian.md/Reference/TypeScript+API/MetadataCache)

[https://docs.obsidian.md/Reference/TypeScript+API/Vault](https://docs.obsidian.md/Reference/TypeScript+API/Vault)

```js
app.vauld.rename(file, newPath)

await app.vault.process(file, (data: string) => {
 return data
})

append(file, data, options)


```

read
```js
app.vault.cachedRead(file)
app.vault.create(path, data, options)
app.vault.modify(file, data, options)

```