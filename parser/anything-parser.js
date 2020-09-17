// Parses anything!
module.exports = class AnythingParser {
    type() {
        return "anything";
    }
    
    parse(arg) {
        return arg;
    }
}