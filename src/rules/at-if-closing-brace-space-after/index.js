import { namespace } from "../../utils";
import { utils } from "stylelint";

export const ruleName = namespace("at-if-closing-brace-space-after");

export const messages = utils.ruleMessages(ruleName, {
  expected: 'Expected single space after "}" of @if statement',
  rejected: 'Unexpected space after "}" of @if statement'
});

export default function(expectation, _, context) {
  return (root, result) => {
    const validOptions = utils.validateOptions(result, ruleName, {
      actual: expectation,
      possible: ["always-intermediate", "never-intermediate"]
    });

    if (!validOptions) {
      return;
    }

    sassConditionalBraceSpaceAfterChecker({
      root,
      result,
      ruleName,
      atRuleName: "if",
      expectation,
      messages,
      context
    });
  };
}

/**
 * The core logic for this rule. Can be imported by other rules with similar
 * logic, namely at-else-closing-brace-space-after
 *
 * @param {Object} args -- Named arguments object
 * @param {PostCSS root} args.root
 * @param {PostCSS result} args.result
 * @param {String ruleName} args.ruleName - needed for `report` function
 * @param {String} args.atRuleName - the name of the at-rule to be checked, e.g. "if", "else"
 * @param {Object} args.messages - returned by stylelint.utils.ruleMessages
 * @return {undefined}
 */
export function sassConditionalBraceSpaceAfterChecker({
  root,
  result,
  ruleName,
  atRuleName,
  expectation,
  messages,
  context
}) {
  function complain(node, message, index, fixValue) {
    if (context.fix) {
      node.next().raws.before = fixValue;

      return;
    }

    utils.report({
      result,
      ruleName,
      node,
      message,
      index
    });
  }

  root.walkAtRules(atrule => {
    // Do nothing if it's not an @if
    if (atrule.name !== atRuleName) {
      return;
    }

    const nextNode = atrule.next();
    const hasSpaceAfter = nextNode && nextNode.raws.before === " ";
    const hasWhiteSpaceAfter = nextNode && nextNode.raws.before !== "";
    const reportIndex = atrule.toString().length;

    // When followed by an @else
    if (nextNode && nextNode.type === "atrule" && nextNode.name === "else") {
      // A single space is needed
      if (expectation === "always-intermediate" && !hasSpaceAfter) {
        complain(atrule, messages.expected, reportIndex, " ");
      } else if (expectation === "never-intermediate" && hasWhiteSpaceAfter) {
        // No whitespace is needed
        complain(atrule, messages.rejected, reportIndex, "");
      }
    }
  });
}
