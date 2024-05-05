
```js
templater = app.plugins.plugins["templater-obsidian"].templater
templater.create_new_note_from_template
templater.append_template_to_active_file
templater.get_new_file_template_for_folder

config = templater.create_running_config(file,targetFile,0)
await templater.parse_template(config,templateText)
```

