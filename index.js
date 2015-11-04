/**
 * fis.baidu.com
 */

var ts = require('typescript');
var util = require('util');

function transpileModule(content, transpileOptions, file) {
  var options = transpileOptions.compilerOptions;

  options.isolatedModules = true;
  options.allowNonTsExtensions = true;
  options.noLib = true;
  options.noResolve = true;

  var newLine = ts.getNewLineCharacter(options);
  var inputFileName = file.realpath;
  var sourceFile = ts.createSourceFile(inputFileName, content, options.target);
  var sourceMapText, outputText;
  
  if (file.isMod) {
    sourceFile.moduleName = file.moduleId || file.id;
  }

  var compilerHost = {
    getSourceFile: function (fileName) {
      if (fileName === ts.normalizeSlashes(inputFileName)) {
        return sourceFile;
      }

      var info = fis.uri(fileName, file.dirname);
      
      if (info.file) {
        var f = info.file;
        var sf = ts.createSourceFile(f.realpath, f.getContent(), options.target);
        
        if (f.isMod) {
          sf.moduleName = f.moduleId || f.id;
        }
        
        return sf;
      }

      return undefined; 
    },
    writeFile: function (name, text, writeByteOrderMark) {
      if (ts.fileExtensionIs(name, ".map")) {
        ts.Debug.assert(sourceMapText === undefined, "Unexpected multiple source map outputs for the file '" + name + "'");
        sourceMapText = text;
      }
      else {
        ts.Debug.assert(outputText === undefined, "Unexpected multiple outputs for the file: " + name);
        outputText = text;
      }
    },
    getDefaultLibFileName: function () { return "lib.d.ts"; },
    useCaseSensitiveFileNames: function () { return false; },
    getCanonicalFileName: function (fileName) { return fileName; },
    getCurrentDirectory: function () { return ""; },
    getNewLine: function () { return newLine; },
    fileExists: function (fileName) {
      return fis.util.exists(fileName);
    },
    readFile: function (fileName) { return ""; }
  };
  
  var program = ts.createProgram([inputFileName], options, compilerHost);
  var diagnostics;
  
  if (transpileOptions.reportDiagnostics) {
      diagnostics = [];
      ts.addRange(diagnostics, program.getSyntacticDiagnostics(sourceFile));
      ts.addRange(diagnostics, program.getOptionsDiagnostics());
  }
  
  program.emit();

  return {
    outputText: outputText, 
    diagnostics: diagnostics, 
    sourceMapText: sourceMapText 
  };
}
 
module.exports = function (content, file, opts) {
  var conf = fis.util.clone(opts);

  if (!conf.sourceMap) {
    conf.inlineSources = false;
  }

  var result = transpileModule(content, {
    compilerOptions: conf,
    fileName: file.realpath,
    reportDiagnostics: true,
    moduleName: undefined
  }, file);
  
  result.diagnostics.forEach(function(e) {
    var msg = util.format('Syntax Error: %s in `%s`', e.messageText, file.subpath);
    fis.log.warning(msg);
  });

  if (result.sourceMapText) {
    var mapping = fis.file.wrap(file.dirname + '/' + file.filename + file.rExt + '.map');

    // 修改 source 文件名。
    var sourceMapObj = JSON.parse(result.sourceMapText);
    sourceMapObj.sources = [file.subpath];
    result.sourceMapText = JSON.stringify(sourceMapObj, null, 4);

    mapping.setContent(result.sourceMapText);
    var url = mapping.getUrl(fis.compile.settings.hash, fis.compile.settings.domain);
    
    result.outputText = result.outputText.replace(/\n?\s*\/\/#\ssourceMappingURL=.*?(?:\n|$)/g, '');
    result.outputText += '\n//# sourceMappingURL=' +  url + '\n';

    file.extras = file.extras || {};
    file.extras.derived = file.extras.derived || [];
    file.extras.derived.push(mapping);
  }
  
  return result.outputText || '';
};

module.exports.defaultOptions = {
  // 1: preserve
  // 2: React
  jsx: 2,
  
  // 1: commonjs
  // 2: amd
  // 3: umd
  // 4: system
  module: 1,

  // 0: ES3
  // 1: ES5
  // 2: ES6
  target: 1,
  noImplicitAny: false,
  outDir: "built",
  rootDir: fis.project.getProjectPath(),
  sourceMap: false,
  inlineSources: true,
  experimentalDecorators: true
};
