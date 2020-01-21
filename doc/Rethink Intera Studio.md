http://mfg.rethinkrobotics.com/intera/Intera_Studio

有一个图形用户界面，可以让你训练机器人 。使用我们行业领先的train-by-demonstration 功能，任何人都可以直接与机器人的手臂交互，轻松地train tasks 。 Intera具有强大的用户界面Intera Studio，可让用户访问机器人tasks并从笔记本电脑端微调task的细节。Intera Studio使您能够快速创建，修改和监视tasks，同时获得控制机器人的高级功能。

 Intera Insights直接在机器人上提供关键的生产指标， 并且可以在它们成为问题之前识别生产异常 .关键性能指标，例如循环时间和零件计数，可在工厂现场实时访问。 相同的可自定义数据也会提供给Intera Studio，从而为其他团队成员提供可视性。 

Sawyer手臂内置嵌入式康耐视 Cognex 视觉系统，可让机器人定位物体或检查零件存在。 该视觉系统使机器人定位系统（RPS）能够在机器人环境中寻找变化，并自动响应工作单元的变化。 

Rethink提供完全集成的cobot解决方案：机器人手臂，Intera软件平台，ClickSmart夹具技术，嵌入式视觉，力感应和实时生产水平指标。 

### 步骤

Sawyer机器人和PC连到同一个局域网，DHCP服务器自动为机器人分配IP，将PC设置为接受来自网络服务器的IP地址。

Sawyer：头部屏幕记录Sawyert的IP地址。![1531724797804](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531724797804.png)

浏览器地址窗口中输入Sawyer的IP和端口号 169.254.59.121：3000，浏览器中显示Intera Studio。

![1531719304943](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531719304943.png)

左下角：链接Sawyer和Intera Studio，点击请求Sawyer控制。

![1531724603332](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531724603332.png)

Sawyer头部屏幕上点击“Grant"，机器人和Intera Studio连接，左下方的控件变绿。

![1531724675973](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531724675973.png)

连接成功后，新建任务

### Menu

![img](http://mfg.rethinkrobotics.com/intera-mediawiki-1.22.2/images/thumb/e/e8/Studio_Menu.png/200px-Studio_Menu.png) 

|                                                              |                                       |                                                              |
| ------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------ |
| Actions                                                      |                                       |                                                              |
| ![1531711510108](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531711510108.png) | **Move To Node**                      | Set a move and how to move to it. Move To Node用于将arm从其当前配置移动到目标配置 ， Move To Node不仅包含有关移动时手臂所需配置的信息，  还有关于手臂将如何移动到指定位置和方向的信息。 |
| ![1531711688500](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531711688500.png) | **Set To Node**                       | Set a variable for a variable or signal. 用于设置信号和变量的值 。 通过在选择第一个变量后单击+栏，可以使用单个Set To节点设置多个信号。 |
| ![1531711835144](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531711835144.png) | **Wait Node**                         | Wait节点运行x秒。它总能返回成功。它永远不会失败或返回错误。  |
| ![1531719496069](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531719496069.png) | **Wait Until Node**                   | Wait Until节点一直运行，直到指定变量的值等于指定值，或者直到超时为止。 |
| Logic                                                        |                                       |                                                              |
| ![1531711347291](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531711347291.png) | **Sequence Node**                     | 按顺序一个接一个地执行。 序列节点按顺序从上到下运行其子节点。 |
| ![1531712992167](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531712992167.png) | **Priority Node**                     | 按顺序一个接一个地执行，任何一个成功或全部失败后返回。 默认情况下，Priority节点按顺序运行其子节点，直到一个返回成功，此时Priority节点将停止运行并将success返回给它的父节点 , 这意味着Priority的其他子分支都不会在该循环上运行 , 如果所有子项都有机会运行且没有一个成功，则该节点将向其父节点返回failure。 |
| ![1531719761844](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531719761844.png) | **Parallel Node**                     | 同时运行它的子节点 。 这与序列或优先级节点（一次只运行一个孩子）形成对比， |
| ![1531713129506](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531713129506.png) | **do if Node**                        | 用于检查条件，并且只有在条件为真时才执行特定逻辑。 如果Do If节点的条件为false，则Do If节点将返回失败。与Loop If节点不同，它不会循环其子节点，即子节点最多运行一次并返回。 |
| ![1531712052875](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531712052875.png) | **Loop If Node**                      | Loop If节点仅在定义的条件为真时用于循环。 只要条件成立，就重复执行。 |
| ![1531720207964](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531720207964.png) | **Loop Node**                         | Loop节点用于按顺序运行其子节点并重复，直到达到指定的最大计数。 |
| Service                                                      |                                       |                                                              |
| ![1531720442793](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531720442793.png) | **Vision Locate Node**                | 查找并跟踪受过训练的快照的位置。 用于执行基于视觉的行为，通常识别在摄像机视野内训练的快照的位置（或位置）并相应地更新定位器框架。 |
| ![1531720539874](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531720539874.png) | **Vision Inspect Node**               | 用于执行基于视觉的行为，通常查找是否存在经过训练的快照       |
| ![1531720333524](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531720333524.png) | **Catch Error & Error Handler Nodes** | 指定错误的自定义处理。                                       |
| ![1531718520961](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531718520961.png) | **Throw Error Node**                  | Throw Error节点可用于抛出用户指定的错误。                    |
| ![1531718881007](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531718881007.png) | **View all templates**                | 查看全部并选择Rethink Robotics或自定义模板。                 |



| Task Bar        | ![1531720670268](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531720670268.png) |      |
| --------------- | ------------------------------------------------------------ | ---- |
| Node Editor     | 用于显示和编辑所选节点的属性。  可以通过选择节点然后单击任务栏中的“ Node Inspector  ”按钮来访问节点编辑器。也可以通过双击“ Behavior Tree Editor ”中的任何节点来访问它。 |      |
| Joints          | 显示每个Sawyer关节的旋转范围和当前旋转位置（7个slider）。 Sawyer的关节从底部向上依次编号为J0~J6。 |      |
| Frames          |                                                              |      |
| Vision          |                                                              |      |
| Tools           | Tooling Gallery是为机器人上保存的特定任务创建的所有End of Arm工具的主存储库。 |      |
| Signals         | 用于配置和管理通过连接设备与机器人通信的外部信号。 列出所有信号(Name,Current Value, Device)，点击一个，可打开Edit Signal page，改变名称和默认值 |      |
| Device Editor   | 用于配置和管理与机器人通信的外部信号设备。  **Name**: User defined device name， **Status**: Current connection Status shown by a Green or Red indicator. |      |
| User Variables  | 用于创建，编辑和删除用户生成的变量。 变量可用于多种用途，其中一种更常见的是用于控制任务中逻辑流的计数器和标志 。 使用Set To节点设置变量，并使用Do If和Wait Until节点根据变量的值进行决策。 |      |
| Shared Data     | 存储工作区中每个项目的所有数据 。 显示变量和信号的当前状态，无论是由系统还是用户创建。  可以独立于行为编辑器直接从共享数据查看和设置某些变量。例如，当用户添加信号，创建端点或创建循环节点时，变量会自动添加到共享数据。 |      |
| Log             | 显示机器人经历过的错误消息和其他错误信息，最新消息。         |      |
| Intera Insights | Intera Insights将Sawyer机器人屏幕转换为可自定义的数据，图形和关键性能指标（KPI）显示，charts显示 |      |

# BEHAVIOR EDITOR

## BEHAVIOR TREE

行为编辑器用于创建，查看和编辑任务中的所有节点。 节点及其相互之间的关系称为行为树。 任务的结构是激活父节点和子节点之间从左到右分支的节点，以及兄弟节点之间从上到下的节点 。双击节点将打开节点检查器node inspector ，可在其中编辑节点的属性。 

## NODE COLORS

橙色 - 已选择：节点已选中，如果节点打开，则其属性将显示在节点编辑器中。 

蓝色 - 未完成：尚未为此节点输入所需信息。当一个或多个节点为蓝色时，任务将不会运行。 

黑色 - 非活动：非活动节点未运行，但如果其父节点有机会开始运行，则可以变为活动节点。 

灰色 - 禁用：禁用的节点及其子节点（如果有的话）被其父节点忽略，因此永远不会运行。 

绿色 - 正在运行：节点当前正在run中执行，它处于活动状态，直到它成功，失败或遇到错误。 

## ADDING NODES TO THE TREE

可以从节点选项板 node palette 或右键单击树中将节点添加到树中。 

使用节点选项板时，首先选择要添加新节点的节点，然后从要插入的选项板中单击节点类型。 如果所选节点是复合节点（这意味着它可以具有子节点），则新节点将作为所选节点的子节点添加到分支的底部。 如果它是基元（这意味着它不能具有子节点），则新节点将作为所选节点的兄弟添加在分支的底部。 

右键单击节点允许添加新节点作为父节点或在所选节点的正上方或下方添加兄弟节点。 

**node palette方式**：根据选中node的type（复合composite/基元Primitive）,判断添加的节点是作为其子节点还是兄弟节点，从而将新节点添加到适当的位置。

**右键单击方式**：可以将新节点添加为父节点、子节点、上方/下方的兄弟节点

![img](http://mfg.rethinkrobotics.com/intera-mediawiki-1.22.2/images/thumb/b/be/RightClick.PNG/260px-RightClick.PNG) 

#### 笛卡尔视图

![1531723240335](C:\Users\WURENJ~1.ZKX\AppData\Local\Temp\1531723240335.png)

笛卡尔视图主要用于通过单击相应轴上的向上或向下箭头来增加Sawyer的位置（x，y，z）或旋转（Rx，Ry，Rz） 。默认增量值为5 mm。此外，可以在笛卡尔视图中键入特定坐标，以将机器人移动到指定的坐标。 单击相应的轴并开始键入有效数字。笛卡尔视图可用于在工作空间中移动机器人，或编辑已在任务中创建的移动到Move To Node。 

