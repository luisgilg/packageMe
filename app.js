var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;
var nodePath = require('path');
var argv = require('minimist')(process.argv.slice(2));

var usageMessage = 'Usage: node app.js <command> <project_path> [<output>]\nWhere <command> is one of : analize, save\n<project_path> is: path to node js project for example\n<output> is: optional, output filename, dafault value is <project_path>\/packageMe.json\n\nSteps:\n1) run command: node app.js analize <project_path>\n2) edit created file <project_path>\/packageMe.json, set \"include\" to \"true|dev\"\n    true: will be added in <project_path>\/package.json dependencies\n    dev: will be added in <project_path>\/package.json devDependencies\n3) run command: node app.js save <project_path> to apply change in <project_path>\/package.json\n\npackageMe.json example:\n{\n  \"localUnreferenceModules\": [\n    {\n      \"name\": \"async\",\n      \"version\": \"0.9.0\",\n      \"include\": false \/\/<- set this to: true or dev\n    }],\n  \"globalUnreferenceModules\": [\n    {\n      \"name\": \"bower\",\n      \"version\": \"1.4.0\",\n      \"include\": false \/\/<- set this to: true or dev\n    }]\n}'; 

if (argv && argv._.length>0) {

	var paths = argv._.slice(1);

	if (argv._[0]=='analize' &&  paths.length >=1 ) {
		paths[0] = nodePath.resolve(__dirname,paths[0]);
		if (paths.length==2) {
			paths[1] = nodePath.resolve(__dirname,paths[1]);
		}else {
			paths.push(nodePath.join(paths[0],'packageMe.json'));
		}

		return analize(paths[0],paths[1]);
	}else if (argv._[0]=='save' &&  paths.length >=1 ) {
		paths[0] = nodePath.resolve(__dirname,paths[0]);
		if (paths.length==2) {
			paths[1] = nodePath.resolve(__dirname,paths[1]);
		}else {
			paths.push(nodePath.join(paths[0],'packageMe.json'));
		}

		return save(paths[0],paths[1]);
	}
	return console.log(usageMessage);
}else{
	return console.log(usageMessage);
}

	

function getPackages(path,cbM){
	fs.readdir(path, function(err, files) {    
		    var dependencies = [];
		    async.each(files, function(file, callback) {
		    	if (file=='.bin') {return callback(null)};

		        var dirPath = nodePath.join(path,file);
		        
		        async.waterfall([
		            function(cb) {
		                fs.lstat(dirPath, cb);
		            }, 
		            function(stat, cb) {
		                if (!stat) {
		                    return callback('File is null');
		                }
		                var isDirectory = stat.isDirectory();
		                if (isDirectory) {
		                	var fileName = nodePath.join(dirPath, 'package.json');
		                    return fs.readFile(fileName,'utf8', cb);
		                }
		            }, 
		            function(data, cb) {
		                try {
		                    var obj = JSON.parse(data);                   
		                    return cb(null, {name: obj.name,version: obj.version});
		                } catch (ex) {
		                    return cb(null,null);
		                }
		            
		            }]
		        , function(err, dep) {
		            if (err) {
		                return console.log(err);
		            }
		            if (dep) {
		            	dependencies.push(dep);
		            	return callback(null);
		            };            
		        });    
		    }, function(err) {
		        if (err) {
		            return console.log(err);
		        }       
		        return cbM(null,dependencies);
		    });
		});
}

function execute(command, callback){
    exec(command, function(err, stdout, stderr){ 
    	if (err){ return callback(err);}
    	return callback(null,stdout); 
    });
};


function analizeDependencies(pkg, modules, callback){

	var refModules=[];
	var unRefModules=[];


	async.each(modules,function(module,callback){
		var dep = pkg.dependencies[module.name] || pkg.devDependencies[module.name];
		if(dep){
			refModules.push({name:module.name, dependencieVersion:dep, moduleVersion:module.version,include:false});
		}else{
			module.include=false;
			unRefModules.push(module);
		}
		return callback(null);
	},
	function(err){
		if (err){
			return callback(err);
		}
		return callback(null,unRefModules);		
	});

 }

function getPackageJson(inputPath,callback){
	return fs.readFile(nodePath.join(inputPath,'package.json'),'utf8',function(err,data){
				if (err) {return callback(err);}	

				var obj = JSON.parse(data);
				return callback(null,obj);
			});
}

function analize(inputPath,outputPath){

	async.parallel({
		projectModules:function(callback){
			return getPackages(nodePath.join(inputPath,'node_modules'),callback);		
		},
		package:function(callback){
			return getPackageJson(inputPath,callback);
		},
		globalModules:function(callback){
			return execute('npm root -g',function(err,path){
				if (err) { return callback(err);}
				return getPackages(path.replace('\r','').replace('\n',''),callback);
			});
		}
	},
	function(err,data){
		if(err) {
			return console.log(err);
		}

		var modules = data.projectModules;

		async.parallel({
			localUnreferenceModules:function(callback){
				return analizeDependencies(data.package,data.projectModules,callback);
			},
			globalUnreferenceModules:function(callback){

				return analizeDependencies(data.package,data.globalModules,callback);
			}
		},function(err,data){

			if(err) {
				return console.log(err);
			}
			var content = JSON.stringify(data, null, 2);

			fs.writeFile(outputPath,content,'utf8',function(err){
				if (err) {
					return console.log(err);
				};
				return console.log('writed ' + outputPath);
			})
			
		});		
	});
}

function eachModules(pkg,modules,cbM){

	var result = pkg; //{dependencies:{},devDependencies:{}};
		
	return async.each(modules,function(module,callback){
		if (module.include==true || module.include=='true' || module.include=='upgrade' || module.include=='strict') {
			result.dependencies[module.name]='^' + module.version;
		}else if (module.include=='dev'|| module.include=='dev upgrade' || module.include=='dev strict') {
			result.devDependencies[module.name]='^' + module.version;
		}
		return callback(null);
	},function(err){

		if(err) {
			return cbM(err);
		}
		return cbM(null,result);
	});
}

function save(inputPath, packageMePath){
	async.parallel({
		package:function(callback){
			return getPackageJson(inputPath,callback);
		},
		packageMe:function(callback){
			fs.readFile(packageMePath,'utf8',function(err,data){
				if (err) {return callback(err)};
				var obj = JSON.parse(data);

				return callback(null,obj);
			});
		}
	},
	function(err,result){
		if(err) {
			return console.log(err);
		}
		var pkg= result.package;
		var localUnreferenceModules = result.packageMe.localUnreferenceModules;
		var globalUnreferenceModules = result.packageMe.globalUnreferenceModules;
		

		async.parallel({
			local:function(cbM){
				return eachModules(pkg,localUnreferenceModules,cbM);
			},
			global:function(cbM){
				return eachModules(pkg,globalUnreferenceModules,cbM);
			}
		},function(err,result){
			if (err) { return console.log(err);}

			var pkgPath = nodePath.join(inputPath,'package.json');
			var content = JSON.stringify(pkg, null, 2);


			fs.writeFile(pkgPath,content,'utf8',function(err){
				if (err) {return console.log(err);}
				return console.log('updated ' + pkgPath);
			});

		});
	});
}

 