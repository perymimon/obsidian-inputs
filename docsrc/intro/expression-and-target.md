Syntax for creating input components follows the convention:

`<"id"?> <"type"> <":name"> "|" <"expression"> <", opts"> <">target">`

## "type"
החלק הזה אחראי על הקומפוננטה שתתרנדר בview.
שתי האופציות שכרגע נתמכות הן 
text: שמייצר text input, the experstion in this case run after the user unfocus the input 
button: שמייצר button, the expertion in this case run when user click on the input

צריך לרשום את זה כך 
`text:` or `button:`

## ":name"
free text that be the name of the button or the placeholder in the input
must be end with |

## "expression"
Expressions undergo evaluation in three steps and can incorporate data from the current or other pages or the last updated file, such as frontmatter fields, dataview inline fields. They can load files as templates or execute JavaScript files or interact with global api.

Step 1: Utilize pre-processing string template on the `expression` to replace all placeholders in the format `{{path.of.data}}` or `&path.to.data` with corresponding data from frontmatter, inline fields, or file properties. 
- If the property exist on frontmatter and elso on dataview-inline-field the priority is by the target type. if target type is frontmatter priority is to read from frontmatter and if it inline-field priority is inline-field
- If the data to inject is a tFile, it's replaced by an Obsidian link (by setting, default: wiki link).
- The last ten files touched by the plugin are referred to as `page0` to `page9`. you can refer them and there variable like
  `{{ page0.book-name }}` 
- while the last ten files created by the plugin are called `new0` to `new9`
`{{ new2.book-name }}`
- you can refer any file and read it data by using `[[file-name]]` syntax
`{{ [[harry potter]].book-name }}`
- Current file is refer by using the name `activeFile`, most time it can omit, because default context always being to current active file.



Step 2: After Step 1, the evaluated expression undergoes content testing.

If the expression matches the pattern `import [[file name]]`:

- If the file name ends with `.md`, its content is loaded and processed using the templater, with the result sent to the target.
- If the file name ends with `.js`, it's imported as a JavaScript module, enabling the use of all Obsidian-Inputs API functions. The `export default` value is sent to the target. If it's undefined, the target part is not executed.
- If an **error occurs** during templater or JavaScript module import, it's displayed in the developer console. 

Step 3: If the expression doesn't match the import pattern, it's evaluated as a JavaScript expression, and the return value is sent to the target.

Step 4: If the expression throws an error, it's considered plaintext and sent to the target as is.
 and that is you way to write arbitrary text to the target

## "> target"
After the > symbol, the target part specifies the area to be modified by the expression value. It is constructed with the following sub-pattern:

`<"file"?><"(::|#|:)path"?><" method">`

by combine `file` `path` the plugin define the type of the entity that should be modified, `target type` can be `file`, `header`, dataview inline `field`, frontmatter or `yaml`, `pattern` himself

- `<"file"?>` Optional,Specifies the name of the file or page to be modified.
  - If no `file` is provided, it refers to the current active file. 
  - If the file does not exist, it is created. Otherwise, it is modified.
  - If no next part `path` is omitted, targetType is the file himself. 
     
- `<"(::|#|:)path">` 
	- `::path`: Specifies the targetType as an inline field in the target file.
		-  In the case of multiple fields by the same name the closer one to the pattern will be chosen
	- `:path` - Specifies the targetType as `YAML` in the front matter of the target file.
	- `#path` - Specifies the targetType as a `header` in the target file.
		-  when mention header name you should ignore `input pattern` if you write it in the same line of the header. so the next line should work 
        - ## book list `text: add | just read &input >#book list ` 
        
	- if no `file` or `path` provide the `targetType` is `pattern` which use the current `input-pattern` as context 
    
- `<" method">` followed by space there is the method that can be one of the next actions. the meaning of the action change a little by the `targetType`
	- **append** 
		- for `inline field` and `yaml` it convert the value to array (if is not) and append the new value to end of the array.
		- for `header` it append the value after the last line of the header content (the not empty line before the next header )
		- for `file` it append the value to bottom of the file
		- for `pattern` it add the value after the `input-pattern`
	- **replace**
		-  for `inline field` and `yaml` it replace the curent value (or array) with the new value
		- for `header` it repace the whol header content with new value
		- for `file` It replaced the whole file with the new value
		- for `pattern` It replaced the whole input pattern with the new value so it actually deleted it
			- caution: if there is a two or more pattern that look the same it replaced the first one.  To avoid that use the ID section .etc `-identify- text:activity| {{input}}> #Activity`
	- **prepend**
		- same as `append` Just add the new value to the start of everything
	- **create**
		- for `file` it created the file. If the file exist it create a new one with increment free number after the name
	- **clear**
		- for `header`, `file`, `inline field` and `yaml` it clear the current value  or content and ignore the new value
		- for `pattern` it clear the text before `input-pattern` until first `inline field` in that line. another run of that target clear the value of the `inline field`, another run remove all text until start of the line
	-  **remove:** Deletes the specified target entirely.
	    - For `header`, it removes the entire header and its content.
	    - For `file`, it deletes the file entirely.
	    - For `inline field` and `yaml`, it removes the current value or content entirely.
	    - For `pattern`, it removes the entire input pattern.
	- **rename**
		- For `file`, new value become the new `path` of target file. 
			-  if `file` not exist nothing happen
			- If `path` is exist it generate a new `path` by incrementing index ex. `file 0`, `file 1`, etc
			- new `path` is coenacted to exist path of the target file
			- but is legit to be started the `path` with:
				-  `\` for make the path start from root valut folder
				- `..` go one folder back relative target file
				- `.` stay in the same place of target file. ( default ) 
		-  For other targets such as `inline field`, `yaml`, or `header`, the `rename` method is not applicable yet


