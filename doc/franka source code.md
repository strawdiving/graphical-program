## webpack打包模块

| index        | import                                                       | 用途                                                         |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 0/1/6        | lodash/Knockout/jQuery                                       |                                                              |
| 4            | util                                                         |                                                              |
| 7            | assert                                                       | assert.keys(，key1, key2, ...)，判断关键的key是否存在（第2~n个参数是否为undefined） |
| 8            | dialogs                                                      | dialog的类。基于Foundation的Reveal，即modal dialogs, 或弹出式窗口，包括用TextDialogTemplate（67），MessageDialogTemplate（68）来创建dialog |
| 11           | settings                                                     |                                                              |
| 12           | auth                                                         | 设置login，读写权限，以及权限处理                            |
| 14           | ko. extenders                                                | 该模块包含knockout extenders                                 |
| 15           | componentUtil                                                |                                                              |
| 18           | SkillElement                                                 |                                                              |
| 19           | com                                                          | 提供了和后端服务器交互的API。                                |
| 23           | Events                                                       | event emitter                                                |
| 24           | ElementAPI                                                   | element_api模块定义了接口类，它被传递给所有上下文菜单和其他元素脚本. 提供了一个用于状态机中脚本代码的定义良好的接口 |
| 25           | GroupElement                                                 |                                                              |
| 26           | components                                                   | makeComponentProviders，makeComponentProviderEntry，updateComponentProviders |
| 27           | Parameter                                                    |                                                              |
| 28           | Tether                                                       |                                                              |
| 29           | ComponentProviders，提供 ComponentLinkManager, ComponentProviderAPI,  isLinkedWith, isSourceFor, getSourceDataForSink ,resolveParameters | linkManager: Utility类，使用component provider entries 来 linking and unlinking skills ; providerAPI: 创建一个接口，为timeline element设置componentProvider 条目entries |
| 31           | window. BASE_URL "/desk", DESK_API "/desk/api", BUNDLE_RESOURCE_URL"/desk/bundles", | ADMIN_API"admin/api",  START_API "/startup/api"              |
| 33.Base64    | Base64                                                       |                                                              |
| 34           | Cookies                                                      |                                                              |
| 35           | Container                                                    |                                                              |
| 36           | parameterAPI/getParameter                                    | 使用可选的expression获取给定元素的可写的observable的参数。 如果给出expression字符串，则将其解析并用于仅返回子树，即参数的一部分 |
| 37           | expressions                                                  | 返回给定表达式字符串的参数访问器对象parameter accessor object |
| 38           | Timeline                                                     |                                                              |
| 39           | Matrix                                                       | Matrix便利函数，逆矩阵，点乘等操作                           |
| 40           | THREE                                                        |                                                              |
| 41.default   | ResizeObserver                                               | 42 polyfill库， js库,主要抚平不同浏览器之间对js实现的差异    |
| 43           | LibraryItem                                                  | 构建函数，及dragStart", "drag", "dragEnd", "dragHint", "appendElement“方法 |
| 44           | TimelineGroup                                                | components/workspace/timeline/group                          |
| 45           | TimelineSkill                                                | components/workspace/timeline/skill                          |
| 46           | ko.wrap                                                      |                                                              |
| 47           | SelectionHandler                                             |                                                              |
| 56           | 打包57                                                       | 最外层webpackJsonp调用 56                                    |
| 57           |                                                              | 57中加载登录页，创建controller、app实例，ko。applyBindings(app)，controller.connect() |
| 48~55，58~62 | 空                                                           |                                                              |
| 63           | Controller                                                   | 定义了一个简单的控制器，用于管理从app服务器接收的一个模型的客户端表现representation。 |
| 64           | ComponentLoader                                              | 自定义的component loader，加入到ko.components.loaders数组中，放在第一个，优先级高于default loader.                                 它在timeline中加载和管理groups和skills的所有上下文菜单组件，其中可用组件按层次结构进行范围化scoped hierarchically. |
| 65           | Keyboard                                                     | 键盘模块提供一种功能，利用该功能将一组语义事件semantic events映射到document上的关键事件 |
| 66           | WEBPACK VAR INJECTION                                        | Foundation                                                   |
| 67/68        | TextDialogTemplate/MessageDialogTemplate                     | 在dialogs（8）中使用来创建textDialog/messageDialog           |
| 69           | Library                                                      |                                                              |
| 70           | Group                                                        |                                                              |
| 71           | Skill                                                        |                                                              |
| 72           | OneAPI                                                       | 提供具有通用接口的上下文菜单，即非元素特定的功能，以与RACE.Core交互。 |
| 73           | poseDialog                                                   | 对话框，用于调整给定姿势并返回修改后姿势的promise。 参数和resolved promise都是4x4矩阵 stacked  column major into a flat array |
| 74           | poseDialog template                                          | pose dialog的模板，微调位姿的dialog                          |
| 75           | Pilot                                                        | 提供了注册和通知接受自服务端的 pilot 导航事件的功能          |
| 76           | Startup                                                      | 系统启动                                                     |
| 77           | processMonitor                                               | 过程监控。订阅admin服务器通过Web socket发布的进程监视器状态。 如果一个进程死了，可观察的`up`被设置为false |
| 78/79/80     | 由（57）调用                                                 |                                                              |
| 81           | App                                                          | app模块代表整个Web应用程序并提供类                           |
| 82           | 创建绑定                                                     | fullScreen,scroll,tether等                                   |
| 83           | 创建绑定                                                     | 创建新的绑定drag，drop，依赖DragDropApi（84）                |
| 84           | DragDropApi                                                  | 该模块提供了拖放的API。 有了它，可以创建Draggables和DropTargets |

| index       | import                                                       |                                                              |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 85/86/87    | component "arc-slider"   ——ArcSlider viewModel/style/template | 圆形滑块组件                                                 |
| 88/89/90    | component "linear-slider" ——LinearSlider viewModel/style/template | 线性滑块组件                                                 |
| 91/92/93    | component "checkbox-slider" ——CheckboxSlider viewModel/style/template | viewModel: makeAPIViewModel(CheckboxSlider) ，tmplate: "<style scoped>" + xxxStyle + "</style>" + xxxTemplate |
| 94/95/96    | component "toggle-slider"—— ToggleSlider viewModel/style/template | 同上                                                         |
| 97/99/100   | component "drop-down-menu" ——DropMenu viewModel/style/template | 同上                                                         |
| 98          | Dropdown List template                                       |                                                              |
| 101/102/103 | component "gripper" ——Gripper viewModel/style/template       | 同上                                                         |
| 104/107/108 | component "gripper-control" ——GripperControl viewModel/style/template | 同上                                                         |
| 105/106     | ![img](file://C:/Users/WURENJ~1.ZKX/AppData/Local/Temp/1531122753928.png?lastModify=1531956912) | ![img](file://C:/Users/WURENJ~1.ZKX/AppData/Local/Temp/1531122717230.png?lastModify=1531956912) |
| 109/110/111 | component "step-number" ——StepNumber viewModel/style/template | 同上                                                         |
| 112         | component "resource"—— Resource，无 markup、template         | viewModel: makeAPIViewModel(Resource) ，tmplate: "<style>resource { display: block; }</style>" |
| 113         | component"one-header" ——Header                               | 114/115/116 Header viewModel/style/template                  |
| 117         | component “one-robot-status”                                 | 118/119/120 RobotStatus style/template/viewModel（调用121~125） |
| 121         | SVG图形源代码![img](file://C:/Users/WURENJ~1.ZKX/AppData/Local/Temp/1531122515063.png?lastModify=1531956912)oneModeIcon | 122 ![img](file://C:/Users/WURENJ~1.ZKX/AppData/Local/Temp/1531122469970.png?lastModify=1531956912)robotModeIcon |
| 123         | ![img](file://C:/Users/WURENJ~1.ZKX/AppData/Local/Temp/1531122431919.png?lastModify=1531956912)zerogTranslationIcon | 124 ![img](file://C:/Users/WURENJ~1.ZKX/AppData/Local/Temp/1531122396599.png?lastModify=1531956912)zerogRotationIcon |
| 125         | ![img](file://C:/Users/WURENJ~1.ZKX/AppData/Local/Temp/1531122295711.png?lastModify=1531956912)zerogFreeIcon |                                                              |
| 126         | component "one-signal-light"                                 | 127/128/129 SignalLight style/template/viewModel             |
| 130         | component "one-library"，主模块，包含131,132                 | 136/137/138 Library viewModel/style/template                 |
| 131         | component "one-library-item"，viewModel：LibraryItem（43）的实例，template:132 | viewModel：通过43 LibraryItem创建LibraryItem实例，132 LibraryItem template |
| 133         | component "one-library-timeline"，viewModel：LibraryTimeline（134）的实例 | 134/135 LibraryTimeline/template                             |
| 139         | component "one-timeline", Timeline主模块，包含140,143,152,154,159,163组件 | 167/168/169 Timeline viewModel/style/template                |
| 140         | component "one-drop-zone"，viewModel：由createViewModel函数创建，在函数中创建DropZone实例 | 141/142 DropZone 模块/template                               |
| 143         | component "one-context-menu", 包含144                        | 145/150/151 ContextMenu viewModel/style(css)/template        |
| 144         | 自定义sandbox绑定，用于创建step的内容，143中使用             |                                                              |
| 146         | WEBPACK VAR INJECTION，145中使用                             |                                                              |
| 147         | StepNavigator, 145中使用                                     | 定义了stepNavigator类，可以使用`<step>`标签将DOM元素分组为多个部分 |
| 148         | franka svg图片，145中使用                                    |                                                              |
| 149         | Step(#continue) template                                     |                                                              |
| 152         | component "one-timeline-skill",viewModel: 45                 | 45/153 Timeline Skill viewModel/template                     |
| 154         | component "one-timeline-group",其中包含"one-container"(155)，viewModel：44 | 44/158 TimelineGroup viewModel/template                      |
| 155         | component "one-container"                                    | 156/157 Container template/viewModel                         |
| 159         | component "one-error-badge"                                  | 160/161/162 ErrorBadge viewModel/template/style              |
| 163         | component "one-selection-menu"                               | 164/165/166 selectionMenu viewModel/style/template           |
| 170         | component "one-execution-status"                             | 171/172/173 ExecutionStatus viewModel/style/template         |

knockout.js

webpack

## Controller