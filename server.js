
const express = require('express');
const server = express();
server.all('/', (req, res)=>{
    res.send('hi')
})
function keepAlive(){
    server.listen(1111, ()=>{console.log("Server is Ready!")});
}
module.exports = keepAlive;