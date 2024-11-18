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

(function() {
  let appSettings = acode.require("settings");
  let Url = acode.require("Url");
  let helpers = acode.require("helpers");

  function getUrl(path) {
    if (path.startsWith("content://com.termux.documents/tree")) {
      path = path.split("::")[1];
      let termuxPath = path.replace(
        /^\/data\/data\/com\.termux\/files\/home/,
        "$HOME"
      );
      return termuxPath;
    } else if (path.startsWith("file:///storage/emulated/0/")) {
      let sdcardPath =
      "/sdcard" +
      path
      .substr("file:///storage/emulated/0".length)
      .replace(/\.[^/.]+$/, "")
      .split("/")
      .join("/") +
      "/";
      return sdcardPath;
    } else if (
      path.startsWith(
        "content://com.android.externalstorage.documents/tree/primary"
      )
    ) {
      path = path.split("::primary:")[1];
      let androidPath = "/sdcard/" + path;
      return androidPath;
    } else {
      return false;
    }
  }

  async function getDirectoryForFile(file) {
    for (let folder of addedFolder) {
      if (file.uri.includes(folder.url)) {
        return folder;
      }
    }
  }

  class CodeRunner {
    #logger = null;

    #commands = [
      {
        extension: "mjs",
        name: "node module",
        command: "node '$uri'",
      },
      {
        extension: "vb",
        name: "Visual Basic",
        command: "cd '$dir' && vbc /nologo '$name' && '$dir$nameNoExt'",
      },
      {
        extension: "vbs",
        name: "Visual Basics",
        command: "cscript '$uri'",
      },
      {
        extension: "scala",
        name: "Scala",
        command: "scala '$uri'",
      },
      {
        extension: "jl",
        name: "Julia",
        command: "julia '$uri'",
      },
      {
        extension: "cr",
        name: "Crystal",
        command: "crystal '$uri'",
      },
      {
        extension: "ml",
        command: "ocaml '$uri'",
      },
      {
        extension: "exs",
        name: "Elixir",
        command: "elixir '$uri'",
      },
      {
        extension: "hx",
        command: "haxe --cwd '$dirNoSlash' --run '$nameNoExt'",
      },
      {
        extension: "rkt",
        command: "racket '$uri'",
      },
      {
        extension: "scm",
        command: "csi -script '$uri'",
      },
      {
        extension: "ahk",
        command: "autohotkey '$uri'",
      },
      {
        extension: "au3",
        command: "autoit3 '$uri'",
      },
      {
        extension: "ipy",
        name: "Ipython",
        command: "ipython '$uri'",
      },
      {
        extension: "kts",
        name: "Kotlin",
        command: "kotlinc -script '$uri'",
      },
      {
        extension: "dart",
        name: "Dart",
        command: "dart '$uri'",
      },
      {
        extension: "pas",
        command: "cd '$dir' && fpc '$name' && '$dir$nameNoExt'",
      },
      {
        extension: "pp",
        command: "cd '$dir' && fpc '$name' && '$dir$nameNoExt'",
      },
      {
        extension: "d",
        command: "dmd '$name' && '$dir$nameNoExt'",
      },
      {
        extension: "hs",
        name: "Haskell",
        command: "runhaskell '$uri'",
      },
      {
        extension: "nim",
        name: "Nim",
        command: "nim compile --verbosity:0 --hints:off --run",
      },
      {
        extension: "csproj",
        name: "C-Sharp Project",
        command: "dotnet run --project",
      },
      {
        extension: "fsproj",
        name: "F-Sharp Project",
        command: "dotnet run --project",
      },
      {
        extension: "kit",
        command: "kitc --run",
      },
      {
        extension: "v",
        command: "v run '$uri'",
      },
      {
        extension: "vsh",
        command: "v run '$uri'",
      },
      {
        extension: "sass",
        name: "Sass",
        command: "sass --style expanded '$uri'",
      },
      {
        extension: "cu",
        command: "cd '$dir' && nvcc '$name' -o '$nameNoExt' && '$dir$nameNoExt'",
      },
      {
        extension: "ring",
        command: "ring '$uri'",
      },
      {
        extension: "sml",
        command: "sml '$uri'",
      },
      {
        extension: "js",
        name: "Javascipt",
        command: "cd '$dir' && node '$name'",
      },
      {
        extension: "py",
        name: "Python",
        command: "cd '$dir' && python '$name'",
      },
      {
        extension: "cpp",
        name: "C++",
        command: "g++ '$uri' -o '$nameNoExt' && ./'$nameNoExt'",
      },
      {
        extension: "java",
        name: "Java",
        command: "javac '$uri' && java '$nameNoExt'",
      },
      {
        extension: "sh",
        name: "Bash",
        command: "bash '$uri'",
      },
      {
        extension: "c",
        name: "C",
        command: "gcc '$uri' -o '$nameNoExt' && ./'$nameNoExt'",
      },
      {
        extension: "cs",
        name: "C-Sharp",
        command: "csc '$uri' && '$nameNoExt'",
      },
      {
        extension: "php",
        name: "PHP",
        command: "php '$uri'",
      },
      {
        extension: "rb",
        name: "Ruby",
        command: "ruby '$uri'",
      },
      {
        extension: "swift",
        name: "Swift",
        command: "swift '$uri'",
      },
      {
        extension: "go",
        name: "Go Lang",
        command: "go run '$uri'",
      },
      {
        extension: "pl",
        name: "Perl",
        command: "perl '$uri'",
      },
      {
        extension: "r",
        name: "R Script",
        command: "Rscript '$uri'",
      },
      {
        extension: "lua",
        name: "Lua",
        command: "lua '$uri'",
      },
      {
        extension: "scala",
        name: "Scala",
        command: "scala '$uri'",
      },
      {
        extension: "kt",
        name: "Kotlin",
        command:
        "kotlinc '$uri' -include-runtime -d '$nameNoExt'.jar && java -jar '$nameNoExt'.jar",
      },
      {
        extension: "vb",
        name: "Visual Basics (EXE)",
        command: "vbnc '$uri' && mono '$nameNoExt.exe'",
      },
      {
        extension: "hs",
        command: "ghc '$uri' -o '$nameNoExt' && ./'$nameNoExt'",
      },
      {
        extension: "rs",
        name: "Rust",
        command: "rustc '$uri' && ./'$nameNoExt'",
      },
      {
        extension: "ex",
        name: "Elixir",
        command: "elixirc '$uri'",
      },
      {
        extension: "erl",
        name: "E Script",
        command: "escript '$uri'",
      },
      {
        extension: "clj",
        name: "Clojure",
        command: "clojure '$uri'",
      },
      {
        extension: "lisp",
        name: "Lisp",
        command: "sbcl --script '$uri'",
      },
      {
        extension: "m",
        name: "Gcc",
        command:
        "gcc -framework Foundation '$uri' -o '$nameNoExt' && ./'$nameNoExt'",
      },
      {
        extension: "d",
        command: "dmd '$uri' && ./'$nameNoExt'",
      },
      {
        extension: "groovy",
        name: "Groovy",
        command: "groovy '$uri'",
      },
      {
        extension: "kts",
        name: "K Script",
        command: "kscript '$uri'",
      },
      {
        extension: "sql",
        name: "SQL (MySql)",
        command: "mysql -u username -p < '$uri'",
      },
      {
        extension: "swift",
        name: "Swift",
        command: "swift '$uri'",
      },
      {
        extension: "matlab",
        name: "Matlab",
        command: "matlab -nodisplay -nosplash -r 'run('$uri');exit;'",
      },
      {
        extension: "hs",
        command: "ghc '$uri' -o '$nameNoExt' && ./'$nameNoExt'",
      },
    ];

    #projectCommands = [
      {
        name: "Built In Runner",
        match: (file => file.canRun()),
        handler: file => file.run()
      },
      {
        name: "NPM",
        async match(file) {
          if (file.name == "package.json") {
            return true;
          }

          let folder = await getDirectoryForFile(file);
          if (!folder) return false;

          let fs = await acode.fsOperation(
            Url.join(folder.url, 'package.json')
          );
          return await fs.exists();
        },
        async handler(file) {
          let scripts = [["installScript",
            "install"]],
          value;
          let data;

          if (file.name == "package.json") {
            data = JSON.parse(file.session.getValue() || "{}");
          } else {
            let folder = await getDirectoryForFile(file);

            let fs = await acode.fsOperation(
              Url.join(folder.url, 'package.json')
            );
            if (await fs.exists()) {
              data = JSON.parse(await fs.readFile('utf-8'));
            } else {
              return;
            }
          }

          for (let script in data.scripts || {}) {
            scripts.push([script, script]);
          }

          if (scripts.length > 0) {
            value = await acode.select("Select script", scripts);
          } else {
            value = await acode.prompt("Script name", "start");
          }

          if (value) {
            if (value == "installScript") {
              return this.ensureCd('npm install');
            }
            return this.ensureCd(`npm run ${value}`);
          }
        },
      },
      {
        name: "Django",
        async match(file) {
          let folder = await getDirectoryForFile(file);
          if (!folder) return false;

          let fs = await acode.fsOperation(
            Url.join(folder.url, 'manage.py')
          );
          return await fs.exists();
        },
        async handler(file) {
          let folder = await getDirectoryForFile(file);
          let folderUrl = getUrl(folder.url);

          let commands = [
            ["runserver",
              "Run Server"],
            ["migrate",
              "Migrate"],
            ["makemigrations",
              "Make Migrations"],
            ["shell",
              "Shell"],
            ["other",
              "Enter Command"]
          ]

          let command = await acode.select(
            "Select Django Command", commands
          );

          if (!command) {
            return;
          } else if (command == "other") {
            command = await acode.prompt("Enter command");
          }

          return `cd "${folderUrl}" && python manage.py ${command}`
        }
      }];

    async init($page, cacheFile, cacheFileUrl, firstInit) {
      this.$runBtn = tag("span", {
        className: "icon play_circle_filled",
        attr: {
          action: "run",
        },
        title: "Run using code runner",
        onclick: this.run.bind(this),
        oncontextmenu: async (ev) => {
          await this.run(ev, true);
        },
      });

      this.$stopBtn = tag("span", {
        className: "icon pause_circle_filled",
        attr: {
          action: "run",
        },
        title: "Stop running.",
        onclick: this.stop.bind(this),
      });
      
      this.$func = this.checkRunnable.bind(this)

      this.checkRunnable();

      editorManager.on("switch-file", this.$func);
      editorManager.on("rename-file", this.$func);

      editorManager.editor.commands.addCommand({
        name: "code.runner:run_code",
        description: "Run Code",
        bindKey: {
          win: "Ctrl-R",
        },
        exec: () => this.run(null, false),
      });

      acode.define("code.runner", {
        run: this.run.bind(this),
        stop: this.stop.bind(this),
        addHandler: this.addHandler.bind(this),
        removeHandler: this.removeHandler.bind(this),
        addWildcard: this.addWildcard.bind(this),
        removeWildcard: this.removeWildcard.bind(this),
      });

      if (firstInit) {
        this.remakeOldsettings();
      }
    }

    get logger() {
      if (this.#logger) return this.#logger;

      let logger = acode.require("acode.sdk.logger");
      if (logger) {
        this.#logger = logger("acode.coderunner.plugin");
        return this.#logger;
      }
      return null;
    }

    get commands() {
      let data = this.settings.commands || this.#commands;

      if (typeof data == "string") {
        try {
          data = JSON.parse(data);
        } catch (err) {
          acode.alert("Invalid command config");
          throw err;
        }
      }

      if (!this.settings.projectsRunnable) {
        return [...data, this.#projectCommands[0]];
      }

      return [
        ...data,
        ...this.#projectCommands
      ];
    }

    async getHandler(file, single = true) {
      let extension = this.getFileExtension(file.name);
      let commands = [];

      for (let command of this.commands) {
        if (command.extension && command.extension == extension) {
          if (single) {
            return command;
          } else {
            commands.push(command);
          }
        } else if (command.match) {
          if (typeof command.match == "function") {
            if (await command.match(file)) {
              if (single) {
                return command;
              } else {
                commands.push(command);
              }
            }
          }

          let regex = new RegExp(command.match);
          if (regex.exec(file.name)) {
            if (single) {
              return command;
            } else {
              commands.push(command);
            }
          }
        }
      }

      return commands;
    }

    ensureCd(command, dir = "$dir") {
      if (this.settings.changeDirectory) {
        return command
      } else {
        return `cd "${dir}" && ${command}`
      }
    }

    async run(event, args) {
      this.runCode(editorManager.editor.getValue(), args);
    }

    async runCode(code, args) {
      const file = editorManager.activeFile;
      let handler,
      handlers = await this.getHandler(file, false);

      if (handlers.length > 1) {
        let value = await acode.select(
          "Run Using",
          handlers.map((item, index) => {
            return [index, item.name || item.extension];
          })
        );

        if (value === undefined) {
          return;
        } else {
          handler = handlers[value];
        }
      } else if (handlers.length == 1) {
        handler = handlers[0];
      } else {
        return;
      }

      let cmd = await this.formatCommand(handler, file);

      if (args) {
        cmd = await acode.prompt("Edit Command", cmd, "textarea");
      }

      if (cmd) {
        this.logger && this.logger.log("Running", cmd);

        try {
          this.$runBtn.replaceWith(this.$stopBtn);
          this.execute(cmd);
          this.$stopBtn.replaceWith(this.$runBtn);

          this.logger && this.logger.log("Done", "exited with code=0");
        } catch (err) {
          this.logger &&
          this.logger.error(`Failed to run "${file.name}" : ${String(err)}`);
          throw err;
        }
      }
    }

    stop() {
      this.execute("^C");
      this.logger && this.logger.log("Done", "exited with code=1");
    }

    execute(command) {
      const termController = acode.require("acodex");

      if (termController) {
        if (!termController.isTerminalOpened()) {
          termController.openTerminal();
        }

        if (termController.isMinimized()) {
          termController.maximiseTerminal();
        }

        termController.execute(command);
      } else {
        let msg =
        "AcodeX plugin required to use Coderunner.\n Please install first.";
        this.logger && this.logger.error(msg);
        acode.alert("Coderunner Error", msg);
        return false;
      }
    }

    destroy() {
      if (this.$runBtn) {
        this.$runBtn.onclick = null;
        this.$runBtn.remove();
      }

      editorManager.off("switch-file", this.$func);
      editorManager.off("rename-file", this.$func);

      editorManager.editor.commands.removeCommand("code.runner:run_code");
    }

    async checkRunnable() {
      const file = editorManager.activeFile;

      if (this.$runBtn.isConnected) {
        this.$runBtn.remove();
      }

      this.checkFileRunnable(file);
    }

    async checkFileRunnable(file) {
      let runner = await this.getHandler(file);
      let btn = this.$runBtn;

      if (runner) {
        const $header = root.get("header");

        if (this.settings.replaceRunBtn) {
          let i;

          let func = () => {
            let icon = $header.get(".icon.play_arrow");
            if (icon) {
              icon.remove();
              clearInterval(i);
              $header.insertBefore(btn, $header.lastChild);
            }
          };

          i = setInterval(func, 10);
        }
        $header.insertBefore(btn, $header.lastChild);
      } else {
        btn.remove();
      }
    }

    async checkProjectRunnable(file) {}

    getFileExtension(name) {
      return String(name).split(".").at(-1);
    }

    async formatCommand(command, file) {
      let cmd;

      if (command.handler) {
        cmd = await command.handler(file);
      } else {
        cmd = command.command;
      }

      if (cmd) {
        if (this.settings.changeDirectory) {
          cmd = `cd "${this.settings.executionDirectory || "$dir"}" && ${cmd}`;
        }

        let splits = file.name.split(".");
        splits.pop();
        let fileNameNoExt = splits.join(".");
        let uri = await getUrl(file.uri);

        let paths = uri.split("/");
        paths.pop();
        let dir = paths.join("/") + "/";

        let folder = await getDirectoryForFile(file);

        cmd = cmd
        .replaceAll("$nameNoExt", fileNameNoExt)
        .replaceAll("$dirNoSlash", dir.slice(0, dir.length - 1))
        .replaceAll("$workspaceUrl", folder?.url)
        .replaceAll("$workspace",folder?.url.split("::")[1])
        .replaceAll("$name", file.name)
        .replaceAll("$dir", dir)
        .replaceAll("$uri", uri);
        return cmd;
      }

      throw Error("Command cannot be null.");
    }

    addHandler(config) {
      this.#projectCommands.push(config);
    }

    removeHandler(name) {
      this.#projectCommands = this.#projectCommands.filter((item) => {
        return item.name === name;
      });
    }

    initialSettings() {
      return {
        changeDirectory: true,
        replaceRunBtn: true,
        executionDirectory: "$dir",
        commands: this.#commands,
        projectsRunnable: true
      };
    }

    remakeOldsettings() {
      let commands = this.settings.commands;

      if (commands && Array.isArray(commands[0])) {
        let newCommands = [];

        commands.forEach((item) => {
          newCommands.push({
            extension: item[0],
            command: item[1],
            name:
            this.#commands.find((command) => {
              command.extension == item[0];
            })?.name || item[0],
          });
        });

        this.#commands = newCommands;
      }
    }

    get settingsObj() {
      let settings = this.settings;
      let commands = settings.commands || this.#commands;
      return {
        list: [{
          index: 0,
          key: "changeDirectory",
          text: "Change Directory",
          info: "Change the current directory before running.",
          checkbox: settings.changeDirectory,
        },
          {
            index: 1,
            key: "executionDirectory",
            text: "Execution Directory",
            value: "$dir",
            info: "Directory to change to before running.",
            prompt: "Directory",
            promptType: "text",
          },
          {
            index: 2,
            key: "commands",
            text: "Command mapping (json lists)",
            info: "Json list of [{ 'name', 'extension' or 'match', 'command' }]",
            value: JSON.stringify(commands),
            prompt: "Command Map",
            promptType: "textarea",
          },
          {
            index: 3,
            key: "replaceRunBtn",
            text: "Replace Run Button",
            info: "Replace the default run button",
            checkbox: settings.replaceRunBtn,
          },
          {
            index: 4,
            key: "projectsRunnable",
            text: "Run Projects",
            info: "Display option to run projects.",
            checkbox: settings.projectsRunnable,
          }
          // {
          //   index: 1,
          //   key: "cursorStyle",
          //   text: "Cursor Style",
          //   value: this.settings.cursorStyle,
          //   info: "The style of the cursor.",
          //   select: [
          //     this.CURSOR_STYLE1,
          //     this.CURSOR_STYLE2,
          //     this.CURSOR_STYLE3,
          //   ],
          // },
          // {
          //   index: 2,
          //   key: "fontSize",
          //   text: "Font Size",
          //   value: this.settings.fontSize,
          //   info: "The font size used to render text.",
          //   prompt: "Font Size",
          //   promptType: "text",
          //   promptOption: [{
          //     match: /^[0-9]+$/,
          //     required: true,
          //   },
          //   ],
          // },
          // {
          //   index: 3,
          //   key: "scrollBack",
          //   text: "Scroll Back",
          //   value: this.settings.scrollBack,
          //   info: "The amount of scrollback in the terminal. Scrollback is the amount of rows that are retained when lines are scrolled beyond the initial viewport.",
          //   prompt: "Scroll Back",
          //   promptType: "number",
          //   promptOption: [{
          //     match: /^[0-9]+$/,
          //     required: true,
          //   },
          //   ],
          // },
          // {
          //   index: 4,
          //   key: "scrollSensitivity",
          //   text: "Scroll Sensitivity",
          //   value: this.settings.scrollSensitivity,
          //   info: "The scrolling speed multiplier used for adjusting normal scrolling speed.",
          //   prompt: "Scroll Sensitivity",
          //   promptType: "number",
          //   promptOption: [{
          //     match: /^[0-9]+$/,
          //     required: true,
          //   },
          //   ],
          // },
          // {
          //   index: 6,
          //   key: "backgroundColor",
          //   text: "Background Color",
          //   value: this.settings.backgroundColor,
          //   color: this.settings.backgroundColor,
          // },
        ],
        cb: (key, value) => {
          if (key == "commands") {
            try {
              value = JSON.parse(value);
            } catch (err) {
              acode.alert("Invalid command config");
              throw err;
            }
          }

          this.settings[key] = value;
          appSettings.update();
        },
      };
    }

    get settings() {
      let value = appSettings.value["acode.coderunner.plugin"];
      if (!value) {
        value = appSettings.value["acode.coderunner.plugin"] =
        this.initialSettings();
        appSettings.update();
      }
      return value;
    }
  }

  if (window.acode) {
    let plugin = {
      id: "acode.coderunner.plugin",
    };
    const runner = new CodeRunner();
    acode.setPluginInit(
      plugin.id,
      (baseUrl, $page, {
        cacheFileUrl, cacheFile, firstInit
      }) => {
        if (!baseUrl.endsWith("/")) baseUrl += "/";
        runner.baseUrl = baseUrl;

        try {
          runner.init($page, cacheFile, cacheFileUrl, firstInit);
        } catch (err) {
          console.log(err);
        }
      },
      runner.settingsObj
    );
    acode.setPluginUnmount(plugin.id,
      () => {
        runner.destroy();
      });
  }
})();
