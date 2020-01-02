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
  ls URL        list contents of a file or folder
  rm URL        delete file or recursively delete folder
  cp URLa URLb  copy file or recrusively copy folder 
  mv URLa URLb  move file or recrusively move folder 
  h             show this help screen
  q             quit Solid-Shell

  URL starts with 
    https://   absolute remote address
    file://    absolute local address
    app://     absolute in-memory address
    /          remote address relative to pod root
    ./         local address relative to current working folder

  URL ends with
    /          folder (e.g. /foo/ is a folder )
    no /       file (e.g. /foo is a file )

  * for more help, see https://github.com/jeff-zucker/solid-shell`
      ,verbosity)
      break
    }
}
function log(msg,verbosity) {
    if(verbosity>0){
        console.log(msg)
    }
}
