# Code Runner

> **Note**
> Backup your commands before updating this plugin.
> Commands are moved to a `commands.json` file.
> You can edit the file through the run button `Edit commands` option.

Acode plugin for running code directly from acode

> Now worls with `AcodeX` and `Acode Terminal` plugins.

## What's new (1.1.4 / 1.1.5)

<details>
  <summary>
    <code><strong>v1.1.4 / 1.1.5</strong></code>
  </summary>
  <ul>
    <li>Added support for setting default handler.</li>
    <li>Added setting to disable command editing.</li>
    <li>Minor Bug Fix</li>
  </ul>
</details>

## How to use

<ul>
<li>Install plugin and acodex plugin</li>
<li>Start acodex terminal.</li>
<li>Click the run button to run code.</li>
<li>Hold the run button down to view/edit the command before running.</li>
</ul>

## API

```javascript
let runner = acode.require("code.runner");

// Function Handler
runner.addHandler({
  name: "python",
  extension: "py",
  match: "*.py",
  icon: "file file_type_python",
  handler(file) {
    if (useIpython) {
      return `cd $dir && ipython ${file.name}`;
    } else {
      return `cd $dir && python ${file.name}`;
    }
  },
});

// String handler
runner.addHandler({
  name: "javascript",
  extension: "js",
  icon: "javascript",
  command: "node $path",
});

// Remove handlers.
runner.removeHandler("javascipt");

runner.addHandler({
  name: "NPM",
  match(file) {
    return file.name == "package.json";
  },
  handler(file) {
    return "npm run";
  },
});

// Use this syntax if you want to use code runner.
function main(runner) {
  runner.addHandler({
    ...
  });
}

let runner = acode.require("code.runner");
if (runner) {
  return main(runner);
} else {
  let handler = ({ detail }) => {
    if (detail.name == "coderunner") {
      main(acode.require("code.runner"));
      document.removeEventListener("plugin.install", handler);
    }
  };
  document.addEventListener("plugin.install", handler);
}
```

### Add Handler

`runner.addHandler` accepts an object with the following keys:

`name`: Name to be displayed if multiple handlers are found.

`icon`: Icon to be displayed if multiple handlers are found.

`extension`: File extension (optional).

`match`: Regex string or function (sync or async) to be matched with the file name or called with the file.

`handler`: Function (sync or async) called with `editorManagee.activeFile`, which should return the command (string).

`command`: String command used to run the file.

### Command Placeholders

`$name` -> File name

`$nameNoExt` -> Name without extension

`$dir` -> File Absolute Directory

`$dirNoSlash` -> File Directory without ending slash

`$uri` -> File Uri

`$workspaceUrl` -> Folder which the file belongs to.
`$workspace` -> Get Root Project Directory Path

## Updates
<details>
  <summary>
    <code><strong>v1.1.4</strong></code>
  </summary>
  <ul>
    <li>Add Keys $workspace</li>
  </ul>
</details>
<details>
  <summary>
    <code><strong>v1.1.3</strong></code>
  </summary>
  <ul>
    <li>Added 'icon' to handlers, fixed bugs, better command editing.</li>
    <li>Added 'Acode Terminal' backend, Fixed 'AcodeX' backend.</li>
    <li>Moved commands to `commands.json`.</li>
  </ul>
</details>
<details>
  <summary>
    <code><strong>v1.1.2</strong></code>
  </summary>
  <ul>
    <li>Added 'plugin.install' event listener so other plugins know when code runner is installed if not already installed. Use `event.target.detail.name == 'coderunner'` to check if the installed plugin is acode sdk.</li>
  </ul>
</details>
<details>
  <summary>
    <code><strong>v1.1.0, v1.1.1</strong></code>
  </summary>
  <ul>
    <li>Updated apis</li>
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
    <code><strong>v1.0.5</strong></code>
  </summary>
  <ul>
    <li>Added option to edit and add commands from settings page</li>
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
    <code><strong>v1.0.2</strong></code>
  </summary>
  <ul>
    <li>Added keyboard shortcut <kbd>ctrl+r</kbd></li>
    <li>Alerts you if acodex is not installed.</li>
    <li>Logs to "Acode SDK" logger if installed.</li>
    <li>Supports up to 30 languages</li>
  </ul>
</details>