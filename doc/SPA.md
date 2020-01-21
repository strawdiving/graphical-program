## 命名空间
将变量和方法定义在不同的命名空间中，只定义一个全局变量，并将其他变量和方法定义为该变量的属性。
1. 将对象用作命名空间
```javascript
// global namespace
var MYAPP = MYAPP || {};
// 将event对象设置为MYAPP的属性
MYAPP.event = {
  ...
  addListener: function(){...},
  removeListener: function(){...},
  getEvent: function(e){...}
};
  
```

2. 可以用对象代替函数的多个参数，即让这些参数都成为某个对象的属性
```javascript
MYAPP.dom.Button = function(text,type,color,border,font){......};
new MYAPP.dom.Button("push",null,"white",null,"Arial");
```
换成：
```javascript
MYAPP.dom.Button = function(text,config) {
  var type = config.type || "submit";
  var font = config.font || "Arial";
  ...
};
// 使用方法
var config = {
  font: "...",
  color: "white",
  ...
};
new MYAPP.dom.Button('push',config);
或
new MYAPP.dom.Button('push',{color: 'red'});
```

3. 自执行函数
保证全局命名空间不被污染的模式：把代码封装在一个匿名函数中，并立刻自行调用。则函数中的所有变量都是局部的，并在函数返回时被销毁（前提是它们不属于闭包）。
```javascript
(function() { ...... })()
```

特别适用于某些脚本加载时所执行的一次性初始化任务。
也可以用于创建和返回对象。若创建对象的过程很复杂，且需要做一些初始化工作，则可以把第一部分相关的初始化工作设置为一个自执行函数，然后通过它来返回一个对象
——它可以访问初始化部分定义的任何私有属性。
```javascript
var MYAPP ={};
MYAPP.dom = function() {
  // 初始化
  function _private() {
  // body
  }
  return {
    getStyle: function(el) {
      _private();
    },
    setStyle: function(...) {......}
  };
});
}
```
