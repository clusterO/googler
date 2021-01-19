const vscode = require("vscode");
const googleIt = require("google-it");
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

async function showInputBox() {
  let filename = Math.random().toString(36).substring(7);

  const search = await vscode.window.showInputBox({
    value: "",
    placeholder: "Type your search here",
  });

  if (!search) {
    vscode.window.showInformationMessage(`Enter some keywords to search`);
    return;
  }

  googleIt({
    query: `${search} site:stackoverflow.com`,
    "no-display": true,
  })
    .then(async (result) => {
      vscode.window.showInformationMessage("loading results...");

      for (let i = 0; i < 5; i++) {
        const { data } = await axios.get(result[i].link);
        const $ = cheerio.load(data);
        const answers = $("#answers");

        let a = answers.find(".accepted-answer");
        if (a.length > 0) {
          let post = a.find(".js-post-body");
          fs.appendFile(
            filename + ".md",
            "### " +
              result[i].title +
              "\r\n" +
              post.text().replace(/^\s*[\r\n]/gm, "") +
              "\r\n",
            (err) => {
              if (err) throw err;
            }
          );
        }
      }

      let uri = vscode.Uri.parse(__dirname + "/" + filename + ".md");
      vscode.workspace
        .openTextDocument(uri)
        .then((doc) => {
          vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside, true);
          try {
            fs.unlinkSync(__dirname + "/" + filename + ".md");
          } catch (err) {
            console.error(err);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((e) => {
      vscode.window.showErrorMessage(e);
    });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand("google", async () => {
    showInputBox();
  });

  context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
