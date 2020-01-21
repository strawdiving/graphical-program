The controller module定义了一个简单的控制器，用于管理从app服务器接收的一个model的客户端表示

### Events

#### com Events

register: connected/disconnected

callback: onConnected/onDisconnected

#### ui Events

| register                                  | callback                                                     | callback by                  |
| ----------------------------------------- | ------------------------------------------------------------ | ---------------------------- |
| logInfo/logWarn/logError                  | onLogInfo/onLogWarn/onLogError                               | (120) RobotStatus            |
| libraryItemDragEnd/timelineElementDragEnd | onxxxx                                                       | Timeline: onDragEnd          |
| timelineElementDragStart                  | onxxx                                                        | TImeline: onDragSart         |
| timelineElementDrag/libraryItemDrag       | onxxx                                                        |                              |
| dropZoneCreated                           | onxxx                                                        | TImeline: registerDropZone   |
| dropZoneDisposed                          | onxxx                                                        | TImeline: unregisterDropZone |
| libraryItemDragStart                      | LibraryItem.dragStart/drag/dragEnd中，分别调用controller.uiEvents.notifyxxx |                              |
| timelineDragStart、timelineDragEnd        | LibraryItem.dragStart/dragEnd中，分别调用controller.uiEvents.notifyxxx |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |
|                                           |                                                              |                              |



#### nav Events

onConnected/onDisconnected

#### componentSink Events

currentComponentProvider/linkableComponentSinks/linkableComponentSources





| Controller                                                   | com                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| reloadTimeline                                               | onTimelineChanged                                            |
| onCreateTimeline                                             | createTimeline                                               |
| LibraryTimeline: handleSave, Timeline: handleSave            | copyTimeline                                                 |
| LibraryTimeline: handleRename                                | renameTimeline                                               |
| LibraryTimeline: handleDelete, Timeline: handleDelete        | deleteTimeline                                               |
| LibraryItem: appendElement, DropZone: drop                   | insertElement                                                |
| DropZone: drop                                               | moveElement                                                  |
| TimelineGroup: handleRename ,TimelineSkill: endRename, selectionHandler.rename | renameElement                                                |
| TimelineGroup.handleDelete, TimelineSkill.handleDelete       | deleteElement                                                |
| selectionHandler.remove                                      | deleteElements                                               |
| selectionHandler中setEnabled函数调用                         | setElementsEnabled                                           |
| Controller.saveUpdatedParameters                             | saveParameters                                               |
| Header.startExecution                                        | startExecution                                               |
| Header.stopExecution                                         | stopExecution                                                |
| Header.killExecution                                         | killExecution                                                |
| ErrorBadge.continueExecution                                 | continueExecution                                            |
| ErrorBadge.restartGroup, ErrorBadge.restartContainer         | restartExecution                                             |
| Library.onFileDropped                                        | installArchive                                               |
| Library.onFileDropped                                        | synchronizeBundles                                           |
| LibraryTimeline.handleDownload                               | exportTimeline                                               |
| LibraryTimeline.share                                        | shareTimeline                                                |
| Pilot构造函数中，Pilot.colorsOff                             | setPilotColors                                               |
| RobotStatus.setTranslationMode/setRotationMode/setFreeMode/setUserMode/disableUserGuiding | setGuidingMode                                               |
| RobotStatus.updateGuiding                                    | setGuidingConfiguration                                      |
| RobotStatus.disableUserGuiding                               | deleteGuidingConfiguration                                   |
| Controller.shutdown                                          | shutdown                                                     |
| Controller.reboot                                            | reboot                                                       |
| RobotStatus.toggleBrakes                                     | openBrakes/closeBrakes                                       |
| RobotStatus.resetErrors/unfold                               | resetErrors                                                  |
| RobotStatus.resetErrorsManually                              | resetErrorsManually                                          |
| Startup.checkStatus                                          | getIsStartupRunning                                          |
| Startup.reboot                                               | rebootStartup                                                |
| Startup.shutdown                                             | shutdownStartup                                              |
| com.onSkillsChanged~onProcessStatus                          | createWS                                                     |
| Controller.connect中，加入到controller的subs中               | onSkillsChanged/onGroupsChanged/onTimelinesChanged/onExecutionChanged |
| Controller.reloadTimeline中，加入timelineSubs中              | onTimelineChanged                                            |
| Pilot构造函数中，创建onNavigationEventReceived的实例         | onNavigationEventReceived                                    |
| RobotStatus构造函数中，加入subs中                            | onNavigationModeChanged                                      |
|                                                              | onNavigationModeChanged/onRobotStatusReceived/onGuidingConfigurationChanged/onSystemStatusReceived/onGuidingModeChanged |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |

