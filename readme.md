# Code Runner
> Acodex plugin Is required to use this extension

Acode plugin for running code directly from acode

## Run Code
<ul>
<li>Install plugin and acodex plugin</li>
<li>Start acodex terminal.</li>
<li>Click the run button to run code.</li>
<li>Hold the run button down to view/edit the command before running.</li>
</ul>

## Exposed API
```javascript
let runner = acode.require("code.runner");

// Function Handler
runner.addHandler({
  name: "python", extension: "py",
  match: "*.py", handler(file) {
    if (useIpython) {
      return `cd $dir && ipython ${file.name}`
    } else {
      return `cd $dir && python ${file.name}`
    }
  }
})

// String handler
runner.addHandler({
  name: "javascript",
  extension: "js",
  command: "node $path"
})

// Remove handlers.
runner.removeHandler("javascipt");

runner.addHandler({
  name: "NPM",
  match(file) {
    return file.name == "package.json";
  },
  handler(file) {
    return "npm run"
  }
})

```

#### Add Handler Parameter

`runner.addHandler` accepts an object with the following keys:

`name`: Name to be displayed if multiple handlers are found.

`extension`: File extension (optional).

`match`: Regex string or function (sync or async) to be matched with the file name or called with the file.

`handler`: Function (sync or async) called with `editorManagee.activeFile`, which should return the command (string).

`command`: String command used to run the file.

#### Command Placeholders

"$name" -> File name

"$nameNoExt" -> Name without extension

"$dir" -> File Absolute Directory

"$dirNoSlash" -> File Directory without ending slash

"$uri" -> File Uri

"$workspaceUrl" -> Folder amongst open folders which the file belongs to.

## Updates
<details>
  <summary>
    <code><strong>v1.0.2</strong></code>
  </summary>
  <ul>
    <li>Added keyboard shortcut <kbd>ctrl+r</kbd></li>
    <li>Alerts you if acodex is not installed.</li>
    <li>Logs to "Acode SDK" logger if installed.</li>
    <li>Supports up to 50 languages</li>
  </ul>
</details>
<details>
  <summary>
    <code><strong>v1.0.3, v1.0.4</strong></code>
  </summary>
  <ul>
    <li>Bug fixes</li>
    <li>Ability to run package.json scripts</li>
  </ul>
</details>
<details>
  <summary>
    <code><strong>v1.0.5</strong></code>
  </summary>
  <ul>
    <li>Added option to edit and add commands from settings page</li>
  </ul>
</details>
<details>
  <summary>
    <code><strong>v1.0.6</strong></code>
  </summary>
  <ul>
    <li>Changed commands structure from [extension, command] to { name: string, extension: string or match: regex | string | function, handler: function or command: string }</li>
    <li>Removed `addWildcard` and `removeWildcard` functions use `addHandler` with match function instead</li>
    <li>Added ability to select between multiple handler natches.</li>
    <li>Added setting to replace default run button</li>
  </ul>
</details>
<details>
  <summary>
    <code><strong>v1.0.7</strong></code>
  </summary>
  <ul>
    <li>Added ability to run projects (based on the content of the workspace directory). E.g: Opening a folder with the file 'package.json' allows you to run the 'NPM' project which gives you the optikn to select from the scripts defined in 'package.json'. Opening a project with 'manage.py' allows you to run the 'django' project.</li>
    <li>Added option to select between built-in runner (acode) or using terminal.</li>
    <li>Added option to disable Projects runner in settings.</li>
  </ul>
</details>
<details>
  <summary>
    <code><strong>v1.0.8, 1.0.9</strong></code>
  </summary>
  <ul>
    <li>Bug fixes</li>
  </ul>
</details>