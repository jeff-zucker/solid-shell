const $rdf = global.$rdf = require("rdflib");
const semantics = require("./semantics.js");
const {mungeURL,unMunge,isFolder,do_err,log,getContentType}=require('./utils.js')
const fs = require("fs");
const path = require("path");
const pr = require('./prefixes.js');
const {SolidFileClient}=require("solid-file-client")
const {SolidNodeClient} = require('solid-node-client');
const client = new SolidNodeClient({parser:$rdf});
const fc = new SolidFileClient(client)
const show = require("./sol.show.js");
const shell = require('./sol.shell.js');
const contentTypeLookup = require('mime-types').contentType;
var verbosity = 2
let credentials;
const LINK = {
  CONTAINER: '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
  RESOURCE: '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
}
const kb = $rdf.graph();
const fetcher = $rdf.fetcher(kb,{fetch:client.fetch.bind(client)});
let source = "https://example.com/";
let rbase = credentials ? credentials.base : process.env.SOLID_REMOTE_BASE;
process.env.SOLID_REMOTE_BASE = rbase;
let statusOnly = false;

module.exports.runSol = runSol;
async function runSol(com,args) {
  let fn,target,expected,opts,turtle,q,content,type;
  return new Promise(async (resolve,reject)=>{  switch(com){
        case "load" :
          source = mungeURL(args[0]);
          log( await semantics.load(source) );
          resolve();
          break          
        case "putback" :
        case "putBack" :
          source = mungeURL(args[0]);
          try {
            fetcher.putBack(source).then(()=>{
              log(`ok putback <${source}>.`);
              resolve();
            });
          }
          catch(err) {
            log(`Could not putback ${source} - ${err.status}`);
          }
          break;

        case "add" :
          if(args[0].startsWith("[")) { 
             source = args.shift()
             source = source.replace(/^\[/,'').replace(/\]$/,'');
             source = mungeURL( source );
          }
          turtle = "@prefix : <#> .\n" + args.join(' ');
          try {
            $rdf.parse(turtle, kb, source, "text/turtle");
            resolve();
          }
          catch(err) {
            log(`Could not load Turtle  - ${err}\n\n${turtle}`);
            resolve();
          }
          break;

        case "match" :
/*
          if(args[0].startsWith("[")) { 
             source = args.shift()
             source = source.replace(/^\[/,'').replace(/\]$/,'');
             source = mungeURL( source );
          }
*/
          q = pr.parseQuery($rdf,args,source);
          let matches = "";
          try {
            for(var m of kb.match(q[0],q[1],q[2])){
         	let s1 = pr.removePrefix(m.subject.value);
		let p1 = pr.removePrefix(m.predicate.value);
                p1 = p1.match(/type/) ?"a" :p1;
		let o1 = pr.removePrefix(m.object.value)
		matches += s1 + " " + p1 + " " + o1 + ".\n"
            }
            log(matches);
            resolve(matches);
          }
          catch(err) {
            log(`ERROR - ${err}`);
            resolve();
          }
          break;

        case "remove" :
          if(args[0] && args[0].startsWith("[")) { 
             source = args.shift()
             source = source.replace(/^\[/,'').replace(/\]$/,'');
             source = mungeURL( source );
          }
          q = pr.parseQuery($rdf,args,source)
          try {
            for(var m of kb.match(q[0],q[1],q[2])){
		kb.remove(m);
            }
            resolve();
          }
          catch(err) {
            log(`Could not remove: ${err}`);
            resolve();
          }
          break;

        case "replace" :
          if(args[0].startsWith("[")) { 
             source = args.shift()
             source = source.replace(/^\[/,'').replace(/\]$/,'');
             source = mungeURL( source );
          }
          let [s1,p1,o1,s2,p2,o2] = args;
          q = pr.parseQuery($rdf,["?",p1,o1],source)
          try {
            for(var m of kb.match(q[0],q[1],q[2])){
		kb.remove(m);
                q = pr.parseQuery($rdf,["?",p2,o2],source)
                kb.add( m.subject, q[1], q[2] );
            }
            resolve();
          }
          catch(err) {
            log(`Could not replace: ${err}`);
            resolve();
          }
          break;

        case "query" :
         try {
/*
[
  '?o': NamedNode { termType: 'NamedNode', classOrder: 5, value: ':#P' },
  '?p': NamedNode {
    termType: 'NamedNode',
    classOrder: 5,
    value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
  },
  '?s': NamedNode { termType: 'NamedNode', classOrder: 5, value: ':#K' }
]
*/
           sparql = 'PREFIX : <#>\n' + args.join(' ');
           const preparedQuery = $rdf.SPARQLToQuery( sparql, false, kb );
           let wanted = preparedQuery.vars;
           let results = [];
console.log(sparql);
           kb.query(preparedQuery, (stmts)=>{
console.log("got ",stmts.length);
             for(var s of stmts){
                results.push([s.subject.value,s.predicate.value,s.object.value])
             }
             console.log(results);
             resolve(results)
           })
         }
         catch(err) {
           log(`Could not run SPARQL  - ${err}\n\n${sparql}`);
           resolve();
         }
         break;

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

function showStatus( response, msg ){
  if(verbosity > 0) log( response.status + " " + msg );
//  log( response.status + " " + response.statusText + ", " + msg );
}

// REST METHODS
        case "get" :
            source = mungeURL(args[0]);
            if(!source) resolve();
            type = source.endsWith("/") ?"Container" :"Resource"
            if(statusOnly){
              fc.fetch(source).then( (response) => {
                showStatus(response,`GET ${type}`);
                resolve()
              },(response)=>{
                showStatus(response,`GET ${type} ${unMunge(source)}`);
                resolve()
              })
            }
            else if( source.endsWith("/") ){
//                log("\nfetching from folder "+source)
                fc.readFolder(source).then( folderObject => {
                    show("folder",folderObject,verbosity);
                    resolve()
                },err=>{
                  showStatus(err,"get "+source);
                  resolve()
                })
            }
            else {
                log("\nfetching from file "+source);
                fc.readFile(source).then( fileBody =>{
                    show("file",fileBody,verbosity);
                    resolve()
                },err=>{
                  showStatus(err,"get "+source);
                  resolve()
                })
            }
            break;

        case "head" :
            source = mungeURL(args.shift());
            if(!source) resolve();
            type = source.endsWith("/") ?"Container" :"Resource"
            if(statusOnly){
              fc.head(source).then( response => {
                showStatus(response,"HEAD "+type);
                resolve()
              },err=>{
                showStatus(err,"head "+source);
                resolve()
              })
            }
            else {
              log("\nfetching head from "+source);
              fc.readHead(source).then( headers => {
                    log(headers)
                    resolve()
              },err=>{ 
                 showStatus(err,"head "+source);
                 resolve() 
              })
            }
            break;

        case "options" :
            source = mungeURL(args.shift());
            if(!source) resolve();
            type = source.endsWith("/") ?"Container" :"Resource"
            if(statusOnly){
              fc.options(source).then( response => {
                showStatus(response,"OPTIONS "+type);
                resolve()
              },err=>{
                showStatus(err,"OPTIONS "+source);
                resolve()
              })
            }
            else {
              fc.options(source).then( options => {
                    log(options)
                    resolve()
              },err=>{ 
                 showStatus(err,"OPTIONS "+source);
                 resolve() 
              })
            }
            break;

        case "put" :
            source = mungeURL(args.shift())
            if(!source) resolve();
            content = args.join(" ") || ""
            type = source.endsWith("/") ?"Container" :"Resource"
            if(statusOnly){
              let cType = getContentType(source);
              fc.put(source,{body:content,headers:{"content-type":cType}}).then( response => {
                showStatus(response,`PUT ${type}`);
                resolve()
              },response=>{
                showStatus(response,`PUT ${type} <${unMunge(source)}>`);
                resolve()
              })
              break;
            }
            if( source.endsWith("/") ){
              fc.createFolder(source).then( (r) => {
                showStatus(r,"put "+source)
                resolve()
              },err=>{ 
                showStatus(err,"put "+source)
                resolve() 
              })
            }
            else {
              let cType = getContentType(source);
              fc.createFile(source,content,cType).then( (r) => {
        showStatus({status:"ok",statusText:"ok"},"put <"+unMunge(source)+">");
//                showStatus(r,"put "+source)
                resolve()
              },err=>{ 
                showStatus(err,"put "+source)
                resolve() 
              })
            }
            break;

        case "post" :
            source = mungeURL(args.shift())
            if(!source) resolve();
            content = args.join(" ") || ""
            type = source.endsWith("/") ?"Container" :"Resource"
            if(statusOnly){
              let cType = getContentType(source);
              let link = source.endsWith("/") ?LINK.CONTAINER :LINK.RESOURCE
              fc.postItem(source,content,cType,link).then( (response) => {
                showStatus(response,`POST ${type}`);
                resolve()
              },response=>{
                showStatus(response,`POST ${type}`);
                resolve()
              })
              break;
            }
            if( source.endsWith("/") ){
               fc.postItem(source,content,cType,LINK.CONTAINER).then( (response) => {
                  showStatus(response,"post "+source);
                  resolve();
               },err=>{ 
                 showStatus(response,"post "+source);
                 resolve();
               });
            }
            else {
               let cType = getContentType(source);
               fc.postItem(source,content,cType,LINK.RESOURCE).then( () => {
                 log(`ok put <${unMunge(source)}>`)
                 resolve()
               },err=>{ do_err(err); resolve() })
            }
            break;

        case "patch" :
            source = mungeURL(args.shift())
            if(!source) resolve();
            content = args.join(" ") || ""
            let cType = getContentType(source);
            fc.patch(source, {
              body: content,
              method: 'PATCH',
              headers: {
                "Content-type" : "application/sparql-update",
              }
            }).then( (response) => {
              showStatus(response,`PATCH Resource`);
              resolve()
            },response=>{
              showStatus(response,`PATCH Resource`);
              resolve()
            })
            break;

        case "rm" :
        case "delete" :
            source = mungeURL(args[0]);
            if(!source) resolve();
            type = source.endsWith("/") ?"Container" :"Resource"
            if( source.endsWith("/") ){
                fc.delete(source).then( (response) => {
        showStatus({status:"ok",statusText:"ok"},"delete <"+unMunge(source)+">");
//                    showStatus(response,`DELETE ${type}`);
                    resolve()
                },response=>{ 
        showStatus({status:"ok",statusText:"ok"},"delete <"+unMunge(source)+">");
//                    showStatus(response,`DELETE ${type}`);
                    resolve()
                })
            }
            else {
                fc.deleteFile(source).then( (response) => {
        showStatus({status:"ok",statusText:"ok"},"delete <"+unMunge(source)+">");
//                    showStatus(response,`DELETE ${type}`);
                    resolve();
                },response=>{ 
        showStatus({status:"ok",statusText:"ok"},"delete <"+unMunge(source)+">");
//                    showStatus(response,`DELETE ${type}`);
                    resolve()
                })
            }
            break;

        case "recursiveDelete" :
            source = mungeURL(args[0]);
            if(!source) resolve();
            if( source.endsWith("/") ){
              let r = await fc.head(source);
              if(r.status==404){
                console.log("  ok recursiveDelete - already empty <",unMunge(source)+">");
                resolve();
              }
              else {
                try {
                  response = await fc.deleteFolderRecursively(source);
                  if(verbosity>0)
                    showStatus({status:"ok",statusText:"ok"},"recursiveDelete "+source);
                }
                catch(e){console.log(e)}
                resolve()
              }
            }
            else {
                fc.deleteFile(source).then( (response) => {
                    showStatus(response,"delete "+source);
                    resolve();
                },err=>{
                  if(err.status !=404) showStatus(err,"delete "+source);
                  resolve()
                })
            }
            break;

        case "emptyFolder" :
            source = mungeURL(args[0]);
            if(!source) resolve();
            if( source.endsWith("/") ){
                fc.deleteFolderContents(source).then( (response) => {
                  if(verbosity>0)
                    showStatus({status:"",statusText:"ok"},"emptyFolder "+source);
                  resolve()
                },err=>{ 
                    if(err.status !=404) showStatus(err,"emptyFolder "+source);
                    resolve()
                })
            }
            break;

        case "cp"   :
        case "copy" :
            let opts = {}
            if(com==="cps") opts.merge="source"
            if(com==="cpt") opts.merge="target"
            source = mungeURL(args[0]);
            target = mungeURL(args[1]);
            if(!source) resolve();
            if(!target) resolve();
            fc.copy(source,target,opts).then( () => {
                log(`ok copy <${unMunge(source)}> to <${unMunge(target)}>`);
                resolve();
            },err=>{ do_err(err); resolve() })
            break;

        case "zip" :
            source = mungeURL(args[0]);
            target = mungeURL(args[1]);
            if(!source) resolve();
            if(!target) resolve();
            fc.createZipArchive(source,target,{links:"exclude"}).then( () => {
                log(`ok zip to <${unMunge(target)}>`);
                resolve();
            },err=>{ do_err(err); resolve() })
            break;

        case "unzip" :
            source = mungeURL(args[0]);
            target = mungeURL(args[1]);
            if(!source) resolve();
            if(!target) resolve();
            fc.extractZipArchive(source,target).then( () => {
                log(`ok unzip to <${unMunge(target)}>`);
                resolve();
            },err=>{ do_err(err); resolve() })
            break;

        case "mv"   :
        case "move" :
            source = mungeURL(args[0]);
            target = mungeURL(args[1]);
            if(!source) resolve();
            if(!target) resolve();
            fc.move(source,target).then( () => {
                log(`ok move <${unMunge(source)}> to <${unMunge(target)}>`)
                resolve();
            },err=>{ do_err(err); resolve() })
            break;

        case "run" :
            source = mungeURL(args[0]);
            if(!source) resolve();
              try {
                content = await fc.readFile(source)
              }catch(err){ do_err(err); resolve() }
              let statements = content.split("\n")
              for(stmt of statements) {
                  stmt = stmt.trim();
                  if(stmt.match(/^#\s*END/)) break  // stop on END
                  if(stmt.length===0) continue       // ignore blank line
                  if(stmt.startsWith("#")) continue  // ignore comment
                  if(stmt.startsWith("!")){          // echo ! lines
                    console.log( stmt.replace(/^\!\s*/,'') );
                    continue;
                  }
                  let args=stmt.split(/\s+/)
                  let c = args.shift()
                  await runSol(c,args)
              }
              resolve()
            break;
 
        case "statusOnly" :
            statusOnly = args.shift().trim() === "true" ?true :false;
            resolve();
            break;

        case "base" :
            source = mungeURL(args.shift());
            source = source.replace(/\/$/,'');
            credentials = credentials || {};
            credentials.base= rbase= process.env.SOLID_REMOTE_BASE= source;
            if(verbosity>0)
              log("Remote Base set to "+credentials.base);
            resolve(credentials.base);
            break;

        case "exists" :
        case "notExists" :
            source = mungeURL(args[0])

            fc.head(source).then( r => {
              if(r.status==404){
                if(com==="exists") log(`FAIL exists <${unMunge(source)}>`)
                if(com==="notExists") log(`ok notExists <${unMunge(source)}>`)
              }
              else {
                if(com==="exists") log(`ok exists <${unMunge(source)}>`)
                if(com==="notExists") log(`FAIL notExists <${unMunge(source)}>`)
              }
              resolve()
            },err=>{
              log(`${err.status } head <${source}>`)
              resolve()
            })
/*
            fc.itemExists(source).then( (exists) => {
                log((exists ?"ok exists" :"FAIL  exists")+" <"+unMunge(source)+">");
                resolve(exists);
            },err=>{ 
                resolve(false) })
*/
            break;
/*
        case "notExists" :
            source = mungeURL(args.shift())
            fc.itemExists(source).then( (exists) => {
                let notExists = exists ? false : true;
                log( (notExists ?"ok notExists" :"FAIL notExists")+" <"+unMunge(source)+">");
                resolve(notExists);
            },err=>{ 
              log(true)
              resolve(true) 
            })
            break;
*/
        case "matchText" :
            source = mungeURL(args.shift())
            expected = args.join(' ');
            if(!source) {
              log("No source file specified!");
              resolve();
            }
            if(isFolder(source)){
              log("Can't use contentsMatch with a folder!");
              resolve();
            }           
//            log(`Reading <${source}> ...`);
            fc.readFile(source).then( (got) => {
              const orgSource = source;
              source = path.basename(source)
              let results = got.indexOf(expected)>-1;
              if(results){
                log(`ok contentsMatch <${unMunge(orgSource)}>`)
              }
              else {
                log(`FAIL contentsMatch <${unMunge(orgSource)}, got: ${got}`)
              }
              resolve(results);
            },err=>{
              log("ERROR : Could not read "+source);
              resolve() 
            })
            break;

        default :
            if(com) log("can't parse last command")
            resolve();
    }});
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
  const e = process.env
  let creds = {};
  if( e.SOLID_IDP && e.SOLID_USERNAME && e.SOLID_PASSWORD && e.SOLID_REMOTE_BASE) {
    return {
      idp:process.env.SOLID_IDP,
      username:process.env.SOLID_USERNAME,
      password:process.env.SOLID_PASSWORD,
      base:process.env.SOLID_REMOTE_BASE,
    }
  }
  else if( e.SOLID_CLIENT_ID && e.SOLID_CLIENT_SECRET 
           && e.SOLID_REFRESH_TOKEN && e.SOLID_OIDC_ISSUER
  ) {
    return {
      oidcIssuer:e.SOLID_OIDC_ISSUER,
      refreshToken:e.SOLID_REFRESH_TOKEN,
      clientId:e.SOLID_CLIENT_ID,
      clientSecret:e.SOLID_CLIENT_SECRET,
      base:process.env.SOLID_REMOTE_BASE,
    }
  }
  let idp =  await shell.prompt("idp? ");
  let username =  await shell.prompt("username? ");
  let password = await shell.prompt("password? ","mute");
  let base = await shell.prompt("remote base? ");
  return { idp, username, password, base }
}
/**
 * login()
 */
async function login(){
  log("logging in ...")
  try {
    credentials = await getCredentials()
    let session = await client.login(credentials)
    if(session.isLoggedIn) {
      log(`logged in as <${session.webId}>`)
      return session
    }
    else {
      log(`Could not log in
    to  <${credentials.idp}>
    as "${credentials.username}" 
    using a password that is ${credentials.password.length} characters long.
      `)
    }
  }catch(e){console.log('LOGIN ERROR : ',e)}
}
console.error = (msg) => {
     if(!msg.match(/fetchQueue/))  console.log(msg)
}
/*
Verbosity
  0 completely silent
  1 report brief error messages
  2 report brief error messages and steps
  3 report full error messages and steps
*/
