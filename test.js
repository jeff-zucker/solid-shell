const fetch = require('node-fetch');
const fn = '/home/jeff/solid/test/rdflib-simple.ttl';

async function test(){
  await fetch(fn);
}
test();
