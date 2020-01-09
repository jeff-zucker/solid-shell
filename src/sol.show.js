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
            log(`----------------------------------------------------------------------------
   sol - interactive shell for Solid - version 1.0.0
----------------------------------------------------------------------------
  cr  <URL> <content>    create a file or folder
  cp  <URLa> <URLb>      copy a file or recursively copy a folder
  cps <URLa> <URLb>      recursively copy a folder, merge preference to source
  cpt <URLa> <URLb>      recursively copy a folder, merge preference to target
  mv  <URLa> <URLb>      move a file or recursively move a folder
  rm  <URL>              delete a file or recursively delete a folder
  ls  <URL>              list file or folder contents
  run <URL>              run a batch file of Sol commands
  head <URL>             show headers for an item
  v | verbosity <level>  set verbosity level
  t | test <type> <args> run a test
  h | help               show this help
  q | quit               quit

  URL starts with  https://   absolute remote address
                   file://    absolute local address
                   app://     absolute in-memory address
                   /          remote address relative to specified base
                  ./          local address relative to current working folder

  URL ends with    /          folder (e.g. /foo/ is a folder )
                   no /       file (e.g. /foo is a file )`
      ,verbosity)
      break
    }
}
function log(msg,verbosity) {
    if(verbosity>0){
        console.log(msg)
    }
}
