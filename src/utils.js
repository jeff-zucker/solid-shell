const contentTypeLookup = require('mime-types').contentType;
const lbase = "file://" + process.cwd();
let rbase = process.env.SOLID_REMOTE_BASE;

function unMunge(url) {
    if(!url) return
    const lregex =  new RegExp("\^"+lbase);
    const rregex =  new RegExp("\^"+rbase);
    url = url.replace( lregex, "." ).replace( rregex, "" );
    return url
}
/**
 * mungeURL()
 *
 * adds the base pod location to remote relative URLs (start with /)
 * adds the current working folder to local relative URLs (start with ./)
 *
 *
 */
function mungeURL(url) {
    if(!url) return
    if( url.match(/^https:\/[^/]/) ){
         url = url.replace(/^https:\//,"https://")
    }
    if( url.match(/^\//) && rbase ){
        return rbase + url;
    }
    else if( url.match(/^\.\//) ){
        return  lbase + url.replace(/\./,'');
    }
    else if( !url.match(/^(http|file|app)/) ){
        console.log(url);
        console.log("URL must start with https:// or file:// or / or ./")
        return false
    }
    return url
}
function isFolder(thing){
  return thing.endsWith('/');
}
function do_err(err){
//  if(verbosity>0){
     console.log(`Error: ${(err.status||"unknown")} ${(err.statusText||"")}`)
//  }
}
function log(msg) {
//    if(verbosity==2 || verbosity==3){
      console.log(msg)
//    }
}
function getContentType(path) {
  if ( path.endsWith('/') 
    || path.endsWith('.meta') 
    || path.endsWith('.acl') 
    || path.endsWith('.ttl') 
  ){
    return 'text/turtle';
  }
  else {
    let extension = path.replace(/.*\./,'');
    let cType = contentTypeLookup(extension);
    return cType===extension ?'text/turtle':cType;
  }
}

module.exports = {
  mungeURL, unMunge, isFolder, do_err, log, getContentType
}
