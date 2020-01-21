## com模块

com模块中使用fetch()，Fetch API使用Promise，因此是一种简洁明了的API，比XMLHttpRequest更加简单易用 

Promise

|                                          |                                                              |                                                              |
| ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| getSkills                                | GET(DESK_API + "/skills")                                    | 获取所有可用的skills                                         |
| getGroups                                | GET(DESK_API + "/groups").                                   | 获取所有可用的groups                                         |
| getTimelines                             | GET(DESK_API + "/timelines")                                 | 获取所有可用的timelines.                                     |
| getTimeline(timelineID)                  | GET(DESK_API + "/timelines/" + timelineID)                   | 获取给定timelineID的时间轴timeline                           |
| getNavigationMode                        | GET(DESK_API + "/navigation/mode")                           | 获取当前的navigation模式                                     |
| createTimeline(name)                     | POST(DESK_API + "/timelines", { body: {   name: name } })    | 用给定的名字创建一个新的，空的timeline                       |
| copyTimeline(id,name)                    | POST(DESK_API + "/timelines", { body: {   id: id,   name: name } }) | 复制指定id的timeline，并用新名字保存                         |
| renameTimeline(id,name)                  | PUT(DESK_API + "/timelines/" + id, { body: {   name: name } }) | 重命名指定id的timeline                                       |
| deleteTimeline(id)                       | DELETE(DESK_API + "/timelines/" + id)                        | 删除指定id的timeline                                         |
| insertElement (id, path)                 | POST(DESK_API + "/timelines/" + pathToString(path), { body: {   id: id } }) | 将由id 引用的library item 插入到指定path的timeline (element)中 |
| copyElement (from, to)                   | POST(DESK_API + "/timelines/" + pathToString(to), { body: {   from: pathToString(from) } }) | 拷贝由"from" path指定的timeline元素, 到由"to" path指定的timeline(elment) |
| moveElement (from, to, policy)           | POST(DESK_API + "/timelines/" + pathToString(to), { body: {   from: pathToString(from),   move: true,   policy: policy }}) | 移动由"from" path指定的timeline元素, 到由"to" path指定的timeline(elment) |
| renameElement (path, name)               | PUT(DESK_API + "/timelines/" + pathToString(path), { body: {   name: name } }) | 由path引用的timeline element重命名为给定名称                 |
| deleteElement(path)                      | DELETE(DESK_API + "/timelines/" + pathToString(path))        | 删除由path引用的timeline element                             |
| deleteElements(paths)                    | DELETE(DESK_API + "/timelines", { body: {   paths: JSON.stringify(paths) } }) | 删除由paths 引用的timeline element                           |
| setElementEnabled (path, enabled)        | PUT(DESK_API + "/timelines/" + pathToString(path), { body: {   enabled: enabled } }) | Enable或disable给定的path指向的timeline element              |
| setElementsEnabled (parameters)          | PUT(DESK_API + "/timelines", { body: {   parameters: JSON.stringify(parameters) } }) | Enable或disable多个elements，参数必须是包含路径和启用字段的对象的数组 |
| saveParameter (path, parameter)          | PUT(DESK_API + "/timelines/" + pathToString(path), { body: {   parameter: JSON.stringify(parameter) } }) | 保存给定timeline元素的参数。 因此，给定path必须指向timeline中的a skill link或group element |
| getExecution                             | GET(DESK_API + "/execution")                                 | 获取当前的execution状态                                      |
| startExecution(timelineId)               | POST(DESK_API + "/execution", { body: {   id: timelineId } }) | 启动给定ID的timeline的execution                              |
| stopExecution                            | DELETE(DESK_API + "/execution")                              | 停止当前正在执行的execution                                  |
| killExecution                            | DELETE(DESK_API + "/execution", { body: { force: true } }) kills a currently running execution |                                                              |
| continueExecution                        | POST(DESK_API + "/execution/continue")                       | 通过continuing last active skill来退出错误处理               |
| restartExecution(path)                   | POST(DESK_API + "/execution/restart", { body: {   restartPath: pathToString(path) } }) | 通过restarting the provided path来退出错误处理               |
| installArchive (archive)                 | POST(DESK_API + "/bundles", {   headers: { "content-type": "application/octet-stream" },   body: archive }) | installArchive 将传递的文件上传到服务器，该文件必须是有效的包含skill bundle(s)的archive存档 |
| synchronizeBundles                       | POST(DESK_API + "/bundles/synchronize")                      | 在服务器上调用a bundle synchronization同步                   |
| exportTimeline(timelineID)               | window.location = DESK_API + "/bundles/export/" + timelineID | 从服务器下载一个包含一个指定id的task bundle的archive         |
| shareTimeline (timelineID)               | POST(DESK_API + "/bundles/share/" + timelineID)              | 从服务器下载一个包含一个指定id的task bundle的archive         |
| saveComponentProviders(path, providers)  | PUT(DESK_API + "/timelines/" + pathToString(path), { body: {   componentProviders: JSON.stringify(providers) } }) | 保存给定timeline element的componentProviders. 因此给定的path必须指向timeline上的一个skill link或group element |
| saveParameters(parameterUpdates)         | PUT(DESK_API + "/timelines", { body: {   parameters: JSON.stringify(parameterUpdates) } }) | 更新多个parameters和component provider的entries              |
| setPilotColors (config)                  | POST(DESK_API + "/robot/pilot_colors", { body: {   colors: JSON.stringify(config) } }) | 保存Pilot上的color配置                                       |
| setGuidingMode(mode)                     | PUT(DESK_API + "/robot/guiding/mode", { body: {   mode: JSON.stringify(mode) } }) | Set the guiding mode                                         |
| setGuidingConfiguration  (configuration) | PUT(DESK_API + "/robot/guiding/configuration", { body: {   configuration: JSON.stringify(configuration) } }) | Set the user guiding configuration                           |
| deleteGuidingConfiguration               | DELETE(DESK_API + "/robot/guiding/configuration")            | Delete the user guiding configuration                        |
| shutdown                                 | fetch_(ADMIN_API + "/shutdown", { method: "POST" })          | Shut down the master controller                              |
| reboot                                   | fetch_(ADMIN_API + "/reboot", { method: "POST" })            | Reboot the master controller                                 |
| openBrakes                               | POST(DESK_API + "/robot/open-brakes"                         | Open the brakes of the robot                                 |
| closeBrakes                              | POST(DESK_API + "/robot/close-brakes"                        | Close the brakes of the robot                                |
| resetErrors                              | POST(DESK_API + "/robot/reset-errors"                        | Reset the robot errors automatically                         |
| resetErrorsManually                      | POST(DESK_API + "/robot/reset-errors-manually"               | Reset the robot errors manually                              |
| getIsStartupRunning                      | STARTUP_API + "/phase"                                       | Check if the startup server is running                       |
| rebootStartup                            | POST(STARTUP_API + "/reboot")                                | Reboot the master controller during startup phase            |
| shutdownStartup                          | POST(STARTUP_API + "/shutdown")                              | Shut down the master controller during startup phase         |
| createWS (url, config)                   |                                                              | 创建具有reconnect行为和JSON解析的WebSockets                  |
| onSkillsChanged(args)                    | dispose: com.createWS(DESK_API + "/skills", args).close      | 订阅`skillsChanged`事件.使用一个带有回调的config对象来通知接收了一个更新(`args.onData`),成功的连接(`args.onOpen`) 及订阅的结束(`args.onClose`).  返回一个用以结束订阅的对象. |
| onGroupsChanged                          | DESK_API + "/groups"                                         |                                                              |
| onTimelinesChanged                       | DESK_API + "/timelines"                                      |                                                              |
| onTimelineChanged                        | DESK_API + "/timelines/" + timelineID                        |                                                              |
| onExecutionChanged                       | DESK_API + "/execution"                                      |                                                              |
| onNavigationEventReceived                | DESK_API + "/navigation/events"                              |                                                              |
| onNavigationModeChanged                  | DESK_API + "/navigation/mode",                               |                                                              |
| onSystemStatusReceived                   | DESK_API + "/system/status"                                  |                                                              |
| onRobotStatusReceived                    | DESK_API + "/robot/status"                                   |                                                              |
| onRobotConfigurationReceived             | DESK_API + "/robot/configuration"                            |                                                              |
| onGripperStateReceived                   | createWS(DESK_API + "/robot/gripper_state", args)            |                                                              |
| onGripperHardwareStateReceived           | DESK_API + "/gripper/hardware"                               |                                                              |
| onPilotHardwareStateReceived             | DESK_API + "/pilot/hardware"                                 |                                                              |
| onBaseHardwareStateReceived              | DESK_API + "/base-leds/hardware"                             |                                                              |
| onGuidingModeChanged                     | DESK_API + "/robot/guiding/mode"                             |                                                              |
| onGuidingConfigurationChanged            | DESK_API + "/robot/guiding/configuration"                    |                                                              |
| onNotification                           | DESK_API + "/notification"                                   |                                                              |
| onProcessStatus                          | ADMIN_API + "/processes"                                     |                                                              |
| getProcessStatus                         | GET(ADMIN_API + "/processes")                                |                                                              |
| getModbusConfiguration                   | GET(DESK_API + "/modbus/values")                             |                                                              |
| fetchBundleResource                      | BUNDLE_RESOURCE_URL + (_.startsWith(url, "/") ? url : "/" + url) | Bundle resource access                                       |