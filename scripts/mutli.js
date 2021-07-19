const str = `
### create, modify, and query an in-memory data store

add 
  :Jun a :Person. 
  :Alejandro a :Person.
  :Keisha a :Person.
  :Spot a :Dog; :has :fleas.


remove
  :Jun ? ?.

replace
  ? :has :fleas.
  ? :has :paws.

match
  ? a :Person.

match
  :Spot ? ?.
`;

async function parseScript( source ){
  let content = await fc.readFile(source);
  const stmts = str.split(/\n\n/);  // records end with 2 newlines
  let commands=[];
  for(let stmt of stmts){
    stmt = stmt.trim();              // ignore white space on ends of recod
    if(stmt.length===0) continue;      // ignore blank lines between records
    if(stmt.startsWith('#')) continue; // ignore comments
    let args = stmt.split(/\n/);
    let com = (args.shift()).trim();
    for( let i in args ){
      args[i]=args[i].trim();
    }
    commands.push({com,args});
  }
  return commands;
}



