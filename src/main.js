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
import plugin from "../plugin.json";
// let plugin = {
//   id: plugin.id,
// };

let Url = acode.require("url");
let fs = acode.require("fsoperation");
let helpers = acode.require("helpers");
let appSettings = acode.require("settings");
let EditorFile = acode.require("EditorFile");
let openFolder = acode.require("openFolder");
let multiPrompt = acode.require("multiPrompt");

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

function getDirectoryForFile(file) {
  return openFolder.find(file.uri);
}

function runAcodeX(termController, command) {
  if (!termController.isTerminalOpened()) {
    if (!termController.newTerminal?.()) {
      termController.openTerminal?.();
    }
  }

  // termController.createSession?.();

  if (termController.isMinimized()) {
    termController.maximiseTerminal();
  }

  return termController.execute(command);
}

async function runAcodeTerminal(terminal, command) {
  let term = await terminal.newTerminal({
    backend: "termux",
    // backendConfig: { command },
  });

  this.$runBtn.replaceWith(this.$stopBtn);
  this.$stopBtn.onclick = () => {
    term.backend.close();
  };

  term.backend.onclose = () => {
    this.$stopBtn.replaceWith(this.$runBtn);
  };

  terminal.show?.()

  return term.execute(command);
}







class CodeRunner {
  #logger = null;

  #commands;
  #commandsUrl;

  #projectCommands = [
    {
      name: "Built In Runner",
      icon: "play_arrow",
      project: true,
      match: (file) => file.canRun(),
      handler: (file, { contextMenu }) =>
        contextMenu ? file.runFile() : file.run(),
    },
  ];

  async init($page, cacheFile, cacheFileUrl, firstInit) {
    let self = this,
      data;
    this.#commandsUrl = Url.join(PLUGIN_DIR, plugin.id, "commands.json");

    if (!(await fs(this.#commandsUrl).exists())) {
      await fs(Url.dirname(this.#commandsUrl)).createFile("commands.json");

      if ((data = this.settings.commands)) {
        await fs(this.#commandsUrl).writeFile(JSON.stringify(data), "utf-8");
      } else {
        await fs(this.#commandsUrl).writeFile(
          await fs(PLUGIN_DIR, plugin.id, "default_commands.json")
            .readFile("utf-8")
          , "utf-8"
        );
      }
    }

    // console.log(await fs(this.#commandsUrl).readFile("utf-8"))

    this.#commands = JSON.parse(
      (await fs(this.#commandsUrl).readFile("utf-8")) || "[]"
    );

    this.#projectCommands.push({
      name: "NPM",
      icon: "file file_type_javascript",
      project: true,
      async match(file) {
        if (file.name == "package.json") {
          return true;
        }

        let folder = getDirectoryForFile(file);
        if (!folder) return false;

        let fs0 = await fs(Url.join(folder.url, "package.json"));
        return await fs0.exists();
      },
      async handler(file, { execute }) {
        let scripts = [["installScript", "install"]],
          value;
        let data;

        if (file.name == "package.json") {
          data = JSON.parse(file.session.getValue() || "{}");
        } else {
          let folder = getDirectoryForFile(file);

          let fs = await acode.fsOperation(
            Url.join(folder.url, "package.json")
          );
          if (await fs.exists()) {
            data = JSON.parse(await fs.readFile("utf-8"));
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
            return await execute(
              await self.#generateCommand("npm install", file, false)
            );
          }
          return await execute(
            await self.#generateCommand(`npm run ${value}`, file, false)
          );
        }
      },
    });

    this.#projectCommands.push({
      name: "Edit commands.json",
      icon: "file file_type_json",
      match: (file) => true,
      handler: () => {
        new EditorFile(Url.basename(this.#commandsUrl), {
          uri: this.#commandsUrl,
        });
      },
      project: true,
    });

    this.#projectCommands.push({
      name: "Django",
      icon: "file file_type_python",
      project: true,
      async match(file) {
        let folder = getDirectoryForFile(file);
        if (!folder) return false;

        let fs = await acode.fsOperation(Url.join(folder.url, "manage.py"));
        return await fs.exists();
      },
      async handler(file, { execute }) {
        let folder = getDirectoryForFile(file);
        let folderUrl = getUrl(folder.url);

        let commands = [
          ["runserver", "Run Server", "play_arrow"],
          ["migrate", "Migrate"],
          ["makemigrations", "Make Migrations"],
          ["shell", "Shell"],
          ["other", "Enter Command", "edit"],
        ];

        let command = await acode.select("Select Django Command", commands);

        if (!command) {
          return;
        } else if (command == "other") {
          command = await acode.prompt("Enter command");
        }

        return await execute(
          await self.#generateCommand(
            `cd "${folderUrl}"; python manage.py ${command}`,
            file,
            false
          )
        );
      },
    });

    app.get("#coderunner-run")?.remove();
    app.get("#coderunner-stop")?.remove();

    this.$runBtn = tag("span", {
      className: "icon play_circle_filled",
      id: "coderunner-run",
      attr: {
        action: "run",
      },
      title: "Run using code runner",
      onclick: this.run.bind(this),
      oncontextmenu: (ev) => {
        this.run(ev, true);
      },
    });

    this.$stopBtn = tag("span", {
      className: "icon pause_circle_filled",
      id: "coderunner-stop",
      attr: {
        action: "run",
      },
      title: "Stop running.",
      onclick: this.stop.bind(this),
    });

    this.$func = this.checkRunnable.bind(this);

    this.checkRunnable();

    editorManager.on("switch-file", this.$func);
    editorManager.on("rename-file", this.$func);

    editorManager.editor.commands.addCommand({
      name: "code.runner:run",
      description: "Run Code",
      bindKey: {
        win: "Ctrl-R",
      },
      exec: () => this.run(false),
    });

    editorManager.editor.commands.addCommand({
      name: "code.runner:run_file",
      description: "Run File",
      bindKey: {
        win: "Ctrl-Shift-R",
      },
      exec: () => this.run(true),
    });

    // editorManager.editor.commands.addCommand({
    //   name: "code.runner:default",
    //   description: "Set Default",
    //   bindKey: {
    //     win: "Ctrl-Shift",
    //   },
    //   exec: () => this.setDefault(),
    // });

    // editorManager.editor.commands.addCommand({
    //   name: "code.runner:run_handler",
    //   description: "Run Code",
    //   bindKey: {
    //     win: "Ctrl-R",
    //   },
    //   exec: (ev) => this.run(ev),
    // });

    acode.define("code.runner", {
      run: this.run.bind(this),
      stop: this.stop.bind(this),
      getDirectoryForFile,
      addHandler: this.addHandler.bind(this),
      removeHandler: this.removeHandler.bind(this),
    });
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

    return [...data, ...this.#projectCommands];
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
      return command;
    } else {
      return `cd "${dir}"; ${command}`;
    }
  }

  async run(event, contextMenu) {
    this.runCode(contextMenu);
  }

  async runCode(contextMenu) {
    const file = editorManager.activeFile;
    let handler,
      cmd,
      handlers = await this.getHandler(file, false);

    let execute = async (cmd) => {
      if (cmd) {
        this.logger && this.logger.debug("Running: " + cmd);

        try {
          await this.execute(cmd);

          this.logger && this.logger.debug("Done. Exited with code=0");
        } catch (err) {
          this.logger &&
            this.logger.error(
              `Failed to run "${file.name}" : ${String(err)}`
            );
          throw err;
        }
      }
    };

    let setDefault;
    if (!contextMenu && (setDefault = handlers.find(h => h.default))) {
      handler = setDefault;
    } else if (
      handlers.length > 1 ||
      (handlers.length == 1 && handlers[0].project)
    ) {
      handlers.push({
        name: "Configure Default",
        icon: "settings",
        project: true,
        handler: async () => {
          let newHandlers = handlers.filter(
            handler => (!!!handler.project)
          );
          newHandlers.push({
            name: "Remove Default",
            icon: "settings"
          })
          let default_handler = await acode.select(
            "Select Default",
            newHandlers.map((item, index) => {
              let icon = item.extension
                ? helpers.getIconForFile("file." + item.extension)
                : "play_arrow";
              return [
                item,
                (item.name || item.extension) + (
                  item.default ? " (Default)" : ""
                ),
                item.icon ? item.icon : icon,
              ];
            })
          );

          if (default_handler) {
            newHandlers.map(item => {
              if (item.default) {
                item.default = false;
              }
            });
            default_handler.default = true;
            await fs(this.#commandsUrl).writeFile(
              JSON.stringify(this.#commands), "utf-8"
            )
          }
        }
      })
      let value = await acode.select(
        "Run Using",
        handlers.map((item, index) => {
          let icon = item.extension
            ? helpers.getIconForFile("file." + item.extension)
            : "play_arrow";
          return [
            index,
            (item.name || item.extension) + (
              item.default ? " (Default)" : ""
            ),
            item.icon ? item.icon : icon,
          ];
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

    if ((cmd = handler.command)) {
      if (this.settings.commandEdit) {
        cmd = await this.#generateCommand(cmd, file);
      } else {
        cmd = this.formatCommand(cmd, file);
      }

      cmd && (await execute(cmd));
    } else if (handler.handler) {
      await handler.handler(file, { contextMenu, execute });
    }
  }

  async #generateCommand(command, file, changeDir) {
    let self = this;

    changeDir = changeDir !== undefined
      ? changeDir
      : this.settings.changeDirectory

    let origCommand = command;
    if (changeDir) {
      command = 'cd "$dir"; ' + command
    }

    function renderCommand() {
      let cmdSrc = app.get("#sourceCmd");
      let cmd = cmdSrc.value;

      if (cmd) {
        cmd = cmd.trim();

        let elem = app.get("#handler");
        let cd = app.get("#changeDir")?.checked;

        if (cd) {
          if (cmd.startsWith('cd "$dir"; ')) return;

          elem.setAttribute(
            "value",
            (elem.value = self.formatCommand('cd "$dir"; ' + cmd, file))
          );
        } else {
          elem.setAttribute(
            "value",
            (elem.value = self.formatCommand(
              (cmdSrc.value = cmd.replace('cd "$dir"; ', '')), file
            ))
          );
        }
      }
    }

    let prompts = await multiPrompt("Run Code", [
      {
        id: "sourceCmd",
        value: command,
        onchange: renderCommand,
      },
      {
        id: "handler",
        placeholder: "Handler",
        // disabled: true,
        value: this.formatCommand(command, file),
        // async onclick() {
        //   let value = await acode.select(
        //     "Handler",
        //     handlers.map((item, index) => {
        //       return [index, item.name || item.extension];
        //     })
        //   );
        //   if (value) {
        //     item = handlers[index];
        //     if (command) {
        //       let cmd = self.formatCommand(command, file, false);
        //       this.setAttribute("value", command);
        //     }
        //     this.value = command;
        //   }
        // },
      },
      // [
      //   {
      //     id: "extraArgs",
      //     placeholder: "Extra arguments",
      //     onchange: renderCommand,
      //   },
      // ],
      [
        {
          id: "changeDir",
          type: "checkbox",
          placeholder: "Change Directory",
          onchange: renderCommand,
          value: changeDir
        },
      ],
    ]);
    return prompts.handler;
  }

  stop() {
    this.$stopBtn.remove();
    this.execute("^C");
    this.logger && this.logger.debug("Done. Exited with code=1");
  }

  async execute(command) {
    let acodex = acode.require("acodex");
    let terminal;

    console.log(acodex, acode.require('acode.terminal'), this.settings.runLibrary)

    if (
      this.settings.runLibrary == "AcodeX" && acodex
    ) {
      await runAcodeX(acodex, command);
    } else if ((terminal = acode.require("acode.terminal"))) {
      if (this.settings.runAcodeTerminal == "AcodeX") {
        let text = "AcodeX unavailable falling back to Acode Terminal.";
        this.logger && this.logger.debug(text);
        console.info(text);
      }
      await runAcodeTerminal.bind(this)(terminal, command);
    } else {
      if (acodex) {
        let text = "AcodeX available falling back to AcodeX.";
        this.logger && this.logger.debug(text);
        console.info(text);
        await runAcodeX(acodex, command);
      } else {
        let msg =
          "AcodeX or Acode Terminal plugin required to use Coderunner." +
          "\n Please install first.";
        this.logger && this.logger.error(msg);
        acode.alert("Coderunner Error", msg);
        return false;
      }
    }
  }

  destroy() {
    if (this.$runBtn) {
      this.$runBtn.onclick = null;
      this.$runBtn.remove();
      this.$stopBtn.remove();
    }

    editorManager.off("switch-file", this.$func);
    editorManager.off("rename-file", this.$func);

    editorManager.editor.commands.removeCommand("code.runner:run_code");
  }

  async checkRunnable() {
    const file = editorManager.activeFile;

    if (this.$runBtn.isConnected) {
      this.$runBtn.remove();
    } else if (this.$stopBtn.isConnected) {
      this.$stopBtn.remove();
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
          let icon = $header.get('.icon.play_arrow[action="run"]');
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

  async checkProjectRunnable(file) { }

  getFileExtension(name) {
    return String(name).split(".").at(-1);
  }

  formatCommand(cmd, file, contextMenu) {
    // let cmd;

    // if (command.handler) {
    //   cmd = await command.handler(file, contextMenu);
    // } else {
    //   cmd = command.command;
    // }

    if (cmd) {
      // if (this.settings.changeDirectory) {
      //   cmd = `cd "${this.settings.executionDirectory || "$dir"}" && ${cmd}`;
      // }

      let splits = file.name.split(".");
      splits.pop();
      let fileNameNoExt = splits.join(".");
      let uri = getUrl(file.uri);

      let paths = uri.split("/");
      paths.pop();
      let dir = paths.join("/") + "/";

      let folder = getDirectoryForFile(file);

      cmd = cmd
        .replaceAll("$nameNoExt", fileNameNoExt)
        .replaceAll("$dirNoSlash", dir.slice(0, dir.length - 1))
        .replaceAll("$workspaceUrl", folder?.url)
        .replaceAll("$workspace", folder?.url.split("::")[1]) //ADD $workspace
        .replaceAll("$name", file.name)
        .replaceAll("$dir", dir)
        .replaceAll("$uri", uri);
      return cmd;
    }

    // throw Error("Command cannot be null.");
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
      // executionDirectory: "$dir",
      // commands: this.#commands,
      projectsRunnable: true,
      commandEdit: true,
      runLibrary: "AcodeX"
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

  format(commands) {
    const { beautify } = ace.require("ace/ext/beautify");

    let str = JSON.stringify(commands);
    let sess = ace.createEditSession("");
    sess.setValue(str);
    sess.setMode("json");

    beautify(sess);
    return sess.getValue();
  }

  get settingsObj() {
    let settings = this.settings;
    let commands = settings.commands || this.#commands;
    return {
      list: [
        {
          index: 0,
          key: "changeDirectory",
          text: "Change Directory",
          info: "Change the current directory before running.",
          checkbox: settings.changeDirectory,
        },
        {
          index: 1,
          key: "runLibrary",
          text: "Terminal Library",
          value: "AcodeX",
          info: "Acode library to use to execute commands.",
          select: ["AcodeX", "Acode Terminal"],
        },
        // {
        //   index: 2,
        //   key: "commands",
        //   text: "Command mapping (json lists)",
        //   info: "Json list of [{ 'name', 'extension' or 'match', 'command' or 'handler' }]",
        //   value: this.format(commands),
        //   prompt: "Command Map",
        //   promptType: "textarea",
        // },
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
        },
        {
          index: 5,
          key: "commandEdit",
          text: "Enable Command Edit Box",
          info: "Whether to display prompt to edit command before running.",
          checkbox: settings.commandEdit,
        },
      ],
      cb: (key, value) => {
        // if (key == "commands") {
        //   try {
        //     value = JSON.parse(value);
        //   } catch (err) {
        //     acode.alert("Invalid command config");
        //     throw err;
        //   }
        // }

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
  const runner = new CodeRunner();
  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, { cacheFileUrl, cacheFile, firstInit }) => {
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      runner.baseUrl = baseUrl;
      await runner.init($page, cacheFile, cacheFileUrl);
    }
      
      
      // if (!baseUrl.endsWith("/")) baseUrl += "/";
      // runner.baseUrl = baseUrl;
      // try {

      //   await runner.init($page, cacheFile, cacheFileUrl, firstInit);
      //   document.dispatchEvent(
      //     new CustomEvent("plugin.install", {
      //       detail: {
      //         name: "coderunner",
      //         plugin: runner,
      //       },
      //     })
      //   );
      // } catch (err) {
      //   console.log(err);
      //   alert(`${console.log(plugin.id)} :` + String(err));
      // }
    ,
    runner.settingsObj
  );

  acode.setPluginUnmount(plugin.id, () => {
    runner.destroy();
  });
}