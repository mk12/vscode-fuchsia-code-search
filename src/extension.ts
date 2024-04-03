import * as vscode from "vscode";
import type * as git from "./git";

let log: vscode.LogOutputChannel;
let gitApi: git.API;
let fuchsiaRepo: git.Repository | undefined;

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    log = vscode.window.createOutputChannel("Fuchsia Code Search", { log: true }),
    vscode.commands.registerTextEditorCommand("fuchsiaCodeSearch.copyUrl", commandCopyUrl),
    vscode.commands.registerTextEditorCommand("fuchsiaCodeSearch.openUrl", commandOpenUrl),
  );
  const extension = vscode.extensions.getExtension<git.GitExtension>("vscode.git");
  if (!extension) return;
  const exports = extension.isActive ? extension.exports : await extension.activate();
  const api = exports.getAPI(1);
  const initialize = () => {
    log.appendLine(`git API initialized with ${api.repositories.length} repo(s)`);
    gitApi = api;
    context.subscriptions.push(
      api.onDidOpenRepository(onDidOpenRepository),
      api.onDidCloseRepository(onDidCloseRepository)
    );
    for (const repo of api.repositories) onDidOpenRepository(repo);
  };
  if (api.state === "initialized") {
    initialize();
  } else {
    const listener = api.onDidChangeState((state) => {
      listener.dispose();
      if (state === "initialized") initialize();
    });
    context.subscriptions.push(listener);
  }
}

async function onDidOpenRepository(repo: git.Repository) {
  if (fuchsiaRepo) return;
  try { await repo.getCommit("c96ba9476e8acca497bb7e78247a0f12d140966b"); }
  catch (err) { return; }
  log.appendLine(`fuchsia repo opened: ${repo.rootUri.fsPath}`);
  fuchsiaRepo = repo;
}

function onDidCloseRepository(repo: git.Repository) {
  if (repo !== fuchsiaRepo) return;
  log.appendLine("fuchsia repo closed");
  fuchsiaRepo = undefined;
}

async function commandCopyUrl(editor: vscode.TextEditor) {
  const url = await getUrl(editor);
  if (url) vscode.env.clipboard.writeText(url);
}

async function commandOpenUrl(editor: vscode.TextEditor) {
  const url = await getUrl(editor);
  if (url) vscode.env.openExternal(vscode.Uri.parse(url));
}

async function getUrl(editor: vscode.TextEditor) {
  const repo = gitApi.getRepository(editor.document.uri);
  if (!repo) return fail("Not in a git repository");
  if (repo.rootUri.fsPath !== fuchsiaRepo?.rootUri.fsPath) return fail("Not in the fuchsia repository");
  const absPath = editor.document.fileName;
  const repoPath = repo.rootUri.fsPath + "/";
  if (!absPath.startsWith(repoPath)) return fail("File is not in the repository");
  const relPath = absPath.slice(repoPath.length);
  let mergeBase;
  try {
    mergeBase = await repo.getMergeBase("origin/main", "HEAD");
  } catch (err) {
    log.appendLine("merge base failed: " + err);
    return fail("Failed to get merge base");
  }
  return `https://cs.opensource.google/fuchsia/fuchsia/+/${mergeBase}:${relPath}${lineParam(editor.selection)}`;
}

function lineParam(selection: vscode.Selection) {
  if (selection.isEmpty) return "";
  const [from, to] = [selection.start, selection.end].sort();
  const param = `;l=${from.line + 1}`;
  const single = from.line === to.line || (from.line + 1 === to.line && to.character === 0);
  return single ? param : param + `-${to.line + 1}`;
}

function fail(message: string) { vscode.window.showErrorMessage(message); }
