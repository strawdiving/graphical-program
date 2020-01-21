技术栈：

CSS: Bootstrap, jQuery-ui, jQuery,

后端：PHP

通讯：websocket，jQuery的Ajax

roslibjs，标准ROS Javascript库

roslibjs是用于从浏览器和ROS交互的核心JavaScript库。它使用WebSockets与rosbridge连接，并提供发布，订阅，服务调用，actionlib，TF，URDF解析和其他基本的ROS功能。 还需要导入必需的库EventEmitter，EventEmitter2是Node.js中的EventEmitter模块的实现，为ROS对象的事件提供事件监听。

http://wiki.ros.org/roslibjs

http://wiki.ros.org/roslibjs/Tutorials/BasicRosFunctionality



首页上，有add mission/create mission按钮，create mission按钮用于创建新mission，点击后，到创建mission的页面。

拖拽由jQuery-ui, jQuery实现，拖拽和放置的是一个dom element，没有使用SVG。

dragging: 

<li class="ui-draggable" style="display:none;"></li>

<li class="ui-state-highlight"></li>

drop:

<li class="ui-draggable" style="display:list-item;"></li>

左侧功能块，ul，id="ActionTypes",class="connectedSortable"

每个功能块

```html
<li class="ui-draggable" style="">

	<input type="hidden" name="action_type[]" value="100">

	<span class="title pull-left">Wait</span>

	<span class="delete-action pull-right">DELETE</span>

	<div class="clearfix"></div>

	<div class="parameters">

		<hr>

		<div class="form-group"> //每个参数选项都是一个form-group模块

			<label for="a76d4ef5f3f6a672bbfab2865563e530">Time</label>

			<input type="text" class="form-control" id="a76d4ef5f3f6a672bbfab2865563e530" name="action_textfield[]" value="5">

		</div>

	</div>

</li>

```

在左侧功能块上双击，或拖拽，即可在右侧加入功能块

右侧：整体是id="ActionListForm"，上方是mission的name, description等，下方是具体的mission编程模块 ul，id="ActionList", class="connectedSortable ui-sortable"

右侧加入的功能块，点击可展开/收起参数block。



:visible 选择器选取每个当前是可见的元素。

**除以下几种情况之外的元素即是可见元素：**

**• 设置为 display:none**

**• type="hidden" 的表单元素**

**• Width 和 height 设置为 0**

**• 隐藏的父元素（同时隐藏所有子元素）**



|                        |                                                              |                                               |
| ---------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| Wait                   | Time                                                         | text(5)                                       |
| If                     | Compare/Index/Operator/Value/True/False                      | selector/text/selector/text/selector/selector |
| Move To Known Position | Position/Retries(Blocked Path)/Distance to goal threshold    | selector/text/text                            |
| Move To Position       | X/Y/Orientation/Retries(Blocked Path)/Distance to goal threshold | 全text                                        |
| Relative Move          | X/Y/Orientation/Max Linear Speed/Max Angular Speed, Collision Detection | 全text，collision为selector                   |
| Taxi Move              | Position                                                     | selector                                      |
| Load MissionList       | MissionList                                                  | selector                                      |
| Bluetooth Relay        | Module/Port/Operation/Timeout                                | select/slider/select/text                     |
| Elevator Control       | Elevator Type/Address/Command/Wait For Completion            | text/text/text/select                         |
| Wait for Bluetooth     | Module/Port/Value/Timeout                                    | select/slider/select/text                     |
| Set PLC Register       | Register/Value                                               | text                                          |
| Wait For PLC Register  | Register/Value/Timeout                                       | text                                          |
| Create Path            | Start Position/Goal Position/Via Position 1~10/Planning time | select, 最后一个text                          |
| Catch Action           | MissionList/Max retries                                      | select/text                                   |
| Pickup Trolley         | Position/Trolley                                             | select                                        |
| Place Trolley          | Position/Reverse into place                                  | select/select                                 |

把之前设置的参数（位置、Trolley、Mission等）导入到select中，供之后的功能块选择