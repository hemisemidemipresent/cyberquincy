// https://gist.github.com/aaditmshah/6683499
function LexicalParser(table) {
    this.table = table;
}

LexicalParser.prototype.parse = function (input) {
    var length = input.length,
        table = this.table,
        output = [],
        stack = [],
        index = 0;

    while (index < length) {
        var token = input[index++];

        switch (token) {
        case "(":
            stack.unshift(token);
            break;
        case ")":
            while (stack.length) {
                var token = stack.shift();
                if (token === "(") break;
                else output.push(token);
            }

            if (token !== "(")
                throw new Error("Mismatched parentheses.");
            break;
        case "'": // discount operator gets distributed FIRST and stuck on the operands
            let numOperands = 0,
                numOperators = 0;

            // Navigate to the start of the most recent parenthetical statement,
            // distributing the discount operator to all operands along the way.
            // I figured empirically/logically that the start is reached when the # of
            // operands reaches 1 + the # of operators when counting backwards
            let idx
            for (idx = output.length - 1; idx >= 0; idx--) {
                let outputToken = output[idx]
                if (table.hasOwnProperty(outputToken)) {
                    numOperators += 1
                } else {
                    numOperands += 1
                    output[idx] = outputToken + "'"
                    if (numOperands > numOperators) break
                }
            }
            break;
        default:
            if (table.hasOwnProperty(token)) { // is an operator
                while (stack.length) {
                    var punctuator = stack[0];

                    if (punctuator === "(") break;

                    var precedence = table[token].precedence,
                        antecedence = table[punctuator].precedence;

                    if (precedence > antecedence) break;
                    else output.push(stack.shift());
                }

                stack.unshift(token);
            } else output.push(token);
        }
    }

    while (stack.length) {
        var token = stack.shift();
        if (token !== "(") output.push(token);
        else throw new Error("Mismatched parentheses.");
    }

    return output;
};

module.exports = LexicalParser