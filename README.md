## fis3-parser-typescript

typescript parser for fis3


### INSTALL

```bash
npm install -g fis3-parser-typescript
```

### USEAGE

	
```js
fis.match('**.ts', {
	parser: fis.plugin('typescript', {
			// options
		}),
	rExt: '.js'
});
```
	
### 注意

如果你的 fis 版本小于 3.2.2 请加以下配置。


```js
fis.set('project.fileType.text', 'ts,tsx');
```

### 常用配置说明

* `jsx` 默认为 2, 解析 `<xml>` 为对应的  `react` 语句。如果设置 1, 则保留。
* `showNotices` 默认为 false, 如果要提示所有提示信息，请开启。
* `module` 默认为 1.

	* `1`: commonjs
  * `2`: amd
  * `3`: umd
  * `4`: system
* `target` 默认为 0, es3.
	
	* `0`: es3
	* `1`: es5
  * `2`: es6
* `sourceMap` 默认为 `false` 配置是否输出 sourcemap

