knockout

knockout使用observable来定义model的可变属性，一个model里所定义的属性，可以映射到html里 

在html中，knockout通过data-bind中声明的handler和其对应的model属性来控制各元素应该做什么事，简而言之，你能通过设定的属性配合handler来控制元素 

1. 定义ViewModel

```
var viewModel = {
    Name: "Lilei",
    profession: "软件工程师"
}；
```

2. view视图里定义绑定data-bind的标签

   ```html
   <div>
   	姓名：<label data-bind="text:Name"></label>
   	职业：<input type="text" data-bind="textinput:profession"/>
   </div>
   ```

3. 激活绑定

   ```
   ko.applyBindings(viewModel);
   ```

   以上基本实现了一个最简单的viewmodel的数据绑定。

实现双向绑定：

三个监控属性：

Observables，

DependentObservables——>computed observables

ObservableArray。

```javascript
<body>
    <div> 
        姓名：<input type="text" data-bind="textinput:Name" /><br />
        职业：<input type="text" data-bind="textinput:Profession" /><br />
        描述：<label data-bind="text:Des"></label>
    </div>
    <script type="text/javascript">
        //1.定义ViewModel
        var myViewModel = {
            Name: ko.observable("Lilei"), //添加了ko.observable()，对应的属性就会变成方法，则对于属性的取值和赋值都需要使用myViewModel.Name()来处理
            Profession: ko.observable("软件工程师"),
        };
        myViewModel.Des = ko.computed(function () { //监控依赖属性
            return "本人姓名——" + myViewModel.Name() + "，职业——" + myViewModel.Profession();
        });

        //2.激活绑定
        ko.applyBindings(myViewModel);</script>
</body>
```

监控属性的意义在于，任何地方改变了viewModel中的属性值，界面都会随之变化；

computed observables

这些函数依赖于一个或多个其他可观察对象，并且只要这些依赖关系发生变化就会自动更新 

Writable computed observables

computed observables具有从其他观测值计算出来的值，因此是只读的。 使 computed observables可写，你只需要提供你自己的回调函数，用written values做一些合理的事情。 

监控依赖属性/计算属性：将属性的值同时监控到其他属性的变化，其中任何一个发生变化，该属性绑定的标签都会触发改变

```html
<body>
    <div><select data-bind="options:deptArr,
                           optionsText:'Name'"></select>

    </div>
    <div>
        <input type="text" id="txt_testobservable" /><input type="button" id="btn_test" value="新增部门" />
    </div>
    <script type="text/javascript">
            var deptArr = ko.observableArray([
                //监控数组对象，js里面任何地方只要对deptArr数组对象做了数组的改变，都会触发UI给出响应
                { id: 1, Name: '研发部' },
                { id: 2, Name: '行政部' },
                { id: 3, Name: '人事部' }
            ]);
            var viewModel = {
                deptArr: deptArr,
            };

            ko.applyBindings(viewModel);

            var i=4;
            $(function () {
                $("#btn_test").on("click", function () {
                    deptArr.push({ id: i++, Name: $("#txt_testobservable").val() });
                });
            });
    </script>
</body>
```

如果要检测并响应对象集合的更改， 使用observableArray，这在显示或编辑多个值，并且需要重复出现的UI部分随着项目的添加和删除而出现和消失时很有用。 

pure computed observables

为大多数应用提供了比常规computed observables更好的性能和内存优势。 这是因为pure computed observable在本身没有subscribers  时不会维护对其依赖项的订阅。 

Subscribe：

如果要注册自己的订阅以在observable对象更改时被通知，可以调用他们的subscribe函数。函数接收三个参数：1）callback，每当通知发生时都会调用它 ，2）`target` (optional)  在回调函数中定义this的值，3） `event`(optional; 默认是 `"change"`) ，是接收通知的事件的名称 

```javascript
myViewModel.personName.subscribe(function(newValue) {
    alert("The person's new name is " + newValue);
});
```

终止订阅：subscription.dispose(); 

强迫观察者始终通知订户 

当写入包含原始值（数字，字符串，布尔值或空值）的观察值时，通常只有在实际值发生变化时才通知observable的依赖关系。 但是，可以使用内置的通知extender来确保在写入时始终通知某个observable的订户，即使该值相同 

```
myViewModel.personName.extend({ notify: 'always' });
```

还有其他extender可以使用

# Creating custom bindings

您不仅限于使用点击，值等内置绑定 - 您可以创建自己的绑定。这是如何控制observables如何与DOM元素交互的，并为您提供了很多灵活性，以便以易于重用的方式封装复杂的行为。 

例如，您可以以自定义绑定的形式创建交互组件，如网格，Tabset等 。

### Registering your binding

要注册绑定，请将其添加为ko.bindingHandlers的子属性： 

```javascript
ko.bindingHandlers.yourBindingName = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called once when the binding is first applied to an element,
        // and again whenever any observables/computeds that are accessed change
        // Update the DOM element based on the supplied values here.
    }
};
```

然后你可以在任意数量的DOM元素上使用它 .您实际上不必提供init和update回调函数 - 只需提供一个或另一个回调函数即可 

```html
<div data-bind="yourBindingName: someValue"> </div>
```

update

Knockout将绑定应用于元素时，并跟踪您访问的任何依赖项（observables / computeds） 时，最初调用update回调函数。当任何这些依赖项发生更改时，将再次调用update回调。 

init

Knockout会为您使用绑定的每个DOM元素调用一次init函数。 init有两个主要用途： 

1) 为DOM元素设置任何初始状态 

2) 要注册任何事件处理程序，例如，当用户单击或修改DOM元素时，可以更改关联的observable的状态 

Components:

component Loader