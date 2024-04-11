# Introduction Obsidian-Inputs

Existing Obsidian plugins for creating input components suffer from instability and long loading times due to reliance on complex libraries .
This issue is significant because it directly affects your experience and workflow efficiency within ObsidianMD. Instability and slow loading times can frustrate you and hinder your productivity.

The Obsidian-Inputs plugin aim to be a epic small Lightweight that offers a convenient inline-code pattern for creating input and button components within ObsidianMD's preview mode. These components dynamically modify actual markdown files, bridging the gap between the HTML view and the markdown file being edited. And in the result ensures long-term readability even if Obsidian or plugin that you depend on stops working.

The motivation behind developing this plugin stemmed from dissatisfaction with existing plugins due to their instability and quirk bugs and in not help that they havvy on spin on obsidian. elso when I try to make a simple pattern like "create a file from template and put note about it on my daily" i found it super complex and involve mingling between plugins

Despite being in its early stages, this plugin boasts a range of features and has the potential to replace multiple existing plugins. Notably, it maintains an average loading time impact of approximately **10ms**.

## Principles Guiding the Plugin's Development

- Data should changes within markdown files for compatibility with diverse markdown readers. and not in any other setting.json\data.json files.
- Emphasize simplicity and user-friendliness syntax. that should easy to read and Understand even if you're read it in the future and not a remember the syntax any more. 
- Syntax designed to be easy to write 
  - Avoiding bidirectional closing parts like parentheses that make you play around with your keyboard. And it is nightmare with bidirectional language 
- Avoidance reliance on external libraries to maintain negligible average load times.
- Obsidian have enough api to play with, and we should use a simple html element so all the users can style it easily with a there css file 

## Plugin Capabilities
`inputs` plugin design to replace a lot of components that update the documents file and provide:
- **Input/Button Creation:** Easily create text inputs, text-areas, radio inputs, and buttons.
- **Markdown Text Modification:** Update Markdown text within documents effortlessly, including
  - headers and their content, 
  - dataview-inline-field,
  - frontmatter field
- **File Operations:** Automatically create new files and perform various file operations such as replacing, appending/prepending content, removing, or renaming files.
- **Macro Creation:** Create macros to automate steps, allowing easy referencing of previous step results or files in subsequent steps.

### Input Sources:
If you want a autocomplete list or static list of option for your input the plugin give you the ability to 
retrieve options from Dataview queries list or input them manually.

### Context Modification:
- **File Operations:** Create, modify, rename, or remove files.
- **Header Manipulation:** Create, modify, rename, or remove headers within files.
- **Front Matter Management:** Manage front matter fields, including creation, update, and modification (support Array)
- **Inline Field Interaction (Dataview):** Interact with inline fields, including creation, update, and modification.
- **pattern:** use the input pattern himself as a pivot point to append,prepend value or replace the pattern Completely with the new value make it one time use 


### Planned Enhancements:
- Future releases will introduce additional features and capabilities to further enhance functionality.
- The plugin facilitates writing concise explanations, incorporating variables from within or across pages for enhanced flexibility and efficiency.



# Terminology
- The terms "page" and "file" are used interchangeably.
- Actual plugin syntax written on the page is referred to as input `notation` or `pattern`.
- Components encompass all UI elements created by the plugin, including inputs and buttons.


For more detailed syntax information, refer to the [Syntax Documentation](https://chat.openai.com/c/bf891b2f-d195-4145-a9de-d44455b0bddd#)

## Screenshoots:
	![[Pasted image 20240328003625.png]]
