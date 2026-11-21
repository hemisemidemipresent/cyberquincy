/** {operator: how tightly it binds; higher binds tighter} */
type OperatorTable = Record<string, { precedence: number }>;

/** Converts infix tokens to postfix (shunting-yard), distributing the discount operator `'` onto operands */
class LexicalParser {
    table: OperatorTable;

    constructor(table: OperatorTable) {
        this.table = table;
    }

    private isOperator(token: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.table, token);
    }

    parse(input: string[]): string[] {
        const output: string[] = [];
        const stack: string[] = [];

        for (const token of input) {
            if (token === '(') {
                stack.unshift(token);
            } else if (token === ')') {
                let stackToken: string;
                while (stack.length) {
                    stackToken = stack.shift();
                    if (stackToken === '(') break;
                    else output.push(stackToken);
                }

                if (stackToken !== '(') {
                    throw new LexicalParseError('Mismatched parentheses.');
                }
            } else if (token === "'") {
                // discount operator gets distributed FIRST and stuck on the operands
                let numOperands = 0;
                let numOperators = 0;

                // Navigate to the start of the most recent parenthetical statement,
                // distributing the discount operator to all operands along the way.
                // I figured empirically/logically that the start is reached when the # of
                // operands reaches 1 + the # of operators when counting backwards
                for (let idx = output.length - 1; idx >= 0; idx--) {
                    const outputToken = output[idx];
                    if (this.isOperator(outputToken)) {
                        numOperators += 1;
                    } else {
                        numOperands += 1;
                        output[idx] = outputToken + "'";
                        if (numOperands > numOperators) break;
                    }
                }
            } else if (this.isOperator(token)) {
                while (stack.length) {
                    const punctuator = stack[0];

                    if (punctuator === '(') break;

                    const precedence = this.table[token].precedence;
                    const antecedence = this.table[punctuator].precedence;

                    if (precedence > antecedence) break;
                    else output.push(stack.shift());
                }

                stack.unshift(token);
            } else output.push(token);
        }

        while (stack.length) {
            const token = stack.shift();
            if (token !== '(') output.push(token);
            else throw new LexicalParseError('Mismatched parentheses.');
        }

        return output;
    }
}

class LexicalParseError extends Error {}

export { LexicalParser, LexicalParseError };
export type { OperatorTable };
