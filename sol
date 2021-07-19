#!/usr/bin/env node
const program = require('commander');
const sol     = require('./src/sol.run.js');   // the commands
const shell   = require('./src/sol.shell.js'); // the prompts
/*
 *  This file is the command-line interface
*/

//zipcopy, unzip

async function main() {
    if(process.argv.length<3){
        process.argv.push("shell");
    }
    else if( !process.argv[2].match(/(shell|run|help)/) ){
        await sol.runSol("login")
    }
    program.parse(process.argv);
}

program
    .name('sol')
    .description('Command line, batch, and interactive shell tool for Solid')
    .version("2.0.0")
;  
program
    .command('shell')
//    .alias('sh')
    .description('run as an interactive shell')
    .action( () => {
        console.clear();
        sol.runSol("help").then(()=>{
          shell.sh()
        },err=>console.log(err));
    });
program
    .command('put <URL> <CONTENT...>')
    .description('create a file or folder')
    .action( (URL,CONTENT) => {
        CONTENT = CONTENT.join(" ");
        sol.runSol("put",[URL,CONTENT]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('head <URL>')
    .description('show headers for a file or folder')
    .action( (URL) => {
        sol.runSol("head",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('get <URL>')
//    .alias('ls')
    .description('show contents of a file or folder')
    .action( (URL) => {
        sol.runSol("get",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('copy <oldURL> <newURL>')
//    .alias('cp')
    .description('copy a file or recursively copy a folder')
    .action( (oldURL,newURL) => {
        sol.runSol("copy",[oldURL,newURL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('move <oldURL> <newURL>')
//    .alias('mv')
    .description('move a file or recursively move a folder')
    .action( (oldURL,newURL) => {
        sol.runSol("mv",[oldURL,newURL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('delete <URL...>')
//    .alias('rm')
    .description('delete file or recursively delete folder')
    .action( URL => {
        sol.runSol("delete",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('run <scriptFile>')
    .description('batch run commands in a script file')
    .action( (scriptFile) => {
        sol.runSol("run",[scriptFile]).then(()=>{
        },err=>console.log(err) )
    },err=>console.log(err));

main();


