# packageMe

#### Usage
```sh
node app.js <command> <project_path> [<output>]
```

Where <command> is one of : analize, save 
<project_path> is: path to node js project. 
<output> is: optional, output filename, dafault value is <project_path>/packageMe.json

#### Steps:
> run command: 
```sh
node app.js analize <project_path>
```
> edit the created file <project_path>/packageMe.json, set "include" to "true|dev"
    true: will be added in <project_path>/package.json dependencies
    dev: will be added in <project_path>/package.json devDependencies
> run command to apply change in <project_path>/package.json: 
```sh
node app.js save <project_path> 
```
packageMe.json example:
```javascript
{
  "localUnreferenceModules": [
    {
      "name": "async",
      "version": "0.9.0",
      "include": false // <- set this to: true or dev
    }],
  "globalUnreferenceModules": [
    {
      "name": "bower",
      "version": "1.4.0",
      "include": false // <- set this to: true or dev
    }]
}
```
