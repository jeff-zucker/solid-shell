#!/usr/bin/env node
const program = require('commander');
const sol     = require('./src/sol.run.js');   // the commands
const shell   = require('./src/sol.shell.js'); // the prompts
/*
 *  This file is the command-line interface
*/

async function main() {
  program.parse(process.argv);
}
program.option('-l,--login',"login");

program
    .command('put <URL> [CONTENT...]')
    .description('create a file or folder')
    .action( async (URL,CONTENT) => {
        if( program.opts().login ) await sol.runSol("login")
        CONTENT = CONTENT.join(" ");
        sol.runSol("put",[URL,CONTENT]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('post <URL> [CONTENT...]')
    .description('create a file or folder')
    .action( async (URL,CONTENT) => {
        if( program.opts().login ) await sol.runSol("login")
        CONTENT = CONTENT.join(" ");
        sol.runSol("post",[URL,CONTENT]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('head <URL>')
    .description('show headers for a file or folder')
    .action( async (URL) => {
        if( program.opts().login ) await sol.runSol("login")
        sol.runSol("head",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('get <URL>')
    .description('show contents of a file or folder')
    .action( async (URL) => {
        if( program.opts().login ) await sol.runSol("login")
        sol.runSol("get",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('copy <oldURL> <newURL>')
    .description('copy a file or recursively copy a folder')
    .action( async (oldURL,newURL) => {
        if( program.opts().login ) await sol.runSol("login")
        sol.runSol("copy",[oldURL,newURL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('move <oldURL> <newURL>')
    .description('move a file or recursively move a folder')
    .action( async (oldURL,newURL) => {
        if( program.opts().login ) await sol.runSol("login")
        sol.runSol("mv",[oldURL,newURL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('delete <URL>')
    .description('delete file or recursively delete folder')
    .action( async (URL) => {
        if( program.opts().login ) await sol.runSol("login")
        sol.runSol("delete",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('zip <folderURL> <zipFileURL>')
    .description('create a zip archive')
    .action( async (folderURL,zipFileURL) => {
        if( program.opts().login ) await sol.runSol("login")
        sol.runSol("zip",[folderURL,zipFileURL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('unzip <zipFileURL> <folderURL>')
    .description('extract a zip archive')
    .action( async (zipFileURL,folderURL) => {
        if( program.opts().login ) await sol.runSol("login")
        sol.runSol("unzip",[zipFileURL,folderURL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('run <scriptFile>')
    .description('batch run commands in a script file')
    .action( async (scriptFile) => {
        if( program.opts().login ) await sol.runSol("login")
        sol.runSol("run",[scriptFile]).then(()=>{
        },err=>console.log(err) )
    },err=>console.log(err));
program
    .command('shell')
    .description('run as an interactive shell')
    .action( async () => {
        console.clear();
        if( program.opts().login ) await sol.runSol("login")
        sol.runSol("help").then(()=>{
          shell.sh()
        },err=>console.log(err));
    });

main();


