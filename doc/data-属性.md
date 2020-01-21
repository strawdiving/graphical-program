## HTML data-* 自定义属性
HTML5的data-* 属性用于嵌入自定义数据，它赋予我们在所有 HTML 元素上嵌入自定义 data 属性的能力。

存储的（自定义）数据能够被页面的 JavaScript 利用，以创建更好的用户体验（不进行 Ajax 调用或服务器端数据库查询）。
### 定义和用法

**data + 自定义属性名**

使用这样的结构可以进行数据存放。

data-* 属性包括两部分：
- 属性名，不应该包含任何大写字母，并且在前缀 "data-" 之后必须有至少一个字符
- 属性值，可以是任意字符串

如
```html
<div id="test" data-age="24"></div>
```
通过HTML的dataset API获取自定义属性：
```javascript
var test = document.getElementById("test");
var age = test.dataset.age
```
使用dataset API时，需要
- 去掉data-*属性的“data-”前缀
- 连字符需要转为驼峰命名，如：data-birth-date转为dataset.birthDate

如果在CSS中使用选择器，我们仍然需要使用连字符格式：
```javascript
<style type="text/css">
[data-birth-date]
{ 
  background-color: #0f0;
  width:100px;
  margin:20px;
}
</style>
```

### 处理data-*属性
```html
<div id="msglist" data-user="bob" data-list-size="5"></div>
```

1. Javascript（一般作为旧版浏览器的备用方案）
```javscript
var msglist = document.getElementById("msglist");
var show = msglist.getAttribute("data-list-size");
// 会改变sata-list-size属性
msglist.setAttribute("data-list-size",show+3);
```

2. jQuery的data()方法
```javascript
var msglist = $("#msglist");
var show = msglist.data("list-size);
// 不会改变data-list-size属性
msglist.data("list-size",show+3);
```

3. HTML dataset API
属性对应的dataset中的属性：
- data-user --- user
- data-list-size --- listSize
```javascript
var msglist = document.getElementById("msglist");
var show = msglist.dataset.listSize;
msglist.dataset.listSize = show+3;
```
