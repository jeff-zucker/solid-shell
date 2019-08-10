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
    .alias('r')
    .description('read a remote file')
    .action( (URL) => {
        sol.runSol("read",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('readFolder <URL>')
    .alias('rf')
    .description("list a remote folder's contents")
    .action( (URL) => {
        sol.runSol("readFolder",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('createFolder <URL...>')
    .alias('cf')
    .description('create one or more remote folders')
    .action( URL => {
        sol.runSol("createFolder",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('delete <URL...>')
    .alias('rm')
    .description('delete remote file(s_ or empty folder(s)')
    .action( URL => {
        sol.runSol("delete",[URL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('upload <target> <files...>')
    .alias("up")
    .description('upload file(s) to a Solid server')
    .action( (target,files) => {
        sol.runSol("upload",[target,files]).then( ()=>{
       },err=>console.log(err));
     },err=>console.log(err));
program
    .command('download <target> <URL>')
    .alias("dn")
    .description('download a remote file')
    .action( (target,URL) => {
        sol.runSol("download",[target,URL]).then( ()=>{
        },err=>console.log(err));
    });
program
    .command('copy <oldURL> <newURL>')
    .alias('cp')
    .description('copy a remote file to a remote location')
    .action( (oldURL,newURL) => {
        sol.runSol("copy",[oldURL,newURL]).then(()=>{
        },err=>console.log(err));
    });
program
    .command('copyFolder <oldURL> <newURL>')
    .alias('cpf')
    .description('deep copy a remote folder to a remote loc.')
    .action( (oldURL,newURL) => {
        sol.runSol("copyFolder",[oldURL,newURL]).then(()=>{
        },err=>console.log(err));
    });
/* TBD
program
    .command('batch <scriptFile>')
    .description('batch run commands in a script file')
    .action( (scriptFile) => {
        sol.runSol("batch",[scriptFile]).then(()=>{
        },err=>console.log(err) )
    },err=>console.log(err))
*/
if(process.argv.length<3){
    process.argv.push("-h");
}
sol.runSol("login").then( ()=> { 
    program.parse(process.argv);
},err=>console.log(err));


