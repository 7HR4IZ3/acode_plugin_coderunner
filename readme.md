# Code Runner

Acode plugin for running code directly from acode

## Guide

> Acodex plugin Is required to use this extension

### HOW TO

#### Run Code
> Install plugin and acodex plugin

> Start acodex terminal.

> Click the run button to run code.

> Hold the run button down to view/edit the command before running.

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


#### Add Handler
```javascript
let runner = acode.require("code.runner");

// Function Handler
runner.addHandler("py", (file) => {
    if (useIpython) {
        return `cd $dir && ipython ${file.name}`
    } else {
        return `cd $dir && python ${file.name}`
    }
})

// String handler
runner.addHandler("js", "node $path")
runner.removeHandler("js");

// Or Use Wildcard handlers

runner.addWildcard(["js", "jsx", "ts", "tsx"], (extension, file) => {
    if (extension == "js") {
        return "node $uri"
    } else if (extension == "jsx") {
        return "cd $dir && ..."
    }
})

// You can either pass an array or a regex string.
runner.addWildcard(".*", (extension, file) => {
  return ...
})
```

##### Command Placeholders
    "$name" -> File name
    "$nameNoExt" -> Name without extension
    "$dir" -> File Absolute Directory
    "$dirNoSlash" -> File Directory without ending slash
    "$uri" -> File Uri

