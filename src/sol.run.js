const $rdf = require("rdflib");
const semantics = require("./semantics.js");
const {mungeURL,unMunge,isFolder,do_err,log,getContentType}=require('./utils.js')
const fs = require("fs");
const path = require("path");
const pr = require('./prefixes.js');
const FC=require("../../solid-file-client/")
const {SolidNodeClient} = require('solid-node-client');
const client = new SolidNodeClient({parser:$rdf});
const fc = new FC(client)
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

module.exports.runSol = runSol;
async function runSol(com,args) {
  let fn,target,expected,opts,turtle,q,content;
  return new Promise(async (resolve,reject)=>{  switch(com){
        case "load" :
          source = mungeURL(args[0]);
          log( await semantics.load(source) );
          resolve();
          break          
/*
        case "load" :
          source = mungeURL(args[0]);
          try {
            fetcher.load(source).then(()=>{
              log(`ok load <${unMunge(source)}>`);
              resolve();
            });
          }
          catch(err) {
            log(`Could not load ${source} - ${err.status}`);
          }
          break;
*/
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

        case "get" :
            source = mungeURL(args);
            if(!source) resolve();
            if( source.endsWith("/") ){
                log("\nfetching from folder "+source)
                fc.readFolder(source).then( folderObject => {
                    show("folder",folderObject,verbosity);
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            else {
                log("\nfetching from file "+source);
                fc.readFile(source).then( fileBody =>{
                    show("file",fileBody,verbosity);
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            break;

        case "head" :
            source = mungeURL(args);
            if(!source) resolve();
            log("\nfetching head from "+source);
                fc.readHead(source).then( headers => {
                    log(headers)
                    resolve()
                },err=>{ do_err(err); resolve() })
            break;

        case "put" :
            source = mungeURL(args.shift())
            if(!source) resolve();
            content = args.join(" ") || ""
            if( source.endsWith("/") ){
                fc.createFolder(source).then( () => {
                    log(`ok put <${unMunge(source)}>`)
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            else {
               let cType = getContentType(source);
               fc.createFile(source,content,cType).then( () => {
                    log(`ok put <${unMunge(source)}>`)
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            break;

        case "post" :
            source = mungeURL(args.shift())
            if(!source) resolve();
            content = args.join(" ") || ""
            if( source.endsWith("/") ){
               fc.postItem(source,content,cType,LINK.CONTAINER).then( () => {
                    log(`ok post <${unMunge(source)}>`)
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            else {
               let cType = getContentType(source);
               fc.postItem(source,content,cType,LINK.RESOURCE).then( () => {
                    log(`ok put <${unMunge(source)}>`)
                    resolve()
                },err=>{ do_err(err); resolve() })
            }
            break;

        case "rm" :
        case "delete" :
            source = mungeURL(args[0]);
            if(!source) resolve();
            if( source.endsWith("/") ){
                fc.deleteFolderRecursively(source).then( () => {
                    log(`ok delete <${unMunge(source)}>`)
                    resolve()
                },err=>{ if(err.status !=404) do_err(err); resolve() })
            }
            else {
                fc.deleteFile(source).then( () => {
                    log(`ok delete <${unMunge(source)}>`)
                    resolve();
                },err=>{ if(err.status !=404) do_err(err); resolve() })
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
                log(`ok zip <${unMunge(source)}> to <${unMunge(target)}>`);
                resolve();
            },err=>{ do_err(err); resolve() })
            break;

        case "unzip" :
            source = mungeURL(args[0]);
            target = mungeURL(args[1]);
            if(!source) resolve();
            if(!target) resolve();
            fc.extractZipArchive(source,target).then( () => {
                log(`ok unzip <${unMunge(source)}> to <${unMunge(target)}>`);
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
            fc.readFile(source).then( async (content) => {
              let statements = content.split("\n")
              for(stmt of statements) {
                  stmt = stmt.trim();
                  if(stmt.match(/^#\s*END/)) break  // stop on END
                  if(stmt.length===0) continue       // ignore blank line
                  if(stmt.startsWith("#")) continue  // ignore comment
                  let args=stmt.split(/\s+/)
                  let c = args.shift()
                  await runSol(c,args)
              }
              resolve()
            },err=>{ do_err(err); resolve() })
            break;
 
        case "base" :
            source = mungeURL(args.shift());
            credentials = credentials || {};
            credentials.base = rbase = source;
            log("Remote Base set to "+credentials.base);
            resolve(credentials.base);
            break;

        case "exists" :
            source = mungeURL(args[0])
            fc.itemExists(source).then( (exists) => {
                log((exists ?"ok exists" :"FAIL  exists")+" <"+unMunge(source)+">");
                resolve(exists);
            },err=>{ 
                resolve(false) })
            break;

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
              source = path.basename(source)
              let results = got.indexOf(expected)>-1;
              if(results){
                log(`ok contentsMatch <${unMunge(source)}>`)
              }
              else {
                log(`FAIL contentsMatch <${unMunge(source)}, got: ${got}`)
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
    credentials = await getCredentials()
    let session = await client.login(credentials)
    log(`logged in as <${session.webId}>`)
    return session
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
