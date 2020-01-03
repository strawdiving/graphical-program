# Backbone

Backbone唯一的依赖就是underscore.js。它是一个类库，由一些非常有用的工具和通用目的的Javascript函数组成。Underscore提供了60多个函数来处理数组操作、函数绑定、Javascript模板和深度的相等检测。除了Underscore，也可以用jQuery来提升处理视图的能力。

## Backbone.View

Backbone视图并不是模板本身，却是一些控制类，它们处理模型的表现。

视图扩展自Backbone的显存类Backbone.View。

```javascript
Backbone.View.extend(properties[,classProperties])
```
通过创建自定义视图来开始视图，可以重写render函数，指定声明式事件，或其他View的根元素的属性。
```javascript
var customView = Backbone.View.extend({
    className:"custom",
    events: {
        "click .icon": "open",
        "click .button .edit": "openEditDialog"
    },
    initialize: function(){......},
    render: function(){......}
});
```
- el——View.el

  所有view始终有一个DOM元素（el属性），无论是否已插入到页面中。

  以这种方式，可以随时渲染视图，并一次性插入到DOM中，以获得尽可能少的回流和重新绘制的高性能UI渲染。

  this.el可以从DOM selector字符串或一个元素中解析出来，否则，它将从视图的tagName, className，id和attributes属性中创建。如果没有设置，this.el是一个空div。

  如果希望将视图绑定到页面中已存在的元素上，只需要直接指定el即可；也可以在实例化一个视图时将一个el引用直接传递给view的构造函数。`new View({el: "#app"});`

- constructor/initialize——`new View([options])`

  ViewOptions有几个特殊选项：
  model，collection，el，id，className，tagName，attributes，events

  如果在options中传递了，则直接附加到view中。

  如果view定义了initialize函数，会在视图view第一次创建时被调用。

  自定义view的constructor函数，传入options（new View(options)）——>调用Backbone.View的constructor——>调用initialize，initialize一般会被自定义view重写。

- attributes——View.attributes

  将在view的el上设置为HTML DOM元素属性的散列，或返回这种散列的函数。

- template——view.template([data])

  虽然view的模板不是由Backbone直接提供的函数，但在views中定义一个template函数是个很好地惯例。

- render——view.render()

  每个视图有一个render()函数，默认情况下里面没有任何操作（空函数）。一旦视图需要重绘，应该调用此函数。

  对不同的视图应该用不同功能的函数来覆盖该函数，用模型数据渲染view的模板，用新的HTML更新this.el。渲染结束时返回this，以启用链式调用。

  ```javascript
  var TodoView = Backbone.View.extend({
      template: _.template($("#todo-template").html()),
      render: function() {
          $(this.el).html(this.template(this.model.toJSON())); // this.model指向模型的实例
          return this;
      }
  });
  
  var todoView = new TodoView({model: new Todo});
  ```

  Backbone本身并不知道你是如何渲染视图的，你可以自己生成元素也可以使用模板类库（如使用underscore的_.template()），建议使用后者，通常这种方法更干净——让HTML保持在Javascript程序之外。

  **绑定（上下文）**

  Underscore提供了`_.bindAll(context,*functionNames)`，将函数名字（字符串形式）和一个上下文绑定在一起。_.bindAll()保证了所有给定的函数总是在指定的上下文中被调用。这在事件回调中尤其有用，因为回调函数的上下文总是在变化。

  ```javascript
  var TodoView = Backbone.Voew.extend({
      initialize: function() {
          _.bindAll(this,'render','close');
      },
      render: function(e) { /* ... */},
      close:function(e) { /* ... */}    
  });
  ```

- events——view.events或view.events()

  events hash（或方法）提供了一种添加事件到el的简单快捷的方法，可用于指定一组DOM事件，这些事件将通过delegateEvents事件代理绑定到view上的方法。

  ```javascript
  var TodoView = Backbone.View.extend({
      events: { // 在视图上通过events哈希对象设置事件和对应回调
          "change input[type=checkbox]": "toggleDone",
          "click .destroy": "clear",
      },
      toggleDone: function(e) {/* ... */},
      clear: function(e) {/* ... */}
  })
  ```

  Events格式：`{“event selector": "callback"}`

  - callback——可以是view上方法的名称，也可以是直接函数体。当视图的事件回调被触发时，在当前视图的上下文中就会调用它们，而不是在当前的目标元素下或者window的上下文中调用。因此，可以在任何回调中直接访问this.el和this.model

  - selector——忽略selector，会将事件绑定到view的根元素（this.el）；如果提供了，事件就会被委托，即事件动态绑定在与selector匹配的el子元素上

  委托利用了事件冒泡，也就意味着事件可以一直触发而不管el中的内容是否已经改变。

  Backbone会在实例化时自动附加事件侦听器，就在调用initialize之前。

- delegateEvents——delegateEvents([events])

  使用jQuery的on函数，为视图内的DOM事件提供声明式回调，如果未传递events参数，则使用this.events作为源。

  默认的，delegateEvents在view的构造函数中为你调用，如果有一个简单的events hash，你的所有DOM事件总是已被连接，不必自己调用。比使用jQuery，手动在渲染期间将事件绑定到子元素上提供了很多优点。

  （在交给jQuery之前）所有连接的callbacks都绑定到view上，当callbacks被调用时，this继续引用view对象。

  当再次运行delegateEvents时，可能使用不同的events hash，所有回调都将被删除并重新委托——对于需要在不同模式下行为不同的views很有用。

  重新绘制页面元素后，原有的事件需要重新触发绑定，可在render之后使用this.delegateEvents()。

## Backbone.Events

Events是一个可以混入任何对象的模块，使对象具有bind和trigger，自定义命名events的能力。

- on——object.on(event,callback,[context])，Alias: bind

  将callback函数绑定到一个对象，回调将在事件被触发时被调用。如果页面上有大量不同的事件，约定用冒号命名空间：
```javascript
“poll:start"或"change:selection"
```
  事件字符串也可以是多个事件的以空格分隔的列表：
```javascript
book.on("change:title change:author",......)
```
  绑定到特殊的“all”事件时，任何事件发生，都会触发绑定的callback，并将事件的名称作为第一个参数传入
```javascript
proxy.on("all",function(evtName){obj.trigger(evtName);});
```
  还支持事件映射语法：
```javascript
book.on({"change:author": authorPane.update,
        "change:title":titleView.update
        });
```
  要在调用回调时为this提供上下文，传递可选的最后一个参数：
```javascript
model.on("change",this.render,this);
```
- off——object.off([event],[callback],[context]) Alias: unbind

  从对象中删除以前绑定的回调函数。

  如果没有指定context，则将删除具有不同上下文的回调的所有版本。

  如果没有指定callback，则event的所有callbacks都删除。

  如果没有指定event，则所有events的callbacks都删除。
- trigger——object.trigger(event,[*args])

  触发给定event或空格分隔的事件列表，后续的arguments将传递给事件传递函数。
- listenTo——object.listenTo(other,event,callback)

  告诉object监听other对象上的特定event，相比于other.on(event,callback,object)，listenTo允许object跟踪事件，并且可以在稍后一次性删除。callback始终以object作为上下文来调用。
  `view.listenTo(model,"change",view.render);`

- stopListening——object.stopListening([other],[event],[callback])

  告诉object停止监听事件。不带参数，则object移除所有已注册的回调。

### Backbone的built-in events

- add(model,collection,options)，一个model添加到一个collection中
- remove(model,collection,options)，一个model从一个collection中移除
- update(collection,options)，在collection中添加/删除任意数量的models后触发单个事件
- reset(collection,options)，collection的整个内容已被重置时触发
- sort(collection,options)，collection被重新排序时触发
- change(model,options)，model的attributes改变时触发
- change: [attribute ] (model,value,options)，一个特定attribute改变时触发
- destroy(model,collection,options)，当一个model被destroy时触发
- all，此特殊事件由任意触发事件触发，将event name作为第一个参数，之后是所有trigger参数

如果在调用发出事件的函数时，如果想阻止事件被触发，可将{silent: true}作为一个选项，但更好的方式，是在事件回调的选项中的特定flag来查看并选择忽略。

## Backbone.Model

模型是保存应用程序数据的地方，你可以把模型想象为对应用程序原始数据的精心设计的抽象，并且添加了一些工具函数和事件。

model是核心，包含交互式数据及围绕它的大部分逻辑：validations,convertions,computed properties,access control

可以在Backbone.Model上调用extend()函数来创建Backbone模型：

- extend——Backbone.Model.extend(properties,[classProperties])

  1）参数1，是一个对象，它成为了模型实例的属性

  2）参数2，可选的类属性的哈希

  创建自己的model类，可以扩展Backbone.Model，并提供实例属性，以及可选的calssProperties，直接附加到constructor函数。

  extend正确地设置原型链，使用extend创建的子类可以进一步extend，通过多次调用extend()可以生成模型的子类，它们将继承父亲所有的类和实例的属性。

  ```javascript
  var User = Backbone.Model.extend({
      // 实例属性
      instanceProperty: "foo"
  },{
      // 类属性
      classProperty: "bar"
  });
  ```

  

  

  如果想调用父对象的实现，或者重写一些core函数如set，save，则必须明确地调用它，如：
  ```javascript
  var Note = Backbone,Model.extend({
      set: function(attributes,options) {
          Backbone.Model.property.set.apply(this.arguments);
          }
        });
  ```

- constructor/initialize——new Model([attributes,[options]])

  Backbone的模型本身是构造函数，所以可以用new关键词来生成一个新的实例。

  创建model的实例时，可以传入attributes的初始值（用来设置model的attributes），如果定义了initialize函数，当model实例化时被调用。initialize()函数可以接受任意实例参数。

  可以重写constructor函数和initialize函数。

  ```javascript
  var User = Backbone.Model.extend({
      initialize: function(name) {
          this.set({name: name});
      }
  });
  var user = new User("Leo McGary");
  assertEqual(user.get("name"),"Leo McGary");
  ```

  如果传递{collection: ......}作为options，则model获得一个collection属性，用于指示这个model属于哪个collection，用于计算model的url。

  model.collection属性通常在你首次将model添加到collection时自动创建，但是，将该选项传给构造函数时，并不会自动将model添加到collection中。

- get(attribute)/set(attributes,[options])

  使用set()和get()函数来设置和获取实例里的属性。

  set(attributes,[options])需要一个哈希形式表示的属性对象以便应用到实例上；get(attribute)只需要一个字符串参数——属性的名字——返回它的值。

  ```javascript
  var user = new User();
  user.set({name: "Donna Moss"})
  console.log(user.get("name")); // "Donna Moss"
  console.log(user.attributes); //{name: "Donna Moss"}
  ```

  将attributes的hash（一个或多个）设置到model上，如果任何属性改变model的状态，model上将触发change事件。

- id——model.id

  id是一个任意字符串（整数id或UUID），如果在attributes hash中设置了id，它将作为直接属性复制到model中。

- cid——model.cid

  cid或client id是在首次创建时自动分配给所有models的唯一标识符。当model未保存到server时，cid很方便，且还没有最终的真实id，但已经需要在UI中可见。

- defaults——model.defults或defaults()

  使用哈希名为defaults的对象来指定model的默认属性。在创建模型的实例时，任何未指定的属性都将被设置成默认值。
  ```javascript
  var Meal =Backbone.Model.extend({
      defaults:{
          "desert": "cheesecake",
          "entree": "ravioli"
      }
  });
  ```

- toJSON——model.toJSON([options])

  为JSON字符串化返回model attributes的浅表shallow副本，而不是返回JSON字符串

- clone——model.clone()

  返回具有相同属性的模型的新实例。

## Backbone.Collection

在Backbone中，模型实例的数据存放在多个集合中。

Collection是models的有序集合，可以绑定“change”事件，以便collection中的任何model被修改时通知。集合中的model触发的任何事件也将直接在集合上触发，允许监听集合中任何model中特定属性的更改，`document.on("change:selected",...)`

针对模型，可以通过扩展Backbone.Collection来创建一个集合。

- extend——Backbone.Collection.extend(properties,[classProperties])

- model——collection.model([attrs],[options])

  重写model属性来指定与集合相关联的模型。
  在创建一个集合时，可以传递原始属性对象（和数组）以及add，create和reset，并将这些属性转换为适当类型的model，也可以通过用返回一个模型的constructor函数来重写该属性，来包含多态模型。

  ```javascript
  var library = Backbone.Collection.extend({
      model: Book
      });
  
  var library1 = Backbone.Collection.extend({
      model: function(attrs,options) {
          if(condition) {
              return new PublicDoc(attrs,options);
          }
          else {
              return new PrivateDoc(attrs,options);
          }
      }
    });
  ```

- constructor/initialize——new Backbone.Collection([models],[options])

  创建集合时，可以选择传入models的初始数组，comparator可以作为option包含在内。Collection创建时initialize会被调用。

  ```javascript
  var Users = Backbone.Collection.extend({ model: User});
  var users = new Users([{name: "Toby Ziegler"},{name: "Josh Lyman"}]); // 在创建一个集合时，可以选择传递一个模型数组。如果定义了一个初始化实例的函数initialize()，在初始化时就会调用它
  ```

  model和comparator如果提供，会直接附加到collection

- toJSON([options])

  返回一个数组，包含集合中每个model的attributes hash（通过model.toJSON获得）。这可以用来序列化并维持整个集合。并不是返回JSON字符串。

- add(models,[option])

  向集合中添加一个model或model的数组。

  ```javascript
  var users = new Users;
  users.add({name: "Donna Moss"}); // 添加一个单独的模型
  users.add([{name: "Toby Ziegler"},{name: "Josh Lyman"}]); // 添加模型组成的数组
  ```

  

  在为集合添加模型时，每个model会触发一个“add”事件，随后触发一个“update”事件

  ```javascript
  users.bind("add", function(user) {
      alert("Ahoy")+user.get("name")+"!"；
  })；
  ```

- remove(models,[option])

  从集合中移除一个model或model的数组，并返回它们。“models”参数的每个模型可以是一个model实例，一个id字符串或JS对象，每个model触发“remove”事件，以及一个单独的“update”事件。

  ```javascript
  users.bind("remove", function(user) {
      alert("Adios "+user.get("name")+"!")；
  })；
  users.remove(users.models[0]);
  ```

- reset([models],[options])

  更改多个模型时，批量更新集合。
  可以用新的models列表（或属性hash）替换集合，在完成时触发单个“reset”事件，并且不触发任何model上的任何“add“/”remove”事件，返回新设置的models。
  如果没有参数，reset()即清空集合。

- comparator

  用于按排好序的顺序维护集合。一个集合的内部元素顺序可以通过comparator()函数来控制，该函数的返回值代表你希望集合内部元素按何种规则排序。

  ```javascript
  var Users = Backbone.Collection.extend({
      comparator: function(user){ // 保证了Users集合内的元素是以name的字母顺序存储的
          return user.get("name"); 
      }
  });
  ```

  返回值既可以是一个字符串，也可以是一个数值，以便将集合的元素按此规则排列。

  models被添加时，会插入到models的正确index处。

## Backbone.Router

Web应用程序通常为应用程序中的重要位置提供可链接，可收藏，可共享的URL。直到最近，hash片段（#page）被用来提供这些永久链接，但随着history API的到来，现在可以使用标准URL（/ page）。Backbone.Router提供了方法来导航客户端页面，并将它们连接到操作和事件。

对于尚不支持History API的浏览器，路由器进行平稳退化，透明转换到URL的片段版本。

在页面加载期间，在应用程序完成所有路由器的创建之后，请务必调用Backbone.history.start（）或Backbone.history.start（{pushState：true}）来导航到初始URL。

- extend`(properties, [classProperties])` 

通过创建自定义Router类开始。定义当匹配某些URL片段时触发的操作函数，并提供将路由与操作配对的路由哈希

- routes

路由哈希将带有参数的URL映射到路由器上的函数（或者只是直接函数定义），类似于View的events哈希。注意，避免在路径定义中使用前导斜杠。

路由可以包含参数部分`：param`，它匹配斜杠之间的单个URL组件；还可以匹配splat（隔板）部分`* splat`，基本是一个通配符，匹配所有的内容。

```javascript
var Workspace = Backbone.Router.extend({
    routes: {                             // Matches:
      "help":                 "help",   // #help
      "search/:query":        "search"  //#search/kiwis
      "search/:query/p:page": "search"  //#search/kiwis/p7
      "file/*path":           "file"    //#file/folder/path.txt
    },
    help: function() { ... },
    search: function(query,page) { ... },
    file: function() { ... }    
});


router.on("route:help",function(page) {...});
```

当访问者按下后退按钮或输入URL，并且匹配特定route时，操作的名称将作为事件触发，这样其他对象就可以监听路由器，并得到通知。

- constructor/initialize——new Router([options])

创建新路由器时，可以直接将其routes哈希作为选项传递。如果定义了initialize()，所有options都会传递给initialize()函数。

- route(route, name, [callback])

手动为路由器创建路由。

route参数——可以是路由字符串或正则表达式。路由或正则表达式中的每个匹配的捕获都将作为参数传递给回调；

name——每当路由匹配时，将作为“route：name”事件触发，如果省略callback参数，则将使用router [name]。

后面添加的路由可能会覆盖先前声明的路由。

```javascript
initialize: function(options) {
    this.route("page/:number","page",function(number) { ... }); // Matches #page/10, passing "10"
    this.route(/^(.*?)\/open$/, "open");  // Matches /117-a/b/c/open, passing "117-a/b/c" to this.open                           
},
open: function(id) { ... } 
```

## Backbone.sync

Backbone每次试图读取或保存模型到服务器时都会调用Backbone.sync()函数。

该函数默认使用`jQuery.ajax`发送RESTful JSON请求，并返回一个 [jqXHR](http://api.jquery.com/jQuery.ajax/#jqXHR)，可以覆盖此函数来改变它默认的行为，以便使用一种不同的持久化策略，如WebSockets、XML传输流或本地存储。

```javascript
Backbone.sync = function(method,model,options) { ... };
```

- method——CRUD方法（`"create"`, `"read"`, `"update"`, 或 `"delete"`）
- model——要保存的模型（或要读取的集合）
- options——请求的可选项，包括成功和失败的回调函数

使用默认实现，当Backbone.sync发送保存模型的请求时，其属性（attributes）将被序列化为JSON进行传递，并在HTTP主体中使用content-type application / json发送。

当返回一个JSON响应，发送服务器已更改，并需要在客户端上更新的模型属性。当响应来自集合（Collection #fetch）的“读取”请求时，向下发送模型属性对象的数组。

每当模型或集合开始与服务器同步时，都会发出“request”事件。如果请求成功完成，会收到“sync”事件，如果没有，则会收到“error”事件。

sync功能可以用Backbone.sync全局覆盖，或者通过向Backbone集合或单个模型添加sync功能，在更细粒度的级别上覆盖。

```javascript
// 重写sync()，这样就可以给模型或者集合的本地存储属性添加委托
// 本地存储属性应当是一个Store的实例
Backbone.sync = function(method,model,options) {
    var resp;
    var store = model.localStorage || model.collection.localStorage;
    
    switch(method) {
        case  "read": resp =  model.id? store.find(model):store.findAll();break;
        case "create": resp = store.create(model);break;
        case "update": resp = store.update(model);break;
        case "delete": resp = store.delete(model);break;        
    }
    if(resp) { options.success(resp);}
    else { options.error("Record not found");}
};
```

将CRUD映射到REST的默认sync处理程序如下所示：

- **create → POST**   `/collection`
- **read → GET**   `/collection[/id]`
- **update → PUT**   `/collection/id`
- **patch → PATCH**   `/collection/id`
- **delete → DELETE**   `/collection/id`

即，如果创建一个实例，Backbone会发送一个POST请求到url（如“/users"）；更新一个实例，会发送一个PUT请求到/users/id这个端点，这里的id是模型的唯一标识。

Backbone期望服务器响应POST、PUT和GET请求时返回一个JSON形式的哈希对象，而且它应该包含用来更新实例的一些属性。

### 与服务器的同步

默认情况下，只要保存模型，Backbone就会用Ajax请求通知服务器。当创建、更新或删除一个模型之前，Backbone通过Backbone.sync()函数来实现这个功能。Backbone发起REST形式的JSON请求到服务器，如果成功，就将更新客户端的模型。

如要利用这个特性，需要在模型中定义一个名为url的属性并复制，并且要求服务器处理请求符合REST形式，Backbone将处理剩下的所有任务：

```javascript
var User = Backbone.Model.extend({
    url: '/users'
});
```

url既可以是一个字符串也可以是一个返回字符串的函数。路径既可以是相对的也可以是绝对的，但必须返回模型端点。

- model.fetch([options])

  可以使用fetch()函数来刷新模型，该函数会（通过一个GET请求）从服务器请求模型的属性，通过委托Backbone.sync将模型的状态与从服务器获取的属性合并。返回一个jqXHR对象。该方法在模型从未填充过数据，或者你希望确保拥有最新的服务器状态时非常有用。

  如果服务器的状态（远程模型）所表示的数据与当前模型属性数据不一致，将触发一个“change”事件。

  fetch接受options哈希中的success和error回调，它们的参数都是`(model，response，options)`。

  ```javascript
  // Poll every 10 seconds to keep the channel model up-to-date.
  setInterval(function() {
    channel.fetch();
  }, 10000);
  ```

- model.save([attributes], [options])

通过委托Backbone.sync将模型保存到数据库（或可选的持久层persistence layer）。如果验证成功则返回jqXHR，否则返回false。

attributes hash（和set中的一样）中应该包含你要更改的属性 - 未包含的keys不会被更改 - 但是，资源的完整表示将被发送到服务器。与set一样，您可以传递单独的keys和values而不是哈希。

如果模型具有validate方法，并且验证失败，则不会保存模型。

如果模型是新的，则save将是“create”（HTTP POST），如果模型已经存在于服务器上，则save将是“update”（HTTP PUT）。

如果您只想将更改的属性发送到服务器，请调用model.save（attrs，{patch：true}），然后发送一个只带有传入的属性的HTTP PATCH请求到服务器。

使用新属性调用save会立即触发“change”事件，Ajax请求开始发往服务器时触发“request”事件，服务器确认更改成功后触发“sync”事件。如果你想在模型上设置新属性之前等待服务器，传递{wait：true}。

在以下示例中，请注意我们的重写版本的Backbone.sync在第一次保存模型时会收到“create”请求，第二次是“update”请求。

```javascript
Backbone.sync = function(method, model) {
  alert(method + ": " + JSON.stringify(model));
  model.set('id', 1);
};

var book = new Backbone.Model({
  title: "The Rough Riders",
  author: "Theodore Roosevelt"
});

book.save();
book.save({author: "Teddy"});
```

所有的save(）调用都是异步的，但可以通过在options哈希中设置success和error两个选项来监听Ajax请求的回调，参数都是（model,response,options）。如果服务器端验证失败，则返回非200 HTTP响应代码，以及文本或JSON中的错误响应。

```javascript
book.save("author", "F.D.R.", {error: function(){ ... }});
```

### 填充集合

Backbone的集合可以请求远程的模型并保存在本地。和模型类似，必须给集合指定一个url属性来设置它的端点。如果没提供url，Backbone将转而使用与之关联的模型的url。

```javascript
var Followers = Backbone.Collection.extend({
    model: User,
    url: "/followers"
});
Followers.fetch();
```

- Collection.fetch()[options])

集合的fetch()函数将发送一个GET请求到服务器来获取远程模型集。当模型数据从服务器返回后，该集合会刷新。

当模型数据从服务器返回时，它使用set来（智能地）合并获取的模型，除非传递{reset：true}，此时集合会被（有效地）重置。获取请求的服务器句柄应返回模型的JSON数组。