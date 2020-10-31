function process(message, resultsProcessingFunction, ...reactors) {
    methodChain = []
    for (var i = 0; i < reactors.length; i++) {
        const reactor = reactors[i]
        
        methodChain.push(
            (message, chain, results) => {
                console.log(reactor)
                reactor.execute(message, chain, results)
            }
        )
    }
    methodChain.push(
        (message, chain, results) => resultsProcessingFunction(message, results)
    )

    methodChain.shift()(message, methodChain, {})
}

module.exports = {process}