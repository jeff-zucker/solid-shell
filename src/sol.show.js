const path = require("path")

module.exports = function(type,thing,verbosity){
    switch(type) {
        case "file" :
            log(thing,verbosity)
            break
        case "folder" : 
            /*
            * TBD : full folder listing with size, stat, perms 
            */
            let fo = ( thing.folders.length>0 ) ? "Folders: " : ""
            let fi = ( thing.files.length>0 ) ? "Files: " : ""
            for(var o in thing.folders ){ 
                fo = fo + thing.folders[o].name + " " 
            }
            let folderLinks = thing.links
            if( folderLinks ) {
                if( folderLinks.meta )
                    fi = fi + path.basename(folderLinks.meta) + " " 
                if( folderLinks.acl )
                    fi = fi + path.basename(folderLinks.acl) + " " 
            }
            for(var i in thing.files ){ 
                fi = fi + thing.files[i].name + " " 
                let fileLinks = thing.files[i].links || {}
                if( fileLinks.meta ){
                   fi = fi + path.basename(fileLinks.meta) + " " 
                }
                if( fileLinks.acl ){
                    fi = fi + path.basename(fileLinks.acl) + " " 
                }
            }
            log(fo+"\n"+fi,verbosity)
            break;

        case "help" : 
            log(`------------------------------------------------------------------------------
Solid Shell - a command line, batch processor, & interactive shell for Solid
------------------------------------------------------------------------------
       Document Management  put, get, head, copy, move, delete, zip, unzip
  Testing/Batch Processing  run, exists, notExists, matchText
              Connectivity  login, base
         Interactive Shell  help, quit
------------------------------------------------------------------------------`
      ,verbosity)
      break
    }
}
function log(msg,verbosity) {
    if(verbosity>0){
        console.log(msg)
    }
}

/*
       Document Management  put, get, head, copy, move, delete, zip, unzip
       Semantic Management  load, putBack, add, remove, match
  Testing/Batch Processing  run, exists, notExists, matchText, verbosity
              Connectivity  login, base
         Interactive Shell  help, quit

  put         <URL> <content>  create a file or folder with Write permission
  post        <URL> <content>  create a file or folder with Append permission
  get         <URL>            read a file or folder
  head        <URL>            show headers for an item
  copy        <URLa> <URLb>    copy a file or recursively copy a folder
  move        <URLa> <URLb>    move a file or recursively move a folder
  delete      <URL>            delete a file or recursively delete a folder
  run         <URL>            run a batch file of sol commands
  load        <URL>            loads a file into an in-memory store
  putBack     <URL>            writes an in-memory store to a file
  add         <turtleString>   adds a triple to the in-memory store
  remove      <turtleString>   removes a triple from the in-memory store
  login                        login to a Solid server (see README for details)
  base        <URL>            set the remote base (will be prepended to /)
  verbosity   <level>          set verbosity level
  help                         show this help
  quit                         quit
  matchTriple <turtleString>   true if triple is found in the in-memory store
  exists      <URL>            true if URL exists & is readable by current user
  notExists   <URL>            true if URL does not exist or is not readable
  matchText   <URL> <text>     true if contents of URL match supplied text`

  https://*  absolute address in a Solid server
         /*  addresss in a Solid server relative to a user-defined base
   file://*  absolute address in a local serverless file system
        ./*  addresss in a local file system relative to current directory`

  URL starts with  https://   absolute remote address
                   file://    absolute local address
                   /          remote address relative to specified base
                  ./          local address relative to current working folder

  URL ends with    /          folder (e.g. /foo/ is a folder )
                   no /       file (e.g. /foo is a file )`
*/
