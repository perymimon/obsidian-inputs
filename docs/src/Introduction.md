# Introduction Obsidian-Inputs

The Obsidian-Inputs plugin aim to be a epic small Lightweight that offers a convenient method for creating input and button components within ObsidianMD's preview mode. These components serve to dynamically modify actual markdown files, bridging the gap between the HTML view and the markdown file being edited.

The motivation behind developing this plugin stemmed from dissatisfaction with existing plugins due to their instability and long loading times, often attributed to their reliance on complex libraries like servlets.

Despite being in its early stages, this plugin boasts a range of features and has the potential to replace multiple existing plugins. Notably, it maintains an average loading time impact of approximately 10ms.

## Principles Guiding the Plugin's Development

- Data changes within a markdown file, and not any other setting.json\data.json files, Data changes within markdown files ensure compatibility with various markdown readers.
- Emphasis on simplicity and ease of use and understand.
- Syntax designed to be straightforward, and easy to write 
  - Avoiding bidirectional closing parts like parentheses that make you play around with your keyboard. and And it's nightmare with the multi language keyboard
- Avoidance of external libraries.  keeping the average load time not noticeable at all

## Plugin Capabilities
Currently, the Obsidian-Inputs plugin supports the creation of :
- `Text Input` 
- `textarea` 
- `Radio Inputs`
- `button`
Source options for that inputs can come from 
- dataview list query
- write them by hand
These components modify different contexts within markdown files:

- **File Operations:** Create, replace content, append\prepend content, remove, or rename files.
- **Header Manipulation:** Create, modify, remove, or rename headers within files.
- **Front Matter Management:** Create, update, append/prepend to arrays, remove, or rename front matter fields.
- **Inline Field Interaction (Dataview):** Create, update, append/prepend to arrays, remove, or rename inline fields.

Additional features and capabilities are planned for future releases.


# Terminology
- The terms "page" and "file" are used interchangeably.
- Actual  plugin's syntax that you write in the page  referred to as `input notation` or  `pattern`
- Component are all UI that plugin create , Inputs and buttons
* Input notation : `<"-id-"?> <"type"> <":name"> "|" <"expression"> <", opts"> <">target">`

`<"-id-"?>`: Optional identifier for the Component element. Helps recognize the element for refocus when page refresh on content change or for pattern replacement.

`<"type">`: Specifies the type of the input element. can be, `text`,`textarea` or `button`. It's followed by a colon :.

`<":name">`: Label or placeholder for the input element. It indicates the purpose of the input field. It's followed by a pipe |.

`<"expression">`: Expression that generate the value to be injected to target. It could be a string with placeholder, a JS expression, a JS file to import and run or md template file.

`<", opts">`: comma separated values for created radio button or dataview query for  create autocomplete input, start with comma     

`<">target">`: Specifies where and how the value of the expression part is stored or processed. It consists of the target file or context, the method of saving or updating the target

For more detailed syntax information, refer to the [Syntax Documentation](https://chat.openai.com/c/bf891b2f-d195-4145-a9de-d44455b0bddd#)
## Examples : 

> **Example 1: Create a text input element:**
> value saves in inline field called `name` in the same file. If the field doesn't exist, it's created.
 `text: Enter your name| {{input}} >::name`
>

> **Example 2: Create a text area with autocomplete:**
>
>`text:select game| {{input}}, = #games >:games append`
Creates an input element that autocompletes from a Dataview query of files tagged with #games, appending the value the end of front matter `games::` key as an array.

> **Example 3: Create a radio input element**
`text: Select color| red, blue, green| = #colors >:selectedColor`

> Example 4: Creates a button element that increments the inline field number.
>  `button:click me| (number || 0)+1 >::number`

> Example 5: Create a button to delete a specific header:
 `button: Delete section| >::file#Section Name remove`

> Exmaple 6: same, just clear the header content
> `button: Delete section| >::file#Section Name clear`
## Screenshoots:
	![[Pasted image 20240328003625.png]]