class ReactionChain {
    process(...reactors) {
        methodChain = []
        for (var i = 0; i < reactors.length; i++) {
            methodChain.push(
                (message, chain, results) => reactors[i].execute(message, chain, results)
            )
        }
    }
}

module.exports = ReactionChain