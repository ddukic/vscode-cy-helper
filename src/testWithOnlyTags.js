const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const {
    FOCUS_TAG,
    FOCUS_TAG_FORMATTED,
    ONLY_BLOCK,
    message,
    TEST_BLOCK,
    TEST_ONLY_BLOCK,
    TEST_SKIP_BLOCK,
    SKIP_BLOCK
} = require('./helper/constants');

const setTag = (kind, scenarioIndex, isCucumber) => {
    const editor = vscode.activeTextEditor();

    !scenarioIndex && vscode.show('err', message.NO_TEST);

    if (isCucumber) {
        // for gherkin set tag @focus on previous line to execute one test
        const { text: previousLineText } = editor.document.lineAt(
            scenarioIndex - 1
        );
        if (!previousLineText.includes(FOCUS_TAG)) {
            vscode.editDocument(
                vscode.Position(scenarioIndex - 1, 0),
                FOCUS_TAG
            );
        }
    } else {
        // for javascript mocha syntax it.only() is required
        const { text, range } = editor.document.lineAt(scenarioIndex);

        const indexOfTest = text.indexOf(TEST_BLOCK);
        const indexOfOnly = text.indexOf(TEST_ONLY_BLOCK);
        const indexOfSkip = text.indexOf(TEST_SKIP_BLOCK);

        !indexOfTest &&
            !indexOfOnly &&
            !indexOfSkip &&
            vscode.show('err', message.NO_TEST);

        const newText = text.replace(
            TEST_BLOCK,
            `it${kind === 'skip' ? SKIP_BLOCK : ONLY_BLOCK}(`
        );
        vscode.editDocument(range, newText);
    }
};

const clearTag = (scenarioIndex, isCucumber) => {
    const editor = vscode.activeTextEditor();
    const { text, range } = editor.document.lineAt(
        isCucumber ? scenarioIndex - 1 : scenarioIndex
    );

    const newText = text
        .replace(FOCUS_TAG, '')
        .replace(FOCUS_TAG_FORMATTED, '')
        .replace(ONLY_BLOCK, '')
        .replace(SKIP_BLOCK, '');
    newText.trim() === ''
        ? vscode.editDocument(
              vscode.Range(vscode.Position(range.start.line, 0), range.end),
              ''
          )
        : vscode.editDocument(range, newText);
};

module.exports = {
    setTag,
    clearTag
};
