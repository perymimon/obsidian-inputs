# Introduction Obsidian-Inputs

This plugin provides a powerful method to create input and button components in the preview mode that can dynamically modify real markdown files, either the current one or others.

It lives between the HTML view and the markdown file that is being edited.

The motivation behind creating this plugin stemmed from the instability of other plugins and frustration with their lengthy loading times due to being written in complex libraries like servlets.

This plugin is feature-rich and has the potential to replace several others, it currently incurs an average loading time impact of approximately 40ms!.

This plugin is still in its early stages, so expect changes and updates as it evolves and matures.

# Principles of Writing and Planning the Plugin

- Data changes within a markdown file, so it a futer proof to read the content on any other markdown reader.
- The plugin should be easy to use and understand.
- The syntax is designed to be straightforward, and easy to write and read
  - for example: avoiding bidirectional closing parts like parentheses that make you play around with your keyboard. and And it's nightmare with the multi language keyboard
- No external libraries are used at this stage, keeping the average load time at around 40ms.

# Capabilities of the Plugin

for now the plugin can support creating `Text Input` `textarea` with autocomplate `Radio Inputs` and `Button` components in the preview mode.
the plugin can interact with the context of:
- File (create, modify content, remove, rename)
- Header in a file (create, modify, remove, rename)
- Front matter field in a file (create, update, append or prepend to an array, remove, rename)
- Inline field (Dataview) in a file (create, update, append or prepend to an array, remove, rename)

more capabilities will be added in the future.


# Terminology
- page and file used with the same minning most of the time.
- the syntax for createin ui called `input notation`

Every notation build with those parts:

`<"-id-"?> <"type:"> <"name|"> <"expression"> <", opts"> <">target">`

`<"-id-"?>`: Optional identifier for the input or button element. Helps recognize the element for focus after content refresh or for pattern replacement.

`<"type:">`: Specifies the type of the input element. can be, `text`,`textarea` or `button`. It's followed by a colon :.

`<"name|">`: Label or placeholder for the input element. It indicates the purpose of the input field. It's followed by a pipe |.

`<"expression">`: Expression that generate the value to be injected to target. It could be a string with placeholder, a js expression,a js file to import and run or md template file.

`<", opts">`: comma separated values for created radio button or dataview query for  create autocomplete input, start with comma     

`<">target">`: Specifies where and how the value of the expression part is stored or processed. It consists of the target file or context, the method of saving or updating the target

for more details go to  [Syntax]()
## Examples : 

`text: {{input}} >::name`  

Creates an input element of type text and saves the user input to the inline field name in the same file. If the field doesn't exist, it's created.

`text:select game| {{input}}, = #games >:games append`

Creates an input element that autocompletes from a Dataview query of files tagged with #games, appending the value the end of front matter `games::` key as an array.

`button:click me| (number || 0)+1 >::number`

Creates a button element that increments the inline field number.

## Screenshoots:
	![[Pasted image 20240328003625.png]]