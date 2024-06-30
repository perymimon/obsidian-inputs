# Obsidian Inputs Plugin

The Obsidian Inputs Plugin allows users to utilize custom inputs within their Obsidian notes, enhancing interactivity and dynamic content.

## Features

- **Expression and Target**: Define expressions and their targets for dynamic content updates.
- **Input Notation Syntax**: Use a specific syntax to define inputs, making it easier to create interactive notes.

## Installation

To install the plugin, follow these steps:

1. Download the plugin from the [releases page](https://github.com/perymimon/obsidian-inputs/releases).
2. Place the downloaded folder in your `.obsidian/plugins` directory.
3. Enable the plugin from the Obsidian settings under the "Community plugins" section.

For detailed instructions, refer to the [installation guide](./intro/how-to-install.md).

## Usage

To use the plugin, you can define inputs using specific notation. Here are three examples:

### Example 1: Basic Input to add a line under header 

```markdown
`input:text|- {{input}} > #Activity append`
```
## Example 2: Radio Input to save value in dataview inline field
```markdown
what are you doing ? `input:radio? read,gym,clean| {{input}} >::activity-type`
```

## Example 3: Select value from dropdown option add it to frontmatter field and save it back to that field 
```markdown
`input:text ? 10,20,20 | {{input}} + {{amount}} > :amount`
```
For more examples and details, refer to the [small examples](https://perymimon.github.io/obsidian-inputs/intro/small-examples.html) section.

## Syntax
The input notation follows specific rules outlined in the [Input Notation Syntax](https://perymimon.github.io/obsidian-inputs/intro/input-notation-syntax.html) documentation.
This includes various types of inputs like text, checkboxes, and select dropdowns.

## Expression and Target
Learn how to set up expressions and targets in your notes to dynamically display content based on user input.
Detailed instructions are available in the [Expression and Target](https://perymimon.github.io/obsidian-inputs/intro/expression-and-target.html) documentation.

## License
This plugin is released under the GNU General Public License. See the [LICENSE](https://github.com/perymimon/obsidian-inputs/blob/master/LICENSE) file for details.
