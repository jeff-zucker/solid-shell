# Solid-shell (Sol)

**a command-line and interactive shell for managing Solid PODs**

## Installation

If you use npm to install you have these options:

   * install locally and use "npx sol" to run from the local install
   * intall globally (-g) and you should then be able  use just "sol"

If you clone or download

   * change to the sol directory and run with "./sol"

## Command-line usage

For one-off commands, you can run sol commands directly. For example this
uploads two files and the contents of a folder to a Solid POD.

   sol upload /someRemotePath file1 file2 folder/*

Enter sol -h to see a full list of commands available from the command line.

## Interactive shell usage

You may also use sol as an interactive shell.  Enter the shell like so:

    sol shell

Once in the shell, enter "help" to see a list of commands available in the shell.

## Configuration file

You will need to create a configuration file named ~/.solid-auth-cli-config.json.  It should contain a JSON object holding your Identity Provider, username, aa base directory as explained below.  It may optionally include your password.  If you choose not to store your password in the file, sol will prompt you for a password.

```javascript
  {
         idp : "...",
    username : "...",
    password : "...", // optional
        base : ""
  }
```

## Specifying a base folder

When you specify a base folder, it will be prepended to all remote file names
that don't start with "https".  In other words, if you set the base to 
"https://me.example.com/public" then a request "readfile foo.ttl"
will read https://me.example.com/public/foo.ttl.

&copy; 2019, Jeff Zucker, may be freely distribute under an MIT license.

