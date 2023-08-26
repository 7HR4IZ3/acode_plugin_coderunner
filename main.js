
// async function getUrl(uri) {
//   let url;
//   url = uri.replace(
//     "content://com.android.externalstorage.documents/tree/primary%3A",
//     ""
//   )
//   url = url.replace(
//     '/storage/emulated/0', ''
//   )
//   url = url.split('::primary:').at(-1);
//   return '/data/data/com.termux/files/home/storage/shared/' + url
// }

function getUrl(path) {
  if (path.startsWith("content://com.termux.documents/tree")) {
    path = path.split("::")[1]
    let termuxPath = path
      .substring(0, path.lastIndexOf("/"))
      .replace(/^\/data\/data\/com\.termux\/files\/home/, "$HOME");
    return termuxPath;
  } else if (path.startsWith("file:///storage/emulated/0/")) {
    let sdcardPath = "/sdcard" + path
      .substr("file:///storage/emulated/0".length)
      .replace(/\.[^/.]+$/, "")
      .split("/")
      .slice(0, -1)
      .join("/") + "/";
    return sdcardPath;
  } else if (
    path.startsWith(
      "content://com.android.externalstorage.documents/tree/primary"
    )
  ) {
    path = path.split("::primary:")[1];
    let androidPath = "/sdcard/" + path.substring(0, path.lastIndexOf("/"));
    return androidPath;
  } else {
    return false;
  }
}

class CodeRunner {
  #logger = null;

  #commands = new Map([
    ['mjs', 'node "$uri"'],
    ['vb', 'cd "$dir" && vbc /nologo "$name" && "$dir$nameNoExt"'],
    ['vbs', 'cscript "$uri"'],
    ['scala', 'scala "$uri"'],
    ['jl', 'julia "$uri"'],
    ['cr', 'crystal "$uri"'],
    ['ml', 'ocaml "$uri"'],
    ['exs', 'elixir "$uri"'],
    ['hx', 'haxe --cwd "$dirNoSlash" --run "$nameNoExt"'],
    ['rkt', 'racket "$uri"'],
    ['scm', 'csi -script "$uri"'],
    ['ahk', 'autohotkey "$uri"'],
    ['au3', 'autoit3 "$uri"'],
    ['ipy', 'ipython "$uri"'],
    ['kts', 'kotlinc -script "$uri"'],
    ['dart', 'dart "$uri"'],
    ['pas', 'cd "$dir" && fpc "$name" && "$dir$nameNoExt"'],
    ['pp', 'cd "$dir" && fpc "$name" && "$dir$nameNoExt"'],
    ['d', 'cd "$dir" && dmd "$name" && "$dir$nameNoExt"'],
    ['hs', 'runhaskell "$uri"'],
    ['nim', 'cd "$dir" && nim compile --verbosity:0 --hints:off --run'],
    ['csproj', 'dotnet run --project'],
    ['fsproj', 'dotnet run --project'],
    ['kit', 'kitc --run'],
    ['v', 'v run "$uri"'],
    ['vsh', 'v run "$uri"'],
    ['sass', 'sass --style expanded "$uri"'],
    ['cu', 'cd "$dir" && nvcc "$name" -o "$nameNoExt" && "$dir$nameNoExt"'],
    ['ring', 'ring "$uri"'],
    ['sml', 'cd "$dir" && sml "$uri"'],
    ['js', 'cd "$dir" && node "$uri"'],
    ['py', 'cd "$dir" && python "$uri"'],
    ['cpp', 'g++ "$uri" -o "$nameNoExt" && ./"$nameNoExt"'],
    ['java', 'javac "$uri" && java "$nameNoExt"'],
    ['sh', 'bash "$uri"'],
    ['html', 'google-chrome "$uri"'],
    ['c', 'gcc "$uri" -o "$nameNoExt" && ./"$nameNoExt"'],
    ['cs', 'csc "$uri" && "$nameNoExt"'],
    ['php', 'php "$uri"'],
    ['rb', 'ruby "$uri"'],
    ['swift', 'swift "$uri"'],
    ['go', 'go run "$uri"'],
    ['pl', 'perl "$uri"'],
    ['r', 'Rscript "$uri"'],
    ['lua', 'lua "$uri"'],
    ['scala', 'scala "$uri"'],
    ['kt', 'kotlinc "$uri" -include-runtime -d "$nameNoExt".jar && java -jar "$nameNoExt".jar'],
    ['vb', 'vbnc "$uri" && mono "$nameNoExt.exe"'],
    ['hs', 'ghc "$uri" -o "$nameNoExt" && ./"$nameNoExt"'],
    ['rs', 'rustc "$uri" && ./"$nameNoExt"'],
    ['dart', 'dart "$uri"'],
    ['ex', 'elixirc "$uri"'],
    ['erl', 'escript "$uri"'],
    ['clj', 'clojure "$uri"'],
    ['lisp', 'sbcl --script "$uri"'],
    ['m', 'gcc -framework Foundation "$uri" -o "$nameNoExt" && ./"$nameNoExt"'],
    ['d', 'dmd "$uri" && ./"$nameNoExt"'],
    ['groovy', 'groovy "$uri"'],
    ['kts', 'kscript "$uri"'],
    ['pl', 'perl "$uri"'],
    ['sql', 'mysql -u username -p < "$uri"'],
    ['swift', 'swift "$uri"'],
    ['matlab', 'matlab -nodisplay -nosplash -r "run(\'$uri\');exit;"'],
    ['vb', 'vbnc "$uri" && mono "$nameNoExt.exe"'],
    ['hs', 'ghc "$uri" -o "$nameNoExt" && ./"$nameNoExt"'],
    // Add more mappings as needed
  ])

  #wildcards = new Map();

  async init($page, cacheFile, cacheFileUrl, firstInit) {
    this.$runBtn = tag('span', {
      className: 'icon play_circle_filled',
      attr: {
        action: 'run',
      },
      title: 'Run using code runner',
      onclick: this.run.bind(this),
      oncontextmenu: async (ev) => {
        await this.run(ev, true);
      }
    });

    this.checkRunnable();

    editorManager.on('switch-file', this.checkRunnable.bind(this));
    editorManager.on('rename-file', this.checkRunnable.bind(this));
    editorManager.editor.commands.addCommand({
      name: "code.runner:run_code",
      description: "Run Code",
      bindKey: { win: "Ctrl-R" },
      exec: this.run.bind(this),
    });

    acode.define("code.runner", {
      run: this.run.bind(this),
      addHandler: this.addHandler.bind(this),
      removeHandler: this.removeHandler.bind(this),
      addWildcard: this.addWildcard.bind(this),
      removeWildcard: this.removeWildcard.bind(this)
    })
    
    let logger;
    if (logger = acode.require("acode.sdk.logger")) {
      this.#logger = logger("acode.coderunner.plugin");
    }
    
    let execute = acode.require('acodex')?.execute;
    
    if (!execute) {
      let msg = ("AcodeX plugin required to use Coderunner. Please install");
      this.#logger && this.#logger.error(msg);
      acode.alert("Coderunner Error", msg);
      return false;
    }
  }

  getHandler(extension, file) {
    let handler = this.#commands.get(extension);
    if (handler) {
      if (typeof handler == "function") {
        return handler(file)
      } else {
        return handler
      }
    }

    for (let [key, value] of this.#wildcards.entries()) {
      let match;
      if (key instanceof Array) {
        key = ("^(" + key.join("|") + "$)")
      }

      if (match = key.match(extension)) {
        if (typeof value == "function") {
          return value(extension, file)
        } else {
          return value
        }
      }
    }
  }

  async run(event, args) {
    await this.runCode(
      editorManager.editor.getValue(),
      args
    );
  }

  async runCode(code, args) {
    const file = editorManager.activeFile
    let extension = this.getFileExtension(file.name);
    let runner = this.getHandler(extension, file)

    let execute = acode.require('acodex')?.execute;
    
    if (!execute) {
      let msg = ("AcodeX plugin required to use Coderunner. Please install");
      this.#logger && this.#logger.error(msg);
      acode.alert("Coderunner Error", msg);
      return false;
    }

    let cmd = await this.getCommand(
      runner, extension, file
    )

    if (args) {
      cmd = await acode.prompt("Edit Command", cmd, 'textarea');
    }

    if (cmd) {
      this.#logger && this.#logger.info("Running file: " + file.name);
      this.#logger && this.#logger.info(`Executing "{cmd}"`);

      try {
        execute(cmd);
      } catch (err) {
        this.#logger && this.#logger.error(
          `Failed to run "{file.name}" : {String(err)}`
        );
        throw err;
      }
    }
  }

  destroy() {
    if (this.$runBtn) {
      this.$runBtn.onclick = null;
      this.$runBtn.remove();
    }

    editorManager.off('switch-file', this.checkRunnable.bind(this));
    editorManager.off('rename-file', this.checkRunnable.bind(this));
    
    editorManager.editor.commands.removeCommand("code.runner:run_code");
  }

  checkRunnable() {
    const file = editorManager.activeFile;

    if (this.$runBtn.isConnected) {
      this.$runBtn.remove();
    }
    
    let runner = this.getHandler(this.getFileExtension(file.name), file);

    if (runner) {
      const $header = root.get('header');
      // $header.get('.icon.play_arrow')?.remove();
      $header.insertBefore(this.$runBtn, $header.lastChild);
    }
  }

  getFileExtension(name) {
    return String(name).split('.').at(-1)
  }
  
  async getCommand(runner, extension, file) {
    let cmd;
    if (typeof runner == 'string') {
      cmd = runner
    } else {
      cmd = await runner(file)
    }

    if (cmd) {
      let splits = file.name.split(".");
      splits.pop();
      let fileNameNoExt = splits.join(".");
      let uri = await getUrl(file.uri);

      let paths = uri.split("/");
      paths.pop();
      let dir = paths.join("/") + "/";

      cmd = cmd.replaceAll(
        '$name', file.name
      ).replaceAll(
        '$dir', dir
      ).replaceAll(
        '$nameNoExt', fileNameNoExt
      ).replaceAll(
        '$dirNoSlash', dir.slice(0, dir.length - 1)
      ).replaceAll(
        '$uri', uri
      );
      return cmd + this.getCommandArgs(extension, file)
    }

    throw Error('Command cannot be null.')
  }

  getCommandArgs(extension, file) {
    let args = [];
    return ' ' + args.join(' ')
  }

  addHandler(extension, value) {
    this.#commands.set(extension, value);
  }

  removeHandler(extension) {
    this.#commands.delete(extension);
  }
  
  addWildcard(extension, value) {
    this.#wildcards.set(extension, value);
  }

  removeWildcard(extension) {
    this.#wildcards.delete(extension);
  }
}

if (window.acode) {
  let plugin = {
    id: "acode.coderunner.plugin",
  }
  const runner = new CodeRunner();
  acode.setPluginInit(plugin.id, (baseUrl, $page, { cacheFileUrl, cacheFile, firstInit }) => {

    if (!baseUrl.endsWith('/')) baseUrl += '/';
    runner.baseUrl = baseUrl;
    
    try {
      runner.init($page, cacheFile, cacheFileUrl, firstInit);
    } catch (err) {
      console.log(err)
    }

  });
  acode.setPluginUnmount(plugin.id, () => {
    runner.destroy();
  });
}