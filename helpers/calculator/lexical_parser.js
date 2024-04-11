class LexicalParser {
    constructor(table) {
        this.table = table;
    }
    
    parse(input) {
        const output = [];
        const stack = [];
        let index;

        for (index = 0; index < input.length; index++) {
            let token = input[index];

            if (token === '(') {
                stack.unshift(token);
            } else if (token === ')') {
                let stackToken;
                while (stack.length) {
                    stackToken = stack.shift();
                    if (stackToken === "(") break;
                    else output.push(stackToken);
                }

                if (stackToken !== "(") {
                    throw new LexicalParseError("Mismatched parentheses.");
                }
            } else if (token === "'") { // discount operator gets distributed FIRST and stuck on the operands
                let numOperands = 0;
                let numOperators = 0;
                let idx;

                // Navigate to the start of the most recent parenthetical statement,
                // distributing the discount operator to all operands along the way.
                // I figured empirically/logically that the start is reached when the # of
                // operands reaches 1 + the # of operators when counting backwards
                for (idx = output.length - 1; idx >= 0; idx--) {
                    let outputToken = output[idx];
                    if (Object.prototype.hasOwnProperty.call(this.table, outputToken)) {
                        numOperators += 1;
                    } else {
                        numOperands += 1;
                        output[idx] = outputToken + "'";
                        if (numOperands > numOperators) break;
                    }
                }
            } else {
                if (Object.prototype.hasOwnProperty.call(this.table, token)) { // is an operator
                    while (stack.length) {
                        let punctuator = stack[0];

                        if (punctuator === "(") break;

                        let precedence = this.table[token].precedence;
                        let antecedence = this.table[punctuator].precedence;

                        if (precedence > antecedence) break;
                        else output.push(stack.shift());
                    }

                    stack.unshift(token);
                } else output.push(token);
            }
        }

        while (stack.length) {
            let token = stack.shift();
            if (token !== "(") output.push(token);
            else throw new LexicalParseError("Mismatched parentheses.");
        }

        return output;
    }
}

class LexicalParseError extends Error {}

module.exports = {
    LexicalParser,
    LexicalParseError,
};