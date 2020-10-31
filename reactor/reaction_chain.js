/**
 * 
 * @param {Discord<Message>} message The original message object provided as the <command>.execute parameter
 * @param {(message, results) => {}} resultsProcessingFunction Takes original message and results from reaction chain and handles results
 * @param  {...Reactor} reactors Individual steps in the react-loop process to gather data for an extended command
 * 
 * New Reactors MUST 
 * - have an execute method that takes (message, chain results)
 * - call the next method in the chain using `chain.shift()(message, chain, results)`
 * 
 * They SHOULD
 * - add at least (and typically) one key-value pair to `results`
 * 
 * They CAN
 * - accept a default value
 */
function process(message, resultsProcessingFunction, ...reactors) {
    methodChain = []
    for (var i = 0; i < reactors.length; i++) {
        const reactor = reactors[i]
        
        methodChain.push(
            (message, chain, results) => {
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