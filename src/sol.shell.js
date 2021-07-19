const sol = require('./sol.run.js');
const readlineSync = require('readline-sync');

module.exports.sh = sh;
module.exports.prompt = prompt;

function prompt(question,mute) {
  return new Promise(function(resolve, reject) {
    if(mute) resolve( readlineSync.question(question,{hideEchoBack: true}))
        else resolve( readlineSync.question( question ) )
    });
}

function sh(){
  prompt("\n> ").then( data => {
    let args = data.split(/\s+/)
    let com = args.shift()
    if( com.match(/^(q|quit|exit)$/) ) process.exit();
    sol.runSol( com, args ).then(()=>{sh()},err=>{
      console.log(err);
      sh(); // recurse
    });
  });
}

