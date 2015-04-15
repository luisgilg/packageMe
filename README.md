Usage: node app.js <command> <project_path> [<output>]
Where <command> is one of : analize, save
<project_path> is: path to node js project for example
<output> is: optional, output filename, dafault value is <project_path>/packageMe.json

Steps:
1) run command: node app.js analize <project_path>
2) edit created file <project_path>/packageMe.json, set "include" to "true|dev"
    true: will be added in <project_path>/package.json dependencies
    dev: will be added in <project_path>/package.json devDependencies
3) run command: node app.js save <project_path> to apply change in <project_path>/package.json

packageMe.json example:
{
  "localUnreferenceModules": [
    {
      "name": "async",
      "version": "0.9.0",
      "include": false //<- set this to: true or dev
    }],
  "globalUnreferenceModules": [
    {
      "name": "bower",
      "version": "1.4.0",
      "include": false //<- set this to: true or dev
    }]
}