
## Input Notation Syntax:
Syntax for creating input components follows the convention:

`<"-id-"?> <"type"> <":name"> "|" <"expression"> <", opts"> <">target">`

`-id-?`: Optional identifier for the Component element, aiding in recognition for refocusing or pattern replacement.

`type`: Specifies the type of the input element, such as `text`, `textarea`, or `button`, followed by a colon `:`.
can be:
- `text`: simple text input. it run the expression when it unfocus and value is not empty
- `button`: simple button. it run the expression when click on it
- `textarea`: text area input that fill the screen

`:name`:  Label of button or placeholder for inputs. indicating the purpose of the input field.

now `|`: Pipe symbol separating the introduction part and the actual expiration/target notation.

`expression`: Expression generating the value to be injected into the target. It could be a string with placeholder, a JS expression, a JS file to import and run or md template file.
	examples:
	- **placeholder:** `I read today the book &book-name` or `I read today the book {{book-name}} ` can result to `I read today the book Harry Potter` if somewhere is the page
	`[book-name::Harry Potter] exist`
	- **JS expression:** `number + 1` if somewhere is the page `[number::2] exist the result to target will be `3`
	- **JS import:** `import [[create-book.js]]` that import and run `create-book.js` if it exists in the vault
	- **md import:** `import [[create-book.md]]`  that read and run throw templater `create-book.md` if it exists in the vault and return the result
 see detail [here](../)
`, opts`: comma separated values for created radio button or dataview query for  create autocomplete input, start with comma

`>target`: Specifies where and how the value of the expression part is stored or processed. including the target file or context and the method of saving or updating the target.
Target own mini pattern
`<filename><type><path> <method>`
(#|::|:)
