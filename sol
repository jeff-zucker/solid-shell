#!/usr/bin/env node
const program = require('commander');          // the command-line interface
const sol     = require('./src/sol.run.js');   // the commands
const shell   = require('./src/sol.shell.js'); // the interactive interface
/*
 *  This file is the command-line interface
*/
program
    .name('sol')
    .description('Command line and interactive shell tool for Solid')
    .version("0.1.0")
;  
program
    .command('shell')
    .alias('sh')
    .description('run as an interactive shell')
    .action( () => {
        shell.sh()
    });
program
    .command('read <URL>')
    .alias('ls')
    .description('list contents of a file or folder')
    .action( (URL) => {
        sol.runSol("read",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('delete <URL...>')
    .alias('rm')
    .description('delete file or recursively delete folder')
    .action( URL => {
        sol.runSol("delete",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('copy <oldURL> <newURL>')
    .alias('cp')
    .description('copy a file or recursively copy a folder')
    .action( (oldURL,newURL) => {
        sol.runSol("copy",[oldURL,newURL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('move <oldURL> <newURL>')
    .alias('mv')
    .description('move a file or recursively move a folder')
    .action( (oldURL,newURL) => {
        sol.runSol("mv",[oldURL,newURL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('run <scriptFile>')
    .description('batch run commands in a script file')
    .action( (scriptFile) => {
        sol.runSol("run",[scriptFile]).then(()=>{
        },err=>console.log(err) )
    },err=>console.log(err))

if(process.argv.length<3){
    process.argv.push("-h");
}
sol.runSol("login").then( ()=> { 
    program.parse(process.argv);
},err=>console.log(err));


