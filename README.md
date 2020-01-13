# Solid-shell (Sol)

a command-line tool, batch processor, and interactive shell for managing Solid data
<br>
<a href="http://badge.fury.io/js/solid-shell">![npm](https://badge.fury.io/js/solid-shell.svg)</a>

Solid-shell (hereafter called Sol) is a nodejs tool for accessing Solid files and folders that may be run as an interactive shell, as a batch processor, and on the command line.  It provides a front-end for [Solid-File-Client](https://github.com/jeff-zucker/solid-file-client) and supports moving and copying files on remote pods, on local file systems, and between the two.  There are multiple levels of versbosity including full logging of all events and errors.  The batch processor supports testing file contents and other features making it suitable for automatic testing.

## Installation

To install from npm

  npm install solid-shell  // npm install -g solid-shell for global install
  change into the solid-shell folder
  npm install

If you use npm to install you have these options:

   * install locally and use "npx sol" to run from the local install
   * install globally (-g) and you should then be able  use just "sol"

If you clone or download

   * change to the sol directory and then npm install (first time only)
   * then run with "./sol"

## Command-line usage

For one-off commands, you can run sol commands directly. For example this
recursively uploads a folder to a Solid POD.

   sol cp ./someLocalPath/ /someRemotePath/

Enter sol -h to see a full list of commands available from the command line.

## Interactive shell usage

You may also use sol as an interactive shell.  Enter the shell like so:

    sol shell

Once in the shell, enter "help" to see a list of commands available in the shell.

## Logging in

You will need to tell Sol your login credentials through one of three methods:

* **configuration file**:  You may create a configuration file named ~/.solid-auth-cli-config.json.  It should contain a JSON object holding your Identity Provider, username, a base directory as explained below.  It may optionally include your password.
```javascript
  const credentials = {
         "idp" : "https://solid.community",
    "username" : "jeffz.",
    "password" : "...",
        "base" : "https://solid.community/public"
  }
```
* **environment variables**:  You may prefer to store your data in environment variables SOLID_IDP, SOLID_USERNAME, SOLID_PASSWORD, SOLID_BASE.

* **let Sol prompt you**: If one or more of the settings is not found in the config file or in the environment variables, Sol will prompt you for the missing settings on startup.

## Specifying a base folder

When you specify a base folder, it will be prepended to all remote file names
that don't start with "https".  In other words, if you set the base to 
"https://me.example.com/public" then a request "ls /foo.ttl"
will read https://me.example.com/public/foo.ttl.

## Working with URLs

All methods in Solid-shell can use files or folders from local
or remote locations.  You must specify these options in the URL.

* Folder URLs always end with a slash.
```
   https://me.example.com/foo/   a folder
   https://me.example.com/foo    a file
```
* Absolute URLs start with https:// or file://
```
   https://me.exmaple.com/foo/bar.ttl   a remote file
   file:///home/me/foo/bar.ttl          a local file
```
* Relative URLs start with ./ or /
```
   ./foo/bar.ttl  a local file relative to your current working folder
   /foo/bar.ttl   a remote file relative to your specified base folder
```
## Methods
```
  cr  <URL> <content>       create a file or folder
  cp  <URLa> <URLb>         copy a file or recursively copy a folder
  cps <URLa> <URLb>         recursively copy a folder, merge preference to source
  cpt <URLa> <URLb>         recursively copy a folder, merge preference to target
  mv  <URLa> <URLb>         move a file or recursively move a folder
  rm  <URL>                 delete a file or recursively delete a folder
  ls  <URL>                 list file or folder contents
  run <URL>                 run a batch file of Sol commands
  head <URL>                show headers for the item
  v | verbosity <level>    set verbosity level
  t | test <type> <args>   run a test
  h | help                 show this help
  q | quit                 quit
```
## Verbosity and Testing
You may set the versbosity level as follows:
```
    0 : only show test results
    1 : show test results and error messages
    2 : show test results, error messages, step-by-step commands
    3 : show test results, full error response, step-by-step commands
```
There are two kinds of test:
```
    test files <folderURL> <expectedFilenames>
    test content <fileURL> <expectedContent>
```
The expected results may contain whitespace but not newlines.  See below for an example in batch processing.

## Batch Processing
You may put a series of Sol commands in a file and then run them as a batch either from the command-line or from the interactive shell.

From the command line:
```
  sol run ./myBatchFile
```
Within the batch file, semi-colons may be used as comments, blank lines are ignrored.  Here's an example batch file:
```
    ; set verbosity and clean test area
    ; create a local folder, create a file in it, 
    ; test that the folder and file have the correct contents;
    ; delete the file and folder

    verbosity 0
    rm ./test-folder/
    cr ./test-folder/
    cr ./test-folder/test-file.txt This is a text file.
    test files ./test-folder/ test-file.txt
    test content ./test-folder/test-file.txt This is a text file.
    rm ./test-folder/

    ; expected output :
    ;   ok files for test-folder
    ;   ok content for test-file.txt

```

&copy; 2019, Jeff Zucker, may be freely distribute under an MIT license.

