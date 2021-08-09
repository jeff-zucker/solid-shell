# Solid-shell (Sol)

a command-line tool, batch processor, and interactive shell for managing Solid data
<br>
<a href="http://badge.fury.io/js/solid-shell">![npm](https://badge.fury.io/js/solid-shell.svg)</a>

Solid-shell (hereafter called Sol) is a nodejs tool for accessing Solid data that may be run as an interactive shell, as a batch processor, and on the command line.  It provides a front-end for [Solid-File-Client](https://github.com/jeff-zucker/solid-file-client) and supports moving and copying files on remote pods, on local file systems, and between the two.

Here's an overview of methods :

         Document Management  put, get, head, copy, move, delete, zip, unzip
    Testing/Batch Processing  run, exists, notExists, matchText
                Connectivity  login, base
           Interactive Shell  shell, help, quit

## NOTE : This App is in transition!**  Everything in the documentation should work, but I may be changing the API slightly in the coming weeks.  I'll remove this note when finalized and post changes here at the top:

* There are now two methods to delete : simple **delete**  (for a file or an empty folder) and **recursiveDelete** for an entire folder tree.
* Added methods for patch and options
* Added statusOnly to show e.g. 200 on a "get" rater than the full body

## Installation

You can either install via npm or clone the github repo

To install with npm
```
  * npm install -g
  * you should now be able to use "sol" to run solid-shell
```
To install via the github repo
   * On this page (https://github.com/jeff-zucker/solid-shell) press the code button in the upper right, copy the url presented
   * in your local console: git clone COPIED_URL
   * that should creaste a folder named solid-shell
   * in that folder use "./sol" to run solid-shell

## Command-line usage

For one-off commands, you can run sol commands directly. For example this
recursively uploads a folder to a Solid POD.
```
   sol copy ./someLocalPath/ /someRemotePath/
```
Enter sol -h to see a full list of commands available from the command line.

## Interactive shell usage

You may also use sol as an interactive shell.  Enter the shell like so:

    sol shell

Once in the shell, enter "help" to see a list of commands available in the shell or "quit" to exit the interactive shell.

## Logging in

You can read and write local resources and read public pod-based resources without logging in.  To access private pod data, you will need to specify your login credentials and login.  Sol looks for the credentials first in environment variables, and if not found, prompts you for them. 

If using an NSS based server such as solidcommunity.net or inrupt.net, you may use either a username/password login or a token login.  If you are using other servers, you will need to use a token login.  See [Solid-Node-Client README](https://github.com/jeff-zucker/solid-node-client) for details.  With either type of credentials, 

These are the environment variables Sol looks for:
```
Either
  SOLID_USERNAME
  SOLID_PASSWORD
  SOLID_IDP
  SOLID_REMOTE_BASE
Or
  SOLID_REFRESH_TOKEN
  SOLID_CLIENT_ID
  SOLID_CLIENT_SECRET
  SOLID_OIDC_ISSUER
  SOLID_REMOTE_BASE
```
Once your environment variables are set, you may login using the -l or --login flags on the command line
```
  sol -l head /foo/private.txt
  sol --login head /foo/private.txt
```
You may also call login directly in a script or in the interactive shell.

## Specifying a base folder

When you specify a base folder, it will be prepended to any URLs starting with /.  In other words, if you set the base to "https://me.example.com/public" then a request "get /foo.ttl" will read https://me.example.com/public/foo.ttl.  

You can set the Base in the environment variables shown above, or by using the *base* method in interactive or script mode.

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

### **put &lt;URL> &lt;content>**

Create a file or folder with Write permission. If the parent path does not exist, it will be created. E.g. if you don't have a /foo folder, "put /foo/bar.txt" will create /foo and /foo/bar.txt.  For files, a put will over-write any existing file of the same name.  For folders, if the folder pre-exists, put will keep the existing folder rather than overwrite it or create a new one.

For files, the URL should contain an extension that clearly labels the content-type e.g. .ttl for turtle, .txt for text, etc.

Content may be omitted to create a blank file.

Use of put requires Write permissions on the resource - if you have Append, but not Write permissions, use post instead.

### **post &lt;URL> &lt;content>**

Ceate a file or folder with Append permission. Post works exactly the same as put with these exceptions : 

* It can be used with only Append permissions, it does not need full Write permission.
* If the file or folder already exists, another version with a random prefix on the file name will be created, nothing will ever be overwritten
     
### **get &lt;URL>**

Read a file or folder and display its contents. Requires Read permission.

### **head &lt;URL>**

Show headers for a file or folder. Requires Read permission.

### **copy &lt;URLa> &lt;URLb>**

Copy a file or recursively copy a folder. Needs Read permission on the *from*p location and Write permission on the *to* location.  Completely overwrites the *to* location if it exists.

### **move &lt;URLa> &lt;URLb>**

Move a file or recursively move a folder. Needs Write permission on both the *to* and *from* locations .  Completely overwrites the *to* location if it exists.

### **delete &lt;URL>**

Delete a file or recursively delete a folder. Needs Write permission on the resource.

### **zip &lt;URL> &lt;zipFile>**

Create a zip archive.  Needs Read permission on the URL and write permission on the zipFile location.

### **unzip &lt;zipFile> &lt;URL>** 

Extracts a zip archive.  Needs Read permission on the zipFile location and Write permission on the extraction location.

## Testing

You may test the existence of a resource with **exists** or **notExists** and the contents of a resource with **matchText**. See below for an example.

## Batch Processing
You may put a series of Sol commands in a file and then run them as a batch either from the command-line or from the interactive shell.

From the command line:
```
  sol run ./myBatchFile
```
Within the batch file, commands should be separated by newlines; a line starting with *#* and will be treated as a comment; blank lines will be ignrored.  Here's an example batch file:
Here's an example of simple script which can be executed with "sol run ./script-name":
```
put ./test-folder/test.txt "hello world"
exists ./test-folder/test.txt
matchText  ./test-folder/test.txt "hello world"
delete ./test-folder/
notExists ./test-folder/
# END
Expected output :
  ok put <./test-folder/test.txt>
  ok exists <./test-folder/test.txt>
  ok contentsMatch <test.txt>
  ok delete <./test-folder/>
  ok notExists <./test-folder/>
```
See the [scripts folder](./scripts) for more script examples.

&copy; 2019,2021 Jeff Zucker, may be freely distributed under an MIT license.

