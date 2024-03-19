const contentTypeLookup = require('mime-types').contentType;

let lbase = process.platform==="win32" ? `file:///${process.cwd().replace(/\\/g,'/')}` : "file://" + process.cwd();


async function packVers(pname){

 try {
    // Get the path to the package.json file of the package
    const packageJsonPath = require.resolve(`${pname}/package.json`);
    
    // Load the package.json file
    let packageJson = require(packageJsonPath);
    
    // Extract the version of the package
    const packageVersion = packageJson.version;
    if(pname=='../')pname='solid-shell';    
    return([pname,packageVersion]);
  } catch (error) {
//    console.error(`Failed to determine the version of ${pname}: ${error.message}`);
  }
}

async function shellVersion(){
  return (await packVers('../'))[1];
}
async function packageVersions(packages){
  let str = "";
  for(let p of packages){
    p  = await packVers(p);
    str += `${p[0]}:${p[1]}, `;
  }
  console.log( "  "+str.replace(/, $/,'') );
}

function unMunge(url) {
    if(!url) return
    let rbase = process.env.SOLID_REMOTE_BASE;
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
    let rbase = process.env.SOLID_REMOTE_BASE;
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
function do_err(err,verbosity){
   verbosity ||=4;
   console.log(`Error: ${(err.status||"unknown")} ${(err.statusText||"")}`)
   if(verbosity>3) console.log(err);
}
function log(msg) {
//    if(verbosity==2 || verbosity==3){
      console.log("  "+msg)
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
    return cType===extension ?null :cType;
  }
}

module.exports = {
  mungeURL, unMunge, isFolder, do_err, log, getContentType, packageVersions, shellVersion
}
