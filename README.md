# packageMe

#### Usage
```sh
node app.js <command> <project_path> [<output>]
```

Where &lt;command&gt; is one of : analize, save 
&lt;project_path&gt; is: path to node js project. 
&lt;output&gt; is: optional, output filename, dafault value is &lt;project_path&gt;/packageMe.json


#### Steps:
> 1) run command: 
```sh
node app.js analize <project_path>
```

> 2) edit the created file &lt;project_path&gt;/packageMe.json, set "include" to "true|dev"
    true: will be added in &lt;project_path&gt;/package.json dependencies
    dev: will be added in &lt;project_path&gt;/package.json devDependencies
    
> 3) run command to apply change in &lt;project_path&gt;/package.json: 
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
