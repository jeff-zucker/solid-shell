const fs = require("fs");
const path = require("path");
const FC=require("solid-file-client")
const auth = require('solid-auth-cli');
const fc = new FC(auth)
const show = require("./sol.show.js");
const shell = require('./sol.shell.js');
var verbosity = 1
let credentials;

module.exports.runSol = runSol;
async function runSol(com,args) {
  let fn,source,target,expected,opts;
  return new Promise((resolve,reject)=>{  switch(com){

        case "help" :
        case "h" :
            show("help","",verbosity);
            resolve();
            break;

        case "verbosity" :
        case "v" :
            let v = args[0]
            if(typeof(v)!="undefined" && v<4) {
              verbosity = v
            }
            else {
              do_err( "Bad verbosity level" )
            }
            resolve()
            break

        case "login" :
            login().then( session => {
                resolve();
            }, err => reject("error logging in : "+err) );
            break;

        case "ls" :
        case "read" :
            source = mungeURL(args[0]);
            if(!source) resolve();
            if( source.endsWith("/") ){
                log("\n*** fetching from folder "+source)
                fc.readFolder(source,{links:"include"}).then( folderObject => {
                    show("folder",folderObject,verbosity);
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            else {
                log("\n*** fetching from file "+source);
                fc.readFile(source).then( fileBody =>{
                    show("file",fileBody,verbosity);
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            break;

        case "cr" :
        case "create" :
            source = mungeURL(args.shift())
            if(!source) resolve();
            let content = args.join(" ") || ""
            let cType   = "text/turtle"
            if(!source) resolve();
            if( source.endsWith("/") ){
                log("\n*** creating folder "+source)
                fc.createFolder(source).then( () => {
                    log("folder created")
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            else {
               log("\n*** creating file "+source)
                fc.createFile(source,content,cType).then( () => {
                    log("file created")
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            break;

        case "rm" :
        case "delete" :
            source = mungeURL(args[0]);
            if(!source) resolve();
            if( source.endsWith("/") ){
                log("\n*** deleting folder "+source)
                fc.deleteFolder(source).then( () => {
                    log("folder deleted")
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            else {
                log("\n*** deleting file "+source)
                fc.deleteFile(source).then( () => {
                    log("file deleted\n");
                    resolve();
                },err=>{ do_err(err); resolve() })
            }
            break;

        case "cp"   :
        case "copy" :
        case "cps" :
        case "cpt" :
            let opts = {}
            if(com==="cps") opts.merge="source"
            if(com==="cpt") opts.merge="target"
            source = mungeURL(args[0]);
            target = mungeURL(args[1]);
            if(!source) resolve();
            if(!target) resolve();
            log("\n*** copying "+source+" to "+target);
            fc.copy(source,target,opts).then( () => {
                log("copied");
                resolve();
            },err=>{ do_err(err); resolve() })
            break;

        case "mv"   :
        case "move" :
            source = mungeURL(args[0]);
            target = mungeURL(args[1]);
            if(!source) resolve();
            if(!target) resolve();
            log("\n*** moving "+source+" to "+target);
            fc.move(source,target).then( () => {
                log("moved");
                resolve();
            },err=>{ do_err(err); resolve() })
            break;

        case "run" :
            source = mungeURL(args[0]);
            if(!source) resolve();
            fc.readFile(source).then( async (content) => {
              let statements = content.split("\n")
              for(stmt of statements) {
                  if(stmt.length===0) continue       // ignore blank line
                  if(stmt.startsWith(";")) continue  // ignore comment
                  if(stmt.startsWith("END")) break  // stop on END
                  let args=stmt.split(/\s+/)
                  let c = args.shift()
                  await runSol(c,args)
              }
              resolve()
            },err=>{ do_err(err); resolve() })
            break;

        case "t" :
        case "test" :
            let testType = args.shift() || ""
            if(testType==="content"){
                source = mungeURL(args.shift())
                if(!source) resolve();
                expected = args.join(" ")
                if(!source) resolve();
                fc.readFile(source).then( (got) => {
                    source = path.basename(source)
                    if(got===expected){
                        console.log(`ok content for ${source}`)
                    }
                    else {
                        console.log(`fail content for ${source}, got : ${got}`)
                    }
                    resolve();
                },err=>{ log(err); resolve() })
            }
            else if(testType==="files"){
                source = mungeURL(args.shift())
                if(!source) resolve();
                expected = args.join(" ")
                if(!source) resolve();
                fc.readFolder(source).then( (got) => {
                    let files=[]
                    for(g of got.files ){
                      files.push( g.name)
                    }
                    files = files.join(' ')
                    source = path.basename(source)
                    if(files===expected){
                        console.log(`ok files for ${source}`)
                    }
                    else {
                        console.log(`fail files for ${source}, got : ${files} expected ${expected}`)
                    }
                    resolve();
                },err=>{ log(err); resolve() })
            }
            break;

        default :
            if(com) log("can't parse last command")
            resolve();
    }});
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
    if( url.match(/^\//) && credentials && credentials.base ){
        return credentials.base + url;
    }
    else if( url.match(/^\.\//) ){
        return  "file://" + process.cwd() + url.replace(/\./,'')
    }
    else if( !url.match(/^(http|file|app)/) ){
        console.log("URL must start with https:// or file:// or / or ./")
        return false
    }
    return url
}
/**
 * getCredentials()
 *
 * check for ~/.solid-auth-cli-config.json
 * if not found, check environment variables
 * prompt for things not found in either place
 * see solid-auth-cli for details
 */
async function getCredentials(){
    let creds = await auth.getCredentials();
    creds.idp = creds.idp || await shell.prompt("idp? ")
    creds.username = creds.username || await shell.prompt("username? ")
    creds.base = creds.base || await shell.prompt("base folder? ")
    creds.password = creds.password || await shell.prompt("password? ","mute")
    return creds
}
/**
 * login()
 */
async function login(){
    log("logging in ...")
    credentials = await getCredentials()
    let session = await auth.login(credentials)
    log(`logged in as <${session.webId}>`)
    return session
}
function do_err(err){
    if(verbosity==1||verbosity==2){
       console.log(`Error: ${(err.status||"unknown")} ${(err.statusText||"")}`)
    }
    if(verbosity==3){
        console.log(err)
    }
}
function log(msg) {
    if(verbosity==2 || verbosity==3){
        console.log(msg)
    }
}
/*
Verbosity
  0 completely silent
  1 report brief error messages
  2 report brief error messages and steps
  3 report full error messages and steps
*/
