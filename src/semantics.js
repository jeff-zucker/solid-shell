const u = require("./utils.js");

async function load(source){
  console.log(source)
  try {
    await fetcher.load(source);
    return `ok load <${u.unMunge(source)}>`;
  }
  catch(err) {
    if(err.status==404) return `${u.unMunge(source)} - not found`;
    return `Could not load ${u.unMunge(source)} - ${err.status}`;
  }
}
module.exports = {load}
