Before delving into the various APIs available for use in the Expression part of Obsidian-Inputs plugin, it's essential to understand the power and versatility they bring to your markdown editing experience. These APIs open up a realm of possibilities, allowing you to interact with your markdown files in dynamic and innovative ways.

By leveraging these APIs, you can seamlessly integrate functionality such as data retrieval, manipulation, and rendering directly into your markdown documents. Whether you're fetching external data sources, performing complex calculations, or generating dynamic content, the APIs empower you to tailor your markdown files to suit your specific needs.

In the following sections, we'll explore the diverse range of APIs at your disposal, along with examples demonstrating their practical application within the Obsidian-Inputs plugin. Get ready to unlock the full potential of your markdown editing workflow with these powerful APIs.
# Obsidian Plugin API Documentation

## Table of Contents
- [link(path)](#link)
- [duration(start, end, format, as)](#duration)
- [updateFile(path, content)](#updatefile)
- [getTFile(path)](#gettfile)
- [letTFile(path)](#lettfile)
- [createTFile(path, text)](#createtfile)
- [getStructure(path)](#getstructure)
- [getFileData(file, priority)](#getfiledata)
- [templater(templateContent, port, targetFile)](#templater)
- [decodeAndRun(expression, opts)](#decodeandrun)
- [saveValue(text, target)](#savevalue)
- [processPattern(preExpression, preTarget, pattern, opts)](#processpattern)

## link(path)
Generates a wiki or markdown link for a given file.
It depends on the user preference in the setting

- `path` (TFile | string): The whole part of the file or just its name or tFile object
- Returns: Markdown link to the file.
## duration(start, end, format, as)
Calculates the duration between two time points.

- `start` (string): The start time.
- `end` (string): The end time.
- `format` (string, optional): The format of the time (default: 'HH:mm').
- `as` (string, optional): The unit of the duration (default: 'hours').
-  Returns: Human-readable duration string.
## async updateFile(path, content)
Updates the whole content of a file in one shot.

- `path` (TFile | string): The path of the file or  the file name or  TFile object.
- `content` (string): The new content of the file.

## getTFile(path)
Gets the Obsidian file object for a given path.

- `path` (TFile | string): The path of the file or 'activeFile' for the currently active file.

## async letTFile(path)
Gets or creates the TFile object for the specified file path.

- `path` (TFile | string): The path of the file.
- Returns: Promise resolving to the TFile object.
## async createTFile(path, text)
Creates a new file with the specified path and optional initial content.

- `path` (string): The path of the new file.
- `text` (string, optional): The initial content of the new file (default: '').
- Returns: Promise resolving to the created TFile object.
## getStructure(path)
Gets the structure of the specified file, including front matter, inline fields, and dirty status.

- `path` (string | TFile): Optional path to the target file or TFile object.
- Returns: Object containing file structure information.
## getFileData(file, priority)
Gets the data from the specified file, prioritizing front matter or inline fields.

- `file` (string | TFile, optional): Optional path to the target file or TFile object.
- `priority` (Priority, optional): Priority for data retrieval ('yaml' or 'field'; default: 'field').
- Returns: Object containing file data.
## async templater(templateContent, port, targetFile)
Applies templating to the specified content using the Templater plugin.

- `templateContent` (string): Content template to apply.
- `port` ({}):  Port object for templating (default: {}).
- `targetFile` (TFile, optional): Target file for templating (default: undefined). Actually put content into that file just take the variables from the file as templater do 
- Returns: Promise resolving to the templated content as a string.
## async decodeAndRun(expression, opts)
Decodes and runs an expression It's like in the input pattern but withou thw support of 
`{{ }}` or `&` template

- `expression` (string | undefined): Input pattern expression to decode and run.
- `opts` (decodeAndRunOpts, optional): Additional options.
- Returns: string result
```
type decodeAndRunOpts = {  
    priority?: Priority | string,  
    vars?: {}, // Global variable that you wanted that expression know about 
    file?: targetFile,  // The file that beat the context of that expression included its variable
}
```
## async saveValue(text, target)
Saves a string value to a target. Exactly as part after `>` of the input notation

- `text` (string | number): The value to save.
- `target` (Target): The target configuration.
```
type Target = {  
    file?: targetFile,  
    targetType: 'yaml' | 'field' | 'header' | 'file' | 'pattern',  
    path: string,  
    method: 'append' | 'prepend' | 'replace' | 'create' | 'remove' | 'clear'  
    pattern: string  
}
```
## async processPattern(preExpression, preTarget, pattern, opts)
Combine the two previous function to 1. 
Processes a pattern expression and save it to the target.
Expression and the target run under `stringTemplate` that can change the expiration that actually run and also the target

- `preExpression` (string): The pre-expression.
- `preTarget` (string): The pre-target.
- `pattern` (string): The pattern expression.
- `opts` (decodeAndRunOpts, optional): Additional options.
