/**
 * fis.baidu.com
 */

var ts = require('typescript');
var util = require('util');
 
module.exports = function (content, file, opts) {
  var conf = fis.util.clone(opts);

  if (!conf.sourceMap) {
    conf.inlineSources = false;
  }

  var result = ts.transpileModule(content, {
    compilerOptions: conf,
    fileName: file.realpath,
    reportDiagnostics: true,
    moduleName: undefined
  });


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
  
  return result.outputText;
};

module.exports.defaultOptions = {
  // 1: preserve
  // 2: React
  jsx: 2,
  
  // 1: commonjs
  // 2: amd
  // 3: umd
  // 4: system
  module: ts.ModuleKind.CommonJS,

  // 0: ES3
  // 1: ES5
  // 2: ES6
  target: ts.ScriptTarget.ES3,
  noImplicitAny: false,
  outDir: "built",
  rootDir: fis.project.getProjectPath(),
  sourceMap: false,
  inlineSources: true
};
