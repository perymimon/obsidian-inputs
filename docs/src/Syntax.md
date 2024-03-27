Every notation for adding `Input` or `Button` build with those parts:

`<"id"?> <"type:"> <"name|"> <"expression"> <", opts"> <">target">`

## <"type:">
החלק הזה אחראי על הקומפוננטה שתתרנדר בview.
שתי האופציות שכרגע נתמכות הן 
text: שמייצר text input, the experstion in this case run after the user unfocus the input 
button: שמייצר button, the expertion in this case run when user click on the input

צריך לרשום את זה כך 
`text:` or `button:`

## <"name|">
free text that be the name of the button or the placeholder in the input
must be end with |

## <"expression">
Expersion evalute in 3 steps, and can include data from the current or other page. 
like fronmatter field, inlinefield, last file that update or create js api and `obsidna-input`
API . it also can load file as template of `templater` or run JS file 

1. step 1: start by replacing all placeholder in the shape of `{{path.of.data}}` with the corresponding data. if the data is a `file` it  replace by obsidian link (default: wiki link) 

it absolution possible to go deeper a page for it internal data (Frontmatater, Inlinefield, file properties). like `{{ page0.game }}`. 

`page0` is a context variable that point the last page that update by the plugin

The last 10 files that toched by the plugin called `page0` to `page9`
The last 10 files that created by the plugin called `new0` to `new9`
the current file called `activeFile` but it can be ommited. default context is allwasy the current active file


2. after phase 1.  evaluated expression tested by it content 
3. if it in the pattern of `import [[name of file]]`
	1. if file end with `.md` it loaded the content and used templater to evalute the content . result go to the target
	2. if file end with `.js` it imported like js module  `default export` go to the target. if the f
	3. if `templater` or import js module throw exception it show in devtool console
4. else try to evaluate it as js expetion and the return value to to `target`
5. if it throw the expression consider as a plaintext and go to `target`

## <"> target">
After the `>` come the target part. the area that be modified by the expertion value

it build with the sub pattern that look like that

`<"file"?><"(::|#|:)path"?><" method">`

- `<"file"?>` Optional, name of the file/page that should be modified
	- if there is not `path` target-type is the `file` If it not provide current file in the context
	- if the file not exist it created it Otherwise it just modified it
- `<"(::|#|:)path">` 
	- `::path` - Specifies the `targetType` is in `inline field` into the file
	- `:path` - Specifies the `targetType` is `yaml` in the frontmatter of the file
	- `#path` - Specifies the `targetType` is `header` in the file
	- if nothing provide the `targetType` is called `pattern` which affects the current `input-pattern` and can replace it with the new value
- `<" method">` followed by space there is the method that can be one of the next action. 
	the meaning of the action change a littel by the `targetType`
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


