const _ = require('lodash');
const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { readFilesFromDir } = require('../helper/utils');
const {
  fixtureAutocompletionCommands,
  cucumberFixtureAutocompleteOnQuotes
} = vscode.config();

class FixtureCompletionProvider {
  provideCompletionItems(document, position, token, context) {
    const start = vscode.Position(position.line, 0);
    const range = vscode.Range(start, position);
    const text = document.getText(range);
    const featureFile = document.languageId === 'feature';
    // break if fixture autocomplete is not needed
    if (
      !fixtureAutocompletionCommands.some(command => {
        const commandPattern = `.${command}`;
        return (
          text.includes(commandPattern) &&
          // verify that cursor position is after command that require autocomplete
          // but before next chainer
          text
            .substring(text.indexOf(commandPattern), position.character)
            .split('.').length === 2 // [empty string before `.` or `cy`, command string]
        );
      }) &&
      // When configuration for cucumber fixture autocomplete on quotes disabled:
      !(cucumberFixtureAutocompleteOnQuotes && featureFile)
    ) {
      return undefined;
    }

    // in case of triggering autocomplete for subfolders - detect last folder from already used
    const firstAutocompletion =
      context.triggerCharacter === '(' || context.triggerCharacter === '"';
    const baseFolder = firstAutocompletion
      ? 'fixtures'
      : `fixtures/**/${_.last(text.slice(0, -1).split(/"|'|`/))}`;
    if (!baseFolder) {
      return undefined;
    }

    // get fs path for fixtures
    const fixtures =
      readFilesFromDir(`${vscode.root()}/**/${baseFolder}`, {
        extension: '',
        name: ''
      }) || [];

    if (fixtures) {
      // find files and folders that are right inside of base folder
      const files = fixtures
        .map(fixture => {
          const folders = fixture.split('/');
          const baseFolderIndex = folders.indexOf(
            _.last(baseFolder.split('/'))
          );
          return baseFolderIndex === -1 ? null : folders[baseFolderIndex + 1];
        })
        .filter(_.identity);

      // prepare completion items list
      const fixtureResults = _.uniq(files).reduce((completions, file) => {
        /**
         * FILE: 16
         * FOLDER: 18
         */
        const type = file.includes('.') ? 16 : 18;
        const insertText = type === 16 ? file.replace('.json', '') : file;
        completions.push({
          label: file,
          kind: type,
          insertText:
            firstAutocompletion && !featureFile ? `"${insertText}"` : insertText
        });
        return completions;
      }, []);
      return {
        items: fixtureResults
      };
    }
  }
}

module.exports = FixtureCompletionProvider;
