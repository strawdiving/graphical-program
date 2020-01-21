webpackJsonp([0],[
/* 0 */,
/* 1  ko, knockout.js前端UI库，MVVM 模式*/,
/* 2 */,
/* 3 */,
/* 4 util*/
/***/ (function(module, exports, __webpack_require__) {

var _ = __webpack_require__(0) // Lodash
var $ = __webpack_require__(6)  // jQuery
var ko = __webpack_require__(1) // Knockout

__webpack_require__(14)

        // util
var util = module.exports = {}

util.isNode = function isNode(o) {
  if (Node !== undefined) {
    return o instanceof Node
  }
  return o && typeof o === "object" &&
         typeof o.nodeType === "number" &&
         typeof o.nodeName === "string"
}

util.isElement = function isElement(o) {
  if (HTMLElement !== undefined) {
    return o instanceof HTMLElement
  }
  return o && typeof o === "object" &&
         o.nodeType === 1 &&
         typeof o.tagName === "string"
}

util.updateObservableArray = function(observable, newArray, newFun, updateFun) {
  var oldArray = ko.unwrap(observable)
  observable(_.map(newArray, function(obj, i) {
    var oldObj = _.findWhere(oldArray, { id: obj.id })
    if (oldObj) {
      updateFun(oldObj, obj, i)
      return oldObj
    } else {
      return newFun(obj, i)
    }
  }))
}

util.extendPath = function(path, index) {
  if (!path) {
    return path
  }
  var indices = path.indices.slice()
  indices.push(index)
  return {id: path.id, indices: indices}
}

util.sameParent = function(path1, path2) {
  if (path1.id !== path2.id || path1.indices.length !== path2.indices.length) {
    return false
  }
  for (var i = 0; i < path1.indices.length - 1; i++) {
    if (i >= path2.indices.length || path1.indices[i] !== path2.indices[i]) {
      return false
    }
  }
  return true
}

util.leftOf = function(path1, path2) {
  return util.sameParent(path1, path2) &&
    path1.indices[path1.indices.length - 1] < path2.indices[path2.indices.length - 1]
}
// markup字符串转成html body中所有节点的数组
util.parseHTML = function(markup) {
  // 创建新的document实现
  var doc = document.implementation.createHTMLDocument()
    //插入一段需要转化的html
  doc.body.innerHTML = markup
  return doc.body.children
}

util.loadCommonJS = function(script, context, modules) {
  var result
  // TODO: scripts have access to window!
  _.extend(window, context)
  modules = modules || {}
  window.require = function(name) {
    return modules[name]
  }
  window.module = {exports: {}}
  window.exports = window.module.exports
  try {
    /* jshint evil: true */
    var res = new Function(script)()
    if (res) {
      result = res
    } else if (window.module.exports || window.exports) {
      result = window.module.exports || window.exports
    }
  } finally {
    _.each(context, function(v, k) {
      delete window[k]
    })
    delete window.require
    delete window.module
    delete window.exports
  }
  return result
}

// TODO: doc: param elements - list of html elements
// Execute <script> tags in a CommonJS-like environment. This function returns
// 'module.exports' of the last script which defined it.
util.loadScriptsCommonJS = function(elements, context, modules) {
  var result
  function loadScript(index, script) {
    result = util.loadCommonJS(script.innerHTML, context, modules)
  }
  $(elements).filter("script").each(loadScript)
  $(elements).find("script").each(loadScript)
  return result
}

// 遍历timeline中包含的所有元素， and call the provided callback
// with the current element's path and (unwrapped) componentProviders.
util.traverseComponentProviders = function(timeline, callback) {
  util.traverseTimeline(timeline, function(path, element) {
    var componentProviders = ko.unwrap(element.componentProviders)
    callback(path, componentProviders)
  })
}

function loadComponentNames(html, componentNames) {
  var names = []
  _.each(html, function(element) {
    if (element.tagName && _.contains(componentNames, element.tagName.toLowerCase())) {
      names.push(element.tagName.toLowerCase())
    }
    names = names.concat(loadComponentNames(element.children, componentNames))
  })
  return _.unique(names)
}

util.contextMenuComponents = function(contextMenu, stepId, componentNames) {
  var names = []
  _.each(contextMenu, function(element) {
    if (_.isString(element)) {
      element = _.first(util.parseHTML(element))
    }
    if (element.tagName && element.tagName.toLowerCase() === "step" &&
        element.id === stepId) {
      names = loadComponentNames(element.children, componentNames)
    }
  })
  return names
}

util.getUnconfiguredPaths = function(timeline) {
  var unconfigured = []
  if (timeline) {
    util.traverseTimeline(timeline, function(path, element) {
      if (ko.unwrap(element.enabled) && util.containsNull(ko.unwrap(element.parameter.value))) {
        unconfigured.push(path)
      }
    })
  }
  return unconfigured
}

util.traverseElements = function(elements, fn) {
  _.forEach(ko.unwrap(elements), function(e) {
    traverse(ko.unwrap(e.path), e, fn)
  })
}

function traverse(path, object, fn) {
  if (object.elements) { // object is container
    _.forEach(ko.unwrap(object.elements), function(element, i) {
      traverse(util.extendPath(path, i), element, fn)
    })
  } else {  // object is element
    fn(path, object)
    if (object.containers) { // object is group
      _.forEach(ko.unwrap(object.containers), function(container, i) {
        traverse(util.extendPath(path, i), container, fn)
      })
    }
  }
}

// 遍历timleine包含的所有元素， and call the
// provided callback with the current element's path and the element
// itself.
util.traverseTimeline = function(timeline, callback) {
  traverse({id: timeline.id, indices: []}, timeline, callback)
}

util.containsNull = function(thing) {
  if (thing === null) {
    return true
  }
  // Mapping strings results in endless recursion
  if (_.isString(thing)) {
    return false
  }
  return _.any(thing, util.containsNull)
}

util.parseImage = function(image) {
  var html = $.parseHTML(ko.unwrap(image))
  var images = {icon: ""}
  $(html).filter("svg").each(function(i, svg) {
    if (svg.id) {
      images[svg.id] = svg.outerHTML
    } else {
      images.icon = svg.outerHTML || ""
    }
  })
  return images
}

/**
 * 返回observables的proxy代理对象,基本上，这样的代理是一个对象，其值与构造时传递的observable值the observable passed at * construction相同。但是，在写入时，the passed observable不会更改，但写入的值会在内部存储。 然后代理提供'isDirty'方法和'reset'方法。
 */
util.makeObservableProxy = function(observable) {
  var updatedObservableValue = ko.observable()
  var proxy = ko.pureComputed({
    read: function() {
      var val = updatedObservableValue()
      return val === undefined ? _.cloneDeep(observable()) : val
    },
    write: function(newValue) {
      updatedObservableValue(newValue)
    }
  })
  proxy.isDirty = function() {
    return updatedObservableValue() !== undefined && !_.isEqual(updatedObservableValue(), observable())
  }
  proxy.reset = function(resetValue) {
    if (resetValue !== undefined) {
      observable(resetValue)
    }
    updatedObservableValue(undefined)
  }
  return proxy
}

/**
 * 如果数组以目标数组开头，则返回true.Returns true if the array starts with the target array
 */
util.isPrefix = function isPrefix(target, array) {
  if (array.length <= target.length) {
    return false
  }
  return _.isEqual(target, array.slice(0, target.length))
}


/***/ }),
/* 5 */,
/* 6 */,
/* 7 assert*/
/***/ (function(module, exports, __webpack_require__) {

  // assert
module.exports = assert

var _ = __webpack_require__(0)

function assert(condition, message) {
  if (!condition) {
    throw new Error(message === "undefined" ? "Assertion failed" : message)
  }
}

assert.keys = function(object) {
  var required = Array.prototype.slice.call(arguments, 1)
  _.map(required, function(key) {
    assert(object[key] !== undefined, "Missing key '" + key + "'")
  })
}


/***/ }),
/* 8 dialogs*/
/***/ (function(module, exports, __webpack_require__) {
var dialogs = module.exports = {}

var _ = __webpack_require__(0)
var $ = __webpack_require__(6)
var ko = __webpack_require__(1)

// 需要dist version 并让它泄漏到窗口leak to window，因为一些功能PhantomJS不支持。
// This can be changed as soon as we have a compiling build as well
__webpack_require__(66)

        // Foundation: 响应式框架， Reveal: modal对话框或pop-up窗口
var Foundation = window.Foundation

// TODO(SN): Foundation Reveal broken!!! again
Foundation.Reveal.prototype.destroy = function destroy() {
  var zfPlugin = this.$element.data("zfPlugin") // save data entry, gets deleted with overlay hiding
  if (this.options.overlay) {
    this.$overlay.hide().off().remove();
  }
  this.$element.data("zfPlugin", zfPlugin) // restore data entry
  this.$element.hide().off();
  this.$anchor.off(".zf");
  $(window).off(".zf.reveal:" + this.id);

  Foundation.unregisterPlugin(this);
}

var TextDialogTemplate = __webpack_require__(67)
var MessageDialogTemplate = __webpack_require__(68)

ko.bindingHandlers.hasSelectedFocus = {
  init: ko.bindingHandlers.hasFocus.init,
  update: function(element, valueAccessor) {
    ko.bindingHandlers.hasFocus.update.apply(this, arguments)
    var selected = ko.utils.unwrapObservable(valueAccessor())
    if (selected) {
      element.select()
    }
  }
}

function MessageDialogViewModel(config) {
  this.icon = config.icon
  this.title = config.title
  this.text = config.text
  this.buttons = config.buttons
}

MessageDialogViewModel.prototype.onKeyDown = function(self, event) {
  if (event.which === 13) {
    var defaultButton = _.find(self.buttons, function(b) { return b.isDefault })
    if (defaultButton) {
      event.preventDefault()
      self.onClick(defaultButton)
    }
  } else if (event.which === 27) {
    var cancelButton = _.findIndex(self.buttons, function(b) { return b.isCancel })
    if (cancelButton) {
      event.preventDefault()
      self.onClick(cancelButton)
    }
  }
}

MessageDialogViewModel.prototype.onClick = function(button) {
  var callback = button.onClick || _.noop
  return callback()
}

function TextDialogViewModel(config, dialog) {
  _.bindAll(this, "okClicked", "cancelClicked")
  this.title = config.title
  this.text = config.text
  this.onOk = config.onOk || _.noop
  this.onCancel = config.onCancel || _.noop

  this.focusText = ko.observable(false)

  $(dialog.element).on("open.zf.reveal", this.focusText.bind(this.focusText, true))
  $(dialog.element).on("keydown", function(event) {
    if (event.which === 13) {
      event.preventDefault()
      this.okClicked(this.text)
    } else if (event.which === 27) {
      event.preventDefault()
      this.cancelClicked()
    }
  }.bind(this))
}

TextDialogViewModel.prototype.okClicked = function() {
  this.onOk(this.text)
}

TextDialogViewModel.prototype.cancelClicked = function() {
  this.onCancel()
}

var activeDialog = ko.observable(false)

function Dialog(template) {
  this.element = $.parseHTML(template)[0]
}
dialogs.Dialog = Dialog

Dialog.prototype.show = function(viewModel, onClose) {
  document.body.appendChild(this.element)
  var dialogElement = $(this.element)
  this.reveal = new Foundation.Reveal(dialogElement)
  dialogElement.on("open.zf.reveal", function() {
    // Defer setting activeDialog to get correct behaviour
    // if a dialog is closed and immediately a new one is opened
    _.defer(function() {
      activeDialog(this)
    }.bind(this))
  }.bind(this))
  dialogElement.on("closed.zf.reveal", function() {
    onClose()
    // We defer any DOM cleanup operations until our close handler is
    // finished because we must not delete any reveal stuff while
    // reveal is closing the dialog.
    _.defer(function() {
      this.reveal.destroy()
      ko.removeNode(this.element)
      activeDialog(null)
    }.bind(this))
  }.bind(this))
  ko.applyBindings(viewModel, this.element)
  this.reveal.open()
}

Dialog.prototype.close = function() {
  this.reveal.close()
}

dialogs.showMessageDialog = function(config) {
  this.close()
  return new Promise(function(resolve) {
    var dialog = new Dialog(MessageDialogTemplate)
    config = _.cloneDeep(config)
    config.buttons = config.buttons || [{ id: "ok", label: "OK", isDefault: true }]
    var buttonClicked = false
    _.forEach(config.buttons, function(button) {
      button.onClick = function() {
        resolve(button.id || button.label)
        buttonClicked = true
        dialog.close()
      }
    })
    var viewModel = new MessageDialogViewModel(config)
    dialog.show(viewModel, function() {
      if (!buttonClicked) {
        var cancelButton = _.findIndex(config.buttons, function(b) { return b.isCancel })
        if (cancelButton && cancelButton.onClick) {
          cancelButton.onClick()
        }
      }
    })
  })
}

dialogs.showTextDialog = function(title, defaultValue, onOk, onCancel) {
  return new Promise(function(resolve) {
    var dialog = new Dialog(TextDialogTemplate)
    var config = {
      title: title,
      text: defaultValue,
      onOk: function(text) {
        if (onOk) {
          onOk(text)
        }
        resolve("ok", text)
        buttonClicked = true
        dialog.close()
      },
      onCancel: function() {
        if (onCancel) {
          onCancel()
        }
        resolve("cancel")
        buttonClicked = true
        dialog.close()
      }
    }
    var buttonClicked = false
    var viewModel = new TextDialogViewModel(config, dialog)
    dialog.show(viewModel, function() {
      if (!buttonClicked) {
        config.onCancel()
      }
    })
  })
}

dialogs.showYesNoDialog = function(title, onYes, onNo) {
  var config = {
    title: title,
    buttons: [{ id: "yes", label: "Yes", isDefault: true },
              { id: "no", label: "No", isCancel: true }
             ]
  }
  return dialogs.showMessageDialog(config)
    .then(function(id) {
      if (id === "yes" && onYes) {
        onYes()
      } else if (id === "no" && onNo) {
        onNo()
      }
      return id
    })
}

dialogs.close = function() {
  if (activeDialog()) {
    activeDialog().close()
  }
}

dialogs.dialogVisible = ko.pureComputed(function() {
  return !!activeDialog()
})


/***/ }),
/* 9 */,
/* 10 */,
/* 11  settings*/
/***/ (function(module, exports) {

var settings = module.exports = {}

settings.scrollBar = { height: 10 }

settings.dropZone = { color: "white" }
settings.reveal = { background: { color: "#fefefe" } }

var element = settings.element = {}
element.width = 50
element.size = 70
element.gap = 10
element.scrollOffset = element.width + 2 * element.gap

var container = settings.container = {}
container.offset = -element.size * 0.67

var contextMenu = settings.contextMenu = {}
contextMenu.widthOffset = (element.width + element.gap) + 3 + element.gap

// Context menu colors (as settings.scss)
contextMenu.highlight = { color: "#00B9EB" }
contextMenu.error = { color: "#ff6961" }
contextMenu.warning = { color: "hsl(47, 93%, 53%)" }
contextMenu.continue = contextMenu.highlight
contextMenu.save = { color: "#2ECC71" }
contextMenu.cancel = contextMenu.error
contextMenu.inactive = { color: "hsla(201,10%,85%,1)" }
contextMenu.unconfigured = { color: "hsla(201,10%,85%,1)" }
contextMenu.active = { color: "#8a8a8a" }
contextMenu.saved = { color: "hsla(201,10%,70%,1)" }
contextMenu.link = { color: "#810AC2" }

settings.pilot = {
  repeatDelay: 0.5,
  repeatRate: 33,
  expectedEventRate: 5
}

settings.rcuErrorMap = { "cartesianPositionViolation" : "Cartesian Position",
  "cartesianReflex" : "Cartesian Reflex",
  "cartesianVelocityProfileSafetyLimitViolation" : "Cartesian Velocity Profile Safety Limit",
  "cartesianVelocityViolation" : "Cartesian Velocity",
  "forceControlSafetyLimitViolation" : "Force Control Safety Limit",
  "jointPositionViolation" : "Joint Position",
  "jointReflex" : "Joint Reflex",
  "jointVelocityViolation" : "Joint Velocity",
  "selfCollisionViolation" : "Self Collision",
  "maxGoalPoseDeviationViolation" : "Max Goal Pose Deviation",
  "maxPathDeviationViolation" : "Max Path Deviation",
  "startElbowSignInconsistent" : "Start Elbow Sign Inconsistent",
  "jointP2PPlanningInsufficientTorque" : "Joint P2P Planning Insufficient Torque",
  "tauJRangeViolation" : "Tau J Range Violation",
  "forceControllerDesiredForceToleranceViolation" : "Force Controller Desired Force Tolerance"
}


/***/ }),
/* 12 auth*/
/***/ (function(module, exports, __webpack_require__) {

var auth = module.exports = {}

var Base64 = __webpack_require__(33).Base64
var cookies = __webpack_require__(34)
var ko = __webpack_require__(1)
var $ = __webpack_require__(6)
var _ = __webpack_require__(0)

var tokenKey = "authorization"
var credentialsKey = "credentials"
var readPermission = "Read"
var readWritePermission = "ReadWrite"

auth.getToken = function() {
  return cookies.get(tokenKey)
}

auth.getCredentials = function() {
  var credentials = localStorage[credentialsKey]
  return credentials && JSON.parse(credentials)
}

auth.loggedIn = function() {
  return !!auth.getAuthenticatedUser()
}

auth.getAuthenticatedUser = function() {
  try {
    return JSON.parse(Base64.decode(auth.getToken().split(".")[1]))
  } catch (e) {
    return undefined
  }
}

auth.renew = function() {
  var credentials = auth.getCredentials()
  if (credentials) {
    return loginWithCredentials(credentials, false)
  } else {
    return Promise.reject("no credentials")
  }
}

// Only one simultaneous login
var loginPromise = null
function loginWithCredentials(credentials) {
  if (!loginPromise) {
    loginPromise = fetch(window.ADMIN_API + "/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(credentials)
    })
      .then(function(response) {
        loginPromise = null
        if (response.status >= 400) {
          var error = new Error(response.statusText)
          error.response = response
          throw error
        } else {
          return response.text()
        }
      })
      .then(function(token) {
        cookies.set(tokenKey, token, { expires: 7 })
        return auth.getAuthenticatedUser()
      })
  }
  return loginPromise
}

auth.invalidate = function() {
  cookies.erase(tokenKey)
}

// Invalidate session and reload the current url on 401 Unauthorized errors.
// 401 Unauthorized错误时，使会话无效并重新加载当前URL
// 注意：此函数旨在用于promise链中，用于处理401错误响应，但也解析为“undefined”！but also resolves to "undefined"!
auth.handleUnauthorized = function(error) {
  switch (error.response && error.response.status) {
  case 401:
    return auth.renew()
      .catch(function() {
        auth.invalidate()
        // The reload results in re-evaluating the requireAuth, which redirects to
        // login (as it should have initially)
        window.location.reload()
      })
  default:
    throw error
  }
}

auth.requireAuth = function(resource, requiredPermission, authorized, unauthorized) {
  authorized = authorized || _.noop
  unauthorized = unauthorized || _.noop
  if (hasPermission(getResourcePermission(resource), requiredPermission)) {
    return authorized()
  } else {
    return unauthorized()
  }
}

auth.hasResourcePermission = function(resource, required) {
  return hasPermission(getResourcePermission(resource), required)
}

function getResourcePermission(resource) {
  var authorization = getUserAuthorization()
  if (authorization && resource) {
    var match = _.find(authorization, function(authPart) {
      return authPart.resource === resource
    })
    return match && match.permission
  }
}

ko.bindingHandlers.requireAuth = {
  update: function(element, valueAccessor) {
    var value = valueAccessor() || {}
    var permission = getResourcePermission(value.resource)

    if (value.displayIf && !hasPermission(permission, value.displayIf)) {
      $(element).remove()
    }

    if (value.enableIf && !hasPermission(permission, value.enableIf)) {
      element.setAttribute("disabled", "")
    }

    if (value.enableInteractionIf && !hasPermission(permission, value.enableInteractionIf)) {
      element.setAttribute("disabled-interaction", "")
    }

    if (value.showIf && !hasPermission(permission, value.showIf)) {
      element.classList.add("hidden")
    }

    if (value.hideIf && hasPermission(permission, value.hideIf)) {
      element.classList.add("hidden")
    }

    if (value.enableEventsIf && !hasPermission(permission, value.enableEventsIf)) {
      $(element).off()
    }
  },
  after: ["drag", "drop", "event"]
}

function hasPermission(given, required) {
  return !required ||
    required === readPermission && (given === readPermission || given === readWritePermission) ||
    required === readWritePermission && given === readWritePermission
}

function getUserAuthorization() {
  var user = auth.getAuthenticatedUser()
  return user && user.role && user.role.authorization
}

auth.isAdmin = function() {
  return auth.getRoleName() === "admin"
}

auth.getUserName = function() {
  var user = auth.getAuthenticatedUser()
  return user && user.name
}

auth.getRoleName = function() {
  var user = auth.getAuthenticatedUser()
  return user && user.role && user.role.name
}


/***/ }),
/* 13 */,
/* 14  ko. extenders*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * 该模块包含knockout extenders. See {@link
 * http://knockoutjs.com/documentation/extenders.html} 了解extender机制的一般信息
 * @module app/extenders
 */

    // knockout.extender

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

/**
 * Knockout extender to change the result returned when reading an observable.
 * The observable can be normally written with `observable(newValue)`, however
 * when accessing its value with `observable()` the given function `fn` is
 * used to transform the stored value.
 * 扩展程序来更改读取可观察值时返回的结果，observable通常可以用`observable（newValue）`编写，但是当使用`observable（）`访问它的值时，使用给定的函数`fn`来转换存储的值。
 *
 * @example
 * var obs = ko.observable(2).extend({reader: function(value) {
 *   return value * Math.PI
 * }})
 * obs() === 2 * Math.PI // true
 * obs(4)
 * obs() === 4 * Math.PI // true
 *
 * @param  {ko.observable} target The knockout observable to extend
 * @param  {Function} fn Function to be executed when reading the observable.
 * @return {ko.observable} Extended observable
 * @memberOf module:app/extenders
 */
ko.extenders.reader = function(target, fn) {
  var result = ko.pureComputed({
    read: function() {
      return fn(target())
    },
    write: target
  })
  // Proxy observableArray functions to extended observable
  if (_.isArray(target())) {
    _.map(_.keys(ko.observableArray.fn), function(k) {
      result[k] = _.bindKey(target, k)
    })
  }
  return result
}

ko.extenders.writer = function(target, fn) {
  var result = ko.pureComputed({
    read: target,
    write: function(value) {
      var current = target()
      value = fn(value, current)
      if (!_.eq(current, value)) {
        target(value)
      }
    }
  })
  // Proxy observableArray functions to extended observable
  if (_.isArray(target())) {
    _.map(_.keys(ko.observableArray.fn), function(k) {
      result[k] = _.bindKey(target, k)
    })
  }
  return result
}

ko.extenders.useEquality = function(target, eq) {
  target.equalityComparer = eq
}


/***/ }),
/* 15 componentUtil*/
/***/ (function(module, exports, __webpack_require__) {


module.exports = {}

var matrix = __webpack_require__(39)
var _ = __webpack_require__(0)

module.exports.parameterAPI = __webpack_require__(36)

module.exports.or = function() {
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] !== undefined && arguments[i] !== null) {
      return arguments[i]
    }
  }
}

module.exports.isTaughtSimple = function(approach, retract) {
  if (approach && retract) {
    if (approach() && retract()) {
      return (approach().length === 0 && retract().length === 0) ||
        (approach().length === 1 && matrix.trajectoryParametersEqual(approach(), retract(), 0.0001))
    } else {
      return !approach() && !retract()
    }
  } else if (approach) {
    return !approach() || approach().length === 1
  } else if (retract) {
    return !retract() || retract().length === 1
  } else {
    return false
  }
}

module.exports.clamp = function(value, min, max) {
  if (value <= min) {
    return min
  } else if (value >= max) {
    return max
  } else {
    return value
  }
}

module.exports.pluralize = function(unit, value) {
  if (_.isArray(unit)) {
    // checks if value is an integer
    if (value % 1 === 0 && _.inRange(value, 1, unit.length)) {
      return unit[value - 1]
    } else {
      return _.last(unit)
    }
  } else {
    return unit
  }
}

/***/ }),
/* 16 */,
/* 17 */,
/* 18 SkillElement*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = SkillElement

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var components = __webpack_require__(26)
var Parameter = __webpack_require__(27)

function SkillElement(data, path, library) {
  this.path = ko.observable(path).extend({ useEquality: _.eq })
  // Data fields
  this.id = data.id
  this.parameter = new Parameter(data.parameter)
  this.name = ko.observable(data.name)
  this.link = ko.observable(data.link)
  this.componentProviders = components.makeComponentProviders(data, this.path).extend({ deferred: true })
  // Client-only properties
  this.enabled = ko.observable(data.enabled)
  this.active = ko.observable(false)
  var skill = ko.pureComputed(function() {
    return library.getSkill(this.link())
  }, this)
  this.color = ko.pureComputed(function() {
    return skill() && skill().color() || ""
  })
  this.image = ko.pureComputed(function() {
    return skill() && skill().image() || ""
  })
  this.contextMenu = ko.pureComputed(function() {
    return skill() && skill().contextMenu()
  })
  this.components = ko.pureComputed(function() {
    return skill() && skill().components()
  })
  var timeline = ko.pureComputed(function() {
    return _.findWhere(library.timelines(), { id: this.path().id })
  }, this)
  this.focused = ko.pureComputed(function() {
    return timeline() && timeline().focusedElement() === this
  }, this)
  this.isSelected = ko.pureComputed(function() {
    return timeline() && timeline().selectedElements().indexOf(this) > -1
  }, this)
  this.showContextMenu = ko.pureComputed(function() {
    return timeline() && timeline().contextMenuElement() === this
  }, this)
  this.showSelectionMenu = ko.pureComputed(function() {
    return timeline() && timeline().selectionMenuElement() === this
  }, this)
}

SkillElement.prototype.update = function(data, path) {
  this.path(path)
  // IDs不变，无需更新id.
  this.parameter.update(data.parameter)
  this.name(data.name)
  this.link(data.link)
  components.updateComponentProviders(this.componentProviders, data, path)
  // Client-only fields
  this.enabled(data.enabled)
}

SkillElement.prototype.equal = function(other) {
  return other instanceof SkillElement &&
         this.id === other.id &&
         _.eq(this.path(), other.path())
}

SkillElement.prototype.unwrap = function() {
  return {
    path: ko.unwrapDeep(this.path),
    id: this.id,
    parameter: this.parameter.unwrap(),
    name: ko.unwrapDeep(this.name),
    link: ko.unwrapDeep(this.link),
    componentProviders: ko.unwrapDeep(this.componentProviders)
  }
}


/***/ }),
/* 19 com*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * com模块定义了访问RACE application serverd的API.
 * @module app/com
 */

//com , 提供了和后端交互的API
var com = module.exports

__webpack_require__(31)
__webpack_require__(32)
var _ = __webpack_require__(0)

var auth = __webpack_require__(12)

// fetch()周围的wrapper包装器，来添加authorization，检测响应状态
function fetch_(url, options) {
  options = options || {}
  var request = function() {
    return fetch(url, Object.assign({
      credentials: "same-origin"
    }, options)).then(checkStatus)
  }
  return request()
    .catch(function(e) {
      return auth.handleUnauthorized(e).then(request)
    })
}

function encodeBody(options) {
  var headers = Object.assign({
    "content-type": "application/x-www-form-urlencoded",
  }, options.headers)
  var body = options.body
  switch (headers["content-type"]) {
    case "application/x-www-form-urlencoded":
      body = _.reduce(options.body, function(res, value, key) {
        return (res ? res + "&" : res) + encodeURI(key) + "=" + encodeURI(value)
      }, "")
      break
    case "application/json":
      body = JSON.stringify(options.body)
      break
  }
  return Object.assign(options, { headers: headers, body: body })
}

com.GET = fetch_

com.DELETE = function(url, options) {
  options = options || {}
  return fetch_(url, Object.assign({
    method: "DELETE"
  }, encodeBody(options), options))
}

com.POST = function(url, options) {
  options = options || {}
  return fetch_(url, Object.assign({
    method: "POST"
  }, encodeBody(options), options))
}

com.PUT = function(url, options) {
  options = options || {}
  return fetch_(url, Object.assign({
    method: "PUT"
  }, encodeBody(options), options))
}

function parseJSON(response) {
  return response.json()
}

function parseText(response) {
  return response.text()
}

function checkStatus(response) {
  if (response.status < 400) {
    return response
  }
  var error = new Error(response.statusText)
  error.response = response
  return response.json()
    .then(function(body) {
      Object.assign(error, body)
      throw error
    }, function() {
      throw error
    })
}

var pathToString = com.pathToString = function(path) {
  var url = ""
  if (path.id) {
    url += path.id
    if (path.indices && path.indices.forEach) {
      path.indices.forEach(function(index) {
        url += "/" + index
      })
    }
  }
  return url
}

/**
 * 获取所有可用的skills.
 * @returns {Promise.<Skill[]>} A promise for an array of skills.
 */
com.getSkills = function() {
  return com.GET(DESK_API + "/skills")
    .then(parseJSON)
}

/**
 * 获取所有可用的groups.
 * @returns {Promise.<Group[]>} A promise for an array of groups.
 */
com.getGroups = function() {
  return com.GET(DESK_API + "/groups")
    .then(parseJSON)
}

/**
 * 获取所有可用的timelines.
 * @returns {Promise.<Timeline[]>} A promise for an array of timelines.
 */
com.getTimelines = function() {
  return com.GET(DESK_API + "/timelines")
    .then(parseJSON)
}

/**
 * 获取给定timelineID的时间轴timeline
 * @param {string} timelineID - The identifier of the timeline to get.
 * @returns {Promise.<Timeline>} A promise for a timeline.
 */
com.getTimeline = function(timelineID) {
  return com.GET(DESK_API + "/timelines/" + timelineID)
    .then(parseJSON)
}

/**
 * 获取当前的navigation模式.
 * @returns {Promise.<string>} A promise for a navigation mode.
 */
com.getNavigationMode = function() {
  return com.GET(DESK_API + "/navigation/mode")
    .then(parseJSON)
}

/**
 * 用给定的名字创建一个新的，空的timeline. 已经用过的名称将导致AlreadyExistsError
 * @param {string} name - The name of the timeline to connect.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.createTimeline = function(name) {
  return com.POST(DESK_API + "/timelines", { body: {
    name: name
  } })
  .catch(function(error) {
    console.error("createTimeline:", error)
    throw error
  })
}

/**
 * 复制指定id的timeline，并用新名字保存。已经用过的名称将导致AlreadyExistsError
 * @param {string} id - The identifier of the timeline to copy.
 * @param {string} name - A name for the new timeline.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.copyTimeline = function(id, name) {
  return com.POST(DESK_API + "/timelines", { body: {
    id: id,
    name: name
  } })
  .catch(function(error) {
    console.error("copyTimeline:", error)
    throw error
  })
}

/**
 * 重命名指定id的timeline，如果命名冲突，返回AlreadyExistsError
 * @param {string} ID - The identifier of the timeline to rename.
 * @param {string} name - The new name.
 * @returns {Promise} A promise with the new timeline id.
 */
com.renameTimeline = function(id, name) {
  return com.PUT(DESK_API + "/timelines/" + id, { body: {
    name: name
  } })
  .then(parseJSON)
  .catch(function(error) {
    console.error("renameTimeline:", error)
    throw error
  })
}

/**
 * 删除指定id的timeline.
 * @param {string} id - The identifier of the timeline to get.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.deleteTimeline = function(id) {
  return com.DELETE(DESK_API + "/timelines/" + id)
  .catch(function(error) {
    console.error("deleteTimeline:", error)
    throw error
  })
}

/**
 * 将由id 引用的library item 插入到指定path的timeline (element)中，path的最后索引作为destination,因此
 * path.indices.length必须>= 1 ，the second last index必须指向 a container element (no link).
 * @param {string} id - The identifier of the library item to insert.
 * @param {Path} path - The path, where to element shall be inserted.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.insertElement = function(id, path) {
  return com.POST(DESK_API + "/timelines/" + pathToString(path), { body: {
    id: id
  } })
  .catch(function(error) {
    console.error("insertElement:", error)
    throw error
  })
}

/**
 * 拷贝由"from" path指定的timeline元素, 到由"to" path指定的timeline(elment)
 * “to”路径的最后一个索引用作目标，因此to.indices.length必须> = 1，而倒数第二个索引必须指向容器元素（无link）。
 * @param {Path} from - The path of the timeline element to copy.
 * @param {Path} to - The path, where the element shall be copied to.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.copyElement = function(from, to) {
  return com.POST(DESK_API + "/timelines/" + pathToString(to), { body: {
    from: pathToString(from)
  } })
  .catch(function(error) {
    console.error("copyElement:", error)
    throw error
  })
}

/**
 * 移动由"from" path指定的timeline元素, 到由"to" path指定的timeline(elment)
 * The last index of the "to" path is used as destination, thus to.indices.length has to be >= 1 and the second last
 * index has to point to a container element (no link).
 * @param {Path} from - The path of the timeline element to move.
 * @param {Path} to - The path, where the element shall be moved to.
 * @param {String} policy - Either "keep", "adjust" or "reset". Defaults to "keep.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.moveElement = function(from, to, policy) {
  policy = policy || "keep"
  return com.POST(DESK_API + "/timelines/" + pathToString(to), { body: {
    from: pathToString(from),
    move: true,
    policy: policy
  }})
  .catch(function(error) {
    console.error("moveElement: ", error)
    throw error
  })
}

/**
 * 由path引用的timeline element重命名为给定名称
 * @param {Path} path - The path of the timeline element to rename.
 * @param {string} name - The new name.
 */
com.renameElement = function(path, name) {
  return com.PUT(DESK_API + "/timelines/" + pathToString(path), { body: {
    name: name
  } })
  .catch(function(error) {
    console.error("renameElement:", error)
    throw error
  })
}

/**
 * 删除由path引用的timeline element.
 * @param {Path} path - The path of the timeline element to delete.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.deleteElement = function(path) {
  return com.DELETE(DESK_API + "/timelines/" + pathToString(path))
  .catch(function(error) {
    console.error("deleteElement:", error)
    throw error
  })
}

/**
 * 删除由paths 引用的timeline element.
 * @param {Path[]} paths - Paths of elements to delete.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.deleteElements = function(paths) {
  return com.DELETE(DESK_API + "/timelines", { body: {
    paths: JSON.stringify(paths)
  } })
  .catch(function(error) {
    console.error("deleteElements:", error)
    throw error
  })
}

/**
 * Enable或disable给定的timeline element.给定的path必须指向timeline上的一个skill element.
 * @param {Path} path - The path of the timeline element
 * @param {bool} enabled - true if the skill shall be enabled, otherwise false.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.setElementEnabled = function(path, enabled) {
  return com.PUT(DESK_API + "/timelines/" + pathToString(path), { body: {
    enabled: enabled
  } })
  .catch(function(error) {
    console.error("setElementEnabled:", error)
    throw error
  })
}

/**
 * Enable或disable多个elements. 参数必须是包含路径和启用字段的对象的数组。参考timeline中的skill element。
 * @param {Object[]} parameters - Element paths and enabled status
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.setElementsEnabled = function(parameters) {
  return com.PUT(DESK_API + "/timelines", { body: {
    parameters: JSON.stringify(parameters)
  } })
  .catch(function(error) {
    console.error("setElementsEnabled:", error)
    throw error
  })
}

/**
 * 保存给定timeline元素的参数。 因此，给定path必须指向timeline中的a skill link或group element。
 * @param {Path} path - The path of the timeline element
 * @param {string} parameter - The new parameter expression.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.saveParameter = function(path, parameter) {
  return com.PUT(DESK_API + "/timelines/" + pathToString(path), { body: {
    parameter: JSON.stringify(parameter)
  } })
  .catch(function(error) {
    console.error("saveParameter:", error)
    throw error
  })
}

/**
 * 获取当前的execution状态.
 * @returns {Promise.<ExecutionUpdate>} A promise for an execution update.
 */
com.getExecution = function() {
  return com.GET(DESK_API + "/execution")
    .then(parseJSON)
}

/**
 * StartExecution启动给定ID的timeline的execution
 * @param {string} timelineId - Timeline to start.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.startExecution = function(timelineId) {
  return com.POST(DESK_API + "/execution", { body: {
    id: timelineId
  } })
  .catch(function(error) {
    console.error("startExecution:", error)
    throw error
  })
}

/**
 * StopExecution 停止当前正在执行的execution.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.stopExecution = function() {
  return com.DELETE(DESK_API + "/execution")
  .catch(function(error) {
    console.error("stopExecution:", error)
    throw error
  })
}

/**
 * KillExecution kills a currently running execution.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.killExecution = function() {
  return com.DELETE(DESK_API + "/execution", { body: { force: true } })
  .catch(function(error) {
    console.error("killExecution:", error)
    throw error
  })
}

/**
 * ContinueExecution 通过continuing last active skill来退出错误处理
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.continueExecution = function() {
  return com.POST(DESK_API + "/execution/continue")
  .catch(function(error) {
    console.error("continueExecution:", error)
    throw error
  })
}

/**
 * RestartExecution 通过restarting the provided path来退出错误处理.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.restartExecution = function(path) {
  return com.POST(DESK_API + "/execution/restart", { body: {
    restartPath: pathToString(path)
  } })
  .catch(function(error) {
    console.error("restartExecution:", error)
    throw error
  })
}

/**
 * installArchive 将传递的文件上传到服务器。该文件必须是有效的包含skill bundle(s)的archive存档. 注意，要更新可用的skills或tasks issue 同步 using {@link synchronizeBundles}.
 * @param {File} archive - The archive file to be installed.
 * @returns {Promise} A promise with no data, indicating success.
 */
com.installArchive = function(archive) {
  return com.POST(DESK_API + "/bundles", {
    headers: { "content-type": "application/octet-stream" },
    body: archive
  })
  .catch(function(error) {
    console.error("installArchive:", error)
    throw error
  })
}

/**
 * synchronizeBundles在服务器上调用a bundle synchronization绑定同步.
 * @returns {Promise} A promise with no data, indicating success.
 */
com.synchronizeBundles = function() {
  return com.POST(DESK_API + "/bundles/synchronize")
  .catch(function(error) {
    console.error("synchronizeBundles:", error)
    throw error
  })
}

/**
 * exportTimeline从服务器下载一个包含一个指定id的task bundle的archive
 * @param {string} timelineID - The timeline to export.
 */
com.exportTimeline = function(timelineID) {
  // Let the browser download the archive
  window.location = DESK_API + "/bundles/export/" + timelineID
}

/**
 * shareTimeline 从服务器下载一个包含一个指定id的task bundle的archive
 * @param {string} timelineID - The timeline to share.
 */
com.shareTimeline = function(timelineID) {
  // Let the browser download the archive
  return com.POST(DESK_API + "/bundles/share/" + timelineID)
  .catch(function(error) {
    console.error("shareTimeline:", error)
    throw error
  })
}

/**
 * 保存给定timeline element的componentProviders. 因此给定的path必须指向timeline上的一个skill link或group element.
 * @param {Path} path - The path of the timeline element
 * @param {ComponentProviderEntry[]} providers - The new list of component provider entries
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.saveComponentProviders = function(path, providers) {
  return com.PUT(DESK_API + "/timelines/" + pathToString(path), { body: {
    componentProviders: JSON.stringify(providers)
  } })
  .catch(function(error) {
    console.error("saveComponentProviders:", error)
    throw error
  })
}

/**
 * 更新多个parameters和component provider的entries.
 * @param {Object[]} - An array of updates ，每个update都是一个至少包含两个fields, "path"，以及
 *                     "parameter"或"componentProviders"的对象.
 */
com.saveParameters = function(parameterUpdates) {
  return com.PUT(DESK_API + "/timelines", { body: {
    parameters: JSON.stringify(parameterUpdates)
  } })
  .catch(function(error) {
    console.error("saveParameters:", error)
    throw error
  })
}

/**
 * 保存Pilot上的color配置.
 * @param config - The new color config as an array containing 9 numbers.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.setPilotColors = function(config) {
  return com.POST(DESK_API + "/robot/pilot_colors", { body: {
    colors: JSON.stringify(config)
  } })
  .catch(function(error) {
    console.error("setPilotColors:", error)
    throw error
  })
}

/**
 * Set the guiding mode.
 * @param mode - The new guiding mode.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.setGuidingMode = function(mode) {
  return com.PUT(DESK_API + "/robot/guiding/mode", { body: {
    mode: JSON.stringify(mode)
  } })
  .catch(function(error) {
    console.error("setGuidingMode:", error)
    throw error
  })
}

/**
 * Set the user guiding configuration.
 * @param configuration - The new user guiding configuration.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.setGuidingConfiguration = function(configuration) {
  return com.PUT(DESK_API + "/robot/guiding/configuration", { body: {
    configuration: JSON.stringify(configuration)
  } })
  .catch(function(error) {
    console.error("setGuidingConfiguration:", error)
    throw error
  })
}

/**
 * Delete the user guiding configuration.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.deleteGuidingConfiguration = function() {
  return com.DELETE(DESK_API + "/robot/guiding/configuration")
  .catch(function(error) {
    console.error("deleteGuidingConfiguration:", error)
    throw error
  })
}

/**
 * Shut down the master controller.
 */
com.shutdown = function() {
  return fetch_(ADMIN_API + "/shutdown", { method: "POST" })
  .catch(function(error) {
    console.error("shutdown:", error)
    throw error
  })
}

/**
 * Reboot the master controller.
 */
com.reboot = function() {
  return fetch_(ADMIN_API + "/reboot", { method: "POST" })
  .catch(function(error) {
    console.error("reboot:", error)
    throw error
  })
}

/**
 * Open the brakes of the robot
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.openBrakes = function() {
  return com.POST(DESK_API + "/robot/open-brakes")
  .catch(function(error) {
    console.error("openBrakes:", error)
    throw error
  })
}

/**
 * Close the brakes of the robot
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.closeBrakes = function() {
  return com.POST(DESK_API + "/robot/close-brakes")
  .catch(function(error) {
    console.error("closeBrakes:", error)
    throw error
  })
}

/**
 * Reset the robot errors automatically
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.resetErrors = function() {
  return com.POST(DESK_API + "/robot/reset-errors")
  .catch(function(error) {
    console.error("resetErrors:", error)
    throw error
  })
}

/**
 * Reset the robot errors manually
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.resetErrorsManually = function() {
  return com.POST(DESK_API + "/robot/reset-errors-manually")
  .catch(function(error) {
    console.error("resetErrorsManually:", error)
    throw error
  })
}

/**
 * Check if the startup server is running.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.getIsStartupRunning = function() {
  return com.GET(STARTUP_API + "/phase")
    .then(parseJSON)
}

/**
 * Reboot the master controller during startup phase.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.rebootStartup = function() {
  return com.POST(STARTUP_API + "/reboot")
  .catch(function(error) {
    console.error("reboot:", error)
    throw error
  })
}

/**
 * Shut down the master controller during startup phase.
 * @returns {Promise} A promise with no data, but indicating success.
 */
com.shutdownStartup = function() {
  return com.POST(STARTUP_API + "/shutdown")
  .catch(function(error) {
    console.error("shutdown:", error)
    throw error
  })
}

// Update API

/**
 * createWS 创建具有reconnect行为和JSON解析的WebSockets. 它是Javascript的WebSockets的一个thin wrapper，并添加了重新连接功能。
 * 第二个参数时一个有以下fields的对象:
 * - onData: 可选.收到data时的Callback.它是通过JSON 反序列化JSON-deserializing参数所创建的对象调用的。
 * - onOpen: 可选. onOpen是底层websocket的callback ,即由相应的事件调用.
 * - onClose: 可选. onClose是底层websocket的callback.
 * - reconnect: 可选. 默认true. 指示如果以non-nominal方式关闭连接，Web socket是否应尝试重新连接。
 * - reconnectTimeout: 可选.默认1000. 重新连接之前的超时（以ms为单位）
 *
 * @param url - 要连接的端点URL Endpoint URL，将以API url为前缀
 * @param config - An object with the above fields.
 * @returns A function to close the web socket.
 */
com.createWS = function createWS(url, config) {
  config = Object.assign({ reconnect: true }, config)
  var scheme = location.protocol === "https:" ? "wss://" : "ws://"
  var wsURL = scheme + location.host + url

  var ws
  function connect() {
    ws = new WebSocket(wsURL)
    if (config.onData) {
      ws.onmessage = function(e) {
        config.onData(JSON.parse(e.data))
      }
    }
    if (config.onOpen) {
      ws.onopen = config.onOpen
    }
    ws.onclose = function(e) {
      console.log("Websocket " + ws.url + " closed", e)
      if (config.onClose) {
        config.onClose(e)
      }
      // Event code 1000 指示socket的正常关闭，即没有错误发生。但我们只想在异常情形下重连
      if (config.reconnect && e.code !== 1000) {
        console.log("Reconnecting websocket " + ws.url)
        reconnect()
      }
    }
    ws.onerror = function(e) {
      console.error("Websocket " + ws.url, e)
    }
  }
  var reconnect = function() {
    window.setTimeout(function() {
      if (config.reconnect) {
        com.GET(url)
          .then(connect)
          .catch(reconnect)
      }
    }, config.reconnectTimeout || 1000)
  }
  connect()
  return {
    close: function() {
      config.reconnect = false
      ws.close()
    }
  }
}

/**
 * 订阅`skillsChanged`事件.
 *
 * 函数使用一个带有回调的config对象来通知接收了一个更新(`args.onData`),成功的连接(`args.onOpen`) 及订阅的结束(`args.onClose`).  返回一个用以结束订阅的对象
 *
 * @param args - 带有可选的fields `onOpen`, `onClose`和`onData`的对象.
 * @returns 带有dispose`方法的对象，来关闭订阅.
 */
com.onSkillsChanged = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/skills", args).close
  }
}

/**
 * Subscribe to `groupsChanged` events.
 * 同上
 */
com.onGroupsChanged = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/groups", args).close
  }
}

/**
 * Subscribe to `timelinesChanged` events.
 * 同上
 */
com.onTimelinesChanged = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/timelines", args).close
  }
}

/**
 * Subscribe to `timelineChanged` events.
 * 同上
 *
 * @param {func(TimelineUpdate)} onData - Callback invoked when event data is received.
 * @param args - Object with the optional fields `onOpen`, `onClose` and `onData`.
 * @returns Object with a `dispose` method to close the subscription.
 */
com.onTimelineChanged = function(timelineID, args) {
  return {
    dispose: com.createWS(DESK_API + "/timelines/" + timelineID, args).close
  }
}

/**
 * Subscribe to `executionChanged` events.
 * 同上.
 */
com.onExecutionChanged = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/execution", args).close
  }
}

/**
 * Subscribe to `navigationEventReceived` events.
 * 同上
 */
com.onNavigationEventReceived = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/navigation/events", args).close
  }
}

/**
 * Subscribe to `onNavigationModeChanged` events
 * 同上
 */
com.onNavigationModeChanged = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/navigation/mode", args).close
  }
}

/**
 * Subscribe to `onSystemStatusReceived` events.
 * 同上
 */
com.onSystemStatusReceived = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/system/status", args).close
  }
}

/**
 * Subscribe to `onRobotStatusReceived` events.
 * 同上
 */
com.onRobotStatusReceived = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/robot/status", args).close
  }
}

/**
 * Subscribe to `onRobotConfigurationReceived` events.
 *
 * 同上
 */
com.onRobotConfigurationReceived = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/robot/configuration", args).close
  }
}

/**
 * Subscribe to `onGripperStateReceived` events.
 * 同上
 */
com.onGripperStateReceived = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/robot/gripper_state", args).close
  }
}

/**
 * Subscribe to `onGripperHardwareStateReceived` events.
 * 同上
 */
com.onGripperHardwareStateReceived = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/gripper/hardware", args).close
  }
}

/**
 * Subscribe to `onPilotHardwareStateReceived` events.
 * 同上
 */
com.onPilotHardwareStateReceived = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/pilot/hardware", args).close
  }
}

/**
 * Subscribe to `onBaseHardwareStateReceived` events.
 * 同上
 */
com.onBaseHardwareStateReceived = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/base-leds/hardware", args).close
  }
}

/**
 * Subscribe to `onGuidingModeChanged` events.
 * 同上
 */
com.onGuidingModeChanged = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/robot/guiding/mode", args).close
  }
}

/**
 * Subscribe to `onGuidingConfigurationChanged` events.
 * 同上
 */
com.onGuidingConfigurationChanged = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/robot/guiding/configuration", args).close
  }
}

/**
 * Subscribe to `onNotification` events.
 * 同上
 */
com.onNotification = function(args) {
  return {
    dispose: com.createWS(DESK_API + "/notification", args).close
  }
}

/**
 * Subscribe to process status events.
 * 同上
 */
com.onProcessStatus = function(args) {
  return {
    dispose: com.createWS(ADMIN_API + "/processes", args).close
  }
}

/**
 * Get current process status
 * @returns {Promise}
 */
com.getProcessStatus = function() {
  return com.GET(ADMIN_API + "/processes")
}

/**
 * Get current modbus configuration
 * @returns {Promise}
 */
com.getModbusConfiguration = function() {
  return com.GET(DESK_API + "/modbus/values")
    .then(parseJSON)
}

// Bundle resource access

com.fetchBundleResource = function(url) {
  return com.GET(BUNDLE_RESOURCE_URL + (_.startsWith(url, "/") ? url : "/" + url))
    .then(parseText)
}


/***/ }),
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 Events*/
/***/ (function(module, exports, __webpack_require__) {

var _ = __webpack_require__(0)

/**
 * 创建新的event emitter, 它可以从其他emitters proxy并跟踪订阅计数
 * @class
 * @memberof module:app/events
 * @param {string} name - A name for this event emitter
 */
var Events = function(name) {
  this.name = name
  this.subs = {}
  this.nextSubscriptionID = 0
  this.proxySubscriptions = []
  this.latchedEvents = {}
  this.registeredEvents = []
  _.bindAll(this, "notify", "notifyLatch", "subscribe", "on", "dispose", "hasAny", "register")
}

/**
 * Notify subscribed callbacks about a given event. Callbacks are invoked with
 * the given data.
 * it is said to be handled and no further subscribers are invoked.
 *
 * 通知与给定事件相关的已订阅的回调函数，（使用给定数据）调用callback进行处理。调用回调函数时使用
 * 给定数据。如果回调函数返回true,说明已经handled，就不会再有subscribers被调用
 * @param {string} event - The event name to notify.
 * @param {mixed} data - Data to pass to subscribers (variadic).
 */
Events.prototype.notify = function(event) {
  var handled = false
  if (this.subs[event]) {
    // Clone subs for invocation -> support notifications resulting in disposes
    var subs = this.subs[event].slice(0)
    for (var i = subs.length - 1; i >= 0 && !handled; --i) {
      var cb = subs[i].cb
      var args = Array.prototype.slice.call(arguments, 1)
      handled = cb.apply(undefined, args)
    }
  } else if (event !== "subscribe" && event !== "dispose") {
    console.debug(this.name + ": event '" + event + "' notified without subscribers")
  }
  delete this.latchedEvents[event]
  return handled
}

/**
 * Notify with latching behavior, current and new subscribers for the passed
 * events are notified until another event gets notified via 'notify' or
 * 'notifyLatch'.
 * 带有锁定行为的notify。传递的事件将通知当前和新的订阅者，直到另一个事件通过'notify'或'notifyLatch'进行notify。
 * @param {string} event - The event name to notify.
 * @param {mixed} data - Data to pass to subscribers (variadic).
 */
Events.prototype.notifyLatch = function(event) {
  var args = Array.prototype.slice.call(arguments, 1)
  var handled = this.notify.apply(this, [event].concat(args))
  this.latchedEvents[event] = args
  return handled
}

/**
 * Subscribe to given event. The passed context will be invoked each time the
 * event gets notified.
 * 订阅给定事件。每次notify事件时，都将调用传递的上下文
 * @param {string} event - The event name to subscribe to. 订阅的事件名称
 * @param {function} cb - Callback to invoke on event. 事件调用的回调函数
 * @param {Object} that - Optional this pointer bound onto callback. 可选此指针绑定到回调
 */
Events.prototype.subscribe = Events.prototype.on = function(event, cb, that) {
  var self = this
  var id = this.nextSubscriptionID++
  if (!_.has(this.subs, event)) {
    this.subs[event] = [{id: id, cb: cb}]
  } else {
    this.subs[event].push({id: id, cb: cb})
  }
  this.notify("subscribe", event, cb)
  if (event in this.latchedEvents) {
    _.defer(function() {
      cb.apply(that, self.latchedEvents[event])
    })
  }
  return {
    dispose: function() {
      self.subs[event] = _.filter(self.subs[event], function(sub) {
        return sub.id !== id
      })
      self.notify("dispose", event)
    }
  }
}

/** Clear all (held) subscriptions. */
Events.prototype.dispose = function() {
  this.subs = {}
  this.latchedEvents = {}
}

/**
 * 确定给定事件是否有任何订阅者。
 * Determine if there are any subscribers for given event.
 * @param {string} event - The event name to count subscribers.
 */
Events.prototype.hasAny = function(event) {
  return this.subs[event] && this.subs[event].length > 0
}

/** 通过创建便利函数来订阅和通知事件来注册事件 注册后，clients可以使用``on<Name>`` and
 * ``notify<Name>``来订阅和通知, ``<Name>``分别是首字母大写的注册事件名称。 如 onLogInfo()，
 * notifyLogInfo()
 * @param {string} event - The event name to register.
 */
Events.prototype.register = function(event) {
  if (_.contains(this.registeredEvents, event)) {
    return
  }
  var self = this
  var functions = ["notify", "notifyLatch", "on", "hasAny"]
  _.each(functions, function(fn) {
    var cap = event.charAt(0).toUpperCase() + event.slice(1)
    self[fn + cap] = function() {
      var args = Array.prototype.slice.call(arguments)
      return self[fn].apply(self, [event].concat(args))
    }
  })
  this.registeredEvents.push(event)
}

module.exports = Events


/***/ }),
/* 24 ElementAPI*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = ElementAPI

/**
 * element_api模块定义了接口类，它被传递给所有上下文菜单和其他元素脚本. 提供了一个用于状态机中脚本代码的定义良好的接口
 */
var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var GroupElement = __webpack_require__(25)
var parameterAPI = __webpack_require__(36)
var SkillElement = __webpack_require__(18)
var Timeline = __webpack_require__(38)

/**
 * 创建给定timeline元素的安全接口，接口中的参数访问可以使用作为第二个参数传递的字符串表达式来限定范围，例如“poses [0] .x”以仅允许访问`pose`数组的第一个姿势中的`x`。

 * API目前包含以下内容：
 *  * `parameter` - access to the skill's (scoped) parameter
 *  * `parameter(expression)` - function, returning an observable, for
 *      for further access/scope the parameter using another expression string
 */
function ElementAPI(controller, element) {
  if (!(element instanceof Timeline ||
        element instanceof SkillElement ||
        element instanceof GroupElement)) {
    throw new Error("ElementAPI requies a timeline or element")
  }
  this.path = ko.pureComputed(function() {
    return _.clone(element.path())
  })
  this.model = {}
  if (element.image) {
    this.model.image = ko.pureComputed(function() { return _.clone(element.image()) })
  }
  this.hasParentComponent = function(name, stepId) {
    var unwrappedPath = element.path()
    if (unwrappedPath.indices.length === 0) {
      return false
    }
    var parentPath = {id: unwrappedPath.id, indices: unwrappedPath.indices.slice(0, -1)}
    return controller.componentLoader.hasComponent(parentPath, name, stepId)
  }
  this.parameter = _.partial(parameterAPI, element.parameter.value, element.parameter.serverValue)
}


/***/ }),
/* 25 GroupElement*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = GroupElement

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var Container = __webpack_require__(35)
var components = __webpack_require__(26)
var Parameter = __webpack_require__(27)
var util = __webpack_require__(4)

function GroupElement(data, path, library) {
  this.library = library
  this.path = ko.observable(path).extend({ useEquality: _.eq })
  // Data fields
  this.id = data.id
  this.parameter = new Parameter(data.parameter)
  this.name = ko.observable(data.name)
  this.libraryItemId = ko.observable(data.libraryItemId)
  this.containers = ko.observableArray(_.map(data.containers, function(data, i) {
    return new Container(data, util.extendPath(path, i), library)
  }))
  this.componentProviders = components.makeComponentProviders(data, this.path).extend({ deferred: true })
  // Client fields
  this.active = ko.observable(false)
  this.enabled = true
  var group = ko.pureComputed(function() {
    return library.getGroup(this.libraryItemId())
  }, this)
  this.color = ko.pureComputed(function() {
    return group() && group().color() || ""
  })
  this.image = ko.pureComputed(function() {
    return group() && group().image() || ""
  })
  this.contextMenu = ko.pureComputed(function() {
    return group() && group().contextMenu()
  })
  this.components = ko.pureComputed(function() {
    return group() && group().components()
  })

  var timeline = ko.pureComputed(function() {
    return _.findWhere(library.timelines(), { id: this.path().id })
  }, this)
  this.focused = ko.pureComputed(function() {
    return timeline() && timeline().focusedElement() === this
  }, this)
  this.showContextMenu = ko.pureComputed(function() {
    return timeline() && timeline().contextMenuElement() === this
  }, this)
  this.isSelected = ko.pureComputed(function() {
    return timeline() && timeline().selectedElements().indexOf(this) > -1
  }, this)
  this.showSelectionMenu = ko.pureComputed(function() {
    return timeline() && timeline().selectionMenuElement() === this
  }, this)
}

GroupElement.prototype.update = function(data, path) {
  this.path(path)
  // IDs don't change, so we don't need to update the id.
  this.parameter.update(data.parameter)
  this.name(data.name)
  this.libraryItemId(data.libraryItemId)
  var i = 0
  this.containers(_.zipWith(data.containers, this.containers(), function(d, c) {
    if (!c) {
      return new Container(d, util.extendPath(path, i++, this.library))
    }
    c.update(d, util.extendPath(path, i++))
    return c
  }))
  components.updateComponentProviders(this.componentProviders, data, path)
}

GroupElement.prototype.equal = function(other) {
  return other instanceof GroupElement &&
         this.id === other.id &&
         _.eq(this.path(), other.path()) &&
         _.all(_.zipWith(this.containers(), other.containers(), function(a, b) {
           return a.equal(b)
         }))
}

GroupElement.prototype.unwrap = function() {
  return {
    path: ko.unwrapDeep(this.path),
    id: this.id,
    parameter: this.parameter.unwrap(),
    name: ko.unwrapDeep(this.name),
    libraryItemId: ko.unwrapDeep(this.libraryItemId),
    containers: _.invoke(this.containers(), "unwrap"),
    componentProviders: ko.unwrapDeep(this.componentProviders)
  }
}


/***/ }),
/* 26 components*/
/***/ (function(module, exports, __webpack_require__) {
var components = module.exports = {}

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)
var util = __webpack_require__(4)

components.makeComponentProviders = function(data, path) {
  function eq(a, b) {
    return ko.ignoreDependencies(function() {
      return _.eq(ko.unwrapDeep(a), ko.unwrapDeep(b))
    })
  }

  var result = _.reduce(data.componentProviders, function(result, cpe, stepId) {
    if (cpe.linkConfig) {
      result[stepId] = components.makeComponentProviderEntry(cpe.linkConfig, path)
    }
    return result
  }, {})
  var providers = ko.observable(result).extend({ useEquality: eq })
  providers.isDirty = function() {
    return !!_.find(providers(), function(p) {
      return p.sourceDistance.isDirty() || p.parameters.isDirty()
    })
  }
  return providers
}

components.makeComponentProviderEntry = function(entry, path) {
  var result = {
    components: ko.observable(entry.components.slice()),
    sourceDistance: util.makeObservableProxy(ko.observable(entry.sourceDistance)),
    parameters: util.makeObservableProxy(ko.observable(_.cloneDeep(entry.parameters)))
  }
  result.sourcePath = ko.pureComputed({
    read: function() {
      var p = ko.unwrapDeep(path)
      return {
        id: p.id,
        indices: p.indices.slice(0, p.indices.length - result.sourceDistance())
      }
    },
    write: function(newPath) {
      var p = ko.unwrapDeep(path)
      if (newPath.id !== p.id || !util.isPrefix(newPath.indices, p.indices)) {
        throw new Error("Path must be a prefix of the element path")
      }
      result.sourceDistance(p.indices.length - newPath.indices.length)
    }
  }).extend({ useEquality: _.eq })
  return result
}

components.updateComponentProviders = function(old, data, path) {
  var oldComponentProviders = old.peek()
  old(_.reduce(data.componentProviders, function(result, cpe, stepId) {
    if (cpe.linkConfig) {
      if (stepId in oldComponentProviders) {
        var newEntry = _.clone(oldComponentProviders[stepId])
        newEntry.components(cpe.linkConfig.components)
        newEntry.parameters.reset(cpe.linkConfig.parameters)
        newEntry.sourceDistance.reset(cpe.linkConfig.sourceDistance)
        result[stepId] = newEntry
      } else {
        result[stepId] = components.makeComponentProviderEntry(cpe.linkConfig, path)
      }
    }
    return result
  }, {}))
}


/***/ }),
/* 27 Parameter*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Parameter

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)
var util = __webpack_require__(4)

function Parameter(value) {
  this.serverValue = ko.observable(_.cloneDeep(value))
  this.value = util.makeObservableProxy(this.serverValue)
}

Parameter.prototype.update = function(newValue) {
  if (!_.eq(this.serverValue(), newValue)) {
    this.value.reset(newValue)
  }
}

Parameter.prototype.commit = function() {
  this.value.reset(this.value())
}

Parameter.prototype.unwrap = function() {
  return this.value()
}

Parameter.prototype.reset = function() {
  this.value.reset(this.serverValue())
}


/***/ }),
/* 28 Tether*/,
/* 29 ComponentProviders*/
/***/ (function(module, exports, __webpack_require__) {


var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var expressions = __webpack_require__(37)
var ElementAPI = __webpack_require__(24)
var Events = __webpack_require__(23)
var util = __webpack_require__(4)
var components = __webpack_require__(26)

/**
 * Utility类，使用component provider entries 来 linking and unlinking skills .
 */
function ComponentLinkManager(controller, path) {
  this.path = path
  this.controller = controller
}

/**
 * 返回要在函数中使用的不透明接收器对象opaque sink object getSourceDataForSink
 * 用于特定step和一组linkable components. 该对象具有一个旨在供用户使用的函数：hasLinkableSource（path）
 * 用于检查指定的path是否has a source for the link object
 */
ComponentLinkManager.prototype.getComponentSink = function(stepId, component) {
  var path = ko.unwrapDeep(this.path)
  var allSinks = this.findAllComponentSinks(stepId, component)
  _.remove(allSinks, function(p) { return _.isEqual(p, path) })
  return {
    type: "sink",
    id: stepId,
    component: component,
    hasLinkableSource: function(path) {
      return !!_.find(allSinks, function(p) { return _.isEqual(p.indices, path.indices) })
    }
  }
}

/**
 * 返回一个opaque object,允许使用函数isSource（path）检查特定路径是否是此对象的matching source匹配源。
 */
ComponentLinkManager.prototype.getComponentSources = function(stepId, component) {
  var path = ko.unwrapDeep(this.path)
  var sources = _.filter(this.findAllComponentSources(component), function(p) {
    return !_.isEqual(p, path)
  })
  return {
    type: "source",
    numberOfSources: function() { return sources.length },
    isSource: function(path) {
      return !!_.find(sources, function(p) { return _.isEqual(p, path) })
    }
  }
}

/**
 * 在此link manager 的元素和（opaque）sourceData对象之间创建新链接。
 * 已使用getSourceDataForSink创建了sourceData对象。
 */
ComponentLinkManager.prototype.linkComponents = function(sourceData) {
  return this.updateLinkedParameters(sourceData.sink.id, ko.unwrapDeep(sourceData.sourcePath), sourceData.parameters)
}

ComponentLinkManager.prototype.resetLink = function(component, stepId) {
  var path = ko.unwrapDeep(this.path)
  var defaultComponentPath = this.controller.componentLoader.componentPath(path, component)
  return this.updateLinkedParameters(stepId, defaultComponentPath, null)
}

ComponentLinkManager.prototype.setSource = function(sourcePath, stepId) {
  var path = ko.unwrapDeep(this.path)
  if (_.isEqual(path, sourcePath)) {
    throw new Error("Cannot set component source to self")
  }
  var model = this.controller.timeline().getElementAtPath(path)
  var currentProviderEntry = ko.unwrap(model.componentProviders)[stepId]
  if (!currentProviderEntry) {
    console.warn("Cannot update step parameters, no component provider entry found", stepId)
  }
  if (!_.isEqual(currentProviderEntry.sourcePath(), sourcePath)) {
    return this.updateLinkedParameters(stepId, sourcePath, null)
  } else {
    return Promise.resolve()
  }
}

ComponentLinkManager.prototype.updateLinkedParameters = function(stepId, sourcePath, parameters) {
  // If we delete the (only) timeline, it can happen that the
  // timeline is set to undefined. Handle that case.
  if (!this.controller.timeline()) {
    return
  }
  var path = ko.unwrapDeep(this.path)
  var model = this.controller.timeline().getElementAtPath(path)
  var elementApi = new ElementAPI(this.controller, model)
  var currentProviderEntry = ko.unwrap(model.componentProviders)[stepId]
  if (!currentProviderEntry) {
    console.warn("Cannot update step parameters, no component provider entry found", stepId)
  }

  var numberOfParents = path.indices.length - sourcePath.indices.length - 2
  for (var parameterName in currentProviderEntry.parameters()) {
    var accessPath = currentProviderEntry.parameters()[parameterName]
    var parameter = elementApi.parameter(accessPath)
    if (parameters === null) {
      parameter(null)
    } else if (_.isObject(parameters)) {
      parameter(setNumberOfParents(parameters[parameterName], numberOfParents))
    } else {
      throw new Error("Parameters is not a valid parameter object.")
    }
  }
  updateComponentProvider(this.controller, path, stepId, function(cp) {
    cp.sourceDistance(path.indices.length - sourcePath.indices.length)
    return cp
  })
  return this.controller.saveUpdatedParameters()
}

/**
 * 遍历timeline树，查找提供the passed component的所有元素，搜索all elements depending on these skills in their component provider entries.依赖在它们的component provider entries中的这些skills的所有元素
 * 返回所有到这些component sinks的paths的列表。
 */
ComponentLinkManager.prototype.findAllComponentSinks = function(stepId, component) {
  // If we delete the (only) timeline, it can happen that the
  // timeline is set to undefined. Handle that case.
  var timeline = this.controller.timeline()
  if (!timeline) {
    return
  }
  var elementPath = ko.unwrapDeep(this.path)
  var targetElement = timeline.getElementAtPath(elementPath)
  var targetProvider = targetElement && ko.unwrap(targetElement.componentProviders)[stepId]
  var parameterKeys = targetProvider ? _.keys(targetProvider.parameters()).sort() : []

  var componentSinks = []
  util.traverseTimeline(timeline, function(path, element) {
    // A component sink 是一个元素，它的source path is a prefix of
    // the element path for which we want to find all possible other sinks.
      // 它的source path是我们想要找到所有可能的其他sinks的元素路径的前缀。
      // 此外，组件名称也必须匹配，并且必须设置所有参数，即non-nil
    if (!element.componentProviders || _.isEqual(path, elementPath)) {
      return
    }
    var componentProvidersForComponent = _.filter(ko.unwrap(element.componentProviders), function(cp) {
      return _.contains(cp.components(), component)
    })
    _.mapValues(componentProvidersForComponent, function(provider) {
      if (provider.sourcePath() && util.isPrefix(provider.sourcePath().indices, elementPath.indices) &&
          _.isEqual(parameterKeys, _.keys(provider.parameters()).sort())) {
        var params = resolveParameters(element, provider.parameters())
        if (_.all(params) && _.find(componentSinks, function(p) { _.isEqual(p, path) }) === undefined) {
          componentSinks.push(path)
        }
      }
    })
  })
  return componentSinks
}

ComponentLinkManager.prototype.findAllComponentSources = function(component) {
  return this.controller.componentLoader.findAllComponentProviders(ko.unwrapDeep(this.path), component)
}

/**
 * Returns an opaque source data object for the specified sink and
 * source model.返回指定的sink和source model的不透明源数据对象。
 */
function getSourceDataForSink(sink, sourceModel) {
  var matchingProvider = _.find(ko.unwrap(sourceModel.componentProviders), function(cp) {
    return _.contains(cp.components(), sink.component)
  })
  if (!matchingProvider) {
    return
  }
  var parameter = sourceModel.parameter.value()
  var protoParameters = {}
  for (var linkedParameter in matchingProvider.parameters()) {
    var accessor = expressions.createAccessor(matchingProvider.parameters()[linkedParameter])
    var value = accessor.read(parameter)
    // We remove all parent accesses and keep only the parameter
    // itself. When linking, we use this proto-paramter and prepend
    // the correnct number of parents again.
    protoParameters[linkedParameter] = setNumberOfParents(value, 0)
  }
  return { sink: sink,
           sourcePath: matchingProvider.sourcePath,
           parameters: protoParameters
         }
}

function setNumberOfParents(accessPath, numberOfParents) {
  if (!accessPath || !accessPath.access) {
    return accessPath
  }
  var parentAccesses = _.fill(Array(numberOfParents), "parent")
  return { access: parentAccesses.concat(_.dropWhile(accessPath.access, function(a) { return a === "parent" })) }
}

/**
 * Returns true if the passed element is linked with the stepId of the other passed element.
 */
function isLinkedWith(element, otherElement, stepId) {
  if (!element.componentProviders || !otherElement.componentProviders) {
    return false
  }
  var entry = ko.unwrap(otherElement.componentProviders)[stepId]
  if (!entry || !entry.parameters()) {
    return false
  }
  var matchingEntries = _.filter(ko.unwrap(element.componentProviders), function(cpe) {
    return _.isEqual(cpe.sourcePath(), entry.sourcePath())
  })
  var otherParameters = _.mapValues(resolveParameters(otherElement, entry.parameters()), dropParentAccesses)
  return !!_.find(matchingEntries, function(cpe) {
    var parameters = cpe.parameters() &&
        _.mapValues(resolveParameters(element, cpe.parameters()), dropParentAccesses)
    return _.keys(parameters).length > 0 &&
      _.isEqual(parameters, otherParameters) &&
      !_.contains(parameters, null)
  })
}

/**
 * Returns true if the passed element is the component source for the stepId of the other passed element.
 */
function isSourceFor(element, otherElement, stepId) {
  if (!otherElement.componentProviders) {
    return false
  }
  var entry = ko.unwrap(otherElement.componentProviders)[stepId]
  if (!entry) {
    return false
  }
  return _.isEqual(element.path(), entry.sourcePath())
}

function updateComponentProvider(controller, path, stepId, fun) {
  var componentProviders = controller.timeline().getElementAtPath(path).componentProviders
  var newComponentProviders = componentProviders()
  newComponentProviders[stepId] = fun(componentProviders()[stepId])
  componentProviders(newComponentProviders)
}

/**
 * 创建一个接口，为timeline element设置componentProvider 条目entries
 * @param {Controller} controller - the controller 包含一个com对象，用于发送请求
 * @param {path} path - the element path which the API shall be created.
 * @param {string} stepId - 要为其设置componentProvider的上下文菜单step的id。

 * @returns {Object} - The returned API object contains the following:

 *  * `registerComponent` - 在component provider entry中注册component的函数,返回一个Promise.
 *                          必须调用该函数才能在component provider entry中注册skill parameters以启用linking。
 *  * `sharesComponentProviders` - ko.pureComputed计算为布尔值，当此元素的上下文菜单中的此步骤与同一时间轴
 *                          中其他位置的另一个data sink共享数据源时，该布尔值为true。
 *  * `componentProviderEvents` - 一个带有'cloneConfiguration'事件的Events对象，当一个skill被unlinked时，组件配置将被复制时'被调用。
 *       an Events object with a 'cloneConfiguration' event  which is called when the component config shall be duplicated          in case a  skill is unlinked.
 */
function ComponentProviderAPI(controller, path, stepId) {
  this.componentProviderEvents = new Events("componentProviderEvents-" + stepId)
  this.componentProviderEvents.register("cloneConfiguration")

  this.registerComponent = function(sourcePath, componentNames, parameters) {
    var elementPath = ko.unwrapDeep(path)
    updateComponentProvider(controller, elementPath, stepId, function(entry) {
      if (entry) {
        entry.parameters(parameters)
        return entry
      } else {
        return components.makeComponentProviderEntry({
          components: componentNames,
          sourceDistance: elementPath.indices.length - ko.unwrapDeep(sourcePath).indices.length,
          parameters: parameters
        }, path)
      }
    })
  }

  this.sharesComponentProviders = ko.pureComputed(function() {
    // If we delete the (only) timeline, it can happen that the
    // timeline is set to undefined. Handle that case.
    if (controller.timeline()) {
      return countComponentProviders(controller.timeline(), ko.unwrapDeep(path), stepId) > 1
    }
  }, this)
}

// 返回与parameterAccessPaths具有相同字段但使用model's parameters解析参数的对象。
function resolveParameters(model, parameterAccessPaths) {
  var parameters = {}
  var modelParameter = model.parameter.value()
  for (var parameterName in parameterAccessPaths) {
    parameters[parameterName] = expressions.createAccessor(parameterAccessPaths[parameterName]).read(modelParameter)
  }
  }
  return parameters
}

function dropParentAccesses(ap) {
  if (!ap || !ap.access) {
    return ap
  }
  return { access: _.dropWhile(ap.access, function(a) { return a === "parent" }) }
}

/** Returns the number of steps in all elements of the passed timeline
 * that refer to the component provider entry defined by the passed
 * sourcePath and parameters. Note that the parameters must be actual
 * parameter values, not the access paths found in the component
 * provider entry.
 *
 * 返回the passed timeline 中所有元素中的steps数，这些元素引用/指向由the passed sourcePath和parameters定义的component provider
 * entry。 请注意，parameters必须是实际参数值，而不是component provider entry中的access paths。
 */
function countComponentProviders(timeline, path, stepId) {
  var model = timeline.getElementAtPath(path)
  var count = 0
  // This might happen because the update is not finished yet and the
  // path points to an already deleted object.
  if (model) {
    util.traverseTimeline(timeline, function(otherPath, element) {
      if (isLinkedWith(element, model, stepId)) {
        count++
      }
    })
  }
  return count
}

module.exports = {
  ComponentLinkManager: ComponentLinkManager,
  ComponentProviderAPI: ComponentProviderAPI,
  isLinkedWith: isLinkedWith,
  isSourceFor: isSourceFor,
  getSourceDataForSink: getSourceDataForSink,
  resolveParameters: resolveParameters,
}
/***/ }),

/* 30 */,
/* 31 */
/***/ (function(module, exports) {

window.BASE_URL = "/desk"
window.DESK_API = window.BASE_URL + "/api"
window.BUNDLE_RESOURCE_URL = window.BASE_URL + "/bundles"
window.ADMIN_API = "/admin/api"
window.STARTUP_API = "/startup/api"


/***/ }),
/* 32 */,
/* 33 */,
/* 34 */,
/* 35 Container*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Container

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var GroupElement = __webpack_require__(25)
var SkillElement = __webpack_require__(18)
var util = __webpack_require__(4)

function Container(data, path, library) {
  this.path = ko.observable(path)
  this.library = library
  this.elements = ko.observableArray(_.map(data.elements, this.newElement.bind(this)))
  // Client-only fields
  this.active = ko.observable(false)
}

Container.prototype.newElement = function(data, index) {
  var path = util.extendPath(this.path(), index)
  if (data.link) {
    return new SkillElement(data, path, this.library)
  } else {
    return new GroupElement(data, path, this.library)
  }
}

Container.prototype.update = function(data, path) {
  this.path(path)
  util.updateObservableArray(this.elements, data.elements, this.newElement.bind(this), function(element, data, i) {
    element.update(data, util.extendPath(path, i))
  })
}

Container.prototype.equal = function(other) {
  return other instanceof Container &&
         _.eq(this.path(), other.path()) &&
         _.all(_.zipWith(this.elements(), other.elements(), function(a, b) {
           return a.equal(b)
         }))
}

Container.prototype.unwrap = function() {
  return {
    path: ko.unwrapDeep(this.path),
    elements: _.invoke(this.elements(), "unwrap")
  }
}


/***/ }),
/* 36 parameterAPI/getParameter*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = getParameter

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var expressions = __webpack_require__(37)

/**
 * 使用可选的expression获取给定元素的可写的observable的参数。 如果给出expression字符串，则将其解析并用于仅返回子树，即参数的一部分
 * Get a writable, observable parameter of a given element with an optional
 * expression. If the expression string is given, it is parsed and used to return only a
 * subtree, i.e. part of the parameter.
 */
function getParameter(parameter, defaultValue, expression) {
  defaultValue = defaultValue || _.cloneDeep(ko.unwrap(parameter))
  expression = expression || []
  if (!ko.isObservable(parameter)) {
    console.error("parameter", parameter, "is not observable")
    return
  }
  try {
    var accessor = expressions.createAccessor(expression)
    var parameterAPI = ko.pureComputed({
      read: function() { return accessor.read(parameter()) },
      write: function(newValue) { parameter(accessor.write(_.cloneDeep(parameter()), newValue)) }
    })
    parameterAPI.parameter = _.partial(getParameter, parameterAPI, ko.pureComputed(function() {
      accessor.read(ko.unwrap(defaultValue))
    }))
    parameterAPI.reset = function() { parameterAPI(accessor.read(ko.unwrap(defaultValue))) }
    parameterAPI.isDirty = function() { return !_.isEqual(accessor.read(ko.unwrap(defaultValue)), parameterAPI()) }
    var accessPath = (parameter.accessPath ? parameter.accessPath() : []).slice().concat(accessor.accessPath())
    parameterAPI.accessPath = function() { return accessPath }

    var modifiers = {
      multiply: {
        func: function(val, factor) { return val * factor },
        inv: function(val, factor) { return val / factor }
      },
      add: {
        func: function(val, addend) { return val + addend },
        inv: function(val, addend) { return val - addend }
      },
      round: {
        func: _.round,
        inv: function(val) { return val }
      }
    }

    _.forEach(modifiers, function(modFunctions, key) {
      parameterAPI[key] = function() {
        var api = this
        var args = Array.prototype.slice.call(arguments)
        var modifiedAPI = ko.pureComputed({
          read: function() {
            return (api() === null || api() === undefined) ? api() : modFunctions.func.apply(undefined, [api()].concat(args))
          },
          write: function(value) {
            if (value === null) {
              api(value)
            } else {
              var modValue = modFunctions.inv.apply(undefined, [value].concat(args))
              api(isNaN(modValue) ? null : modValue)
            }
          }
        })
        for (var k in modifiers) { modifiedAPI[k] = api[k] }
        modifiedAPI.reset = api.reset
        modifiedAPI.isDirty = api.isDirty
        modifiedAPI.accessPath = api.accessPath
        return modifiedAPI
      }
    })

    return parameterAPI
  } catch (e) {
    console.error(e)
  }
}


/***/ }),
/* 37 expressions*/
/***/ (function(module, exports, __webpack_require__) {

var expressions = module.exports = {}

var _ = __webpack_require__(0)

/**
 * 返回给定表达式字符串的参数访问器对象parameter accessor object
 * 传递的字符串使用以下语法指定参数访问路径，并返回具有函数`read（data）``和``write（data，value）``的访问器。
 * 这些函数可用于分别在指定的访问路径上读取和写入子参数。
 *
 * 参数访问路径支持：
   * * struct 字段访问，使用“param.nested”
   * *数组字段访问，使用“paramlist [2]”
   * *基本参数提取，使用基本参数类型，如浮动参数类型就是"float"
 *
 * 组合起来，访问路径“nested.somearray [1] .float”在struct字段
 * 'nested'的结构中的结构字段'somearray'处的索引1处读取/写入常量float表达式。
 *
 * 指定子参数的另一个例子是访问路径“poses [2]”,它解析为struct字段'poses'处索引2处的某个参数。
 * 假设paremeter类型是一个带有字段'poses'的结构和一个固定大小的float [16]数组的数组
 * 当保存到服务器时，``write（）``的传递值必须解析为float [16]参数
 *
 * @param {string} expression - The access path string expression
 */
expressions.createAccessor = function(expression) {
  var accessPath
  if (_.isString(expression)) {
    accessPath = accessPathFromString(expression)
  } else if (_.isArray(expression)) {
    accessPath = expression
  } else {
    console.warn("Accessor expression is neither string nor array", expression)
    accessPath = []
  }
  var access = expressionAccess(accessPath)
  access.accessPath = function() { return accessPath }
  return access
}

function expressionAccess(accessPath) {
  if (accessPath.length === 0) {
    return {
      read: function(data) {return data},
      write: function(data, value) {return value},
      accessPath: function() { return accessPath }
    }
  }
  return structAccess(accessPath) ||
         arrayAccess(accessPath)
}

function structAccess(accessPath) {
  var identifier = accessPath[0]
  if (!_.isString(identifier)) {
    return
  }
  var next = expressionAccess(accessPath.slice(1))
  return {
    read: function(data) {
      return next && data && next.read(data[identifier])
    },
    write: function(data, value) {
      if (next && data) {
        data[identifier] = next.write(data[identifier], value)
      }
      return data
    }
  }
}

function arrayAccess(accessPath) {
  var index = accessPath[0]
  if (!_.isNumber(index)) {
    return
  }
  var next = expressionAccess(accessPath.slice(1))
  return {
    read: function(data) {
      return next && data && next.read(data[index])
    },
    write: function(data, value) {
      if (next && data) {
        data[index] = next.write(data[index], value)
      }
      return data
    }
  }
}

function accessPathFromString(expression) {
  if (expression[0] !== "." && expression[0] !== "[") {
    expression = "." + expression
  }
  var accessPath = []
  while (expression) {
    var stringRe = /^\.([a-zA-Z_]+[a-zA-Z0-9_]*)/
    var arrayRe = /^\[([0-9]+)\]/
    var fieldMatch = stringRe.exec(expression)
    var arrayMatch = arrayRe.exec(expression)
    if (fieldMatch) {
      accessPath.push(fieldMatch[1])
      expression = expression.substring(fieldMatch[0].length)
    } else if (arrayMatch) {
      accessPath.push(parseInt(arrayMatch[1], 10))
      expression = expression.substring(arrayMatch[0].length)
    } else {
      break
    }
  }
  return accessPath
}


/***/ }),
/* 38 Timeline*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Timeline

var _ = __webpack_require__(0)
var $ = __webpack_require__(6)
var ko = __webpack_require__(1)

var Container = __webpack_require__(35)
var Parameter = __webpack_require__(27)
var util = __webpack_require__(4)
var auth = __webpack_require__(12)

function Timeline(data, library) {
  this.library = library
  // A path here simplifies joint processing of timeline and elements
  this.path = ko.observable({ id: data.id, indices: [] }).extend({ useEquality: _.eq })
  // Data fields
  this.id = data.id
  this.containers = ko.observableArray(_.map(data.containers, function(data, i) {
    return new Container(data, {id: this.id, indices: [i] }, this.library)
  }, this))
  this.name = ko.observable(data.name)
  this.contextMenu = ko.observable().extend({writer: function(value) {
    return $.parseHTML(value, null, true)
  }})
  this.contextMenu(data.contextMenu)
  this.components = ko.observable(data.components).extend({ deferred: true })
  this.parameter = new Parameter(data.parameter)
  // Client-only fields
  this.active = ko.observable(false)
  this.focusedElement = ko.observable()
  this.focused = ko.pureComputed(function() {
    return this.focusedElement() === this
  }, this)
  this.contextMenuElement = ko.observable().extend({
    writer: function(value) {
      if (!auth.hasResourcePermission("Parameters", "Read")) {
        return undefined
      }
      if (value) {
        this.focusedElement(value)
      }
      return value
    }.bind(this)
  })
  this.showContextMenu = ko.pureComputed(function() {
    return this.contextMenuElement() === this
  }, this)
  this.selectedElements = ko.observableArray()
  var selectionMenuElement = ko.observable()
  this.selectionMenuElement = ko.pureComputed({
    read: function() {
      var selected = this.selectedElements()
      if (_.isEmpty(selected)) {
        return null
      }
      return selectionMenuElement()
    },
    write: selectionMenuElement
  }, this)
}

Timeline.prototype.update = function(data) {
  // IDs don't change, so we don't need to update the id.
  this.name(data.name)
  var i = 0
  this.containers(_.zipWith(data.containers, this.containers(), function(d, c) {
    if (!c) {
      return new Container(d, {id: this.id, indices: [i++] }, this.library)
    }
    c.update(d, {id: this.id, indices: [i++] })
    return c
  }, this))
  this.contextMenu(data.contextMenu)
  this.components(data.components)
  this.parameter.update(data.parameter)
  this.updateFocusedElement()
  this.updateSelectedElements()
}

Timeline.prototype.updateFocusedElement = function() {
  // Reset focus/selection if element not in timeline anymore
  if (this.focusedElement() && !this.containsElement(this.focusedElement())) {
    this.focusedElement(null)
    this.contextMenuElement(null)
  } else {
    // TODO(Lorenz): Use an actual notification mechanism, e.g. a
    // separate observable here.
    this.focusedElement.notifySubscribers()
  }
}

Timeline.prototype.updateSelectedElements = function() {
  this.selectedElements(this.selectedElements().filter(function(el) {
    return this.containsElement(el)
  }.bind(this)))
}

Timeline.prototype.containsElement = function(element) {
  return element === this || (ko.isObservable(element.path) && this.getElementAtPath(element.path()) === element)
}

Timeline.prototype.updateElement = function(data, path) {
  var element = this.getElementAtPath(path)
  if (element) {
    element.update(data, path)
  } else {
    console.warn("updateElement: element not found", path)
  }
  this.updateFocusedElement()
  this.updateSelectedElements()
}

Timeline.prototype.equal = function(other) {
  return other instanceof Timeline &&
         this.id === other.id &&
         _.all(_.zipWith(this.containers(), other.containers(), function(a, b) {
           return a.equal(b)
         }))
}

/**
 * Get a copy of the  underlying data from timeline model. In contrast to
 * ko.unwrapDeep, this takes care of unwrapping ONLY relevant data and avoids
 * model cycles, e.g. the held library instance is not included.
 * 从timeline模型中获取基础数据的副本，与ko.unwrapDeep相比，
 * 它只负责解包相关数据并避免模型cycle，例如,held library实例不包括在内。
 */
Timeline.prototype.unwrap = function() {
  return {
    id: this.id,
    containers: _.invoke(this.containers(), "unwrap"),
    name: ko.unwrapDeep(this.name),
    components: ko.unwrapDeep(this.components),
    parameter: ko.unwrapDeep(this.parameter),
  }
}

Timeline.prototype.getElementAtPath = function(path) {
  if (!path || path.id !== this.id) {
    return null
  }
  function elementAtIndex(array, indices) {
    var entry = array[indices.shift()]
    if (indices.length === 0) {
      return entry
    }
    if (entry && entry.containers) {
      return elementAtIndex(entry.containers(), indices.slice())
    } else if (entry && entry.elements) {
      return elementAtIndex(entry.elements(), indices.slice())
    }
    return null
  }
  return elementAtIndex(this.containers(), path.indices.slice())
}

Timeline.prototype.getParameterUpdates = function() {
  var updates = []
  util.traverseTimeline(this, function(path, element) {
    if ("parameter" in element) {
      if (element.parameter.value.isDirty()) {
        updates.push({ path: path, parameter: element.parameter.value() })
      }
      if (element.componentProviders && element.componentProviders.isDirty()) {
        updates.push({ path: path, componentProviders: ko.unwrapDeep(element.componentProviders) })
      }
    }
  })
  return updates
}

Timeline.prototype.commitParameterUpdates = function() {
  util.traverseTimeline(this, function(_, element) {
    if ("parameter" in element) {
      element.parameter.commit()
    }
  })
}

Timeline.prototype.resetParameterUpdates = function() {
  util.traverseTimeline(this, function(_, element) {
    if ("parameter" in element) {
      element.parameter.reset()
    }
  })
}


/***/ }),
/* 39 Matrix*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * Matrix utility functions. Matrices are 16-dimensional arrays of  stacked
 * column-major.
 */
var Matrix = module.exports = {}

var _ = __webpack_require__(0)

Matrix.transpose = function(m) {
  var mT = new Array(16)
  mT[0] = m[0]
  mT[1] = m[4]
  mT[2] = m[8]
  mT[3] = m[12]

  mT[4] = m[1]
  mT[5] = m[5]
  mT[6] = m[9]
  mT[7] = m[13]

  mT[8] = m[2]
  mT[9] = m[6]
  mT[10] = m[10]
  mT[11] = m[14]

  mT[12] = m[3]
  mT[13] = m[7]
  mT[14] = m[11]
  mT[15] = m[15]

  return mT
}

// 反转矩阵m
// Inverts the matrix m (column-major) into a new matrix and returns it.
Matrix.invert = function(m) {
  var mInv = Matrix.transpose(m)
  mInv[3] = mInv[7] = mInv[11] = 0
  mInv[12] = -(m[0] * m[12] + m[1] * m[13] + m[2] * m[14])
  mInv[13] = -(m[4] * m[12] + m[5] * m[13] + m[6] * m[14])
  mInv[14] = -(m[8] * m[12] + m[9] * m[13] + m[10] * m[14])
  mInv[15] = 1
  return mInv
}

// 点乘矩阵
// Multiplies the passed matrices a, b into a new matrix and returns it.
Matrix.dot = function(a, b) {
  var out = new Array(16)

  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
      a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
      a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
      a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  // Cache only the current line of the second matrix
  var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}

// 返回一个新的单位矩阵
Matrix.identity = function() {
  var i = _.fill(Array(16), 0)
  i[0] = i[5] = i[10] = i[15] = 1
  return i
}

/**
 * 用x，y和z的给定值来translate变换矩阵m
 */
Matrix.translate = function(m, x, y, z) {
  m = _.clone(m)
  m[12] += (x || 0)
  m[13] += (y || 0)
  m[14] += (z || 0)
  return m
}

Matrix.transformRelativeTrajectoryNewFrame = function(trajectory, oldFrame, newFrame) {
  return _.map(trajectory, function(p) {
    var oldFrameInv = Matrix.invert(oldFrame)
    return Matrix.dot(newFrame, Matrix.dot(oldFrameInv, p))
  })
}

Matrix.matricesEqual = function(a, b, precision) {
  var tolerance = 0.5 * Math.pow(10, -(precision === 0 || precision === undefined ? 7 : precision))
  if (!a || !b) {
    return a === b
  } else if (!_.isArray(a) || !_.isArray(b)) {
    throw new Error("matricesEqual requires two matrices")
  }
  return _.every(_.zip(a, b), function(ms) {
    return Math.abs(ms[0] - ms[1]) < tolerance
  })
}

Matrix.trajectoriesEqual = function(a, b, precision) {
  return _.every(_.zip(a, b), function(ts) {
    return Matrix.matricesEqual(ts[0], ts[1], precision)
  })
}

Matrix.trajectoryParametersEqual = function(a, b, precision) {
  function poseToMatrix(p) { return p.pose }
  return Matrix.trajectoriesEqual(_.map(a, poseToMatrix), _.map(b, poseToMatrix), precision)
}

/**
 * 移动/变换传递轨迹的所有点：假设点绝对但“锚定anchored'在'from' pose，对它们进行变换，使它们“锚定”在'to'姿势，但仍然是绝对坐标。
 * 假设'trajectory' 参数的每个点包含{[16]浮点姿势}的条目entry，并且'from'和'to'参数被假定为{[16] float pose} 结构。
 * 返回值是相同格式的轨迹。parameter is assumed to contain a
 *  { [16]float pose; } entry per point, and the 'from' and 'to' parameters are
 * assumed to be {[16]float pose; } structs.
 *
 * All matrices are specified column-major.
 */
Matrix.moveTrajectory = function(trajectory, from, to) {
  var nullPose = [0, 0, 0, 0,
                  0, 0, 0, 0,
                  0, 0, 0, 0,
                  0, 0, 0, 0]
  if (!from || !to || _.isEqual(to.pose, nullPose) || _.isEqual(from.pose, nullPose)) {
    return trajectory
  }
  var originalPoints = _.map(trajectory, "pose")
  var originalJointAngles = _.map(trajectory, "joint_angles")
  var transformedPoints =
    Matrix.transformRelativeTrajectoryNewFrame(originalPoints, from.pose, to.pose)
  return _.map(_.zip(transformedPoints, originalJointAngles), function(p) {
    return {pose: p[0], joint_angles: p[1]} // eslint-disable-line camelcase
  })
}
/**
 * Move/transform passed pose: Assume pose absolute, but 'anchored' at the
 * 'from' pose and transform it so it is 'anchored' at the 'to' pose,
 * but still in absolute coordinates.
 * 假设'pose'，'from'和'to'参数是{[16] float pose}类型的struct;
 *
 * All matrices are specified column-major
 */
Matrix.movePose = function(pose, from, to) {
  var nullPose = [0, 0, 0, 0,
                  0, 0, 0, 0,
                  0, 0, 0, 0,
                  0, 0, 0, 0]
  if (!from || !to || _.isEqual(to.pose, nullPose) || _.isEqual(from.pose, nullPose)) {
    return pose
  }
  var oldFrameInv = Matrix.invert(from.pose)
  var transformedPose =  Matrix.dot(to.pose, Matrix.dot(oldFrameInv, pose.pose))
  return {pose: transformedPose, joint_angles: pose.joint_angles} // eslint-disable-line camelcase
}


/***/ }),
/* 40 */,
/* 41 */,
/* 42 */,
/* 43 LibraryItem*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = LibraryItem

var _ = __webpack_require__(0)
var $ = __webpack_require__(6)
var ko = __webpack_require__(1)

var assert = __webpack_require__(7)

function LibraryItem(params) {
  assert.keys(params, "controller", "model")
  this.controller = params.controller

  var model = ko.unwrap(params.model)
  this.id = model.id
  this.name = model.name
  this.color = model.color
  this.image = model.image
  this.contextMenu = model.contextMenu

  _.bindAll(this, "dragStart", "drag", "dragEnd", "dragHint", "appendElement")
}

LibraryItem.prototype.dragStart = function() {
  this.controller.uiEvents.notifyLibraryItemDragStart(this)
}

LibraryItem.prototype.drag = function(vm, event) {
  this.controller.uiEvents.notifyLibraryItemDrag(this, event)
}

LibraryItem.prototype.dragEnd = function() {
  this.controller.uiEvents.notifyLibraryItemDragEnd(this)
}

LibraryItem.prototype.dragHint = function(element) {
  var hint = $(element).clone()
  var label = document.createElement("label")
  label.innerHTML = this.name().toUpperCase()
  hint.append(label)
  return hint
}

LibraryItem.prototype.appendElement = function() {
  var tl = ko.unwrap(this.controller.timeline)
  var nrContainers = ko.unwrap(tl.containers).length
  if (tl && nrContainers > 0) {
    var to = {id: tl.id, indices: [nrContainers - 1,
      ko.unwrap(ko.unwrap(tl.containers)[nrContainers - 1].elements).length]}
    this.controller.com.insertElement(this.id, to)
  }
}


/***/ }),
/* 44 TimelineGroup viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = TimelineGroup

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var assert = __webpack_require__(7)
var ComponentProviders = __webpack_require__(29)
var settings = __webpack_require__(11)
var util = __webpack_require__(4)
var dialogs = __webpack_require__(8)

/**
 * @class
 * @memberof module:components/workspace/timeline/group
 */
function TimelineGroup(params) {
  assert.keys(params, "controller", "model")
  this.settings = settings
  this.controller = params.controller
  this.model = params.model
  this.path = this.model.path
  this.containers = this.model.containers
  this.name = this.model.name
  this.color = this.model.color
  this.image = this.model.image
  this.active = this.model.active
  this.focused = this.model.focused
  this.showContextMenu = this.model.showContextMenu
  this.showSelectionMenu = this.model.showSelectionMenu
  this.isSelected = this.model.isSelected

  this.clicked = params.clicked || _.noop
  this.rightClicked = params.rightClicked || _.noop
  this.contextMenuRequestClose = params.contextMenuRequestClose
  this.dropZonesEnabled = params.dropZonesEnabled

  this.isLinear = ko.pureComputed(function() {
    return !this.image().open || !this.image().close
  }, this)

  this.isLastActive = ko.pureComputed(function() {
    var path = this.path()
    var execution = ko.unwrap(this.controller.execution)
    return execution && execution.running && execution.state.id === path.id &&
           _.isEqual(execution.lastActivePath, path)
  }, this)
  this.isLastError = ko.pureComputed(function() {
    var execution = ko.unwrap(this.controller.execution)
    return execution && execution.running && execution.errorHandling &&
           _.isEqual(execution.lastActivePath, this.path())
  }, this)

  this.configured = ko.pureComputed(function() {
    return !util.containsNull(this.model.parameter.value())
  }, this)

  this.currentSource = ko.observable(false)
  this.linked = ko.observable(false)
  this.linkable = ko.observable(false)
  this.linkingSink = ko.observable() // Holds a sink while linking and if linkable
  this.linkingSource = ko.observable() // Holds a source while linking and if linkable
  this.dragging = ko.observable(false)
  this.contextWidth = ko.observable("initial")

  _.bindAll(this, "dragStart", "drag", "dragEnd", "dragHint", "click",
            "handleDelete", "handleSave", "handleRename")

  this.subs = []
  var componentSinkEvents = this.controller.componentSinkEvents
  this.subs.push(componentSinkEvents.onCurrentComponentProvider(function(cp) {
    this.currentSource(cp && _.eq(cp.sourcePath, this.path()))
    this.linked(cp && ComponentProviders.isLinkedWith(this.model, cp.model, cp.stepId))
  }.bind(this)))
  this.subs.push(componentSinkEvents.onLinkableComponentSinks(function(sink) {
    var linkable = sink && sink.hasLinkableSource(this.path())
    this.linkable(!!linkable)
    this.linkingSink(linkable ? sink : null)
  }.bind(this)))
  this.subs.push(componentSinkEvents.onLinkableComponentSources(function(source) {
    var linkable = source && source.isSource(this.model.path())
    this.linkable(!!linkable)
    this.linkingSource(linkable ? source : null)
  }.bind(this)))
}

TimelineGroup.prototype.dispose = function() {
  _.invoke(this.subs, "dispose")
}

TimelineGroup.prototype.dragGroupConfig = function() {
  return {
    group: "element",
    dragstart: this.dragStart,
    drag: this.drag,
    dragend: this.dragEnd,
    hint: this.dragHint
  }
}

TimelineGroup.prototype.dragStart = function() {
  this.dragging(true)
  this.controller.uiEvents.notifyTimelineElementDragStart(this)
}

TimelineGroup.prototype.drag = function(vm, event) {
  this.controller.uiEvents.notifyTimelineElementDrag(this, event)
}

TimelineGroup.prototype.dragEnd = function() {
  this.dragging(false)
  this.controller.uiEvents.notifyTimelineElementDragEnd(this)
}

TimelineGroup.prototype.dragHint = function(element) {
  var hint = element.closest(".group").clone()
  hint.find("one-context-menu").remove()
  hint.find(".group-label").remove()
  hint.find(".group-body").remove()
  return hint
}

TimelineGroup.prototype.click = function(bindingContext, event) {
  if (this.linkingSink()) {
    var sink = this.linkingSink()
    var source = ComponentProviders.getSourceDataForSink(sink, this.model)
    sink.callback(source)
  } else if (this.linkingSource()) {
    this.linkingSource().callback(this.path())
  } else {
    this.clicked(this.model, event)
  }
}

TimelineGroup.prototype.rightClick = function() {
  this.rightClicked(this.model)
}

TimelineGroup.prototype.handleDelete = function() {
  this.controller.com.deleteElement(this.path())
}

TimelineGroup.prototype.handleSave = function() {
  var self = this
  var text = "Save group <b>" + ko.unwrap(this.name) + "</b> as template"
  dialogs.showTextDialog(text, ko.unwrap(this.name), function(name) {
    self.controller.com.createTemplate(ko.unwrapDeep(self.path), name).then(function() {}, function(e) {
      self.controller.uiEvents.notifyLogError("Failed to save group: " + JSON.stringify(e))
    })})
}

TimelineGroup.prototype.handleRename = function() {
  var self = this
  var text = "Enter new name for group <b>" + ko.unwrap(this.name) + ""
  dialogs.showTextDialog(text, ko.unwrap(this.name), function(name) {
    self.controller.com.renameElement(ko.unwrapDeep(self.path), name).then(function() {}, function(e) {
      self.controller.uiEvents.notifyLogError("Failed to rename group: " + JSON.stringify(e))
    })})
}


/***/ }),
/* 45 TimelineSkill*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = TimelineSkill

var _ = __webpack_require__(0)
var $ = __webpack_require__(6)
var ko = __webpack_require__(1)

var assert = __webpack_require__(7)
var ComponentProviders = __webpack_require__(29)
var settings = __webpack_require__(11)
var util = __webpack_require__(4)

/**
 * @class
 * @memberof module:components/workspace/timeline/skill
 */
function TimelineSkill(params) {
  assert.keys(params, "controller", "model")
  this.settings = settings
  this.controller = params.controller
  this.model = params.model
  this.path = this.model.path
  this.id = this.model.id
  this.name = this.model.name
  this.link = this.model.link
  this.color = this.model.color
  this.image = this.model.image
  this.active = this.model.active
  this.focused = this.model.focused
  this.showContextMenu = this.model.showContextMenu
  this.showSelectionMenu = this.model.showSelectionMenu
  this.enabled = this.model.enabled

  this.clicked = params.clicked || _.noop
  this.rightClicked = params.rightClicked || _.noop
  this.contextMenuRequestClose = params.contextMenuRequestClose

  this.isLastActive = ko.pureComputed(function() {
    var path = this.path()
    var execution = ko.unwrap(this.controller.execution)
    return execution && execution.running && execution.state.id === path.id &&
           _.isEqual(execution.lastActivePath, path)
  }, this)
  this.isLastError = ko.pureComputed(function() {
    var execution = ko.unwrap(this.controller.execution)
    return execution && execution.running && execution.errorHandling &&
           _.isEqual(execution.lastActivePath, this.path())
  }, this)

  this.configured = ko.pureComputed(function() {
    return !util.containsNull(this.model.parameter.value())
  }, this)

  this.linked = ko.observable(false)
  this.linkable = ko.observable(false)
  this.linkingSink = ko.observable() // Holds a sink while linking and if linkable
  this.lookForSource = ko.observable(false)
  this.renaming = ko.observable()
  this.dragging = ko.observable(false)
  this.contextWidth = ko.observable("initial")

  _.bindAll(this, "dragStart", "drag", "dragEnd", "dragHint", "click", "handleDelete")

  this.subs = []
  this.subs.push(this.controller.componentSinkEvents.onCurrentComponentProvider(function(cp) {
    this.linked(cp && ComponentProviders.isLinkedWith(this.model, cp.model, cp.stepId))
  }.bind(this)))
  this.subs.push(this.controller.componentSinkEvents.onLinkableComponentSinks(function(sink) {
    var linkable = sink && sink.hasLinkableSource(this.path())
    this.linkable(!!linkable)
    this.linkingSink(linkable ? sink : null)
  }.bind(this)))
  this.subs.push(this.controller.componentSinkEvents.onLinkableComponentSources(function(source) {
    this.lookForSource(!!source && this.showContextMenu())
  }.bind(this)))
}

TimelineSkill.prototype.dispose = function() {
  _.invoke(this.subs, "dispose")
}

TimelineSkill.prototype.dragStart = function() {
  this.dragging(true)
  this.controller.uiEvents.notifyTimelineElementDragStart(this)
}

TimelineSkill.prototype.drag = function(vm, event) {
  this.controller.uiEvents.notifyTimelineElementDrag(this, event)
}

TimelineSkill.prototype.dragEnd = function() {
  this.dragging(false)
  this.controller.uiEvents.notifyTimelineElementDragEnd(this)
}

TimelineSkill.prototype.dragHint = function(element) {
  return $(element).parent().clone()
}

TimelineSkill.prototype.click = function(bindingContext, event) {
  var sink = this.linkingSink()
  if (sink) {
    var source = ComponentProviders.getSourceDataForSink(sink, this.model)
    sink.callback(source)
  } else {
    this.clicked(this.model, event)
  }
}

TimelineSkill.prototype.rightClick = function() {
  this.rightClicked(this.model)
}

/** Start renaming the skill / switch to renaming mode. */
TimelineSkill.prototype.startRename = function() {
  this.renaming(this.name())
}

/**
 * End renaming the skill and save the current name. If an error
 * occurs, the original name is restored.
 */
TimelineSkill.prototype.endRename = function() {
  var self = this
  this.controller.com.renameElement(this.path(), ko.unwrap(this.name))
  .then(function() {
    self.renaming(undefined)
  }, function() {
    self.name(self.renaming())  // Reset name
    self.renaming(undefined)
  })
}

TimelineSkill.prototype.handleDelete = function() {
  this.controller.com.deleteElement(this.path())
}


/***/ }),
/* 46 ko.wrap*/
/***/ (function(module, exports, __webpack_require__) {

var _ = __webpack_require__(0)

module.exports = function(ko) {
  if (!ko.wrap) {
    /**
     * 确保传递的value是observable (array). 如果value为undefined, 使用默认值替代.
      * @param  {Object} value Value in question.
      * @param  {Object} def Default value to use if value === undefined.
      * @return {ko.observable(Object)} An observable holding value or def.
      */
    ko.wrap = function(value, def) {
      value = value === undefined ? def : value
      if (ko.isObservable(value)) {
        return value
      }
      if (_.isArray(value)) {
        return ko.observableArray(value)
      }
      return ko.observable(value)
    }
  }
}


/***/ }),
/* 47 selectionHandler*/
/***/ (function(module, exports, __webpack_require__) {

var selectionHandler = module.exports = {}

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var util = __webpack_require__(4)
var SkillElement = __webpack_require__(18)
var dialogs = __webpack_require__(8)

function setEnabled(selectedElements, com, enabled) {
  return com.setElementsEnabled(
    ko.unwrap(selectedElements).filter(function(el) {
      return el instanceof SkillElement
    }).map(function(element) {
      return {
        path: ko.unwrapDeep(element.path),
        enabled: enabled
      }
    }))
}

selectionHandler.enable = function(selectedElements, com) {
  setEnabled(selectedElements, com, true)
}

selectionHandler.disable = function(selectedElements, com) {
  setEnabled(selectedElements, com, false)
}

selectionHandler.remove = function(selectedElements, com) {
  var sortedPaths = getSortedElements(selectedElements).map(function(element) {
    return ko.unwrapDeep(element.path)
  })
  var pathsWithoutChildren = removeSuffixes(sortedPaths)
  com.deleteElements(pathsWithoutChildren)
}

selectionHandler.rename = function(element, com) {
  dialogs.showTextDialog("Enter a new name for<br />'" + element.name() + "'", element.name(), function(name) {
    com.renameElement(element.path(), name)
    .catch(function() {
      dialogs.showMessageDialog({
        icon: "error",
        title: "Failed to rename element"
      })
    })
  })
}

selectionHandler.invert = function(selectedElements, elements) {
  var all = selectElementsWithChildren([], elements)
  return _.difference(all, ko.unwrap(selectedElements))
}

selectionHandler.selectAll = function(elements) {
  return selectElementsWithChildren([], elements)
}

selectionHandler.toggleSelection = function(selectedElements, elementToToggle) {
  if (selectedElements.indexOf(elementToToggle) === -1) {
    return addSelection(selectedElements, elementToToggle)
  } else {
    return removeSelection(selectedElements, elementToToggle)
  }
}

function addSelection(selectedElements, elementToSelect) {
  return selectedElements.concat(elementToSelect)
}

function removeSelection(selectedElements, elementToRemove) {
  return selectedElements.filter(function(element) { return element !== elementToRemove })
}

function selectElementsWithChildren(selectedElements, elementsToAdd) {
  selectedElements = Object.assign([], selectedElements)
  util.traverseElements(elementsToAdd, function(path, element) {
    if (selectedElements.indexOf(element) === -1) {
      selectedElements.push(element)
    }
  })
  return selectedElements
}

function getSortedElements(selectedElements) {
  return _.sortBy(ko.unwrap(selectedElements), function(element) { return ko.unwrap(element.path).indices })
}

function removeSuffixes(paths) {
  return paths.filter(function(pathToFilter) {
    return !_.any(paths, function(pathToCompare) {
      return util.isPrefix(ko.unwrap(pathToCompare).indices, ko.unwrap(pathToFilter).indices)
    })
  })
}


/***/ }),
/* 48 */,
/* 49 */,
/* 50 */,
/* 51 */,
/* 52 */,
/* 53 */,
/* 54 */,
/* 55 */,
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(57);


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

// Explicitly leak jQuery such that knockout can find it on window
var $ = window.jQuery = __webpack_require__(6)
var ko = __webpack_require__(1)

__webpack_require__(31)
var com = __webpack_require__(19)
var Controller = __webpack_require__(63)
var auth = __webpack_require__(12)

__webpack_require__(78)
__webpack_require__(79)
__webpack_require__(80)

$(document).ready(function() {
  if (!auth.loggedIn()) {
    location.replace("/login?redirect=" + location.href)
    return
  }
  if (!location.pathname.startsWith(BASE_URL)) {
    location.replace(BASE_URL)
    return
  }

  var App = __webpack_require__(81)
  var controller = new Controller(com)
  var app = new App(controller)
  ko.applyBindings(app)
  controller.connect()
})


/***/ }),
/* 58 */,
/* 59 */,
/* 60 */,
/* 61 */,
/* 62 */,
/* 63 Controller*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * The controller module定义了一个简单的控制器，用于管理从app服务器接收的一个model的客户端表示
 * @module app/controller
 */
module.exports = Controller

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var ComponentLoader = __webpack_require__(64)
var Events = __webpack_require__(23)
var Keyboard = __webpack_require__(65)
var Library = __webpack_require__(69)
var OneAPI = __webpack_require__(72)
var Pilot = __webpack_require__(75)
var dialogs = __webpack_require__(8)
var Startup = __webpack_require__(76)
var ProcessMonitor = __webpack_require__(77)

/**
 * 用给定的com实例创建一个新的控制器实例. controller管理的data model是observable的,
 * 即，可能更改的所有属性都包含在Knockout observables或observable数组中。
 *
 * 另外controller提供了事件机制，允许订阅不同的UI events.
 *
 * 特别地，controller提供以下字段:
 * * ``library`` - 对象 - [Library]{@link module:app/controller.Library}类的实例.
 * * ``timeline`` - object - The currently selected timeline.
 * * ``com`` - object - The com instance passed to this class.
 * * ``uiEvents`` - object - [Events]{@link module:app/events.Events}的一个实例
 *
 * @class
 * @memberof module:app/controller
 * @param {object} com - controller使用的通信接口,必须是[Com]{@link module:app/com.Com}的实例
 */
function Controller(com) {
  /**
   * [Library]{@link module:app/controller.Library}的实例，包含app服务器的当前
   * library tasks, skills 和 timelines
   * 创建时，控制器通过调用com对象中的相应方法初始化其library，并将当前timeline设置为第一个timeline对象
   */
  this.library = new Library()

  /**
   * The currently selected timeline.
   */
  this.timeline = ko.observable()

  /**
   * The current execution state.
   */
  this.execution = ko.observable({
    running: false,
    error: null,
    errorHandling: false,
    lastActivePath: null,
    tracking: true,
    state: null
  })

  /**
   * The com interface as an instance of [Com]@link module:app/com.Com}.
   */
  this.com = com

  this.subs = []
  this.timelineSubs = []

  this.comEvents = new Events("com")
  this.comEvents.register("connected")
  this.comEvents.register("disconnected")

  // Com connection status
  this.isConnected = ko.observable(false)
  this.isShutDown = ko.observable(false)
  this.isReboot = ko.observable(false)

  this.comEvents.onConnected(function() {
    this.isConnected(true)
    this.isShutDown(false)
    this.isReboot(false)
  }.bind(this))
  this.comEvents.onDisconnected(this.isConnected.bind(this, false))

  this.startup = new Startup(com, this.isShutDown, this.isReboot)

  // ui event dispatcher 是 [Events]{@link module:app/events.Events}的实例
  this.uiEvents = new Events("ui")
  this.uiEvents.register("logInfo")
  this.uiEvents.register("logWarn")
  this.uiEvents.register("logError")
  this.uiEvents.register("timelineDragStart")
  this.uiEvents.register("timelineDragEnd")
  this.uiEvents.register("libraryItemDragStart")
  this.uiEvents.register("libraryItemDragEnd")
  this.uiEvents.register("libraryItemDrag")
  this.uiEvents.register("timelineElementDragStart")
  this.uiEvents.register("timelineElementDragEnd")
  this.uiEvents.register("timelineElementDrag")
  this.uiEvents.register("dropZoneCreated")
  this.uiEvents.register("dropZoneDisposed")

  this.navEvents = new Events("nav")
  this.pilot = new Pilot(this.navEvents, this.com)

  // Navigation events connection status
  this.isNavEventsConnected = ko.observable(false)
  this.navEvents.onConnected(this.isNavEventsConnected.bind(this, true))
  this.navEvents.onDisconnected(this.isNavEventsConnected.bind(this, false))

  Keyboard(this.navEvents, this.isNavEventsConnected, this.startup.isRunning)

  this.processMonitor = new ProcessMonitor(this.com)

  this.componentLoader = new ComponentLoader(this)

  this.componentSinkEvents = new Events("componentSink")
  this.componentSinkEvents.register("currentComponentProvider")
  this.componentSinkEvents.register("linkableComponentSinks")
  this.componentSinkEvents.register("linkableComponentSources")
  this.oneAPI = new OneAPI(this)

  // Map of timeline registrations used by withTimeline.
  this.withTimelineSubs = []
  this.library.timelines.subscribe(this.processWithTimelineSubs.bind(this))

  this.timerShutDown = ko.computed(function() {
    return this.isShutDown()
  }, this).extend({ rateLimit: { timeout: 60000, method: "notifyWhenChangesStop" } })

  this.showOverlay = ko.pureComputed(function() {
    if (!dialogs.dialogVisible()) {
      if (this.startup.isRunning()) {
        return "startup"
      } else if (this.isShutDown()) {
        return "shutdown"
      } else if (this.isReboot()) {
        return "reboot"
      } else if ((this.isConnected() || this.processMonitor.isConnected()) && !this.processMonitor.up()) {
        // We only want to show the 'process dead' overlay if we know
        // that some process is still up. Otherwise, we might show it
        // even when we are not connected to a master controller
        // anymore.
        return "process-dead"
      } else if (!this.isConnected() || !this.processMonitor.isConnected()) {
        return "disconnected"
      } else if (!this.isNavEventsConnected()) {
        return "no-nav"
      }
    }
  }, this)
}

/**
 * 从app服务器重新加载所有信息。 重新加载完整的库后，还要使用从app服务器收到的第一个时间轴初始化当前时间轴
 * @returns {Promise} A promise with no data but indicating success.
 */
Controller.prototype.connect = function() {
  var self = this
  return new Promise(function(resolve) {
    var connections = {
      skills: false,
      groups: false,
      timelines: false,
      execution: false
    }
    var connected = false
    var onConnected = function(name) {
      connections[name] = true
      if (connections.skills && connections.groups && connections.timelines && connections.execution) {
        connected = true
        self.comEvents.notifyConnected()
        resolve()
      }
      self.startup.stopObserving()
   }
    var onClose = function(name) {
      connections[name] = false
      if (connected) {
        connected = false
        self.comEvents.notifyDisconnected()
      }
      if (!connections.skills && !connections.groups && !connections.timelines && !connections.execution) {
        self.startup.startObserving()
      }
    }

    self.subs.push(self.com.onSkillsChanged({
      onData: self.skillsChanged.bind(self),
      onOpen: onConnected.bind(this, "skills"),
      onClose: onClose.bind(this, "skills")
    }))
    self.subs.push(self.com.onGroupsChanged({
      onData: self.groupsChanged.bind(self),
      onOpen: onConnected.bind(this, "groups"),
      onClose: onClose.bind(this, "groups")
    }))
    self.subs.push(self.com.onTimelinesChanged({
      onData: self.timelinesChanged.bind(self),
      onOpen: onConnected.bind(this, "timelines"),
      onClose: onClose.bind(this, "timelines")
    }))
    self.subs.push(self.com.onExecutionChanged({
      onData: self.executionChanged.bind(self),
      onOpen: onConnected.bind(this, "execution"),
      onClose: onClose.bind(this, "execution")
    }))
  })
}

/**
 * 将当前的timeline设置为参数中指定的timeline.
 *
 * @param {string} timelineId The id of the timeline to load.
 */
Controller.prototype.reloadTimeline = function(timeline) {
  if (!timeline) {
    console.log("timeline is undefined.")
    return
  }
  if (timeline !== this.timeline()) {
    // 我们已经订阅了一个timeline，“reloadTimeline”将订阅一个不同的timeline.
      // In that case, we need to close our existing web sockets and reconnect.
    _.invoke(this.timelineSubs, "dispose")
    this.timelineSubs = []
  }
  return new Promise(function(resolve) {
    if (this.timelineSubs.length === 0) {
      this.timelineSubs.push(this.com.onTimelineChanged(timeline.id, {
        onOpen: resolve,
        onData: this.timelineChanged.bind(this)
      }))
    } else {
      resolve()
    }
  }.bind(this))
  .then(function() {
    this.timeline(timeline)
    this.uiEvents.notifyLogInfo("Opened task '" + timeline.name() + "'")
  }.bind(this))
}

Controller.prototype.groupsChanged = function(groups) {
  console.debug("groupsChanged", groups)
  this.library.updateGroups(groups)
}

Controller.prototype.skillsChanged = function(skills) {
  console.debug("skillsChanged", skills)
  this.library.updateSkills(skills)
  if (this.timeline()) {
    this.componentLoader.updateTimelineComponents(this.timeline())
  }
}

Controller.prototype.timelinesChanged = function(timelines) {
  console.debug("timelinesChanged", timelines)
  this.library.updateTimelines(timelines)
  // Update currently loaded timeline accordingly
  if (timelines.length === 0) {
    this.timeline(undefined)
    return
  }
  // Switch timeline if none selected or the current was deleted
  var timeline = this.timeline()
  if (!timeline || !_.findWhere(timelines, { id: timeline.id })) {
    this.reloadTimeline(_.first(this.library.timelines()))
  }
}

Controller.prototype.executionChanged = function(execution) {
  console.debug("executionChanged", execution)
  // Log whats going and and update the observable
  if (execution.error) {
    this.uiEvents.notifyLogError("<b>Execution runtime error</b>")
  } else if (this.execution().tracking && !execution.tracking) {
    this.uiEvents.notifyLogWarn("<b>Execution warning:</b> not tracking most recent state")
  } else if (!this.execution().running && execution.running) {
    this.uiEvents.notifyLogInfo("Execution started")
  } else if (this.execution().running && !execution.running) {
    this.uiEvents.notifyLogInfo("Execution stopped")
  }
  this.execution(execution)
  var timelineId = execution.id
  if (!timelineId && execution.lastActivePath) {
    timelineId = execution.lastActivePath.id
  } else if (!timelineId && execution.state) {
    timelineId = execution.state.id
  }
  if (timelineId) {
    return this.withTimeline({ id: timelineId })
    .then(function(timeline) {
      // Switch timeline if none selected or current timeline does not match execution info
      if (!this.timeline() || this.timeline().id !== timeline.id) {
        this.reloadTimeline(timeline)
      }
      if (execution.state && execution.state.id === timeline.id) {
        timeline.active(execution.state.active)
        _.map(_.zipWith(timeline.containers(), execution.state.children, updateContainerActivation))
      } else {
        deactivate(timeline)
      }
    }.bind(this))
  }
}

function deactivate(element) {
  element.active(false)
  _.map(ko.unwrap(element.containers), deactivate)
  _.map(ko.unwrap(element.elements), deactivate)
}

function updateElementActivation(element, activation) {
  if (activation === undefined) {
    deactivate(element)
  } else {
    element.active(activation.active)
    _.map(_.zipWith(ko.unwrap(element.containers), activation.children, updateContainerActivation))
  }
}

function updateContainerActivation(container, activation) {
  if (activation === undefined) {
    deactivate(container)
  } else {
    container.active(activation.active)
    _.map(_.zipWith(ko.unwrap(container.elements), activation.children, updateElementActivation))
  }
}

Controller.prototype.timelineChanged = function(data) {
  console.debug("timelineChanged", data)
  if (data.timeline) {
    // Timeline update
    this.timeline().update(data.timeline)
    this.componentLoader.updateTimelineComponents(this.timeline())
  }
  if (data.path) {
    // Element update
    if (!data.path.id || !data.path.indices || data.path.indices.length < 1) {
      console.warn("encountered invalid element update")
      return
    }
    if (!this.timeline() || data.path.id !== this.timeline().id) {
      console.log("ignoring element update for other timeline")
      return
    }
    this.timeline().updateElement(data.element, data.path)
    this.componentLoader.updateElementComponents(this.timeline().getElementAtPath(data.path))
  }
}

function matchProps(props, obj) {
  return _.reduce(obj, function(result, val, prop) {
    if (prop in props) {
      return result || ko.unwrap(val) === props[prop]
    } else {
      return result
    }
  }, false)
}

// 使用与指定名称匹配的时间轴执行指定的函数。 如果时间线尚不存在，则延迟执行该函数，直到存在这样的时间线。 该功能保证最多执行一次。
Controller.prototype.withTimeline = function(props) {
  var timeline = _.find(this.library.timelines(), _.curry(matchProps)(props))
  if (timeline) {
    return Promise.resolve(timeline)
  }
  return new Promise(function(resolve) {
    this.withTimelineSubs.push({ props: props, resolve: resolve })
  }.bind(this))
}

Controller.prototype.processWithTimelineSubs = function(timelines) {
  this.withTimelineSubs = _.reduce(this.withTimelineSubs, function(result, sub) {
    var timeline = _.find(timelines, _.curry(matchProps)(sub.props))
    if (timeline) {
      sub.resolve(timeline)
      return result
    } else {
      return result.concat([sub])
    }
  }, [])
}

/**
 * 保存值比core中存储的值更新的所有参数。
 */
Controller.prototype.saveUpdatedParameters = function() {
  var updates = this.timeline().getParameterUpdates()
  if (updates.length > 0) {
    return this.com.saveParameters(updates)
      .then(function() {
        this.timeline().commitParameterUpdates()
        this.uiEvents.notifyLogInfo("Saved parameters")
      }.bind(this))
      .catch(function() {
        this.timeline().resetParameterUpdates()
        this.uiEvents.notifyLogError("Saving parameters failed!")
      }.bind(this))
  } else {
    return Promise.resolve()
  }
}

Controller.prototype.shutdown = function(force) {
  if (!force && this.execution().running) {
    return dialogs.showMessageDialog({
      icon: "error",
      title: "Cannot shut down",
      text: "Execution is still running!"
    })
  }
  return (force ? Promise.resolve("yes") : dialogs.showMessageDialog({
    icon: "warning",
    title: "Shut down Control?",
    buttons: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No", isCancel: true },
    ]
  }))
  .then(function(id) {
    if (id === "yes") {
      dialogs.close()
      return this.com.shutdown()
      .catch(function(error) {
        //如果我们确实收到错误响应，则只显示错误消息。 原因：关闭时，REST调用可能不会// 终止，因为app服务器被shutdown命令killed。 在这种情况下，我们不希望显示错误对话框。
        if (!(error instanceof TypeError)) {
          throw error
        }
      })
      .then(this.isShutDown.bind(this, true))
      .catch(function() {
        return dialogs.showMessageDialog({
          icon: "error",
          title: "Shutdown failed",
          text: "Make sure the user stop is closed!"
        })
      })
    }
  }.bind(this))
}

Controller.prototype.reboot = function(force) {
  if (!force && this.execution().running) {
    return dialogs.showMessageDialog({
      icon: "error",
      title: "Cannot reboot",
      text: "Execution is still running!"
    })
  }
  return (force ? Promise.resolve("yes") : dialogs.showMessageDialog({
    icon: "warning",
    title: "Reboot Control?",
    buttons: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No", isCancel: true },
    ]
  }))
  .then(function(id) {
    if (id === "yes") {
      dialogs.close()
      return this.com.reboot()
      .catch(function(error) {
        // Only show an error message if we actually got an error
        // response. Reason: when shutting down, the REST call will
        // likely not terminate because the app server is killed by
        // the shutdown command. In that case, we don't want to show
        // the error dialog.
        if (!(error instanceof TypeError)) {
          throw error
        }
      })
      .then(this.isReboot.bind(this, true))
      .catch(function() {
        return dialogs.showMessageDialog({
          icon: "error",
          title: "Reboot failed",
          text: "Make sure the user stop is closed!"
        })
      })
    }
  }.bind(this))
}


/***/ }),
/* 64 ComponentLoader*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = ComponentLoader
/**
*  timeline component loader 模块提供了定制的 knockout component loader，它在timeline中加载和管理groups和skills的所有上下文菜单组件，其中可用组件按层次结构进行范围化scoped hierarchically.
*/

var _ = __webpack_require__(0)
var $ = __webpack_require__(6)
var ko = __webpack_require__(1)

var com = __webpack_require__(19)
var events = __webpack_require__(23)
var ElementAPI = __webpack_require__(24)
var settings = __webpack_require__(11)
var util = __webpack_require__(4)
var matrix = __webpack_require__(39)
var ComponentUtil = __webpack_require__(15)

function ComponentLoader(controller) {
  this.controller = controller

  this.timelineId = undefined
  this.tree = ko.observable({
    id: undefined,
    components: {}
  }).extend({ deferred: true })
  this.names = []
  this.linkableNames = []

  this.timelineElementSelector = "one-timeline-skill, one-timeline-group"

  // Register this as knockout component loader
  ko.components.loaders.unshift(this)
  // Prepend custom lookup to resolve components using the tree
    // 预先自定义查找以使用树解析组件
  var self = this
  var originalLookup = ko.components.getComponentNameForNode
  ko.components.getComponentNameForNode = function(node) {
    return self.lookupComponent(node) || originalLookup(node)
  }

  // 我们记住我们从lookupComponent返回的所有组件名称，以便在树更改时清除所有组件，以// 避免由于错误的缓存entries导致的任何令人讨厌的副作用。
  this.instantiatedComponents = []
}

ComponentLoader.prototype.clearComponentCache = function() {
  _.map(this.instantiatedComponents, ko.components.clearCachedDefinition)
  this.instantiatedComponents = []
}

/**
 * 重新加载给定timeline的所有timeline元素的component定义.每当timeline 更新时调用.
 * @param {Timeline} timeline - The timeline to reload components from
 */
ComponentLoader.prototype.updateTimelineComponents = function(timeline) {
  if (!timeline) {
    console.warn("invalid timeline:", timeline)
    return
  }
  this.clearComponentCache()
  this.timelineId = timeline.id
  // （重新）为时间轴创建component configurations树
  var path = { id: timeline.id, indices: [] }
  var tree = createTree(timeline, this.processElement.bind(this))
  var newTree = updateTree(this.tree(), path.indices, tree)
  // We trigger an update only if the tree changed. This is important
  // since otherwise, context menus would reload whenever a parameter
  // changes which causes ugly flickering.
  if (!_.isEqual(newTree, this.tree())) {
    this.tree(newTree)
  }
}

/**
 * 重新加载给定时间轴元素及其子元素的组件定义.
 * Call this whenever a timeline element is updated.
 * @param {Path} path - Path of the updated timeline element
 * @param {Element} element - The timeline element to reload components from
 */
ComponentLoader.prototype.updateElementComponents = function(element) {
  if (!element) {
    console.warn("invalid element:", element)
    return
  }
  this.clearComponentCache()
  // (Re-)create subtree of component configurations at element path
  var path = element.path()
  var tree = createTree(element, this.processElement.bind(this))
  var newTree = updateTree(this.tree(), path.indices, tree)
  // We trigger an update only if the tree changed. This is important
  // since otherwise, context menus would reload whenever a parameter
  // changes which causes ugly flickering.
  if (!_.isEqual(newTree, this.tree())) {
    this.tree(newTree)
  }
}

function createTree(object, fn) {
  var node = fn(object)
  var children = []
  if (object.containers) { // object is group
    children = _.map(ko.unwrap(object.containers), function(container) {
      return createTree(container, fn)
    })
  } else if (object.elements) { // object is container
    children = _.map(ko.unwrap(object.elements), function(element) {
      return createTree(element, fn)
    })
  }
  node.children = children
  return node
}

function updateTree(tree, indices, subtree) {
  // If no indices given or empty, overwrite tree
  if (!indices || indices.length === 0) {
    tree.id = subtree.id
    _.extend(tree.components, subtree.components)
    tree.children = subtree.children // replace children
    return tree
  }
  indices = indices.slice(0)
  var index = indices.shift()
  if (index >= 0 && index < tree.children.length) {
    // If indices exhausted, replace child at index with given subtree
    if (indices.length === 0) {
      tree.children[index] = subtree
      return tree
    }
    updateTree(tree.children[index], indices, subtree)
  }
  return tree
}

ComponentLoader.prototype.processElement = function(element) {
  var markup = ko.unwrap(element.components)
  var components = {}
  if (markup) {
    var elementComponents = loadComponentsFromMarkup(element, markup)
    if (elementComponents) {
      for (var name in elementComponents) {
        components[name] = elementComponents[name]
        this.names.push(name)
        if (components[name].linkable) {
          this.linkableNames.push(name)
        }
      }
    }
  }
  return {
    id: element.id, // This is actually not used, but helpful for debugging
    components: components
  }
}

// 从DOM节点到组件名称的自定义查找，以便沿着名称存储路径以允许分层范围的组件定义。 store also the path along a name to allow for hierarchically scoped component definitions.
ComponentLoader.prototype.lookupComponent = function(node) {
  var name = node.tagName && node.tagName.toLowerCase()
  if (this.names.indexOf(name) >= 0) {
    // 找到最近的timeline-skill或timeline-group组件，确定用于scoped component lookup范围组件查找的路径
    var closestElement = $(node).closest(this.timelineElementSelector)
    var children = closestElement.children()
    if (closestElement.length === 0 || children.length === 0) {
      return name
    }
    // Find top level step directly below stepNavigator (which has no parent)
    // using the fact that the current step is available in the binding
    // context.
      // 基于当前step在binding context可用的事实，在stepNavigator下面找到顶级步骤（没有父级）
    var ctx = ko.contextFor(node)
    var topLevelStep = ctx.step.topLevel()
    var stepId = topLevelStep && topLevelStep.id

    // Take the data which was available for binding the timeline element
    var element = ko.dataFor(children.get()[0])

    var path = ko.ignoreDependencies(function() { return ko.unwrapDeep(element.path) })
    // 只有当它尚未在默认的组件加载器上注册并且它实际存在于此加载器中时，使用name + path作为"component name"
    if (!ko.components.isRegistered(name) && this.hasComponent(path, name, stepId)) {
      var config = this.findComponentConfig(path.indices, name, stepId)
      var componentName = encodeComponentContext({
        name: name,
        path: ko.unwrap(path),
        sourcePath: ko.unwrap(config.source && config.source.path),
        stepId: stepId
      })
      this.instantiatedComponents.push(componentName)
      return componentName
    }
  }
  return null
}

// 如果可以为指定路径解析具有指定名称的组件，则返回true。
// Returns true if the component with the specified name can be
// resolved for the specified path.
ComponentLoader.prototype.hasComponent = function(path, name, stepId) {
  if (!path || path.id !== this.timelineId) {
    return false
  }
  return !!this.findComponentConfig(path.indices, name, stepId)
}

// Return the path of the provider of the specified component when it
// is instantiated from path.当指定组件从path实例化时，返回其provider的路径。
ComponentLoader.prototype.componentPath = function(path, name, stepId) {
  if (!path) {
    return undefined
  }
  var config = this.findComponentConfig(path.indices, name, stepId)
  if (!config) {
    return undefined
  }
  return (config.source && config.source.path()) || {id: this.timelineId, indices: []}
}

// 根据以下规则查找最接近的组件配置:
//
//  * 如果给出了stepId，并且传递的indices指向具有该stepId的componentProviders条目的元素，则该组件将从此component provider entry的sourcePath加载（如果可以在那里找到）。
//  如果未给出stepId，indices指向无效元素，或者该sourcePath上的元素不包含任何适当的组件，则以下规则适用：
//
//  * Finds the component config matching the name with the longest
//    path that is not the path to the element to expand.查找与名称匹配的组件配      置，其中最长路径不是要展开的元素的路径。
//
//  * 如果根据上述规则找不到任何组件，则尝试返回元素的配置以进行扩展（如果可能）。
//    否则，返回undefined
ComponentLoader.prototype.findComponentConfig = function(indices, name, stepId) {
  var config, tree
  if (stepId) {
    var cp = ko.ignoreDependencies(function() {
      var element = this.controller.timeline().getElementAtPath({id: this.timelineId, indices: indices})
      return element && ko.unwrap(element.componentProviders)[stepId]
    }, this)
    if (cp && _.contains(cp.components.peek(), name) && cp.sourcePath()) {
      tree = this.tree()
      var cpIndices = cp.sourcePath().indices.slice()
      while (tree && cpIndices && cpIndices.length > 0) {
        tree = tree.children[cpIndices.shift()]
      }
      config = tree && tree.components[name]
      if (config) {
        return config
      }
    }
  }

  tree = this.tree()
  config = tree.components[name]
  indices = indices.slice()
  if (indices.length === 0) {
    return config
  }
  while (tree && indices && indices.length > 1) {
    tree = tree.children[indices.shift()]
    config = tree && tree.components[name] || config
  }
  tree = tree && tree.children[indices.shift()]
  return config || tree && tree.components[name]
}

// Returns a list of element paths which:
// * 提供具有给定名称的组件
// * 是传递的elementPath的祖先

ComponentLoader.prototype.findAllComponentProviders = function(elementPath, name) {
  var tree = this.tree()
  var indices = elementPath.indices.slice()
  var path = { id: elementPath.id, indices: [] }
  var paths = []
  if (tree.components.hasOwnProperty(name) && tree.components[name].linkable) {
    paths.push(_.cloneDeep(path))
  }
  _.each(indices, function(idx) {
    tree = tree.children[idx]
    path.indices.push(idx)
    if (tree && tree.components.hasOwnProperty(name) && tree.components[name].linkable) {
      paths.push(_.cloneDeep(path))
    }
  })
  return paths
}

// knockout component loader hooks
ComponentLoader.prototype.getConfig = function(componentName, callback) {
  // Extract componentConfig from tree if componentName is actually a path + name
  var componentContext = decodeComponentContext(componentName)
  if (!componentContext) {
    callback(null) // not interested
    return
  }
  var path = componentContext.path
  var name = componentContext.name
  var stepId = componentContext.stepId
  var componentConfig = null
  // Timeline id has to match the current timeline
  if (path.id === this.timelineId) {
    componentConfig = this.findComponentConfig(path.indices, name, stepId)
  }
  // Default to an empty configuration to restrict the default loader of
  // loading the component, but being able to clear the cache
  if (!componentConfig) {
    componentConfig = {}
  } else {
    componentConfig = _.clone(componentConfig)
  }
  callback(componentConfig)
}

ComponentLoader.prototype.loadComponent = function(componentName, componentConfig, callback) {
  //仅加载符合我们的componentName格式的组件的组件定义，并提供构造函数作为viewmodel
  var componentContext = decodeComponentContext(componentName)
  if (!componentContext || !_.contains(this.names, componentContext.name)) {
    callback(null)
    return
  }
  // Create API on source element
  var source = null
  if (componentConfig.source) {
    source = new ElementAPI(this.controller, componentConfig.source)
  }
  var template = loadTemplate(componentConfig.template)
  var viewmodel
  if (componentConfig.viewModelNode) {
    viewmodel = loadViewModel(componentConfig.viewModelNode)
  }
  var self = this
  Promise.all([template, viewmodel])
    .then(function(values) {
      var config = {
        template: values[0]
      }
      var constructor = values[1]
      if (constructor) {
        config.createViewModel = function(params, componentInfo) {
          return new constructor(params, self.controller.oneAPI, source, componentInfo.element)
        }
      }
      callback(config)
    })
}

function loadComponentsFromMarkup(element, markup) {
  var html = $.parseHTML(markup, null, true)
  var components = {}
  $(html).each(function(index, el) {
    if (!$(el).is("component")) {
      return undefined
    }
    var names = $(el).attr("name").split(" ")
    if (names === undefined) {
      console.error("Component does not have a name")
      return
    }
    var linkable = $(el).attr("linkable") !== undefined
    // Extract template definition from first <template> tag
    var templates = $(el).children("template")
    if (templates.length < 1) {
      console.error("Missing template for component '" + names[0] + "'")
      return
    }
    var template = templates[0]
    // 执行component <viewmodel> tags ，使用'module.exports' 作为viewmodel
    try {
      var viewmodel = $(el).children("viewmodel,script")[0]
      _.forEach(names, function(name) {
        components[name] = {
          viewModelNode: viewmodel,
          template: template,
          source: element,
          linkable: linkable
        }
      })
    } catch (e) {
      console.error("error on loading <script> tags of component", _.first(names),
                    "of element", element.id, ":", e)
    }
  })
  return components
}

function loadTemplate(html) {
  var src = $(html).attr("src")
  if (src) {
    return com.fetchBundleResource(src)
      .then(function(data) {
        data = $.parseHTML("<div>" + data + "</div>", null, true)[0]
        return replaceVariables(data).childNodes
      })
  } else {
    var htmlSubstituted = replaceVariables(html.content)
    // In the tests, when we don't have a browser, html.content will
    // be undefined. Handle that case properly.
    return Promise.resolve(htmlSubstituted && htmlSubstituted.childNodes)
  }
}

function loadViewModel(html) {
  var modules = { lodash: _,
                  jquery: $,
                  knockout: ko,
                  events: events,
                  matrix: matrix,
                  component_util: ComponentUtil // eslint-disable-line camelcase
                }
  var src = $(html).attr("src")
  if (src) {
    return com.fetchBundleResource(src)
      .then(function(data) {
        return util.loadCommonJS(data, {}, modules)
      })
  } else {
    return Promise.resolve(util.loadCommonJS(html.textContent, {}, modules))
  }
}

function replaceVariables(html) {
  // Search and replace variables in template style, with variables:
  // * are prefixed with $
  // * start with a letter or '_'
  // * contain only alphanumeric, '.', '_' or '-' characters
  var re = /\$[a-zA-Z_][a-zA-Z\._-]*\b/g
  $(html).children("style").each(function(index, style) {
    style.textContent = style.textContent.replace(re, function(variable) {
      var path = variable.substring(1)
      return _.get(settings.contextMenu, path, variable)
    })
  })
  return html
}

function encodeComponentContext(componentContext) {
  return JSON.stringify(componentContext)
}

function decodeComponentContext(componentName) {
  try {
    var componentContext = JSON.parse(componentName)
    if ("name" in componentContext && "path" in componentContext && "stepId" in componentContext) {
      return componentContext
    }
  } catch (e) {
    // Do nothing on JSON parse errors since they are expected for all
    // normal components. Only components originating in elements have
    // a JSON object encoded in their name.
  }
}


/***/ }),
/* 65 Keyboard*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * 键盘模块提供一种功能，利用该功能将一组语义事件semantic events映射到document上的关键事件。下列事件are registered on to key presses (with key id):
 *   * enter (13) -> "circle"
 *   * esc   (27) -> "cross"
 *   * space (32) -> "check"
 *   * left  (37) -> "left"
 *   * up    (38) -> "up"
 *   * right (39) -> "right"
 *   * down  (40) -> "down"
 *   * 1     (49) -> "program"
 *   * 2     (50) -> "teach"
 *   * 3     (51) -> "work"
 *   * h     (72) -> "left"
 *   * j     (74) -> "down"
 *   * k     (75) -> "up"
 *   * l     (76) -> "right"
 */
var $ = __webpack_require__(6)
var dialogs = __webpack_require__(8)

module.exports = function(events, isNavEventsConnected, isStartupRunning) {
  events.register("check")
  events.register("circle")
  events.register("cross")
  events.register("left")
  events.register("up")
  events.register("right")
  events.register("down")
  events.register("program")
  events.register("teach")
  events.register("work")

  /* eslint complexity: 0 */
  $(document).on("keydown", function(event) {
    if (document.activeElement.tagName.toLowerCase() === "input" ||
      dialogs.dialogVisible() || !isNavEventsConnected() || isStartupRunning()) {
      return
    }
    if (event.ctrlKey) {
      return
    }
    var handled = false
    switch (event.which) {
      case 13:
        handled = events.notifyCircle()
      break
      case 27:
        handled = events.notifyCross()
      break
      case 32:
        handled = events.notifyCheck()
      break
      case 37:
        handled = events.notifyLeft()
      break
      case 38:
        handled = events.notifyUp()
      break
      case 39:
        handled = events.notifyRight()
      break
      case 40:
        handled = events.notifyDown()
      break
      case 72: // h
        handled = events.notifyLeft()
      break
      case 75: // k
        handled = events.notifyUp()
      break
      case 76: // l
        handled = events.notifyRight()
      break
      case 74: // j
        handled = events.notifyDown()
      break
      case 49:
        handled = events.notifyProgram()
      break
      case 50:
        handled = events.notifyTeach()
      break
      case 51:
        handled = events.notifyWork()
      break
    }
    if (handled) {
      event.preventDefault()
    }
  })
}


/***/ }),
/* 66  Foundation*/
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(jQuery) {
            ! function(t) {
                function e(n) {
                    if (i[n]) return i[n].exports;
                    var s = i[n] = {
                        i: n,
                        l: !1,
                        exports: {}
                    };
                    return t[n].call(s.exports, s, s.exports, e), s.l = !0, s.exports
                }
                var i = {};
                e.m = t,
                    e.c = i,
                    e.i = function(t) {
                    return t
                },
                    e.d = function(t, i, n) {

                  e.o(t, i) || Object.defineProperty(t, i, {
                        configurable: !1,
                        enumerable: !0,
                        get: n
                    })
                },
                    e.n = function(t) {
                    var i = t && t.__esModule ? function() {
                        return t.default
                    } : function() {
                        return t
                    };
                    return e.d(i, "a", i), i
                },
                    e.o = function(t, e) {
                    return Object.prototype.hasOwnProperty.call(t, e)
                },
                    e.p = "",
                    e(e.s = 36)
            }([
                function(t, e) {
                t.exports = jQuery
            },

                function(t, e, i) {
                "use strict";

                function n() {
                    return "rtl" === r()("html").attr("dir")
                }

                function s(t, e) {
                    return t = t || 6, Math.round(Math.pow(36, t + 1) - Math.random() * Math.pow(36, t)).toString(36).slice(1) + (e ? "-" + e : "")
                }

                function o(t) {
                    var e, i = {
                            transition: "transitionend",
                            WebkitTransition: "webkitTransitionEnd",
                            MozTransition: "transitionend",
                            OTransition: "otransitionend"
                        },
                        n = document.createElement("div");
                    for (var s in i) void 0 !== n.style[s] && (e = i[s]);
                    return e || (e = setTimeout(function() {
                        t.triggerHandler("transitionend", [t])
                    }, 1), "transitionend")
                }
                i.d(e, "a", function() {
                    return n
                }), i.d(e, "b", function() {
                    return s
                }), i.d(e, "c", function() {
                    return o
                });
                var a = i(0),
                    r = i.n(a)
            },
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t) {
                    return t.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
                }

                function o(t) {
                    return s(void 0 !== t.constructor.name ? t.constructor.name : t.className)
                }
                i.d(e, "a", function() {
                    return u
                });
                var a = i(0),
                    r = (i.n(a), i(1)),
                    l = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    u = function() {
                        function t(e, s) {
                            n(this, t), this._setup(e, s);
                            var a = o(this);
                            this.uuid = i.i(r.b)(6, a), this.$element.attr("data-" + a) || this.$element.attr("data-" + a, this.uuid), this.$element.data("zfPlugin") || this.$element.data("zfPlugin", this), this.$element.trigger("init.zf." + a)
                        }
                        return l(t, [{
                            key: "destroy",
                            value: function() {
                                this._destroy();
                                var t = o(this);
                                this.$element.removeAttr("data-" + t).removeData("zfPlugin").trigger("destroyed.zf." + t);
                                for (var e in this) this[e] = null
                            }
                        }]), t
                    }()
            },

                /** keyboard相关 **/
                function(t, e, i) {
                "use strict";

                function n(t) {
                    return !!t && t.find("a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]").filter(function() {
                        return !(!a()(this).is(":visible") || a()(this).attr("tabindex") < 0)
                    })
                }


                function s(t) {
                    var e = l[t.which || t.keyCode] || String.fromCharCode(t.which).toUpperCase();
                    return e = e.replace(/\W+/, ""), t.shiftKey && (e = "SHIFT_" + e), t.ctrlKey && (e = "CTRL_" + e), t.altKey && (e = "ALT_" + e), e = e.replace(/_$/, "")
                }
                i.d(e, "a", function() {
                    return c
                });
                var o = i(0),
                    a = i.n(o),
                    r = i(1),
                    l = {
                        9: "TAB",
                        13: "ENTER",
                        27: "ESCAPE",
                        32: "SPACE",
                        35: "END",
                        36: "HOME",
                        37: "ARROW_LEFT",
                        38: "ARROW_UP",
                        39: "ARROW_RIGHT",
                        40: "ARROW_DOWN"
                    },
                    u = {},
                    c = {
                        keys: function(t) {
                            var e = {};
                            for (var i in t) e[t[i]] = t[i];
                            return e
                        }(l),
                        parseKey: s,
                        handleKey: function(t, e, n) {
                            var s, o, l, c = u[e],
                                h = this.parseKey(t);
                            if (!c) return console.warn("Component not defined!");
                            if (s = void 0 === c.ltr ? c : i.i(r.a)() ? a.a.extend({}, c.ltr, c.rtl) : a.a.extend({}, c.rtl, c.ltr), o = s[h], (l = n[o]) && "function" == typeof l) {
                                var d = l.apply();
                                (n.handled || "function" == typeof n.handled) && n.handled(d)
                            } else(n.unhandled || "function" == typeof n.unhandled) && n.unhandled()
                        },
                        findFocusable: n,
                        register: function(t, e) {
                            u[t] = e
                        },
                        trapFocus: function(t) {
                            var e = n(t),
                                i = e.eq(0),
                                o = e.eq(-1);
                            t.on("keydown.zf.trapfocus", function(t) {
                                t.target === o[0] && "TAB" === s(t) ? (t.preventDefault(), i.focus()) : t.target === i[0] && "SHIFT_TAB" === s(t) && (t.preventDefault(), o.focus())
                            })
                        },
                        releaseFocus: function(t) {
                            t.off("keydown.zf.trapfocus")
                        }
                    }
            },

                /** media query 媒体查询相关 **/
                function(t, e, i) {
                "use strict";

                function n(t) {
                    var e = {};
                    return "string" != typeof t ? e : (t = t.trim().slice(1, -1)) ? e = t.split("&").reduce(function(t, e) {
                        var i = e.replace(/\+/g, " ").split("="),
                            n = i[0],
                            s = i[1];
                        return n = decodeURIComponent(n), s = void 0 === s ? null : decodeURIComponent(s), t.hasOwnProperty(n) ? Array.isArray(t[n]) ? t[n].push(s) : t[n] = [t[n], s] : t[n] = s, t
                    }, {}) : e
                }
                i.d(e, "a", function() {
                    return r
                });
                var s = i(0),
                    o = i.n(s),
                    a = window.matchMedia || function() {
                        var t = window.styleMedia || window.media;
                        if (!t) {
                            var e = document.createElement("style"),
                                i = document.getElementsByTagName("script")[0],
                                n = null;
                            e.type = "text/css", e.id = "matchmediajs-test", i && i.parentNode && i.parentNode.insertBefore(e, i), n = "getComputedStyle" in window && window.getComputedStyle(e, null) || e.currentStyle, t = {
                                matchMedium: function(t) {
                                    var i = "@media " + t + "{ #matchmediajs-test { width: 1px; } }";
                                    return e.styleSheet ? e.styleSheet.cssText = i : e.textContent = i, "1px" === n.width
                                }
                            }
                        }
                        return function(e) {
                            return {
                                matches: t.matchMedium(e || "all"),
                                media: e || "all"
                            }
                        }
                    }(),
                    r = {
                        queries: [],
                        current: "",
                        _init: function() {
                            var t = this;
                            o()("meta.foundation-mq").length || o()('<meta class="foundation-mq">').appendTo(document.head);
                            var e, i = o()(".foundation-mq").css("font-family");
                            e = n(i);
                            for (var s in e) e.hasOwnProperty(s) && t.queries.push({
                                name: s,
                                value: "only screen and (min-width: " + e[s] + ")"
                            });
                            this.current = this._getCurrentSize(), this._watcher()
                        },
                        atLeast: function(t) {
                            var e = this.get(t);
                            return !!e && a(e).matches
                        },
                        is: function(t) {
                            return t = t.trim().split(" "), t.length > 1 && "only" === t[1] ? t[0] === this._getCurrentSize() : this.atLeast(t[0])
                        },
                        get: function(t) {
                            for (var e in this.queries)
                                if (this.queries.hasOwnProperty(e)) {
                                    var i = this.queries[e];
                                    if (t === i.name) return i.value
                                }
                            return null
                        },
                        _getCurrentSize: function() {
                            for (var t, e = 0; e < this.queries.length; e++) {
                                var i = this.queries[e];
                                a(i.value).matches && (t = i)
                            }
                            return "object" == typeof t ? t.name : t
                        },
                        _watcher: function() {
                            var t = this;
                            o()(window).off("resize.zf.mediaquery").on("resize.zf.mediaquery", function() {
                                var e = t._getCurrentSize(),
                                    i = t.current;
                                e !== i && (t.current = e, o()(window).trigger("changed.zf.mediaquery", [e, i]))
                            })
                        }
                    }
            },

                function(t, e, i) {
                "use strict";

                function n(t, e, i) {
                    var n = void 0,
                        s = Array.prototype.slice.call(arguments, 3);
                    o()(window).off(e).on(e, function(e) {
                        n && clearTimeout(n), n = setTimeout(function() {
                            i.apply(null, s)
                        }, t || 10)
                    })
                }
                i.d(e, "a", function() {
                    return u
                });
                var s = i(0),
                    o = i.n(s),
                    a = i(6),
                    r = function() {
                        for (var t = ["WebKit", "Moz", "O", "Ms", ""], e = 0; e < t.length; e++)
                            if (t[e] + "MutationObserver" in window) return window[t[e] + "MutationObserver"];
                        return !1
                    }(),
                    l = function(t, e) {
                        t.data(e).split(" ").forEach(function(i) {
                            o()("#" + i)["close" === e ? "trigger" : "triggerHandler"](e + ".zf.trigger", [t])
                        })
                    },
                    u = {
                        Listeners: {
                            Basic: {},
                            Global: {}
                        },
                        Initializers: {}
                    };
                u.Listeners.Basic = {
                    openListener: function() {
                        l(o()(this), "open")
                    },
                    closeListener: function() {
                        o()(this).data("close") ? l(o()(this), "close") : o()(this).trigger("close.zf.trigger")
                    },
                    toggleListener: function() {
                        o()(this).data("toggle") ? l(o()(this), "toggle") : o()(this).trigger("toggle.zf.trigger")
                    },
                    closeableListener: function(t) {
                        t.stopPropagation();
                        var e = o()(this).data("closable");
                        "" !== e ? a.a.animateOut(o()(this), e, function() {
                            o()(this).trigger("closed.zf")
                        }) : o()(this).fadeOut().trigger("closed.zf")
                    },
                    toggleFocusListener: function() {
                        var t = o()(this).data("toggle-focus");
                        o()("#" + t).triggerHandler("toggle.zf.trigger", [o()(this)])
                    }
                },
                    u.Initializers.addOpenListener = function(t) {
                    t.off("click.zf.trigger", u.Listeners.Basic.openListener), t.on("click.zf.trigger", "[data-open]", u.Listeners.Basic.openListener)
                },
                    u.Initializers.addCloseListener = function(t) {
                    t.off("click.zf.trigger", u.Listeners.Basic.closeListener), t.on("click.zf.trigger", "[data-close]", u.Listeners.Basic.closeListener)
                },
                    u.Initializers.addToggleListener = function(t) {
                    t.off("click.zf.trigger", u.Listeners.Basic.toggleListener), t.on("click.zf.trigger", "[data-toggle]", u.Listeners.Basic.toggleListener)
                },
                    u.Initializers.addCloseableListener = function(t) {
                    t.off("close.zf.trigger", u.Listeners.Basic.closeableListener),
                        t.on("close.zf.trigger", "[data-closeable], [data-closable]", u.Listeners.Basic.closeableListener)
                },
                    u.Initializers.addToggleFocusListener = function(t) {
                    t.off("focus.zf.trigger blur.zf.trigger", u.Listeners.Basic.toggleFocusListener), t.on("focus.zf.trigger blur.zf.trigger", "[data-toggle-focus]", u.Listeners.Basic.toggleFocusListener)
                },

                    u.Listeners.Global = {
                    resizeListener: function(t) {
                        r || t.each(function() {
                            o()(this).triggerHandler("resizeme.zf.trigger")
                        }), t.attr("data-events", "resize")
                    },
                    scrollListener: function(t) {
                        r || t.each(function() {
                            o()(this).triggerHandler("scrollme.zf.trigger")
                        }), t.attr("data-events", "scroll")
                    },
                    closeMeListener: function(t, e) {
                        var i = t.namespace.split(".")[0];
                        o()("[data-" + i + "]").not('[data-yeti-box="' + e + '"]').each(function() {
                            var t = o()(this);
                            t.triggerHandler("close.zf.trigger", [t])
                        })
                    }
                },
                    u.Initializers.addClosemeListener = function(t) {
                    var e = o()("[data-yeti-box]"),
                        i = ["dropdown", "tooltip", "reveal"];
                    if (t && ("string" == typeof t ? i.push(t) : "object" == typeof t && "string" == typeof t[0] ? i.concat(t) : console.error("Plugin names must be strings")), e.length) {
                        var n = i.map(function(t) {
                            return "closeme.zf." + t
                        }).join(" ");
                        o()(window).off(n).on(n, u.Listeners.Global.closeMeListener)
                    }
                },
                    u.Initializers.addResizeListener = function(t) {
                    var e = o()("[data-resize]");
                    e.length && n(t, "resize.zf.trigger", u.Listeners.Global.resizeListener, e)
                },
                    u.Initializers.addScrollListener = function(t) {
                    var e = o()("[data-scroll]");
                    e.length && n(t, "scroll.zf.trigger", u.Listeners.Global.scrollListener, e)
                },
                    u.Initializers.addMutationEventsListener = function(t) {
                    if (!r) return !1;
                    var e = t.find("[data-resize], [data-scroll], [data-mutate]"),
                        i = function(t) {
                            var e = o()(t[0].target);
                            switch (t[0].type) {
                                case "attributes":
                                    "scroll" === e.attr("data-events") && "data-events" === t[0].attributeName && e.triggerHandler("scrollme.zf.trigger", [e, window.pageYOffset]), "resize" === e.attr("data-events") && "data-events" === t[0].attributeName && e.triggerHandler("resizeme.zf.trigger", [e]), "style" === t[0].attributeName && (e.closest("[data-mutate]").attr("data-events", "mutate"), e.closest("[data-mutate]").triggerHandler("mutateme.zf.trigger", [e.closest("[data-mutate]")]));
                                    break;
                                case "childList":
                                    e.closest("[data-mutate]").attr("data-events", "mutate"), e.closest("[data-mutate]").triggerHandler("mutateme.zf.trigger", [e.closest("[data-mutate]")]);
                                    break;
                                default:
                                    return !1
                            }
                        };
                    if (e.length)
                        for (var n = 0; n <= e.length - 1; n++) {
                            var s = new r(i);
                            s.observe(e[n], {
                                attributes: !0,
                                childList: !0,
                                characterData: !1,
                                subtree: !0,
                                attributeFilter: ["data-events", "style"]
                            })
                        }
                },
                    u.Initializers.addSimpleListeners = function() {
                    var t = o()(document);
                    u.Initializers.addOpenListener(t), u.Initializers.addCloseListener(t), u.Initializers.addToggleListener(t), u.Initializers.addCloseableListener(t), u.Initializers.addToggleFocusListener(t)
                },
                    u.Initializers.addGlobalListeners = function() {
                    var t = o()(document);
                    u.Initializers.addMutationEventsListener(t), u.Initializers.addResizeListener(), u.Initializers.addScrollListener(), u.Initializers.addClosemeListener()
                },
                    u.init = function(t, e) {
                    if (void 0 === t.triggersInitialized) {
                        t(document);
                        "complete" === document.readyState ? (u.Initializers.addSimpleListeners(), u.Initializers.addGlobalListeners()) : t(window).on("load", function() {
                            u.Initializers.addSimpleListeners(), u.Initializers.addGlobalListeners()
                        }), t.triggersInitialized = !0
                    }
                    e && (e.Triggers = u, e.IHearYou = u.Initializers.addGlobalListeners)
                }
            },
                function(t, e, i) {
                "use strict";

                function n(t, e, i) {
                    function n(r) {
                        a || (a = r), o = r - a, i.apply(e), o < t ? s = window.requestAnimationFrame(n, e) : (window.cancelAnimationFrame(s), e.trigger("finished.zf.animate", [e]).triggerHandler("finished.zf.animate", [e]))
                    }
                    var s, o, a = null;
                    if (0 === t) return i.apply(e),
                        void e.trigger("finished.zf.animate", [e]).triggerHandler("finished.zf.animate", [e]);
                    s = window.requestAnimationFrame(n)
                }

                function s(t, e, n, s) {
                    function o() {
                        t || e.hide(), c(), s && s.apply(e)
                    }

                    function c() {
                        e[0].style.transitionDuration = 0,
                            e.removeClass(h + " " + d + " " + n)
                    }
                    if (e = a()(e).eq(0), e.length) {
                        var h = t ? l[0] : l[1],
                            d = t ? u[0] : u[1];
                        c(), e.addClass(n).css("transition", "none"), requestAnimationFrame(function() {
                            e.addClass(h), t && e.show()
                        }), requestAnimationFrame(function() {
                            e[0].offsetWidth, e.css("transition", "").addClass(d)
                        }), e.one(i.i(r.c)(e), o)
                    }
                }
                i.d(e, "b", function() {
                    return n
                }), i.d(e, "a", function() {
                    return c
                });
                var o = i(0),
                    a = i.n(o),
                    r = i(1),
                    l = ["mui-enter", "mui-leave"],
                    u = ["mui-enter-active", "mui-leave-active"],
                    c = {
                        animateIn: function(t, e, i) {
                            s(!0, t, e, i)
                        },
                        animateOut: function(t, e, i) {
                            s(!1, t, e, i)
                        }
                    }
            },
                function(t, e, i) {
                "use strict";

                function n(t, e, i, n, o) {
                    return 0 === s(t, e, i, n, o)
                }

                function s(t, e, i, n, s) {
                    var a, r, l, u, c = o(t);
                    if (e) {
                        var h = o(e);
                        r = h.height + h.offset.top - (c.offset.top + c.height), a = c.offset.top - h.offset.top, l = c.offset.left - h.offset.left, u = h.width + h.offset.left - (c.offset.left + c.width)
                    } else r = c.windowDims.height + c.windowDims.offset.top - (c.offset.top + c.height), a = c.offset.top - c.windowDims.offset.top, l = c.offset.left - c.windowDims.offset.left, u = c.windowDims.width - (c.offset.left + c.width);
                    return r = s ? 0 : Math.min(r, 0), a = Math.min(a, 0), l = Math.min(l, 0), u = Math.min(u, 0), i ? l + u : n ? a + r : Math.sqrt(a * a + r * r + l * l + u * u)
                }

                function o(t) {
                    if ((t = t.length ? t[0] : t) === window || t === document) throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
                    var e = t.getBoundingClientRect(),
                        i = t.parentNode.getBoundingClientRect(),
                        n = document.body.getBoundingClientRect(),
                        s = window.pageYOffset,
                        o = window.pageXOffset;
                    return {
                        width: e.width,
                        height: e.height,
                        offset: {
                            top: e.top + s,
                            left: e.left + o
                        },
                        parentDims: {
                            width: i.width,
                            height: i.height,
                            offset: {
                                top: i.top + s,
                                left: i.left + o
                            }
                        },
                        windowDims: {
                            width: n.width,
                            height: n.height,
                            offset: {
                                top: s,
                                left: o
                            }
                        }
                    }
                }

                function a(t, e, n, s, o, a) {
                    switch (console.log("NOTE: GetOffsets is deprecated in favor of GetExplicitOffsets and will be removed in 6.5"), n) {
                        case "top":
                            return i.i(l.a)() ? r(t, e, "top", "left", s, o, a) : r(t, e, "top", "right", s, o, a);
                        case "bottom":
                            return i.i(l.a)() ? r(t, e, "bottom", "left", s, o, a) : r(t, e, "bottom", "right", s, o, a);
                        case "center top":
                            return r(t, e, "top", "center", s, o, a);
                        case "center bottom":
                            return r(t, e, "bottom", "center", s, o, a);
                        case "center left":
                            return r(t, e, "left", "center", s, o, a);
                        case "center right":
                            return r(t, e, "right", "center", s, o, a);
                        case "left bottom":
                            return r(t, e, "bottom", "left", s, o, a);
                        case "right bottom":
                            return r(t, e, "bottom", "right", s, o, a);
                        case "center":
                            return {
                                left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2 + o,
                                top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - ($eleDims.height / 2 + s)
                            };
                        case "reveal":
                            return {
                                left: ($eleDims.windowDims.width - $eleDims.width) / 2 + o,
                                top: $eleDims.windowDims.offset.top + s
                            };
                        case "reveal full":
                            return {
                                left: $eleDims.windowDims.offset.left,
                                top: $eleDims.windowDims.offset.top
                            };
                        default:
                            return {
                                left: i.i(l.a)() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width - o : $anchorDims.offset.left + o,
                                top: $anchorDims.offset.top + $anchorDims.height + s
                            }
                    }
                }

                function r(t, e, i, n, s, a, r) {
                    var l, u, c = o(t),
                        h = e ? o(e) : null;
                    switch (i) {
                        case "top":
                            l = h.offset.top - (c.height + s);
                            break;
                        case "bottom":
                            l = h.offset.top + h.height + s;
                            break;
                        case "left":
                            u = h.offset.left - (c.width + a);
                            break;
                        case "right":
                            u = h.offset.left + h.width + a
                    }
                    switch (i) {
                        case "top":
                        case "bottom":
                            switch (n) {
                                case "left":
                                    u = h.offset.left + a;
                                    break;
                                case "right":
                                    u = h.offset.left - c.width + h.width - a;
                                    break;
                                case "center":
                                    u = r ? a : h.offset.left + h.width / 2 - c.width / 2 + a
                            }
                            break;
                        case "right":
                        case "left":
                            switch (n) {
                                case "bottom":
                                    l = h.offset.top - s + h.height - c.height;
                                    break;
                                case "top":
                                    l = h.offset.top + s;
                                    break;
                                case "center":
                                    l = h.offset.top + s + h.height / 2 - c.height / 2
                            }
                    }
                    return {
                        top: l,
                        left: u
                    }
                }
                i.d(e, "a", function() {
                    return u
                });
                var l = i(1),
                    u = {
                        ImNotTouchingYou: n,
                        OverlapArea: s,
                        GetDimensions: o,
                        GetOffsets: a,
                        GetExplicitOffsets: r
                    }
            },
                // onImageLoaded
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    function i() {
                        0 === --n && e()
                    }
                    var n = t.length;
                    0 === n && e(), t.each(function() {
                        if (this.complete && void 0 !== this.naturalWidth) i();
                        else {
                            var t = new Image,
                                e = "load.zf.images error.zf.images";
                            o()(t).one(e, function t(n) {
                                o()(this).off(e, t), i()
                            }), t.src = o()(this).attr("src")
                        }
                    })
                }
                i.d(e, "a", function() {
                    return n
                });
                var s = i(0),
                    o = i.n(s)
            },
                //
                function(t, e, i) {
                "use strict";
                i.d(e, "a", function() {
                    return o
                });
                var n = i(0),
                    s = i.n(n),
                    o = {
                        Feather: function(t) {
                            var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "zf";
                            t.attr("role", "menubar");
                            var i = t.find("li").attr({
                                    role: "menuitem"
                                }),
                                n = "is-" + e + "-submenu",
                                o = n + "-item",
                                a = "is-" + e + "-submenu-parent",
                                r = "accordion" !== e;
                            i.each(function() {
                                var t = s()(this),
                                    i = t.children("ul");
                                i.length && (
                                    t.addClass(a),
                                    i.addClass("submenu " + n).attr({
                                    "data-submenu": ""
                                }),
                                    r && (t.attr({
                                    "aria-haspopup": !0,
                                    "aria-label": t.children("a:first").text()
                                }), "drilldown" === e && t.attr({
                                    "aria-expanded": !1
                                })),
                                        i.addClass("submenu " + n).attr({
                                    "data-submenu": "",
                                    role: "menu"
                                }),
                                    "drilldown" === e && i.attr({
                                    "aria-hidden": !0
                                })),
                                t.parent("[data-submenu]").length && t.addClass("is-submenu-item " + o)
                            })
                        },
                        Burn: function(t, e) {
                            var i = "is-" + e + "-submenu",
                                n = i + "-item",
                                s = "is-" + e + "-submenu-parent";
                            t.find(">li, .menu, .menu > li").removeClass(i + " " + n + " " + s + " is-submenu-item submenu is-active").removeAttr("data-submenu").css("display", "")
                        }
                    }
            },
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s() {
                    this.removeEventListener("touchmove", o), this.removeEventListener("touchend", s), g = !1
                }

                function o(t) {
                    if (f.a.spotSwipe.preventDefault && t.preventDefault(), g) {
                        var e, i = t.touches[0].pageX,
                            n = (t.touches[0].pageY, l - i);
                        h = (new Date).getTime() - c, Math.abs(n) >= f.a.spotSwipe.moveThreshold && h <= f.a.spotSwipe.timeThreshold && (e = n > 0 ? "left" : "right"), e && (t.preventDefault(), s.call(this), f()(this).trigger("swipe", e).trigger("swipe" + e))
                    }
                }

                function a(t) {
                    1 == t.touches.length && (l = t.touches[0].pageX, u = t.touches[0].pageY, g = !0, c = (new Date).getTime(), this.addEventListener("touchmove", o, !1), this.addEventListener("touchend", s, !1))
                }

                function r() {
                    this.addEventListener && this.addEventListener("touchstart", a, !1)
                }
                i.d(e, "a", function() {
                    return m
                });
                var l, u, c, h, d = i(0),
                    f = i.n(d),
                    p = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    m = {},
                    g = !1,
                    v = function() {
                        function t(e) {
                            n(this, t), this.version = "1.0.0", this.enabled = "ontouchstart" in document.documentElement, this.preventDefault = !1, this.moveThreshold = 75, this.timeThreshold = 200, this.$ = e, this._init()
                        }
                        return p(t, [{
                            key: "_init",
                            value: function() {
                                var t = this.$;
                                t.event.special.swipe = {
                                    setup: r
                                }, t.each(["left", "up", "down", "right"], function() {
                                    t.event.special["swipe" + this] = {
                                        setup: function() {
                                            t(this).on("swipe", t.noop)
                                        }
                                    }
                                })
                            }
                        }]), t
                    }();
                m.setupSpotSwipe = function(t) {
                    t.spotSwipe = new v(t)
                },
                    m.setupTouchHandler = function(t) {
                    t.fn.addTouch = function() {
                        this.each(function(i, n) {
                            t(n).bind("touchstart touchmove touchend touchcancel", function() {
                                e(event)
                            })
                        });
                        var e = function(t) {
                            var e, i = t.changedTouches,
                                n = i[0],
                                s = {
                                    touchstart: "mousedown",
                                    touchmove: "mousemove",
                                    touchend: "mouseup"
                                },
                                o = s[t.type];
                            "MouseEvent" in window && "function" == typeof window.MouseEvent ? e = new window.MouseEvent(o, {
                                bubbles: !0,
                                cancelable: !0,
                                screenX: n.screenX,
                                screenY: n.screenY,
                                clientX: n.clientX,
                                clientY: n.clientY
                            }) : (e = document.createEvent("MouseEvent"), e.initMouseEvent(o, !0, !0, window, 1, n.screenX, n.screenY, n.clientX, n.clientY, !1, !1, !1, !1, 0, null)), n.target.dispatchEvent(e)
                        }
                    }
                },
                    m.init = function(t) {
                    void 0 === t.spotSwipe && (m.setupSpotSwipe(t), m.setupTouchHandler(t))
                }
            },
                //Accordian
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return d
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(3),
                    u = i(1),
                    c = i(2),
                    h = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    d = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), h(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t,
                                    this.options = r.a.extend({}, e.defaults, this.$element.data(), i),
                                    this.className = "Accordion",
                                    this._init(),
                                    l.a.register("Accordion", {
                                    ENTER: "toggle",
                                    SPACE: "toggle",
                                    ARROW_DOWN: "next",
                                    ARROW_UP: "previous"
                                })
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                var t = this;
                                this.$element.attr("role", "tablist"),
                                    this.$tabs = this.$element.children("[data-accordion-item]"), this.$tabs.each(function(t, e) {
                                    var n = r()(e),
                                        s = n.children("[data-tab-content]"),
                                        o = s[0].id || i.i(u.b)(6, "accordion"),
                                        a = e.id || o + "-label";
                                    n.find("a:first").attr({
                                        "aria-controls": o,
                                        role: "tab",
                                        id: a,
                                        "aria-expanded": !1,
                                        "aria-selected": !1
                                    }), s.attr({
                                        role: "tabpanel",
                                        "aria-labelledby": a,
                                        "aria-hidden": !0,
                                        id: o
                                    })
                                });
                                var e = this.$element.find(".is-active").children("[data-tab-content]");
                                this.firstTimeInit = !0, e.length && (this.down(e, this.firstTimeInit), this.firstTimeInit = !1), this._checkDeepLink = function() {
                                    var e = window.location.hash;
                                    if (e.length) {
                                        var i = t.$element.find('[href$="' + e + '"]'),
                                            n = r()(e);
                                        if (i.length && n) {
                                            if (i.parent("[data-accordion-item]").hasClass("is-active") || (t.down(n, t.firstTimeInit), t.firstTimeInit = !1), t.options.deepLinkSmudge) {
                                                var s = t;
                                                r()(window).load(function() {
                                                    var t = s.$element.offset();
                                                    r()("html, body").animate({
                                                        scrollTop: t.top
                                                    }, s.options.deepLinkSmudgeDelay)
                                                })
                                            }
                                            t.$element.trigger("deeplink.zf.accordion", [i, n])
                                        }
                                    }
                                }, this.options.deepLink && this._checkDeepLink(), this._events()
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this;
                                this.$tabs.each(function() {
                                    var e = r()(this),
                                        i = e.children("[data-tab-content]");
                                    i.length && e.children("a").off("click.zf.accordion keydown.zf.accordion").on("click.zf.accordion", function(e) {
                                        e.preventDefault(), t.toggle(i)
                                    }).on("keydown.zf.accordion", function(n) {
                                        l.a.handleKey(n, "Accordion", {
                                            toggle: function() {
                                                t.toggle(i)
                                            },
                                            next: function() {
                                                var i = e.next().find("a").focus();
                                                t.options.multiExpand || i.trigger("click.zf.accordion")
                                            },
                                            previous: function() {
                                                var i = e.prev().find("a").focus();
                                                t.options.multiExpand || i.trigger("click.zf.accordion")
                                            },
                                            handled: function() {
                                                n.preventDefault(), n.stopPropagation()
                                            }
                                        })
                                    })
                                }), this.options.deepLink && r()(window).on("popstate", this._checkDeepLink)
                            }
                        }, {
                            key: "toggle",
                            value: function(t) {
                                if (t.closest("[data-accordion]").is("[disabled]")) return void console.info("Cannot toggle an accordion that is disabled.");
                                if (t.parent().hasClass("is-active") ? this.up(t) : this.down(t), this.options.deepLink) {
                                    var e = t.prev("a").attr("href");
                                    this.options.updateHistory ? history.pushState({}, "", e) : history.replaceState({}, "", e)
                                }
                            }
                        }, {
                            key: "down",
                            value: function(t, e) {
                                var i = this;
                                if (t.closest("[data-accordion]").is("[disabled]") && !e) return void console.info("Cannot call down on an accordion that is disabled.");
                                if (t.attr("aria-hidden", !1).parent("[data-tab-content]").addBack().parent().addClass("is-active"), !this.options.multiExpand && !e) {
                                    var n = this.$element.children(".is-active").children("[data-tab-content]");
                                    n.length && this.up(n.not(t))
                                }
                                t.slideDown(this.options.slideSpeed, function() {
                                    i.$element.trigger("down.zf.accordion", [t])
                                }), r()("#" + t.attr("aria-labelledby")).attr({
                                    "aria-expanded": !0,
                                    "aria-selected": !0
                                })
                            }
                        }, {
                            key: "up",
                            value: function(t) {
                                if (t.closest("[data-accordion]").is("[disabled]")) return void console.info("Cannot call up on an accordion that is disabled.");
                                var e = t.parent().siblings(),
                                    i = this;
                                (this.options.allowAllClosed || e.hasClass("is-active")) && t.parent().hasClass("is-active") && (t.slideUp(i.options.slideSpeed, function() {
                                    i.$element.trigger("up.zf.accordion", [t])
                                }), t.attr("aria-hidden", !0).parent().removeClass("is-active"), r()("#" + t.attr("aria-labelledby")).attr({
                                    "aria-expanded": !1,
                                    "aria-selected": !1
                                }))
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.$element.find("[data-tab-content]").stop(!0).slideUp(0).css("display", ""), this.$element.find("a").off(".zf.accordion"), this.options.deepLink && r()(window).off("popstate", this._checkDeepLink)
                            }
                        }]), e
                    }(c.a);
                d.defaults = {
                    slideSpeed: 250,
                    multiExpand: !1,
                    allowAllClosed: !1,
                    deepLink: !1,
                    deepLinkSmudge: !1,
                    deepLinkSmudgeDelay: 300,
                    updateHistory: !1
                }
            },
                // AccordionMenu
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return f
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(3),
                    u = i(9),
                    c = i(1),
                    h = i(2),
                    d = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    f = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), d(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "AccordionMenu", this._init(), l.a.register("AccordionMenu", {
                                    ENTER: "toggle",
                                    SPACE: "toggle",
                                    ARROW_RIGHT: "open",
                                    ARROW_UP: "up",
                                    ARROW_DOWN: "down",
                                    ARROW_LEFT: "close",
                                    ESCAPE: "closeAll"
                                })
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                u.a.Feather(this.$element, "accordion");
                                var t = this;
                                this.$element.find("[data-submenu]").not(".is-active").slideUp(0), this.$element.attr({
                                    role: "tree",
                                    "aria-multiselectable": this.options.multiOpen
                                }), this.$menuLinks = this.$element.find(".is-accordion-submenu-parent"), this.$menuLinks.each(function() {
                                    var e = this.id || i.i(c.b)(6, "acc-menu-link"),
                                        n = r()(this),
                                        s = n.children("[data-submenu]"),
                                        o = s[0].id || i.i(c.b)(6, "acc-menu"),
                                        a = s.hasClass("is-active");
                                    t.options.submenuToggle ? (n.addClass("has-submenu-toggle"), n.children("a").after('<button id="' + e + '" class="submenu-toggle" aria-controls="' + o + '" aria-expanded="' + a + '" title="' + t.options.submenuToggleText + '"><span class="submenu-toggle-text">' + t.options.submenuToggleText + "</span></button>")) : n.attr({
                                        "aria-controls": o,
                                        "aria-expanded": a,
                                        id: e
                                    }), s.attr({
                                        "aria-labelledby": e,
                                        "aria-hidden": !a,
                                        role: "group",
                                        id: o
                                    })
                                }), this.$element.find("li").attr({
                                    role: "treeitem"
                                });
                                var e = this.$element.find(".is-active");
                                if (e.length) {
                                    var t = this;
                                    e.each(function() {
                                        t.down(r()(this))
                                    })
                                }
                                this._events()
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this;
                                this.$element.find("li").each(function() {
                                    var e = r()(this).children("[data-submenu]");
                                    e.length && (t.options.submenuToggle ? r()(this).children(".submenu-toggle").off("click.zf.accordionMenu").on("click.zf.accordionMenu", function(i) {
                                        t.toggle(e)
                                    }) : r()(this).children("a").off("click.zf.accordionMenu").on("click.zf.accordionMenu", function(i) {
                                        i.preventDefault(), t.toggle(e)
                                    }))
                                }).on("keydown.zf.accordionmenu", function(e) {
                                    var i, n, s = r()(this),
                                        o = s.parent("ul").children("li"),
                                        a = s.children("[data-submenu]");
                                    o.each(function(t) {
                                        if (r()(this).is(s)) return i = o.eq(Math.max(0, t - 1)).find("a").first(), n = o.eq(Math.min(t + 1, o.length - 1)).find("a").first(), r()(this).children("[data-submenu]:visible").length && (n = s.find("li:first-child").find("a").first()), r()(this).is(":first-child") ? i = s.parents("li").first().find("a").first() : i.parents("li").first().children("[data-submenu]:visible").length && (i = i.parents("li").find("li:last-child").find("a").first()), void(r()(this).is(":last-child") && (n = s.parents("li").first().next("li").find("a").first()))
                                    }), l.a.handleKey(e, "AccordionMenu", {
                                        open: function() {
                                            a.is(":hidden") && (t.down(a), a.find("li").first().find("a").first().focus())
                                        },
                                        close: function() {
                                            a.length && !a.is(":hidden") ? t.up(a) : s.parent("[data-submenu]").length && (t.up(s.parent("[data-submenu]")), s.parents("li").first().find("a").first().focus())
                                        },
                                        up: function() {
                                            return i.focus(), !0
                                        },
                                        down: function() {
                                            return n.focus(), !0
                                        },
                                        toggle: function() {
                                            return !t.options.submenuToggle && (s.children("[data-submenu]").length ? (t.toggle(s.children("[data-submenu]")), !0) : void 0)
                                        },
                                        closeAll: function() {
                                            t.hideAll()
                                        },
                                        handled: function(t) {
                                            t && e.preventDefault(), e.stopImmediatePropagation()
                                        }
                                    })
                                })
                            }
                        }, {
                            key: "hideAll",
                            value: function() {
                                this.up(this.$element.find("[data-submenu]"))
                            }
                        }, {
                            key: "showAll",
                            value: function() {
                                this.down(this.$element.find("[data-submenu]"))
                            }
                        }, {
                            key: "toggle",
                            value: function(t) {
                                t.is(":animated") || (t.is(":hidden") ? this.down(t) : this.up(t))
                            }
                        }, {
                            key: "down",
                            value: function(t) {
                                var e = this;
                                this.options.multiOpen || this.up(this.$element.find(".is-active").not(t.parentsUntil(this.$element).add(t))), t.addClass("is-active").attr({
                                    "aria-hidden": !1
                                }), this.options.submenuToggle ? t.prev(".submenu-toggle").attr({
                                    "aria-expanded": !0
                                }) : t.parent(".is-accordion-submenu-parent").attr({
                                    "aria-expanded": !0
                                }), t.slideDown(e.options.slideSpeed, function() {
                                    e.$element.trigger("down.zf.accordionMenu", [t])
                                })
                            }
                        }, {
                            key: "up",
                            value: function(t) {
                                var e = this;
                                t.slideUp(e.options.slideSpeed, function() {
                                    e.$element.trigger("up.zf.accordionMenu", [t])
                                });
                                var i = t.find("[data-submenu]").slideUp(0).addBack().attr("aria-hidden", !0);
                                this.options.submenuToggle ? i.prev(".submenu-toggle").attr("aria-expanded", !1) : i.parent(".is-accordion-submenu-parent").attr("aria-expanded", !1)
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.$element.find("[data-submenu]").slideDown(0).css("display", ""), this.$element.find("a").off("click.zf.accordionMenu"), this.options.submenuToggle && (this.$element.find(".has-submenu-toggle").removeClass("has-submenu-toggle"), this.$element.find(".submenu-toggle").remove()), u.a.Burn(this.$element, "accordion")
                            }
                        }]), e
                    }(h.a);
                f.defaults = {
                    slideSpeed: 250,
                    submenuToggle: !1,
                    submenuToggleText: "Toggle menu",
                    multiOpen: !0
                }
            },
                // Drilldown
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return p
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(3),
                    u = i(9),
                    c = i(1),
                    h = i(7),
                    d = i(2),
                    f = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    p = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), f(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "Drilldown", this._init(), l.a.register("Drilldown", {
                                    ENTER: "open",
                                    SPACE: "open",
                                    ARROW_RIGHT: "next",
                                    ARROW_UP: "up",
                                    ARROW_DOWN: "down",
                                    ARROW_LEFT: "previous",
                                    ESCAPE: "close",
                                    TAB: "down",
                                    SHIFT_TAB: "up"
                                })
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                u.a.Feather(this.$element, "drilldown"), this.options.autoApplyClass && this.$element.addClass("drilldown"), this.$element.attr({
                                    role: "tree",
                                    "aria-multiselectable": !1
                                }), this.$submenuAnchors = this.$element.find("li.is-drilldown-submenu-parent").children("a"), this.$submenus = this.$submenuAnchors.parent("li").children("[data-submenu]").attr("role", "group"), this.$menuItems = this.$element.find("li").not(".js-drilldown-back").attr("role", "treeitem").find("a"), this.$element.attr("data-mutate", this.$element.attr("data-drilldown") || i.i(c.b)(6, "drilldown")), this._prepareMenu(), this._registerEvents(), this._keyboardEvents()
                            }
                        }, {
                            key: "_prepareMenu",
                            value: function() {
                                var t = this;
                                this.$submenuAnchors.each(function() {
                                    var e = r()(this),
                                        i = e.parent();
                                    t.options.parentLink && e.clone().prependTo(i.children("[data-submenu]")).wrap('<li class="is-submenu-parent-item is-submenu-item is-drilldown-submenu-item" role="menuitem"></li>'), e.data("savedHref", e.attr("href")).removeAttr("href").attr("tabindex", 0), e.children("[data-submenu]").attr({
                                        "aria-hidden": !0,
                                        tabindex: 0,
                                        role: "group"
                                    }), t._events(e)
                                }), this.$submenus.each(function() {
                                    var e = r()(this);
                                    if (!e.find(".js-drilldown-back").length) switch (t.options.backButtonPosition) {
                                        case "bottom":
                                            e.append(t.options.backButton);
                                            break;
                                        case "top":
                                            e.prepend(t.options.backButton);
                                            break;
                                        default:
                                            console.error("Unsupported backButtonPosition value '" + t.options.backButtonPosition + "'")
                                    }
                                    t._back(e)
                                }), this.$submenus.addClass("invisible"), this.options.autoHeight || this.$submenus.addClass("drilldown-submenu-cover-previous"), this.$element.parent().hasClass("is-drilldown") || (this.$wrapper = r()(this.options.wrapper).addClass("is-drilldown"), this.options.animateHeight && this.$wrapper.addClass("animate-height"), this.$element.wrap(this.$wrapper)), this.$wrapper = this.$element.parent(), this.$wrapper.css(this._getMaxDims())
                            }
                        }, {
                            key: "_resize",
                            value: function() {
                                this.$wrapper.css({
                                    "max-width": "none",
                                    "min-height": "none"
                                }), this.$wrapper.css(this._getMaxDims())
                            }
                        }, {
                            key: "_events",
                            value: function(t) {
                                var e = this;
                                t.off("click.zf.drilldown").on("click.zf.drilldown", function(i) {
                                    if (r()(i.target).parentsUntil("ul", "li").hasClass("is-drilldown-submenu-parent") && (i.stopImmediatePropagation(), i.preventDefault()), e._show(t.parent("li")), e.options.closeOnClick) {
                                        var n = r()("body");
                                        n.off(".zf.drilldown").on("click.zf.drilldown", function(t) {
                                            t.target === e.$element[0] || r.a.contains(e.$element[0], t.target) || (t.preventDefault(), e._hideAll(), n.off(".zf.drilldown"))
                                        })
                                    }
                                })
                            }
                        }, {
                            key: "_registerEvents",
                            value: function() {
                                this.options.scrollTop && (this._bindHandler = this._scrollTop.bind(this), this.$element.on("open.zf.drilldown hide.zf.drilldown closed.zf.drilldown", this._bindHandler)), this.$element.on("mutateme.zf.trigger", this._resize.bind(this))
                            }
                        }, {
                            key: "_scrollTop",
                            value: function() {
                                var t = this,
                                    e = "" != t.options.scrollTopElement ? r()(t.options.scrollTopElement) : t.$element,
                                    i = parseInt(e.offset().top + t.options.scrollTopOffset, 10);
                                r()("html, body").stop(!0).animate({
                                    scrollTop: i
                                }, t.options.animationDuration, t.options.animationEasing, function() {
                                    this === r()("html")[0] && t.$element.trigger("scrollme.zf.drilldown")
                                })
                            }
                        }, {
                            key: "_keyboardEvents",
                            value: function() {
                                var t = this;
                                this.$menuItems.add(this.$element.find(".js-drilldown-back > a, .is-submenu-parent-item > a")).on("keydown.zf.drilldown", function(e) {
                                    var n, s, o = r()(this),
                                        a = o.parent("li").parent("ul").children("li").children("a");
                                    a.each(function(t) {
                                        if (r()(this).is(o)) return n = a.eq(Math.max(0, t - 1)), void(s = a.eq(Math.min(t + 1, a.length - 1)))
                                    }), l.a.handleKey(e, "Drilldown", {
                                        next: function() {
                                            if (o.is(t.$submenuAnchors)) return t._show(o.parent("li")), o.parent("li").one(i.i(c.c)(o), function() {
                                                o.parent("li").find("ul li a").filter(t.$menuItems).first().focus()
                                            }), !0
                                        },
                                        previous: function() {
                                            return t._hide(o.parent("li").parent("ul")), o.parent("li").parent("ul").one(i.i(c.c)(o), function() {
                                                setTimeout(function() {
                                                    o.parent("li").parent("ul").parent("li").children("a").first().focus()
                                                }, 1)
                                            }), !0
                                        },
                                        up: function() {
                                            return n.focus(), !o.is(t.$element.find("> li:first-child > a"))
                                        },
                                        down: function() {
                                            return s.focus(), !o.is(t.$element.find("> li:last-child > a"))
                                        },
                                        close: function() {
                                            o.is(t.$element.find("> li > a")) || (t._hide(o.parent().parent()), o.parent().parent().siblings("a").focus())
                                        },
                                        open: function() {
                                            return o.is(t.$menuItems) ? o.is(t.$submenuAnchors) ? (t._show(o.parent("li")), o.parent("li").one(i.i(c.c)(o), function() {
                                                o.parent("li").find("ul li a").filter(t.$menuItems).first().focus()
                                            }), !0) : void 0 : (t._hide(o.parent("li").parent("ul")), o.parent("li").parent("ul").one(i.i(c.c)(o), function() {
                                                setTimeout(function() {
                                                    o.parent("li").parent("ul").parent("li").children("a").first().focus()
                                                }, 1)
                                            }), !0)
                                        },
                                        handled: function(t) {
                                            t && e.preventDefault(), e.stopImmediatePropagation()
                                        }
                                    })
                                })
                            }
                        }, {
                            key: "_hideAll",
                            value: function() {
                                var t = this.$element.find(".is-drilldown-submenu.is-active").addClass("is-closing");
                                this.options.autoHeight && this.$wrapper.css({
                                    height: t.parent().closest("ul").data("calcHeight")
                                }), t.one(i.i(c.c)(t), function(e) {
                                    t.removeClass("is-active is-closing")
                                }), this.$element.trigger("closed.zf.drilldown")
                            }
                        }, {
                            key: "_back",
                            value: function(t) {
                                var e = this;
                                t.off("click.zf.drilldown"), t.children(".js-drilldown-back").on("click.zf.drilldown", function(i) {
                                    i.stopImmediatePropagation(), e._hide(t);
                                    var n = t.parent("li").parent("ul").parent("li");
                                    n.length && e._show(n)
                                })
                            }
                        }, {
                            key: "_menuLinkEvents",
                            value: function() {
                                var t = this;
                                this.$menuItems.not(".is-drilldown-submenu-parent").off("click.zf.drilldown").on("click.zf.drilldown", function(e) {
                                    setTimeout(function() {
                                        t._hideAll()
                                    }, 0)
                                })
                            }
                        }, {
                            key: "_show",
                            value: function(t) {
                                this.options.autoHeight && this.$wrapper.css({
                                    height: t.children("[data-submenu]").data("calcHeight")
                                }), t.attr("aria-expanded", !0), t.children("[data-submenu]").addClass("is-active").removeClass("invisible").attr("aria-hidden", !1), this.$element.trigger("open.zf.drilldown", [t])
                            }
                        }, {
                            key: "_hide",
                            value: function(t) {
                                this.options.autoHeight && this.$wrapper.css({
                                    height: t.parent().closest("ul").data("calcHeight")
                                });
                                t.parent("li").attr("aria-expanded", !1), t.attr("aria-hidden", !0).addClass("is-closing"), t.addClass("is-closing").one(i.i(c.c)(t), function() {
                                    t.removeClass("is-active is-closing"), t.blur().addClass("invisible")
                                }), t.trigger("hide.zf.drilldown", [t])
                            }
                        }, {
                            key: "_getMaxDims",
                            value: function() {
                                var t = 0,
                                    e = {},
                                    i = this;
                                return this.$submenus.add(this.$element).each(function() {
                                    var n = (r()(this).children("li").length, h.a.GetDimensions(this).height);
                                    t = n > t ? n : t, i.options.autoHeight && (r()(this).data("calcHeight", n), r()(this).hasClass("is-drilldown-submenu") || (e.height = n))
                                }), this.options.autoHeight || (e["min-height"] = t + "px"), e["max-width"] = this.$element[0].getBoundingClientRect().width + "px", e
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.options.scrollTop && this.$element.off(".zf.drilldown", this._bindHandler), this._hideAll(), this.$element.off("mutateme.zf.trigger"), u.a.Burn(this.$element, "drilldown"), this.$element.unwrap().find(".js-drilldown-back, .is-submenu-parent-item").remove().end().find(".is-active, .is-closing, .is-drilldown-submenu").removeClass("is-active is-closing is-drilldown-submenu").end().find("[data-submenu]").removeAttr("aria-hidden tabindex role"), this.$submenuAnchors.each(function() {
                                    r()(this).off(".zf.drilldown")
                                }), this.$submenus.removeClass("drilldown-submenu-cover-previous invisible"), this.$element.find("a").each(function() {
                                    var t = r()(this);
                                    t.removeAttr("tabindex"), t.data("savedHref") && t.attr("href", t.data("savedHref")).removeData("savedHref")
                                })
                            }
                        }]), e
                    }(d.a);
                p.defaults = {
                    autoApplyClass: !0,
                    backButton: '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>',
                    backButtonPosition: "top",
                    wrapper: "<div></div>",
                    parentLink: !1,
                    closeOnClick: !1,
                    autoHeight: !1,
                    animateHeight: !1,
                    scrollTop: !1,
                    scrollTopElement: "",
                    scrollTopOffset: 0,
                    animationDuration: 500,
                    animationEasing: "swing"
                }
            },
                //DropdownMenu
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return p
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(3),
                    u = i(9),
                    c = i(7),
                    h = i(1),
                    d = i(2),
                    f = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    p = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), f(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "DropdownMenu", this._init(), l.a.register("DropdownMenu", {
                                    ENTER: "open",
                                    SPACE: "open",
                                    ARROW_RIGHT: "next",
                                    ARROW_UP: "up",
                                    ARROW_DOWN: "down",
                                    ARROW_LEFT: "previous",
                                    ESCAPE: "close"
                                })
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                u.a.Feather(this.$element, "dropdown");
                                var t = this.$element.find("li.is-dropdown-submenu-parent");
                                this.$element.children(".is-dropdown-submenu-parent").children(".is-dropdown-submenu").addClass("first-sub"), this.$menuItems = this.$element.find('[role="menuitem"]'), this.$tabs = this.$element.children('[role="menuitem"]'), this.$tabs.find("ul.is-dropdown-submenu").addClass(this.options.verticalClass), "auto" === this.options.alignment ? this.$element.hasClass(this.options.rightClass) || i.i(h.a)() || this.$element.parents(".top-bar-right").is("*") ? (this.options.alignment = "right", t.addClass("opens-left")) : (this.options.alignment = "left", t.addClass("opens-right")) : "right" === this.options.alignment ? t.addClass("opens-left") : t.addClass("opens-right"), this.changed = !1, this._events()
                            }
                        }, {
                            key: "_isVertical",
                            value: function() {
                                return "block" === this.$tabs.css("display") || "column" === this.$element.css("flex-direction")
                            }
                        }, {
                            key: "_isRtl",
                            value: function() {
                                return this.$element.hasClass("align-right") || i.i(h.a)() && !this.$element.hasClass("align-left")
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this,
                                    e = "ontouchstart" in window || void 0 !== window.ontouchstart,
                                    i = "is-dropdown-submenu-parent",
                                    n = function(n) {
                                        var s = r()(n.target).parentsUntil("ul", "." + i),
                                            o = s.hasClass(i),
                                            a = "true" === s.attr("data-is-click"),
                                            l = s.children(".is-dropdown-submenu");
                                        if (o)
                                            if (a) {
                                                if (!t.options.closeOnClick || !t.options.clickOpen && !e || t.options.forceFollow && e) return;
                                                n.stopImmediatePropagation(), n.preventDefault(), t._hide(s)
                                            } else n.preventDefault(), n.stopImmediatePropagation(), t._show(l), s.add(s.parentsUntil(t.$element, "." + i)).attr("data-is-click", !0)
                                    };
                                (this.options.clickOpen || e) && this.$menuItems.on("click.zf.dropdownmenu touchstart.zf.dropdownmenu", n), t.options.closeOnClickInside && this.$menuItems.on("click.zf.dropdownmenu", function(e) {
                                    r()(this).hasClass(i) || t._hide()
                                }), this.options.disableHover || this.$menuItems.on("mouseenter.zf.dropdownmenu", function(e) {
                                    var n = r()(this);
                                    n.hasClass(i) && (clearTimeout(n.data("_delay")), n.data("_delay", setTimeout(function() {
                                        t._show(n.children(".is-dropdown-submenu"))
                                    }, t.options.hoverDelay)))
                                }).on("mouseleave.zf.dropdownmenu", function(e) {
                                    var n = r()(this);
                                    if (n.hasClass(i) && t.options.autoclose) {
                                        if ("true" === n.attr("data-is-click") && t.options.clickOpen) return !1;
                                        clearTimeout(n.data("_delay")), n.data("_delay", setTimeout(function() {
                                            t._hide(n)
                                        }, t.options.closingTime))
                                    }
                                }), this.$menuItems.on("keydown.zf.dropdownmenu", function(e) {
                                    var i, n, s = r()(e.target).parentsUntil("ul", '[role="menuitem"]'),
                                        o = t.$tabs.index(s) > -1,
                                        a = o ? t.$tabs : s.siblings("li").add(s);
                                    a.each(function(t) {
                                        if (r()(this).is(s)) return i = a.eq(t - 1), void(n = a.eq(t + 1))
                                    });
                                    var u = function() {
                                            n.children("a:first").focus(), e.preventDefault()
                                        },
                                        c = function() {
                                            i.children("a:first").focus(), e.preventDefault()
                                        },
                                        h = function() {
                                            var i = s.children("ul.is-dropdown-submenu");
                                            i.length && (t._show(i), s.find("li > a:first").focus(), e.preventDefault())
                                        },
                                        d = function() {
                                            var i = s.parent("ul").parent("li");
                                            i.children("a:first").focus(), t._hide(i), e.preventDefault()
                                        },
                                        f = {
                                            open: h,
                                            close: function() {
                                                t._hide(t.$element), t.$menuItems.eq(0).children("a").focus(), e.preventDefault()
                                            },
                                            handled: function() {
                                                e.stopImmediatePropagation()
                                            }
                                        };
                                    o ? t._isVertical() ? t._isRtl() ? r.a.extend(f, {
                                        down: u,
                                        up: c,
                                        next: d,
                                        previous: h
                                    }) : r.a.extend(f, {
                                        down: u,
                                        up: c,
                                        next: h,
                                        previous: d
                                    }) : t._isRtl() ? r.a.extend(f, {
                                        next: c,
                                        previous: u,
                                        down: h,
                                        up: d
                                    }) : r.a.extend(f, {
                                        next: u,
                                        previous: c,
                                        down: h,
                                        up: d
                                    }) : t._isRtl() ? r.a.extend(f, {
                                        next: d,
                                        previous: h,
                                        down: u,
                                        up: c
                                    }) : r.a.extend(f, {
                                        next: h,
                                        previous: d,
                                        down: u,
                                        up: c
                                    }), l.a.handleKey(e, "DropdownMenu", f)
                                })
                            }
                        }, {
                            key: "_addBodyHandler",
                            value: function() {
                                var t = r()(document.body),
                                    e = this;
                                t.off("mouseup.zf.dropdownmenu touchend.zf.dropdownmenu").on("mouseup.zf.dropdownmenu touchend.zf.dropdownmenu", function(i) {
                                    e.$element.find(i.target).length || (e._hide(), t.off("mouseup.zf.dropdownmenu touchend.zf.dropdownmenu"))
                                })
                            }
                        }, {
                            key: "_show",
                            value: function(t) {
                                var e = this.$tabs.index(this.$tabs.filter(function(e, i) {
                                        return r()(i).find(t).length > 0
                                    })),
                                    i = t.parent("li.is-dropdown-submenu-parent").siblings("li.is-dropdown-submenu-parent");
                                this._hide(i, e), t.css("visibility", "hidden").addClass("js-dropdown-active").parent("li.is-dropdown-submenu-parent").addClass("is-active");
                                var n = c.a.ImNotTouchingYou(t, null, !0);
                                if (!n) {
                                    var s = "left" === this.options.alignment ? "-right" : "-left",
                                        o = t.parent(".is-dropdown-submenu-parent");
                                    o.removeClass("opens" + s).addClass("opens-" + this.options.alignment), n = c.a.ImNotTouchingYou(t, null, !0), n || o.removeClass("opens-" + this.options.alignment).addClass("opens-inner"), this.changed = !0
                                }
                                t.css("visibility", ""), this.options.closeOnClick && this._addBodyHandler(), this.$element.trigger("show.zf.dropdownmenu", [t])
                            }
                        }, {
                            key: "_hide",
                            value: function(t, e) {
                                var i;
                                if (i = t && t.length ? t : void 0 !== e ? this.$tabs.not(function(t, i) {
                                    return t === e
                                }) : this.$element, i.hasClass("is-active") || i.find(".is-active").length > 0) {
                                    if (i.find("li.is-active").add(i).attr({
                                        "data-is-click": !1
                                    }).removeClass("is-active"), i.find("ul.js-dropdown-active").removeClass("js-dropdown-active"), this.changed || i.find("opens-inner").length) {
                                        var n = "left" === this.options.alignment ? "right" : "left";
                                        i.find("li.is-dropdown-submenu-parent").add(i).removeClass("opens-inner opens-" + this.options.alignment).addClass("opens-" + n), this.changed = !1
                                    }
                                    this.$element.trigger("hide.zf.dropdownmenu", [i])
                                }
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.$menuItems.off(".zf.dropdownmenu").removeAttr("data-is-click").removeClass("is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner"), r()(document.body).off(".zf.dropdownmenu"), u.a.Burn(this.$element, "dropdown")
                            }
                        }]), e
                    }(d.a);
                p.defaults = {
                    disableHover: !1,
                    autoclose: !0,
                    hoverDelay: 50,
                    clickOpen: !1,
                    closingTime: 500,
                    alignment: "auto",
                    closeOnClick: !0,
                    closeOnClickInside: !0,
                    verticalClass: "vertical",
                    rightClass: "align-right",
                    forceFollow: !0
                }
            },

                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }

                function a(t, e) {
                    var i = e.indexOf(t);
                    return i === e.length - 1 ? e[0] : e[i + 1]
                }
                i.d(e, "a", function() {
                    return m
                });
                var r = i(7),
                    l = i(2),
                    u = i(1),
                    c = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    h = ["left", "right", "top", "bottom"],
                    d = ["top", "bottom", "center"],
                    f = ["left", "right", "center"],
                    p = {
                        left: d,
                        right: d,
                        top: f,
                        bottom: f
                    },
                    m = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), c(e, [{
                            key: "_init",
                            value: function() {
                                this.triedPositions = {}, this.position = "auto" === this.options.position ? this._getDefaultPosition() : this.options.position, this.alignment = "auto" === this.options.alignment ? this._getDefaultAlignment() : this.options.alignment
                            }
                        }, {
                            key: "_getDefaultPosition",
                            value: function() {
                                return "bottom"
                            }
                        }, {
                            key: "_getDefaultAlignment",
                            value: function() {
                                switch (this.position) {
                                    case "bottom":
                                    case "top":
                                        return i.i(u.a)() ? "right" : "left";
                                    case "left":
                                    case "right":
                                        return "bottom"
                                }
                            }
                        }, {
                            key: "_reposition",
                            value: function() {
                                this._alignmentsExhausted(this.position) ? (this.position = a(this.position, h), this.alignment = p[this.position][0]) : this._realign()
                            }
                        }, {
                            key: "_realign",
                            value: function() {
                                this._addTriedPosition(this.position, this.alignment), this.alignment = a(this.alignment, p[this.position])
                            }
                        }, {
                            key: "_addTriedPosition",
                            value: function(t, e) {
                                this.triedPositions[t] = this.triedPositions[t] || [], this.triedPositions[t].push(e)
                            }
                        }, {
                            key: "_positionsExhausted",
                            value: function() {
                                for (var t = !0, e = 0; e < h.length; e++) t = t && this._alignmentsExhausted(h[e]);
                                return t
                            }
                        }, {
                            key: "_alignmentsExhausted",
                            value: function(t) {
                                return this.triedPositions[t] && this.triedPositions[t].length == p[t].length
                            }
                        }, {
                            key: "_getVOffset",
                            value: function() {
                                return this.options.vOffset
                            }
                        }, {
                            key: "_getHOffset",
                            value: function() {
                                return this.options.hOffset
                            }
                        }, {
                            key: "_setPosition",
                            value: function(t, e, i) {
                                if ("false" === t.attr("aria-expanded")) return !1;
                                r.a.GetDimensions(e), r.a.GetDimensions(t);
                                if (e.offset(r.a.GetExplicitOffsets(e, t, this.position, this.alignment, this._getVOffset(), this._getHOffset())), !this.options.allowOverlap) {
                                    for (var n = 1e8, s = {
                                        position: this.position,
                                        alignment: this.alignment
                                    }; !this._positionsExhausted();) {
                                        var o = r.a.OverlapArea(e, i, !1, !1, this.options.allowBottomOverlap);
                                        if (0 === o) return;
                                        o < n && (n = o, s = {
                                            position: this.position,
                                            alignment: this.alignment
                                        }), this._reposition(), e.offset(r.a.GetExplicitOffsets(e, t, this.position, this.alignment, this._getVOffset(), this._getHOffset()))
                                    }
                                    this.position = s.position, this.alignment = s.alignment, e.offset(r.a.GetExplicitOffsets(e, t, this.position, this.alignment, this._getVOffset(), this._getHOffset()))
                                }
                            }
                        }]), e
                    }(l.a);
                m.defaults = {
                    position: "auto",
                    alignment: "auto",
                    allowOverlap: !1,
                    allowBottomOverlap: !0,
                    vOffset: 0,
                    hOffset: 0
                }
            },
                // SmoothScroll
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return h
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(1),
                    u = i(2),
                    c = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    h = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), c(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "SmoothScroll", this._init()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                var t = this.$element[0].id || i.i(l.b)(6, "smooth-scroll");
                                this.$element.attr({
                                    id: t
                                }), this._events()
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this,
                                    i = function(i) {
                                        if (!r()(this).is('a[href^="#"]')) return !1;
                                        var n = this.getAttribute("href");
                                        t._inTransition = !0, e.scrollToLoc(n, t.options, function() {
                                            t._inTransition = !1
                                        }), i.preventDefault()
                                    };
                                this.$element.on("click.zf.smoothScroll", i), this.$element.on("click.zf.smoothScroll", 'a[href^="#"]', i)
                            }
                        }], [{
                            key: "scrollToLoc",
                            value: function(t) {
                                var i = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : e.defaults,
                                    n = arguments[2];
                                if (!r()(t).length) return !1;
                                var s = Math.round(r()(t).offset().top - i.threshold / 2 - i.offset);
                                r()("html, body").stop(!0).animate({
                                    scrollTop: s
                                }, i.animationDuration, i.animationEasing, function() {
                                    n && "function" == typeof n && n()
                                })
                            }
                        }]), e
                    }(u.a);
                h.defaults = {
                    animationDuration: 500,
                    animationEasing: "linear",
                    threshold: 50,
                    offset: 0
                }
            },
                // Tabs
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return d
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(3),
                    u = i(8),
                    c = i(2),
                    h = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    d = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), h(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "Tabs", this._init(), l.a.register("Tabs", {
                                    ENTER: "open",
                                    SPACE: "open",
                                    ARROW_RIGHT: "next",
                                    ARROW_UP: "previous",
                                    ARROW_DOWN: "next",
                                    ARROW_LEFT: "previous"
                                })
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                var t = this,
                                    e = this;
                                if (this.$element.attr({
                                    role: "tablist"
                                }), this.$tabTitles = this.$element.find("." + this.options.linkClass), this.$tabContent = r()('[data-tabs-content="' + this.$element[0].id + '"]'), this.$tabTitles.each(function() {
                                    var t = r()(this),
                                        i = t.find("a"),
                                        n = t.hasClass("" + e.options.linkActiveClass),
                                        s = i.attr("data-tabs-target") || i[0].hash.slice(1),
                                        o = i[0].id ? i[0].id : s + "-label",
                                        a = r()("#" + s);
                                    t.attr({
                                        role: "presentation"
                                    }), i.attr({
                                        role: "tab",
                                        "aria-controls": s,
                                        "aria-selected": n,
                                        id: o,
                                        tabindex: n ? "0" : "-1"
                                    }), a.attr({
                                        role: "tabpanel",
                                        "aria-labelledby": o
                                    }), n || a.attr("aria-hidden", "true"), n && e.options.autoFocus && r()(window).load(function() {
                                        r()("html, body").animate({
                                            scrollTop: t.offset().top
                                        }, e.options.deepLinkSmudgeDelay, function() {
                                            i.focus()
                                        })
                                    })
                                }), this.options.matchHeight) {
                                    var n = this.$tabContent.find("img");
                                    n.length ? i.i(u.a)(n, this._setHeight.bind(this)) : this._setHeight()
                                }
                                this._checkDeepLink = function() {
                                    var e = window.location.hash;
                                    if (e.length) {
                                        var i = t.$element.find('[href$="' + e + '"]');
                                        if (i.length) {
                                            if (t.selectTab(r()(e), !0), t.options.deepLinkSmudge) {
                                                var n = t.$element.offset();
                                                r()("html, body").animate({
                                                    scrollTop: n.top
                                                }, t.options.deepLinkSmudgeDelay)
                                            }
                                            t.$element.trigger("deeplink.zf.tabs", [i, r()(e)])
                                        }
                                    }
                                }, this.options.deepLink && this._checkDeepLink(), this._events()
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                this._addKeyHandler(), this._addClickHandler(), this._setHeightMqHandler = null, this.options.matchHeight && (this._setHeightMqHandler = this._setHeight.bind(this), r()(window).on("changed.zf.mediaquery", this._setHeightMqHandler)), this.options.deepLink && r()(window).on("popstate", this._checkDeepLink)
                            }
                        }, {
                            key: "_addClickHandler",
                            value: function() {
                                var t = this;
                                this.$element.off("click.zf.tabs").on("click.zf.tabs", "." + this.options.linkClass, function(e) {
                                    e.preventDefault(), e.stopPropagation(), t._handleTabChange(r()(this))
                                })
                            }
                        }, {
                            key: "_addKeyHandler",
                            value: function() {
                                var t = this;
                                this.$tabTitles.off("keydown.zf.tabs").on("keydown.zf.tabs", function(e) {
                                    if (9 !== e.which) {
                                        var i, n, s = r()(this),
                                            o = s.parent("ul").children("li");
                                        o.each(function(e) {
                                            if (r()(this).is(s)) return void(t.options.wrapOnKeys ? (i = 0 === e ? o.last() : o.eq(e - 1), n = e === o.length - 1 ? o.first() : o.eq(e + 1)) : (i = o.eq(Math.max(0, e - 1)), n = o.eq(Math.min(e + 1, o.length - 1))))
                                        }), l.a.handleKey(e, "Tabs", {
                                            open: function() {
                                                s.find('[role="tab"]').focus(), t._handleTabChange(s)
                                            },
                                            previous: function() {
                                                i.find('[role="tab"]').focus(), t._handleTabChange(i)
                                            },
                                            next: function() {
                                                n.find('[role="tab"]').focus(), t._handleTabChange(n)
                                            },
                                            handled: function() {
                                                e.stopPropagation(), e.preventDefault()
                                            }
                                        })
                                    }
                                })
                            }
                        }, {
                            key: "_handleTabChange",
                            value: function(t, e) {
                                if (t.hasClass("" + this.options.linkActiveClass)) return void(this.options.activeCollapse && (this._collapseTab(t), this.$element.trigger("collapse.zf.tabs", [t])));
                                var i = this.$element.find("." + this.options.linkClass + "." + this.options.linkActiveClass),
                                    n = t.find('[role="tab"]'),
                                    s = n.attr("data-tabs-target") || n[0].hash.slice(1),
                                    o = this.$tabContent.find("#" + s);
                                if (this._collapseTab(i), this._openTab(t), this.options.deepLink && !e) {
                                    var a = t.find("a").attr("href");
                                    this.options.updateHistory ? history.pushState({}, "", a) : history.replaceState({}, "", a)
                                }
                                this.$element.trigger("change.zf.tabs", [t, o]), o.find("[data-mutate]").trigger("mutateme.zf.trigger")
                            }
                        }, {
                            key: "_openTab",
                            value: function(t) {
                                var e = t.find('[role="tab"]'),
                                    i = e.attr("data-tabs-target") || e[0].hash.slice(1),
                                    n = this.$tabContent.find("#" + i);
                                t.addClass("" + this.options.linkActiveClass), e.attr({
                                    "aria-selected": "true",
                                    tabindex: "0"
                                }), n.addClass("" + this.options.panelActiveClass).removeAttr("aria-hidden")
                            }
                        }, {
                            key: "_collapseTab",
                            value: function(t) {
                                var e = t.removeClass("" + this.options.linkActiveClass).find('[role="tab"]').attr({
                                    "aria-selected": "false",
                                    tabindex: -1
                                });
                                r()("#" + e.attr("aria-controls")).removeClass("" + this.options.panelActiveClass).attr({
                                    "aria-hidden": "true"
                                })
                            }
                        }, {
                            key: "selectTab",
                            value: function(t, e) {
                                var i;
                                i = "object" == typeof t ? t[0].id : t, i.indexOf("#") < 0 && (i = "#" + i);
                                var n = this.$tabTitles.find('[href$="' + i + '"]').parent("." + this.options.linkClass);
                                this._handleTabChange(n, e)
                            }
                        }, {
                            key: "_setHeight",
                            value: function() {
                                var t = 0,
                                    e = this;
                                this.$tabContent.find("." + this.options.panelClass).css("height", "").each(function() {
                                    var i = r()(this),
                                        n = i.hasClass("" + e.options.panelActiveClass);
                                    n || i.css({
                                        visibility: "hidden",
                                        display: "block"
                                    });
                                    var s = this.getBoundingClientRect().height;
                                    n || i.css({
                                        visibility: "",
                                        display: ""
                                    }), t = s > t ? s : t
                                }).css("height", t + "px")
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.$element.find("." + this.options.linkClass).off(".zf.tabs").hide().end().find("." + this.options.panelClass).hide(), this.options.matchHeight && null != this._setHeightMqHandler && r()(window).off("changed.zf.mediaquery", this._setHeightMqHandler), this.options.deepLink && r()(window).off("popstate", this._checkDeepLink)
                            }
                        }]), e
                    }(c.a);
                d.defaults = {
                    deepLink: !1,
                    deepLinkSmudge: !1,
                    deepLinkSmudgeDelay: 300,
                    updateHistory: !1,
                    autoFocus: !1,
                    wrapOnKeys: !0,
                    matchHeight: !1,
                    activeCollapse: !1,
                    linkClass: "tabs-title",
                    linkActiveClass: "is-active",
                    panelClass: "tabs-panel",
                    panelActiveClass: "is-active"
                }
            },
                // Timer
                function(t, e, i) {
                "use strict";

                function n(t, e, i) {
                    var n, s, o = this,
                        a = e.duration,
                        r = Object.keys(t.data())[0] || "timer",
                        l = -1;
                    this.isPaused = !1, this.restart = function() {
                        l = -1, clearTimeout(s), this.start()
                    }, this.start = function() {
                        this.isPaused = !1, clearTimeout(s), l = l <= 0 ? a : l, t.data("paused", !1), n = Date.now(), s = setTimeout(function() {
                            e.infinite && o.restart(), i && "function" == typeof i && i()
                        }, l), t.trigger("timerstart.zf." + r)
                    }, this.pause = function() {
                        this.isPaused = !0, clearTimeout(s), t.data("paused", !0);
                        var e = Date.now();
                        l -= e - n, t.trigger("timerpaused.zf." + r)
                    }
                }
                i.d(e, "a", function() {
                    return n
                });
                var s = i(0);
                i.n(s)
            },
                function(t, e, i) {
                "use strict";
                Object.defineProperty(e, "__esModule", {
                    value: !0
                });
                var n = i(0),
                    s = i.n(n),
                    o = i(21),
                    a = i(1),
                    r = i(7),
                    l = i(8),
                    u = i(3),
                    c = i(4),
                    h = i(6),
                    d = i(9),
                    f = i(18),
                    p = i(10),
                    m = i(5),
                    g = i(20),
                    v = i(11),
                    b = i(12),
                    y = i(13),
                    w = i(22),
                    _ = i(14),
                    $ = i(23),
                    k = i(24),
                    C = i(25),
                    z = i(26),
                    O = i(27),
                    T = i(29),
                    E = i(30),
                    P = i(31),
                    A = i(32),
                    F = i(16),
                    x = i(33),
                    D = i(17),
                    S = i(34),
                    R = i(35),
                    H = i(28);
                o.a.addToJquery(s.a),
                    o.a.rtl = a.a,
                    o.a.GetYoDigits = a.b,
                    o.a.transitionend = a.c,
                    o.a.Box = r.a,
                    o.a.onImagesLoaded = l.a,
                    o.a.Keyboard = u.a,
                    o.a.MediaQuery = c.a,
                    o.a.Motion = h.a,
                    o.a.Move = h.b,
                    o.a.Nest = d.a,
                    o.a.Timer = f.a,
                    p.a.init(s.a),
                    m.a.init(s.a, o.a),
                    o.a.plugin(g.a, "Abide"),
                    o.a.plugin(v.a, "Accordion"),
                    o.a.plugin(b.a, "AccordionMenu"),
                    o.a.plugin(y.a, "Drilldown"),
                    o.a.plugin(w.a, "Dropdown"),
                    o.a.plugin(_.a, "DropdownMenu"),
                    o.a.plugin($.a, "Equalizer"),
                    o.a.plugin(k.a, "Interchange"),
                    o.a.plugin(C.a, "Magellan"),
                    o.a.plugin(z.a, "OffCanvas"),
                    o.a.plugin(O.a, "Orbit"),
                    o.a.plugin(T.a, "ResponsiveMenu"),
                    o.a.plugin(E.a, "ResponsiveToggle"),
                    o.a.plugin(P.a, "Reveal"),
                    o.a.plugin(A.a, "Slider"),
                    o.a.plugin(F.a, "SmoothScroll"),
                    o.a.plugin(x.a, "Sticky"),
                    o.a.plugin(D.a, "Tabs"),
                    o.a.plugin(S.a, "Toggler"),
                    o.a.plugin(R.a, "Tooltip"),
                    o.a.plugin(H.a, "ResponsiveAccordionTabs")
            },
                // Abide
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return c
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(2),
                    u = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    c = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), u(e, [{
                            key: "_setup",
                            value: function(t) {
                                var i = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
                                this.$element = t, this.options = r.a.extend(!0, {}, e.defaults, this.$element.data(), i), this.className = "Abide", this._init()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                this.$inputs = this.$element.find("input, textarea, select"), this._events()
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this;
                                this.$element.off(".abide").on("reset.zf.abide", function() {
                                    t.resetForm()
                                }).on("submit.zf.abide", function() {
                                    return t.validateForm()
                                }), "fieldChange" === this.options.validateOn && this.$inputs.off("change.zf.abide").on("change.zf.abide", function(e) {
                                    t.validateInput(r()(e.target))
                                }), this.options.liveValidate && this.$inputs.off("input.zf.abide").on("input.zf.abide", function(e) {
                                    t.validateInput(r()(e.target))
                                }), this.options.validateOnBlur && this.$inputs.off("blur.zf.abide").on("blur.zf.abide", function(e) {
                                    t.validateInput(r()(e.target))
                                })
                            }
                        }, {
                            key: "_reflow",
                            value: function() {
                                this._init()
                            }
                        }, {
                            key: "requiredCheck",
                            value: function(t) {
                                if (!t.attr("required")) return !0;
                                var e = !0;
                                switch (t[0].type) {
                                    case "checkbox":
                                        e = t[0].checked;
                                        break;
                                    case "select":
                                    case "select-one":
                                    case "select-multiple":
                                        var i = t.find("option:selected");
                                        i.length && i.val() || (e = !1);
                                        break;
                                    default:
                                        t.val() && t.val().length || (e = !1)
                                }
                                return e
                            }
                        }, {
                            key: "findFormError",
                            value: function(t) {
                                var e = t[0].id,
                                    i = t.siblings(this.options.formErrorSelector);
                                return i.length || (i = t.parent().find(this.options.formErrorSelector)), i = i.add(this.$element.find('[data-form-error-for="' + e + '"]'))
                            }
                        }, {
                            key: "findLabel",
                            value: function(t) {
                                var e = t[0].id,
                                    i = this.$element.find('label[for="' + e + '"]');
                                return i.length ? i : t.closest("label")
                            }
                        }, {
                            key: "findRadioLabels",
                            value: function(t) {
                                var e = this,
                                    i = t.map(function(t, i) {
                                        var n = i.id,
                                            s = e.$element.find('label[for="' + n + '"]');
                                        return s.length || (s = r()(i).closest("label")), s[0]
                                    });
                                return r()(i)
                            }
                        }, {
                            key: "addErrorClasses",
                            value: function(t) {
                                var e = this.findLabel(t),
                                    i = this.findFormError(t);
                                e.length && e.addClass(this.options.labelErrorClass), i.length && i.addClass(this.options.formErrorClass), t.addClass(this.options.inputErrorClass).attr("data-invalid", "")
                            }
                        }, {
                            key: "removeRadioErrorClasses",
                            value: function(t) {
                                var e = this.$element.find(':radio[name="' + t + '"]'),
                                    i = this.findRadioLabels(e),
                                    n = this.findFormError(e);
                                i.length && i.removeClass(this.options.labelErrorClass), n.length && n.removeClass(this.options.formErrorClass), e.removeClass(this.options.inputErrorClass).removeAttr("data-invalid")
                            }
                        }, {
                            key: "removeErrorClasses",
                            value: function(t) {
                                if ("radio" == t[0].type) return this.removeRadioErrorClasses(t.attr("name"));
                                var e = this.findLabel(t),
                                    i = this.findFormError(t);
                                e.length && e.removeClass(this.options.labelErrorClass), i.length && i.removeClass(this.options.formErrorClass), t.removeClass(this.options.inputErrorClass).removeAttr("data-invalid")
                            }
                        }, {
                            key: "validateInput",
                            value: function(t) {
                                var e = this.requiredCheck(t),
                                    i = !1,
                                    n = !0,
                                    s = t.attr("data-validator"),
                                    o = !0;
                                if (t.is("[data-abide-ignore]") || t.is('[type="hidden"]') || t.is("[disabled]")) return !0;
                                switch (t[0].type) {
                                    case "radio":
                                        i = this.validateRadio(t.attr("name"));
                                        break;
                                    case "checkbox":
                                        i = e;
                                        break;
                                    case "select":
                                    case "select-one":
                                    case "select-multiple":
                                        i = e;
                                        break;
                                    default:
                                        i = this.validateText(t)
                                }
                                s && (n = this.matchValidation(t, s, t.attr("required"))), t.attr("data-equalto") && (o = this.options.validators.equalTo(t));
                                var a = -1 === [e, i, n, o].indexOf(!1),
                                    l = (a ? "valid" : "invalid") + ".zf.abide";
                                if (a) {
                                    var u = this.$element.find('[data-equalto="' + t.attr("id") + '"]');
                                    if (u.length) {
                                        var c = this;
                                        u.each(function() {
                                            r()(this).val() && c.validateInput(r()(this))
                                        })
                                    }
                                }
                                return this[a ? "removeErrorClasses" : "addErrorClasses"](t), t.trigger(l, [t]), a
                            }
                        }, {
                            key: "validateForm",
                            value: function() {
                                var t = [],
                                    e = this;
                                this.$inputs.each(function() {
                                    t.push(e.validateInput(r()(this)))
                                });
                                var i = -1 === t.indexOf(!1);
                                return this.$element.find("[data-abide-error]").css("display", i ? "none" : "block"), this.$element.trigger((i ? "formvalid" : "forminvalid") + ".zf.abide", [this.$element]), i
                            }
                        }, {
                            key: "validateText",
                            value: function(t, e) {
                                e = e || t.attr("pattern") || t.attr("type");
                                var i = t.val(),
                                    n = !1;
                                return i.length ? n = this.options.patterns.hasOwnProperty(e) ? this.options.patterns[e].test(i) : e === t.attr("type") || new RegExp(e).test(i) : t.prop("required") || (n = !0), n
                            }
                        }, {
                            key: "validateRadio",
                            value: function(t) {
                                var e = this.$element.find(':radio[name="' + t + '"]'),
                                    i = !1,
                                    n = !1;
                                return e.each(function(t, e) {
                                    r()(e).attr("required") && (n = !0)
                                }), n || (i = !0), i || e.each(function(t, e) {
                                    r()(e).prop("checked") && (i = !0)
                                }), i
                            }
                        }, {
                            key: "matchValidation",
                            value: function(t, e, i) {
                                var n = this;
                                return i = !!i, -1 === e.split(" ").map(function(e) {
                                    return n.options.validators[e](t, i, t.parent())
                                }).indexOf(!1)
                            }
                        }, {
                            key: "resetForm",
                            value: function() {
                                var t = this.$element,
                                    e = this.options;
                                r()("." + e.labelErrorClass, t).not("small").removeClass(e.labelErrorClass), r()("." + e.inputErrorClass, t).not("small").removeClass(e.inputErrorClass), r()(e.formErrorSelector + "." + e.formErrorClass).removeClass(e.formErrorClass), t.find("[data-abide-error]").css("display", "none"), r()(":input", t).not(":button, :submit, :reset, :hidden, :radio, :checkbox, [data-abide-ignore]").val("").removeAttr("data-invalid"), r()(":input:radio", t).not("[data-abide-ignore]").prop("checked", !1).removeAttr("data-invalid"), r()(":input:checkbox", t).not("[data-abide-ignore]").prop("checked", !1).removeAttr("data-invalid"), t.trigger("formreset.zf.abide", [t])
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                var t = this;
                                this.$element.off(".abide").find("[data-abide-error]").css("display", "none"), this.$inputs.off(".abide").each(function() {
                                    t.removeErrorClasses(r()(this))
                                })
                            }
                        }]), e
                    }(l.a);
                c.defaults = {
                    validateOn: "fieldChange",
                    labelErrorClass: "is-invalid-label",
                    inputErrorClass: "is-invalid-input",
                    formErrorSelector: ".form-error",
                    formErrorClass: "is-visible",
                    liveValidate: !1,
                    validateOnBlur: !1,
                    patterns: {
                        alpha: /^[a-zA-Z]+$/,
                        alpha_numeric: /^[a-zA-Z0-9]+$/,
                        integer: /^[-+]?\d+$/,
                        number: /^[-+]?\d*(?:[\.\,]\d+)?$/,
                        card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|(?:222[1-9]|2[3-6][0-9]{2}|27[0-1][0-9]|2720)[0-9]{12}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
                        cvv: /^([0-9]){3,4}$/,
                        email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
                        url: /^(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
                        domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,
                        datetime: /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
                        date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
                        time: /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
                        dateISO: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
                        month_day_year: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
                        day_month_year: /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,
                        color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,
                        website: {
                            test: function(t) {
                                return c.defaults.patterns.domain.test(t) || c.defaults.patterns.url.test(t)
                            }
                        }
                    },
                    validators: {
                        equalTo: function(t, e, i) {
                            return r()("#" + t.attr("data-equalto")).val() === t.val()
                        }
                    }
                }
            },
                function(t, e, i) {
                "use strict";

                function n(t) {
                    if (void 0 === Function.prototype.name) {
                        var e = /function\s([^(]{1,})\(/,
                            i = e.exec(t.toString());
                        return i && i.length > 1 ? i[1].trim() : ""
                    }
                    return void 0 === t.prototype ? t.constructor.name : t.prototype.constructor.name
                }

                function s(t) {
                    return "true" === t || "false" !== t && (isNaN(1 * t) ? t : parseFloat(t))
                }

                function o(t) {
                    return t.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
                }
                i.d(e, "a", function() {
                    return c
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(1),
                    u = i(4),
                    c = {
                        version: "6.4.3",
                        _plugins: {},
                        _uuids: [],
                        plugin: function(t, e) {
                            var i = e || n(t),
                                s = o(i);
                            this._plugins[s] = this[i] = t
                        },
                        registerPlugin: function(t, e) {
                            var s = e ? o(e) : n(t.constructor).toLowerCase();
                            t.uuid = i.i(l.b)(6, s), t.$element.attr("data-" + s) || t.$element.attr("data-" + s, t.uuid), t.$element.data("zfPlugin") || t.$element.data("zfPlugin", t), t.$element.trigger("init.zf." + s), this._uuids.push(t.uuid)
                        },
                        unregisterPlugin: function(t) {
                            var e = o(n(t.$element.data("zfPlugin").constructor));
                            this._uuids.splice(this._uuids.indexOf(t.uuid), 1), t.$element.removeAttr("data-" + e).removeData("zfPlugin").trigger("destroyed.zf." + e);
                            for (var i in t) t[i] = null
                        },
                        reInit: function(t) {
                            var e = t instanceof r.a;
                            try {
                                if (e) t.each(function() {
                                    r()(this).data("zfPlugin")._init()
                                });
                                else {
                                    var i = typeof t,
                                        n = this;
                                    ({
                                        object: function(t) {
                                            t.forEach(function(t) {
                                                t = o(t), r()("[data-" + t + "]").foundation("_init")
                                            })
                                        },
                                        string: function() {
                                            t = o(t), r()("[data-" + t + "]").foundation("_init")
                                        },
                                        undefined: function() {
                                            this.object(Object.keys(n._plugins))
                                        }
                                    })[i](t)
                                }
                            } catch (t) {
                                console.error(t)
                            } finally {
                                return t
                            }
                        },
                        reflow: function(t, e) {
                            void 0 === e ? e = Object.keys(this._plugins) : "string" == typeof e && (e = [e]);
                            var i = this;
                            r.a.each(e, function(e, n) {
                                var o = i._plugins[n];
                                r()(t).find("[data-" + n + "]").addBack("[data-" + n + "]").each(function() {
                                    var t = r()(this),
                                        e = {};
                                    if (t.data("zfPlugin")) return void console.warn("Tried to initialize " + n + " on an element that already has a Foundation plugin.");
                                    t.attr("data-options") && t.attr("data-options").split(";").forEach(function(t, i) {
                                        var n = t.split(":").map(function(t) {
                                            return t.trim()
                                        });
                                        n[0] && (e[n[0]] = s(n[1]))
                                    });
                                    try {
                                        t.data("zfPlugin", new o(r()(this), e))
                                    } catch (t) {
                                        console.error(t)
                                    } finally {
                                        return
                                    }
                                })
                            })
                        },
                        getFnName: n,
                        addToJquery: function(t) {
                            var e = function(e) {
                                var i = typeof e,
                                    s = t(".no-js");
                                if (s.length && s.removeClass("no-js"), "undefined" === i) u.a._init(), c.reflow(this);
                                else {
                                    if ("string" !== i) throw new TypeError("We're sorry, " + i + " is not a valid parameter. You must use a string representing the method you wish to invoke.");
                                    var o = Array.prototype.slice.call(arguments, 1),
                                        a = this.data("zfPlugin");
                                    if (void 0 === a || void 0 === a[e]) throw new ReferenceError("We're sorry, '" + e + "' is not an available method for " + (a ? n(a) : "this element") + ".");
                                    1 === this.length ? a[e].apply(a, o) : this.each(function(i, n) {
                                        a[e].apply(t(n).data("zfPlugin"), o)
                                    })
                                }
                                return this
                            };
                            return t.fn.foundation = e, t
                        }
                    };
                c.util = {
                    throttle: function(t, e) {
                        var i = null;
                        return function() {
                            var n = this,
                                s = arguments;
                            null === i && (i = setTimeout(function() {
                                t.apply(n, s), i = null
                            }, e))
                        }
                    }
                },
                    window.Foundation = c,
                    function() {
                        Date.now && window.Date.now || (window.Date.now = Date.now = function() {
                            return (new Date).getTime()
                        });
                        for (var t = ["webkit", "moz"], e = 0; e < t.length && !window.requestAnimationFrame; ++e) {
                            var i = t[e];
                            window.requestAnimationFrame = window[i + "RequestAnimationFrame"], window.cancelAnimationFrame = window[i + "CancelAnimationFrame"] || window[i + "CancelRequestAnimationFrame"]
                        }
                        if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
                            var n = 0;
                            window.requestAnimationFrame = function(t) {
                                var e = Date.now(),
                                    i = Math.max(n + 16, e);
                                return setTimeout(function() {
                                    t(n = i)
                                }, i - e)
                            }, window.cancelAnimationFrame = clearTimeout
                        }
                        window.performance && window.performance.now || (window.performance = {
                            start: Date.now(),
                            now: function() {
                                return Date.now() - this.start
                            }
                        })
                    }(),
                Function.prototype.bind || (Function.prototype.bind = function(t) {
                    if ("function" != typeof this) throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
                    var e = Array.prototype.slice.call(arguments, 1),
                        i = this,
                        n = function() {},
                        s = function() {
                            return i.apply(this instanceof n ? this : t, e.concat(Array.prototype.slice.call(arguments)))
                        };
                    return this.prototype && (n.prototype = this.prototype), s.prototype = new n, s
                })
            },
                // Dropdown
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return p
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(3),
                    u = i(1),
                    c = i(15),
                    h = i(5),
                    d = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    f = function t(e, i, n) {
                        null === e && (e = Function.prototype);
                        var s = Object.getOwnPropertyDescriptor(e, i);
                        if (void 0 === s) {
                            var o = Object.getPrototypeOf(e);
                            return null === o ? void 0 : t(o, i, n)
                        }
                        if ("value" in s) return s.value;
                        var a = s.get;
                        if (void 0 !== a) return a.call(n)
                    },
                    p = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), d(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "Dropdown", h.a.init(r.a), this._init(), l.a.register("Dropdown", {
                                    ENTER: "open",
                                    SPACE: "open",
                                    ESCAPE: "close"
                                })
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                var t = this.$element.attr("id");
                                this.$anchors = r()('[data-toggle="' + t + '"]').length ? r()('[data-toggle="' + t + '"]') : r()('[data-open="' + t + '"]'), this.$anchors.attr({
                                    "aria-controls": t,
                                    "data-is-focus": !1,
                                    "data-yeti-box": t,
                                    "aria-haspopup": !0,
                                    "aria-expanded": !1
                                }), this._setCurrentAnchor(this.$anchors.first()), this.options.parentClass ? this.$parent = this.$element.parents("." + this.options.parentClass) : this.$parent = null, this.$element.attr({
                                    "aria-hidden": "true",
                                    "data-yeti-box": t,
                                    "data-resize": t,
                                    "aria-labelledby": this.$currentAnchor.id || i.i(u.b)(6, "dd-anchor")
                                }), f(e.prototype.__proto__ || Object.getPrototypeOf(e.prototype), "_init", this).call(this), this._events()
                            }
                        }, {
                            key: "_getDefaultPosition",
                            value: function() {
                                var t = this.$element[0].className.match(/(top|left|right|bottom)/g);
                                return t ? t[0] : "bottom"
                            }
                        }, {
                            key: "_getDefaultAlignment",
                            value: function() {
                                var t = /float-(\S+)/.exec(this.$currentAnchor.className);
                                return t ? t[1] : f(e.prototype.__proto__ || Object.getPrototypeOf(e.prototype), "_getDefaultAlignment", this).call(this)
                            }
                        }, {
                            key: "_setPosition",
                            value: function() {
                                f(e.prototype.__proto__ || Object.getPrototypeOf(e.prototype), "_setPosition", this).call(this, this.$currentAnchor, this.$element, this.$parent)
                            }
                        }, {
                            key: "_setCurrentAnchor",
                            value: function(t) {
                                this.$currentAnchor = r()(t)
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this;
                                this.$element.on({
                                    "open.zf.trigger": this.open.bind(this),
                                    "close.zf.trigger": this.close.bind(this),
                                    "toggle.zf.trigger": this.toggle.bind(this),
                                    "resizeme.zf.trigger": this._setPosition.bind(this)
                                }), this.$anchors.off("click.zf.trigger").on("click.zf.trigger", function() {
                                    t._setCurrentAnchor(this)
                                }), this.options.hover && (this.$anchors.off("mouseenter.zf.dropdown mouseleave.zf.dropdown").on("mouseenter.zf.dropdown", function() {
                                    t._setCurrentAnchor(this);
                                    var e = r()("body").data();
                                    void 0 !== e.whatinput && "mouse" !== e.whatinput || (clearTimeout(t.timeout), t.timeout = setTimeout(function() {
                                        t.open(), t.$anchors.data("hover", !0)
                                    }, t.options.hoverDelay))
                                }).on("mouseleave.zf.dropdown", function() {
                                    clearTimeout(t.timeout), t.timeout = setTimeout(function() {
                                        t.close(), t.$anchors.data("hover", !1)
                                    }, t.options.hoverDelay)
                                }), this.options.hoverPane && this.$element.off("mouseenter.zf.dropdown mouseleave.zf.dropdown").on("mouseenter.zf.dropdown", function() {
                                    clearTimeout(t.timeout)
                                }).on("mouseleave.zf.dropdown", function() {
                                    clearTimeout(t.timeout), t.timeout = setTimeout(function() {
                                        t.close(), t.$anchors.data("hover", !1)
                                    }, t.options.hoverDelay)
                                })), this.$anchors.add(this.$element).on("keydown.zf.dropdown", function(e) {
                                    var i = r()(this);
                                    l.a.findFocusable(t.$element);
                                    l.a.handleKey(e, "Dropdown", {
                                        open: function() {
                                            i.is(t.$anchors) && (t.open(), t.$element.attr("tabindex", -1).focus(), e.preventDefault())
                                        },
                                        close: function() {
                                            t.close(), t.$anchors.focus()
                                        }
                                    })
                                })
                            }
                        }, {
                            key: "_addBodyHandler",
                            value: function() {
                                var t = r()(document.body).not(this.$element),
                                    e = this;
                                t.off("click.zf.dropdown").on("click.zf.dropdown", function(i) {
                                    e.$anchors.is(i.target) || e.$anchors.find(i.target).length || e.$element.find(i.target).length || (e.close(), t.off("click.zf.dropdown"))
                                })
                            }
                        }, {
                            key: "open",
                            value: function() {
                                if (this.$element.trigger("closeme.zf.dropdown", this.$element.attr("id")), this.$anchors.addClass("hover").attr({
                                    "aria-expanded": !0
                                }), this.$element.addClass("is-opening"), this._setPosition(), this.$element.removeClass("is-opening").addClass("is-open").attr({
                                    "aria-hidden": !1
                                }), this.options.autoFocus) {
                                    var t = l.a.findFocusable(this.$element);
                                    t.length && t.eq(0).focus()
                                }
                                this.options.closeOnClick && this._addBodyHandler(), this.options.trapFocus && l.a.trapFocus(this.$element), this.$element.trigger("show.zf.dropdown", [this.$element])
                            }
                        }, {
                            key: "close",
                            value: function() {
                                if (!this.$element.hasClass("is-open")) return !1;
                                this.$element.removeClass("is-open").attr({
                                    "aria-hidden": !0
                                }), this.$anchors.removeClass("hover").attr("aria-expanded", !1), this.$element.trigger("hide.zf.dropdown", [this.$element]), this.options.trapFocus && l.a.releaseFocus(this.$element)
                            }
                        }, {
                            key: "toggle",
                            value: function() {
                                if (this.$element.hasClass("is-open")) {
                                    if (this.$anchors.data("hover")) return;
                                    this.close()
                                } else this.open()
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.$element.off(".zf.trigger").hide(), this.$anchors.off(".zf.dropdown"), r()(document.body).off("click.zf.dropdown")
                            }
                        }]), e
                    }(c.a);
                p.defaults = {
                    parentClass: null,
                    hoverDelay: 250,
                    hover: !1,
                    hoverPane: !1,
                    vOffset: 0,
                    hOffset: 0,
                    positionClass: "",
                    position: "auto",
                    alignment: "auto",
                    allowOverlap: !1,
                    allowBottomOverlap: !0,
                    trapFocus: !1,
                    autoFocus: !1,
                    closeOnClick: !1
                }
            },
                // Equalizer
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return f
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(4),
                    u = i(8),
                    c = i(1),
                    h = i(2),
                    d = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    f = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), d(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "Equalizer", this._init()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                var t = this.$element.attr("data-equalizer") || "",
                                    e = this.$element.find('[data-equalizer-watch="' + t + '"]');
                                l.a._init(), this.$watched = e.length ? e : this.$element.find("[data-equalizer-watch]"), this.$element.attr("data-resize", t || i.i(c.b)(6, "eq")), this.$element.attr("data-mutate", t || i.i(c.b)(6, "eq")), this.hasNested = this.$element.find("[data-equalizer]").length > 0, this.isNested = this.$element.parentsUntil(document.body, "[data-equalizer]").length > 0, this.isOn = !1, this._bindHandler = {
                                    onResizeMeBound: this._onResizeMe.bind(this),
                                    onPostEqualizedBound: this._onPostEqualized.bind(this)
                                };
                                var n, s = this.$element.find("img");
                                this.options.equalizeOn ? (n = this._checkMQ(), r()(window).on("changed.zf.mediaquery", this._checkMQ.bind(this))) : this._events(), (void 0 !== n && !1 === n || void 0 === n) && (s.length ? i.i(u.a)(s, this._reflow.bind(this)) : this._reflow())
                            }
                        }, {
                            key: "_pauseEvents",
                            value: function() {
                                this.isOn = !1, this.$element.off({
                                    ".zf.equalizer": this._bindHandler.onPostEqualizedBound,
                                    "resizeme.zf.trigger": this._bindHandler.onResizeMeBound,
                                    "mutateme.zf.trigger": this._bindHandler.onResizeMeBound
                                })
                            }
                        }, {
                            key: "_onResizeMe",
                            value: function(t) {
                                this._reflow()
                            }
                        }, {
                            key: "_onPostEqualized",
                            value: function(t) {
                                t.target !== this.$element[0] && this._reflow()
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                this._pauseEvents(), this.hasNested ? this.$element.on("postequalized.zf.equalizer", this._bindHandler.onPostEqualizedBound) : (this.$element.on("resizeme.zf.trigger", this._bindHandler.onResizeMeBound), this.$element.on("mutateme.zf.trigger", this._bindHandler.onResizeMeBound)), this.isOn = !0
                            }
                        }, {
                            key: "_checkMQ",
                            value: function() {
                                var t = !l.a.is(this.options.equalizeOn);
                                return t ? this.isOn && (this._pauseEvents(), this.$watched.css("height", "auto")) : this.isOn || this._events(), t
                            }
                        }, {
                            key: "_killswitch",
                            value: function() {}
                        }, {
                            key: "_reflow",
                            value: function() {
                                if (!this.options.equalizeOnStack && this._isStacked()) return this.$watched.css("height", "auto"), !1;
                                this.options.equalizeByRow ? this.getHeightsByRow(this.applyHeightByRow.bind(this)) : this.getHeights(this.applyHeight.bind(this))
                            }
                        }, {
                            key: "_isStacked",
                            value: function() {
                                return !this.$watched[0] || !this.$watched[1] || this.$watched[0].getBoundingClientRect().top !== this.$watched[1].getBoundingClientRect().top
                            }
                        }, {
                            key: "getHeights",
                            value: function(t) {
                                for (var e = [], i = 0, n = this.$watched.length; i < n; i++) this.$watched[i].style.height = "auto", e.push(this.$watched[i].offsetHeight);
                                t(e)
                            }
                        }, {
                            key: "getHeightsByRow",
                            value: function(t) {
                                var e = this.$watched.length ? this.$watched.first().offset().top : 0,
                                    i = [],
                                    n = 0;
                                i[n] = [];
                                for (var s = 0, o = this.$watched.length; s < o; s++) {
                                    this.$watched[s].style.height = "auto";
                                    var a = r()(this.$watched[s]).offset().top;
                                    a != e && (n++, i[n] = [], e = a), i[n].push([this.$watched[s], this.$watched[s].offsetHeight])
                                }
                                for (var l = 0, u = i.length; l < u; l++) {
                                    var c = r()(i[l]).map(function() {
                                            return this[1]
                                        }).get(),
                                        h = Math.max.apply(null, c);
                                    i[l].push(h)
                                }
                                t(i)
                            }
                        }, {
                            key: "applyHeight",
                            value: function(t) {
                                var e = Math.max.apply(null, t);
                                this.$element.trigger("preequalized.zf.equalizer"), this.$watched.css("height", e), this.$element.trigger("postequalized.zf.equalizer")
                            }
                        }, {
                            key: "applyHeightByRow",
                            value: function(t) {
                                this.$element.trigger("preequalized.zf.equalizer");
                                for (var e = 0, i = t.length; e < i; e++) {
                                    var n = t[e].length,
                                        s = t[e][n - 1];
                                    if (n <= 2) r()(t[e][0][0]).css({
                                        height: "auto"
                                    });
                                    else {
                                        this.$element.trigger("preequalizedrow.zf.equalizer");
                                        for (var o = 0, a = n - 1; o < a; o++) r()(t[e][o][0]).css({
                                            height: s
                                        });
                                        this.$element.trigger("postequalizedrow.zf.equalizer")
                                    }
                                }
                                this.$element.trigger("postequalized.zf.equalizer")
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this._pauseEvents(), this.$watched.css("height", "auto")
                            }
                        }]), e
                    }(h.a);
                f.defaults = {
                    equalizeOnStack: !1,
                    equalizeByRow: !1,
                    equalizeOn: ""
                }
            },
                //Interchange
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return d
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(4),
                    u = i(2),
                    c = i(1),
                    h = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    d = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), h(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, i), this.rules = [], this.currentPath = "", this.className = "Interchange", this._init(), this._events()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                l.a._init();
                                var t = this.$element[0].id || i.i(c.b)(6, "interchange");
                                this.$element.attr({
                                    "data-resize": t,
                                    id: t
                                }), this._addBreakpoints(), this._generateRules(), this._reflow()
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this;
                                this.$element.off("resizeme.zf.trigger").on("resizeme.zf.trigger", function() {
                                    return t._reflow()
                                })
                            }
                        }, {
                            key: "_reflow",
                            value: function() {
                                var t;
                                for (var e in this.rules)
                                    if (this.rules.hasOwnProperty(e)) {
                                        var i = this.rules[e];
                                        window.matchMedia(i.query).matches && (t = i)
                                    }
                                t && this.replace(t.path)
                            }
                        }, {
                            key: "_addBreakpoints",
                            value: function() {
                                for (var t in l.a.queries)
                                    if (l.a.queries.hasOwnProperty(t)) {
                                        var i = l.a.queries[t];
                                        e.SPECIAL_QUERIES[i.name] = i.value
                                    }
                            }
                        }, {
                            key: "_generateRules",
                            value: function(t) {
                                var i, n = [];
                                i = this.options.rules ? this.options.rules : this.$element.data("interchange"), i = "string" == typeof i ? i.match(/\[.*?\]/g) : i;
                                for (var s in i)
                                    if (i.hasOwnProperty(s)) {
                                        var o = i[s].slice(1, -1).split(", "),
                                            a = o.slice(0, -1).join(""),
                                            r = o[o.length - 1];
                                        e.SPECIAL_QUERIES[r] && (r = e.SPECIAL_QUERIES[r]), n.push({
                                            path: a,
                                            query: r
                                        })
                                    }
                                this.rules = n
                            }
                        }, {
                            key: "replace",
                            value: function(t) {
                                if (this.currentPath !== t) {
                                    var e = this,
                                        i = "replaced.zf.interchange";
                                    "IMG" === this.$element[0].nodeName ? this.$element.attr("src", t).on("load", function() {
                                        e.currentPath = t
                                    }).trigger(i) : t.match(/\.(gif|jpg|jpeg|png|svg|tiff)([?#].*)?/i) ? (t = t.replace(/\(/g, "%28").replace(/\)/g, "%29"), this.$element.css({
                                        "background-image": "url(" + t + ")"
                                    }).trigger(i)) : r.a.get(t, function(n) {
                                        e.$element.html(n).trigger(i), r()(n).foundation(), e.currentPath = t
                                    })
                                }
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.$element.off("resizeme.zf.trigger")
                            }
                        }]), e
                    }(u.a);
                d.defaults = {
                    rules: null
                }, d.SPECIAL_QUERIES = {
                    landscape: "screen and (orientation: landscape)",
                    portrait: "screen and (orientation: portrait)",
                    retina: "only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)"
                }
            },
                // magellan
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return d
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(1),
                    u = i(2),
                    c = i(16),
                    h = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    d = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), h(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "Magellan", this._init(), this.calcPoints()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                var t = this.$element[0].id || i.i(l.b)(6, "magellan");
                                this.$targets = r()("[data-magellan-target]"), this.$links = this.$element.find("a"), this.$element.attr({
                                    "data-resize": t,
                                    "data-scroll": t,
                                    id: t
                                }), this.$active = r()(), this.scrollPos = parseInt(window.pageYOffset, 10), this._events()
                            }
                        }, {
                            key: "calcPoints",
                            value: function() {
                                var t = this,
                                    e = document.body,
                                    i = document.documentElement;
                                this.points = [], this.winHeight = Math.round(Math.max(window.innerHeight, i.clientHeight)), this.docHeight = Math.round(Math.max(e.scrollHeight, e.offsetHeight, i.clientHeight, i.scrollHeight, i.offsetHeight)), this.$targets.each(function() {
                                    var e = r()(this),
                                        i = Math.round(e.offset().top - t.options.threshold);
                                    e.targetPoint = i, t.points.push(i)
                                })
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this;
                                r()("html, body"), t.options.animationDuration, t.options.animationEasing;
                                r()(window).one("load", function() {
                                    t.options.deepLinking && location.hash && t.scrollToLoc(location.hash), t.calcPoints(), t._updateActive()
                                }), this.$element.on({
                                    "resizeme.zf.trigger": this.reflow.bind(this),
                                    "scrollme.zf.trigger": this._updateActive.bind(this)
                                }).on("click.zf.magellan", 'a[href^="#"]', function(e) {
                                    e.preventDefault();
                                    var i = this.getAttribute("href");
                                    t.scrollToLoc(i)
                                }), this._deepLinkScroll = function(e) {
                                    t.options.deepLinking && t.scrollToLoc(window.location.hash)
                                }, r()(window).on("popstate", this._deepLinkScroll)
                            }
                        }, {
                            key: "scrollToLoc",
                            value: function(t) {
                                this._inTransition = !0;
                                var e = this,
                                    i = {
                                        animationEasing: this.options.animationEasing,
                                        animationDuration: this.options.animationDuration,
                                        threshold: this.options.threshold,
                                        offset: this.options.offset
                                    };
                                c.a.scrollToLoc(t, i, function() {
                                    e._inTransition = !1, e._updateActive()
                                })
                            }
                        }, {
                            key: "reflow",
                            value: function() {
                                this.calcPoints(), this._updateActive()
                            }
                        }, {
                            key: "_updateActive",
                            value: function() {
                                if (!this._inTransition) {
                                    var t, e = parseInt(window.pageYOffset, 10);
                                    if (e + this.winHeight === this.docHeight) t = this.points.length - 1;
                                    else if (e < this.points[0]) t = void 0;
                                    else {
                                        var i = this.scrollPos < e,
                                            n = this,
                                            s = this.points.filter(function(t, s) {
                                                return i ? t - n.options.offset <= e : t - n.options.offset - n.options.threshold <= e
                                            });
                                        t = s.length ? s.length - 1 : 0
                                    }
                                    if (this.$active.removeClass(this.options.activeClass), this.$active = this.$links.filter('[href="#' + this.$targets.eq(t).data("magellan-target") + '"]').addClass(this.options.activeClass), this.options.deepLinking) {
                                        var o = "";
                                        void 0 != t && (o = this.$active[0].getAttribute("href")), o !== window.location.hash && (window.history.pushState ? window.history.pushState(null, null, o) : window.location.hash = o)
                                    }
                                    this.scrollPos = e, this.$element.trigger("update.zf.magellan", [this.$active])
                                }
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                if (this.$element.off(".zf.trigger .zf.magellan").find("." + this.options.activeClass).removeClass(this.options.activeClass), this.options.deepLinking) {
                                    var t = this.$active[0].getAttribute("href");
                                    window.location.hash.replace(t, "")
                                }
                                r()(window).off("popstate", this._deepLinkScroll)
                            }
                        }]), e
                    }(u.a);
                d.defaults = {
                    animationDuration: 500,
                    animationEasing: "linear",
                    threshold: 50,
                    activeClass: "is-active",
                    deepLinking: !1,
                    offset: 0
                }
            },
                // offcanvas
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return p
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(3),
                    u = i(4),
                    c = i(1),
                    h = i(2),
                    d = i(5),
                    f = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    p = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), f(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                var n = this;
                                this.className = "OffCanvas", this.$element = t, this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.contentClasses = {
                                    base: [],
                                    reveal: []
                                }, this.$lastTrigger = r()(), this.$triggers = r()(), this.position = "left", this.$content = r()(), this.nested = !!this.options.nested, r()(["push", "overlap"]).each(function(t, e) {
                                    n.contentClasses.base.push("has-transition-" + e)
                                }), r()(["left", "right", "top", "bottom"]).each(function(t, e) {
                                    n.contentClasses.base.push("has-position-" + e), n.contentClasses.reveal.push("has-reveal-" + e)
                                }), d.a.init(r.a), u.a._init(), this._init(), this._events(), l.a.register("OffCanvas", {
                                    ESCAPE: "close"
                                })
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                var t = this.$element.attr("id");
                                if (this.$element.attr("aria-hidden", "true"), this.options.contentId ? this.$content = r()("#" + this.options.contentId) : this.$element.siblings("[data-off-canvas-content]").length ? this.$content = this.$element.siblings("[data-off-canvas-content]").first() : this.$content = this.$element.closest("[data-off-canvas-content]").first(), this.options.contentId ? this.options.contentId && null === this.options.nested && console.warn("Remember to use the nested option if using the content ID option!") : this.nested = 0 === this.$element.siblings("[data-off-canvas-content]").length, !0 === this.nested && (this.options.transition = "overlap", this.$element.removeClass("is-transition-push")), this.$element.addClass("is-transition-" + this.options.transition + " is-closed"), this.$triggers = r()(document).find('[data-open="' + t + '"], [data-close="' + t + '"], [data-toggle="' + t + '"]').attr("aria-expanded", "false").attr("aria-controls", t), this.position = this.$element.is(".position-left, .position-top, .position-right, .position-bottom") ? this.$element.attr("class").match(/position\-(left|top|right|bottom)/)[1] : this.position, !0 === this.options.contentOverlay) {
                                    var e = document.createElement("div"),
                                        i = "fixed" === r()(this.$element).css("position") ? "is-overlay-fixed" : "is-overlay-absolute";
                                    e.setAttribute("class", "js-off-canvas-overlay " + i), this.$overlay = r()(e), "is-overlay-fixed" === i ? r()(this.$overlay).insertAfter(this.$element) : this.$content.append(this.$overlay)
                                }
                                this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, "g").test(this.$element[0].className), !0 === this.options.isRevealed && (this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split("-")[2], this._setMQChecker()), this.options.transitionTime && this.$element.css("transition-duration", this.options.transitionTime), this._removeContentClasses()
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                if (this.$element.off(".zf.trigger .zf.offcanvas").on({
                                    "open.zf.trigger": this.open.bind(this),
                                    "close.zf.trigger": this.close.bind(this),
                                    "toggle.zf.trigger": this.toggle.bind(this),
                                    "keydown.zf.offcanvas": this._handleKeyboard.bind(this)
                                }), !0 === this.options.closeOnClick) {
                                    (this.options.contentOverlay ? this.$overlay : this.$content).on({
                                        "click.zf.offcanvas": this.close.bind(this)
                                    })
                                }
                            }
                        }, {
                            key: "_setMQChecker",
                            value: function() {
                                var t = this;
                                r()(window).on("changed.zf.mediaquery", function() {
                                    u.a.atLeast(t.options.revealOn) ? t.reveal(!0) : t.reveal(!1)
                                }).one("load.zf.offcanvas", function() {
                                    u.a.atLeast(t.options.revealOn) && t.reveal(!0)
                                })
                            }
                        }, {
                            key: "_removeContentClasses",
                            value: function(t) {
                                "boolean" != typeof t ? this.$content.removeClass(this.contentClasses.base.join(" ")) : !1 === t && this.$content.removeClass("has-reveal-" + this.position)
                            }
                        }, {
                            key: "_addContentClasses",
                            value: function(t) {
                                this._removeContentClasses(t), "boolean" != typeof t ? this.$content.addClass("has-transition-" + this.options.transition + " has-position-" + this.position) : !0 === t && this.$content.addClass("has-reveal-" + this.position)
                            }
                        }, {
                            key: "reveal",
                            value: function(t) {
                                t ? (this.close(), this.isRevealed = !0, this.$element.attr("aria-hidden", "false"), this.$element.off("open.zf.trigger toggle.zf.trigger"), this.$element.removeClass("is-closed")) : (this.isRevealed = !1, this.$element.attr("aria-hidden", "true"), this.$element.off("open.zf.trigger toggle.zf.trigger").on({
                                    "open.zf.trigger": this.open.bind(this),
                                    "toggle.zf.trigger": this.toggle.bind(this)
                                }), this.$element.addClass("is-closed")), this._addContentClasses(t)
                            }
                        }, {
                            key: "_stopScrolling",
                            value: function(t) {
                                return !1
                            }
                        }, {
                            key: "_recordScrollable",
                            value: function(t) {
                                var e = this;
                                e.scrollHeight !== e.clientHeight && (0 === e.scrollTop && (e.scrollTop = 1), e.scrollTop === e.scrollHeight - e.clientHeight && (e.scrollTop = e.scrollHeight - e.clientHeight - 1)), e.allowUp = e.scrollTop > 0, e.allowDown = e.scrollTop < e.scrollHeight - e.clientHeight, e.lastY = t.originalEvent.pageY
                            }
                        }, {
                            key: "_stopScrollPropagation",
                            value: function(t) {
                                var e = this,
                                    i = t.pageY < e.lastY,
                                    n = !i;
                                e.lastY = t.pageY, i && e.allowUp || n && e.allowDown ? t.stopPropagation() : t.preventDefault()
                            }
                        }, {
                            key: "open",
                            value: function(t, e) {
                                if (!this.$element.hasClass("is-open") && !this.isRevealed) {
                                    var n = this;
                                    e && (this.$lastTrigger = e), "top" === this.options.forceTo ? window.scrollTo(0, 0) : "bottom" === this.options.forceTo && window.scrollTo(0, document.body.scrollHeight), this.options.transitionTime && "overlap" !== this.options.transition ? this.$element.siblings("[data-off-canvas-content]").css("transition-duration", this.options.transitionTime) : this.$element.siblings("[data-off-canvas-content]").css("transition-duration", ""), this.$element.addClass("is-open").removeClass("is-closed"), this.$triggers.attr("aria-expanded", "true"), this.$element.attr("aria-hidden", "false").trigger("opened.zf.offcanvas"), this.$content.addClass("is-open-" + this.position), !1 === this.options.contentScroll && (r()("body").addClass("is-off-canvas-open").on("touchmove", this._stopScrolling), this.$element.on("touchstart", this._recordScrollable), this.$element.on("touchmove", this._stopScrollPropagation)), !0 === this.options.contentOverlay && this.$overlay.addClass("is-visible"), !0 === this.options.closeOnClick && !0 === this.options.contentOverlay && this.$overlay.addClass("is-closable"), !0 === this.options.autoFocus && this.$element.one(i.i(c.c)(this.$element), function() {
                                        if (n.$element.hasClass("is-open")) {
                                            var t = n.$element.find("[data-autofocus]");
                                            t.length ? t.eq(0).focus() : n.$element.find("a, button").eq(0).focus()
                                        }
                                    }), !0 === this.options.trapFocus && (this.$content.attr("tabindex", "-1"), l.a.trapFocus(this.$element)), this._addContentClasses()
                                }
                            }
                        }, {
                            key: "close",
                            value: function(t) {
                                if (this.$element.hasClass("is-open") && !this.isRevealed) {
                                    var e = this;
                                    this.$element.removeClass("is-open"), this.$element.attr("aria-hidden", "true").trigger("closed.zf.offcanvas"), this.$content.removeClass("is-open-left is-open-top is-open-right is-open-bottom"), !1 === this.options.contentScroll && (r()("body").removeClass("is-off-canvas-open").off("touchmove", this._stopScrolling), this.$element.off("touchstart", this._recordScrollable), this.$element.off("touchmove", this._stopScrollPropagation)), !0 === this.options.contentOverlay && this.$overlay.removeClass("is-visible"), !0 === this.options.closeOnClick && !0 === this.options.contentOverlay && this.$overlay.removeClass("is-closable"), this.$triggers.attr("aria-expanded", "false"), !0 === this.options.trapFocus && (this.$content.removeAttr("tabindex"), l.a.releaseFocus(this.$element)), this.$element.one(i.i(c.c)(this.$element), function(t) {
                                        e.$element.addClass("is-closed"), e._removeContentClasses()
                                    })
                                }
                            }
                        }, {
                            key: "toggle",
                            value: function(t, e) {
                                this.$element.hasClass("is-open") ? this.close(t, e) : this.open(t, e)
                            }
                        }, {
                            key: "_handleKeyboard",
                            value: function(t) {
                                var e = this;
                                l.a.handleKey(t, "OffCanvas", {
                                    close: function() {
                                        return e.close(), e.$lastTrigger.focus(), !0
                                    },
                                    handled: function() {
                                        t.stopPropagation(), t.preventDefault()
                                    }
                                })
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.close(), this.$element.off(".zf.trigger .zf.offcanvas"), this.$overlay.off(".zf.offcanvas")
                            }
                        }]), e
                    }(h.a);
                p.defaults = {
                    closeOnClick: !0,
                    contentOverlay: !0,
                    contentId: null,
                    nested: null,
                    contentScroll: !0,
                    transitionTime: null,
                    transition: "push",
                    forceTo: null,
                    isRevealed: !1,
                    revealOn: null,
                    autoFocus: !0,
                    revealClass: "reveal-for-",
                    trapFocus: !1
                }
            },
                // orbit
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return g
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(3),
                    u = i(6),
                    c = i(18),
                    h = i(8),
                    d = i(1),
                    f = i(2),
                    p = i(10),
                    m = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    g = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), m(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t,
                                    this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "Orbit", p.a.init(r.a), this._init(), l.a.register("Orbit", {
                                    ltr: {
                                        ARROW_RIGHT: "next",
                                        ARROW_LEFT: "previous"
                                    },
                                    rtl: {
                                        ARROW_LEFT: "next",
                                        ARROW_RIGHT: "previous"
                                    }
                                })
                            }
                        },
                            {
                            key: "_init",
                            value: function() {
                                this._reset(), this.$wrapper = this.$element.find("." + this.options.containerClass), this.$slides = this.$element.find("." + this.options.slideClass);
                                var t = this.$element.find("img"),
                                    e = this.$slides.filter(".is-active"),
                                    n = this.$element[0].id || i.i(d.b)(6, "orbit");
                                this.$element.attr({
                                    "data-resize": n,
                                    id: n
                                }), e.length || this.$slides.eq(0).addClass("is-active"), this.options.useMUI || this.$slides.addClass("no-motionui"), t.length ? i.i(h.a)(t, this._prepareForOrbit.bind(this)) : this._prepareForOrbit(), this.options.bullets && this._loadBullets(), this._events(), this.options.autoPlay && this.$slides.length > 1 && this.geoSync(), this.options.accessible && this.$wrapper.attr("tabindex", 0)
                            }
                        },
                            {
                            key: "_loadBullets",
                            value: function() {
                                this.$bullets = this.$element.find("." + this.options.boxOfBullets).find("button")
                            }
                        },
                            {
                            key: "geoSync",
                            value: function() {
                                var t = this;
                                this.timer = new c.a(this.$element, {
                                    duration: this.options.timerDelay,
                                    infinite: !1
                                }, function() {
                                    t.changeSlide(!0)
                                }), this.timer.start()
                            }
                        },
                            {
                            key: "_prepareForOrbit",
                            value: function() {
                                this._setWrapperHeight()
                            }
                        },
                            {
                            key: "_setWrapperHeight",
                            value: function(t) {
                                var e, i = 0,
                                    n = 0,
                                    s = this;
                                this.$slides.each(function() {
                                    e = this.getBoundingClientRect().height, r()(this).attr("data-slide", n), /mui/g.test(r()(this)[0].className) || s.$slides.filter(".is-active")[0] === s.$slides.eq(n)[0] || r()(this).css({
                                        position: "relative",
                                        display: "none"
                                    }), i = e > i ? e : i, n++
                                }), n === this.$slides.length && (this.$wrapper.css({
                                    height: i
                                }), t && t(i))
                            }
                        },
                            {
                            key: "_setSlideHeight",
                            value: function(t) {
                                this.$slides.each(function() {
                                    r()(this).css("max-height", t)
                                })
                            }
                        },
                            {
                            key: "_events",
                            value: function() {
                                var t = this;
                                if (this.$element.off(".resizeme.zf.trigger").on({
                                    "resizeme.zf.trigger": this._prepareForOrbit.bind(this)
                                }), this.$slides.length > 1) {
                                    if (this.options.swipe && this.$slides.off("swipeleft.zf.orbit swiperight.zf.orbit").on("swipeleft.zf.orbit", function(e) {
                                        e.preventDefault(), t.changeSlide(!0)
                                    }).on("swiperight.zf.orbit", function(e) {
                                        e.preventDefault(), t.changeSlide(!1)
                                    }), this.options.autoPlay && (this.$slides.on("click.zf.orbit", function() {
                                        t.$element.data("clickedOn", !t.$element.data("clickedOn")), t.timer[t.$element.data("clickedOn") ? "pause" : "start"]()
                                    }), this.options.pauseOnHover && this.$element.on("mouseenter.zf.orbit", function() {
                                        t.timer.pause()
                                    }).on("mouseleave.zf.orbit", function() {
                                        t.$element.data("clickedOn") || t.timer.start()
                                    })), this.options.navButtons) {
                                        this.$element.find("." + this.options.nextClass + ", ." + this.options.prevClass).attr("tabindex", 0).on("click.zf.orbit touchend.zf.orbit", function(e) {
                                            e.preventDefault(), t.changeSlide(r()(this).hasClass(t.options.nextClass))
                                        })
                                    }
                                    this.options.bullets && this.$bullets.on("click.zf.orbit touchend.zf.orbit", function() {
                                        if (/is-active/g.test(this.className)) return !1;
                                        var e = r()(this).data("slide"),
                                            i = e > t.$slides.filter(".is-active").data("slide"),
                                            n = t.$slides.eq(e);
                                        t.changeSlide(i, n, e)
                                    }), this.options.accessible && this.$wrapper.add(this.$bullets).on("keydown.zf.orbit", function(e) {
                                        l.a.handleKey(e, "Orbit", {
                                            next: function() {
                                                t.changeSlide(!0)
                                            },
                                            previous: function() {
                                                t.changeSlide(!1)
                                            },
                                            handled: function() {
                                                r()(e.target).is(t.$bullets) && t.$bullets.filter(".is-active").focus()
                                            }
                                        })
                                    })
                                }
                            }
                        },
                            {
                            key: "_reset",
                            value: function() {
                                void 0 !== this.$slides && this.$slides.length > 1 && (this.$element.off(".zf.orbit").find("*").off(".zf.orbit"), this.options.autoPlay && this.timer.restart(), this.$slides.each(function(t) {
                                    r()(t).removeClass("is-active is-active is-in").removeAttr("aria-live").hide()
                                }), this.$slides.first().addClass("is-active").show(), this.$element.trigger("slidechange.zf.orbit", [this.$slides.first()]), this.options.bullets && this._updateBullets(0))
                            }
                        },
                            {
                            key: "changeSlide",
                            value: function(t, e, i) {
                                if (this.$slides) {
                                    var n = this.$slides.filter(".is-active").eq(0);
                                    if (/mui/g.test(n[0].className)) return !1;
                                    var s, o = this.$slides.first(),
                                        a = this.$slides.last(),
                                        r = t ? "Right" : "Left",
                                        l = t ? "Left" : "Right",
                                        c = this;
                                    s = e || (t ? this.options.infiniteWrap ? n.next("." + this.options.slideClass).length ? n.next("." + this.options.slideClass) : o : n.next("." + this.options.slideClass) : this.options.infiniteWrap ? n.prev("." + this.options.slideClass).length ? n.prev("." + this.options.slideClass) : a : n.prev("." + this.options.slideClass)), s.length && (this.$element.trigger("beforeslidechange.zf.orbit", [n, s]), this.options.bullets && (i = i || this.$slides.index(s), this._updateBullets(i)), this.options.useMUI && !this.$element.is(":hidden") ? (u.a.animateIn(s.addClass("is-active").css({
                                        position: "absolute",
                                        top: 0
                                    }), this.options["animInFrom" + r], function() {
                                        s.css({
                                            position: "relative",
                                            display: "block"
                                        }).attr("aria-live", "polite")
                                    }), u.a.animateOut(n.removeClass("is-active"), this.options["animOutTo" + l], function() {
                                        n.removeAttr("aria-live"), c.options.autoPlay && !c.timer.isPaused && c.timer.restart()
                                    })) : (n.removeClass("is-active is-in").removeAttr("aria-live").hide(), s.addClass("is-active is-in").attr("aria-live", "polite").show(), this.options.autoPlay && !this.timer.isPaused && this.timer.restart()), this.$element.trigger("slidechange.zf.orbit", [s]))
                                }
                            }
                        },
                            {
                            key: "_updateBullets",
                            value: function(t) {
                                var e = this.$element.find("." + this.options.boxOfBullets).find(".is-active").removeClass("is-active").blur(),
                                    i = e.find("span:last").detach();
                                this.$bullets.eq(t).addClass("is-active").append(i)
                            }
                        },
                            {
                            key: "_destroy",
                            value: function() {
                                this.$element.off(".zf.orbit").find("*").off(".zf.orbit").end().hide()
                            }
                        }
                        ]), e
                    }(f.a);
                g.defaults = {
                    bullets: !0,
                    navButtons: !0,
                    animInFromRight: "slide-in-right",
                    animOutToRight: "slide-out-right",
                    animInFromLeft: "slide-in-left",
                    animOutToLeft: "slide-out-left",
                    autoPlay: !0,
                    timerDelay: 5e3,
                    infiniteWrap: !0,
                    swipe: !0,
                    pauseOnHover: !0,
                    accessible: !0,
                    containerClass: "orbit-container",
                    slideClass: "orbit-slide",
                    boxOfBullets: "orbit-bullets",
                    nextClass: "orbit-next",
                    prevClass: "orbit-previous",
                    useMUI: !0
                }
            },
                // ResponsiveAccordionTabs
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return m
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(4),
                    u = i(1),
                    c = i(2),
                    h = i(11),
                    d = i(17),
                    f = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    p = {
                        tabs: {
                            cssClass: "tabs",
                            plugin: d.a
                        },
                        accordion: {
                            cssClass: "accordion",
                            plugin: h.a
                        }
                    },
                    m = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), f(e, [{
                            key: "_setup",
                            value: function(t, e) {
                                this.$element = r()(t), this.options = r.a.extend({}, this.$element.data(), e), this.rules = this.$element.data("responsive-accordion-tabs"), this.currentMq = null, this.currentPlugin = null, this.className = "ResponsiveAccordionTabs", this.$element.attr("id") || this.$element.attr("id", i.i(u.b)(6, "responsiveaccordiontabs")), this._init(), this._events()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                if (l.a._init(), "string" == typeof this.rules) {
                                    for (var t = {}, e = this.rules.split(" "), i = 0; i < e.length; i++) {
                                        var n = e[i].split("-"),
                                            s = n.length > 1 ? n[0] : "small",
                                            o = n.length > 1 ? n[1] : n[0];
                                        null !== p[o] && (t[s] = p[o])
                                    }
                                    this.rules = t
                                }
                                this._getAllOptions(), r.a.isEmptyObject(this.rules) || this._checkMediaQueries()
                            }
                        }, {
                            key: "_getAllOptions",
                            value: function() {
                                var t = this;
                                t.allOptions = {};
                                for (var e in p)
                                    if (p.hasOwnProperty(e)) {
                                        var i = p[e];
                                        try {
                                            var n = r()("<ul></ul>"),
                                                s = new i.plugin(n, t.options);
                                            for (var o in s.options)
                                                if (s.options.hasOwnProperty(o) && "zfPlugin" !== o) {
                                                    var a = s.options[o];
                                                    t.allOptions[o] = a
                                                }
                                            s.destroy()
                                        } catch (t) {}
                                    }
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this;
                                r()(window).on("changed.zf.mediaquery", function() {
                                    t._checkMediaQueries()
                                })
                            }
                        }, {
                            key: "_checkMediaQueries",
                            value: function() {
                                var t, e = this;
                                r.a.each(this.rules, function(e) {
                                    l.a.atLeast(e) && (t = e)
                                }), t && (this.currentPlugin instanceof this.rules[t].plugin || (r.a.each(p, function(t, i) {
                                    e.$element.removeClass(i.cssClass)
                                }), this.$element.addClass(this.rules[t].cssClass), this.currentPlugin && (!this.currentPlugin.$element.data("zfPlugin") && this.storezfData && this.currentPlugin.$element.data("zfPlugin", this.storezfData), this.currentPlugin.destroy()), this._handleMarkup(this.rules[t].cssClass), this.currentPlugin = new this.rules[t].plugin(this.$element, {}), this.storezfData = this.currentPlugin.$element.data("zfPlugin")))
                            }
                        }, {
                            key: "_handleMarkup",
                            value: function(t) {
                                var e = this,
                                    n = "accordion",
                                    s = r()("[data-tabs-content=" + this.$element.attr("id") + "]");
                                if (s.length && (n = "tabs"), n !== t) {
                                    var o = e.allOptions.linkClass ? e.allOptions.linkClass : "tabs-title",
                                        a = e.allOptions.panelClass ? e.allOptions.panelClass : "tabs-panel";
                                    this.$element.removeAttr("role");
                                    var l = this.$element.children("." + o + ",[data-accordion-item]").removeClass(o).removeClass("accordion-item").removeAttr("data-accordion-item"),
                                        c = l.children("a").removeClass("accordion-title");
                                    if ("tabs" === n ? (s = s.children("." + a).removeClass(a).removeAttr("role").removeAttr("aria-hidden").removeAttr("aria-labelledby"), s.children("a").removeAttr("role").removeAttr("aria-controls").removeAttr("aria-selected")) : s = l.children("[data-tab-content]").removeClass("accordion-content"), s.css({
                                        display: "",
                                        visibility: ""
                                    }), l.css({
                                        display: "",
                                        visibility: ""
                                    }), "accordion" === t) s.each(function(t, i) {
                                        r()(i).appendTo(l.get(t)).addClass("accordion-content").attr("data-tab-content", "").removeClass("is-active").css({
                                            height: ""
                                        }), r()("[data-tabs-content=" + e.$element.attr("id") + "]").after('<div id="tabs-placeholder-' + e.$element.attr("id") + '"></div>').detach(), l.addClass("accordion-item").attr("data-accordion-item", ""), c.addClass("accordion-title")
                                    });
                                    else if ("tabs" === t) {
                                        var h = r()("[data-tabs-content=" + e.$element.attr("id") + "]"),
                                            d = r()("#tabs-placeholder-" + e.$element.attr("id"));
                                        d.length ? (h = r()('<div class="tabs-content"></div>').insertAfter(d).attr("data-tabs-content", e.$element.attr("id")), d.remove()) : h = r()('<div class="tabs-content"></div>').insertAfter(e.$element).attr("data-tabs-content", e.$element.attr("id")), s.each(function(t, e) {
                                            var n = r()(e).appendTo(h).addClass(a),
                                                s = c.get(t).hash.slice(1),
                                                o = r()(e).attr("id") || i.i(u.b)(6, "accordion");
                                            s !== o && ("" !== s ? r()(e).attr("id", s) : (s = o, r()(e).attr("id", s), r()(c.get(t)).attr("href", r()(c.get(t)).attr("href").replace("#", "") + "#" + s))), r()(l.get(t)).hasClass("is-active") && n.addClass("is-active")
                                        }), l.addClass(o)
                                    }
                                }
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.currentPlugin && this.currentPlugin.destroy(), r()(window).off(".zf.ResponsiveAccordionTabs")
                            }
                        }]), e
                    }(c.a);
                m.defaults = {}
            },
                // ResponsiveMenu
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return g
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(4),
                    u = i(1),
                    c = i(2),
                    h = i(14),
                    d = i(13),
                    f = i(12),
                    p = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    m = {
                        dropdown: {
                            cssClass: "dropdown",
                            plugin: h.a
                        },
                        drilldown: {
                            cssClass: "drilldown",
                            plugin: d.a
                        },
                        accordion: {
                            cssClass: "accordion-menu",
                            plugin: f.a
                        }
                    },
                    g = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), p(e, [{
                            key: "_setup",
                            value: function(t, e) {
                                this.$element = r()(t), this.rules = this.$element.data("responsive-menu"), this.currentMq = null, this.currentPlugin = null, this.className = "ResponsiveMenu", this._init(), this._events()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                if (l.a._init(), "string" == typeof this.rules) {
                                    for (var t = {}, e = this.rules.split(" "), n = 0; n < e.length; n++) {
                                        var s = e[n].split("-"),
                                            o = s.length > 1 ? s[0] : "small",
                                            a = s.length > 1 ? s[1] : s[0];
                                        null !== m[a] && (t[o] = m[a])
                                    }
                                    this.rules = t
                                }
                                r.a.isEmptyObject(this.rules) || this._checkMediaQueries(), this.$element.attr("data-mutate", this.$element.attr("data-mutate") || i.i(u.b)(6, "responsive-menu"))
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this;
                                r()(window).on("changed.zf.mediaquery", function() {
                                    t._checkMediaQueries()
                                })
                            }
                        }, {
                            key: "_checkMediaQueries",
                            value: function() {
                                var t, e = this;
                                r.a.each(this.rules, function(e) {
                                    l.a.atLeast(e) && (t = e)
                                }), t && (this.currentPlugin instanceof this.rules[t].plugin || (r.a.each(m, function(t, i) {
                                    e.$element.removeClass(i.cssClass)
                                }), this.$element.addClass(this.rules[t].cssClass), this.currentPlugin && this.currentPlugin.destroy(), this.currentPlugin = new this.rules[t].plugin(this.$element, {})))
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.currentPlugin.destroy(), r()(window).off(".zf.ResponsiveMenu")
                            }
                        }]), e
                    }(c.a);
                g.defaults = {}
            },
                // ResponsiveToggle
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return d
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(4),
                    u = i(6),
                    c = i(2),
                    h = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    d = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), h(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = r()(t), this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "ResponsiveToggle", this._init(), this._events()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                l.a._init();
                                var t = this.$element.data("responsive-toggle");
                                if (t || console.error("Your tab bar needs an ID of a Menu as the value of data-tab-bar."), this.$targetMenu = r()("#" + t), this.$toggler = this.$element.find("[data-toggle]").filter(function() {
                                    var e = r()(this).data("toggle");
                                    return e === t || "" === e
                                }), this.options = r.a.extend({}, this.options, this.$targetMenu.data()), this.options.animate) {
                                    var e = this.options.animate.split(" ");
                                    this.animationIn = e[0], this.animationOut = e[1] || null
                                }
                                this._update()
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                this._updateMqHandler = this._update.bind(this), r()(window).on("changed.zf.mediaquery", this._updateMqHandler), this.$toggler.on("click.zf.responsiveToggle", this.toggleMenu.bind(this))
                            }
                        }, {
                            key: "_update",
                            value: function() {
                                l.a.atLeast(this.options.hideFor) ? (this.$element.hide(), this.$targetMenu.show()) : (this.$element.show(), this.$targetMenu.hide())
                            }
                        }, {
                            key: "toggleMenu",
                            value: function() {
                                var t = this;
                                l.a.atLeast(this.options.hideFor) || (this.options.animate ? this.$targetMenu.is(":hidden") ? u.a.animateIn(this.$targetMenu, this.animationIn, function() {
                                    t.$element.trigger("toggled.zf.responsiveToggle"), t.$targetMenu.find("[data-mutate]").triggerHandler("mutateme.zf.trigger")
                                }) : u.a.animateOut(this.$targetMenu, this.animationOut, function() {
                                    t.$element.trigger("toggled.zf.responsiveToggle")
                                }) : (this.$targetMenu.toggle(0), this.$targetMenu.find("[data-mutate]").trigger("mutateme.zf.trigger"), this.$element.trigger("toggled.zf.responsiveToggle")))
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.$element.off(".zf.responsiveToggle"), this.$toggler.off(".zf.responsiveToggle"), r()(window).off("changed.zf.mediaquery", this._updateMqHandler)
                            }
                        }]), e
                    }(c.a);
                d.defaults = {
                    hideFor: "medium",
                    animate: !1
                }
            },
                // Reveal
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }

                function a() {
                    return /iP(ad|hone|od).*OS/.test(window.navigator.userAgent)
                }

                function r() {
                    return /Android/.test(window.navigator.userAgent)
                }

                function l() {
                    return a() || r()
                }
                i.d(e, "a", function() {
                    return v
                });
                var u = i(0),
                    c = i.n(u),
                    h = i(3),
                    d = i(4),
                    f = i(6),
                    p = i(2),
                    m = i(5),
                    g = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    v = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), g(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = c.a.extend({}, e.defaults, this.$element.data(), i), this.className = "Reveal", this._init(), m.a.init(c.a), h.a.register("Reveal", {
                                    ESCAPE: "close"
                                })
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                d.a._init(), this.id = this.$element.attr("id"), this.isActive = !1, this.cached = {
                                    mq: d.a.current
                                }, this.isMobile = l(), this.$anchor = c()('[data-open="' + this.id + '"]').length ? c()('[data-open="' + this.id + '"]') : c()('[data-toggle="' + this.id + '"]'), this.$anchor.attr({
                                    "aria-controls": this.id,
                                    "aria-haspopup": !0,
                                    tabindex: 0
                                }), (this.options.fullScreen || this.$element.hasClass("full")) && (this.options.fullScreen = !0, this.options.overlay = !1), this.options.overlay && !this.$overlay && (this.$overlay = this._makeOverlay(this.id)), this.$element.attr({
                                    role: "dialog",
                                    "aria-hidden": !0,
                                    "data-yeti-box": this.id,
                                    "data-resize": this.id
                                }), this.$overlay ? this.$element.detach().appendTo(this.$overlay) : (this.$element.detach().appendTo(c()(this.options.appendTo)), this.$element.addClass("without-overlay")), this._events(), this.options.deepLink && window.location.hash === "#" + this.id && c()(window).one("load.zf.reveal", this.open.bind(this))
                            }
                        }, {
                            key: "_makeOverlay",
                            value: function() {
                                var t = "";
                                return this.options.additionalOverlayClasses && (t = " " + this.options.additionalOverlayClasses), c()("<div></div>").addClass("reveal-overlay" + t).appendTo(this.options.appendTo)
                            }
                        }, {
                            key: "_updatePosition",
                            value: function() {
                                var t, e, i = this.$element.outerWidth(),
                                    n = c()(window).width(),
                                    s = this.$element.outerHeight(),
                                    o = c()(window).height();
                                t = "auto" === this.options.hOffset ? parseInt((n - i) / 2, 10) : parseInt(this.options.hOffset, 10), e = "auto" === this.options.vOffset ? s > o ? parseInt(Math.min(100, o / 10), 10) : parseInt((o - s) / 4, 10) : parseInt(this.options.vOffset, 10), this.$element.css({
                                    top: e + "px"
                                }), this.$overlay && "auto" === this.options.hOffset || (this.$element.css({
                                    left: t + "px"
                                }), this.$element.css({
                                    margin: "0px"
                                }))
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this,
                                    e = this;
                                this.$element.on({
                                    "open.zf.trigger": this.open.bind(this),
                                    "close.zf.trigger": function(i, n) {
                                        if (i.target === e.$element[0] || c()(i.target).parents("[data-closable]")[0] === n) return t.close.apply(t)
                                    },
                                    "toggle.zf.trigger": this.toggle.bind(this),
                                    "resizeme.zf.trigger": function() {
                                        e._updatePosition()
                                    }
                                }), this.options.closeOnClick && this.options.overlay && this.$overlay.off(".zf.reveal").on("click.zf.reveal", function(t) {
                                    t.target !== e.$element[0] && !c.a.contains(e.$element[0], t.target) && c.a.contains(document, t.target) && e.close()
                                }), this.options.deepLink && c()(window).on("popstate.zf.reveal:" + this.id, this._handleState.bind(this))
                            }
                        }, {
                            key: "_handleState",
                            value: function(t) {
                                window.location.hash !== "#" + this.id || this.isActive ? this.close() : this.open()
                            }
                        }, {
                            key: "open",
                            value: function() {
                                function t() {
                                    n.isMobile ? (n.originalScrollPos || (n.originalScrollPos = window.pageYOffset), c()("html, body").addClass("is-reveal-open")) : c()("body").addClass("is-reveal-open")
                                }
                                var e = this;
                                if (this.options.deepLink) {
                                    var i = "#" + this.id;
                                    window.history.pushState ? this.options.updateHistory ? window.history.pushState({}, "", i) : window.history.replaceState({}, "", i) : window.location.hash = i
                                }
                                this.isActive = !0, this.$element.css({
                                    visibility: "hidden"
                                }).show().scrollTop(0), this.options.overlay && this.$overlay.css({
                                    visibility: "hidden"
                                }).show(), this._updatePosition(), this.$element.hide().css({
                                    visibility: ""
                                }), this.$overlay && (this.$overlay.css({
                                    visibility: ""
                                }).hide(), this.$element.hasClass("fast") ? this.$overlay.addClass("fast") : this.$element.hasClass("slow") && this.$overlay.addClass("slow")), this.options.multipleOpened || this.$element.trigger("closeme.zf.reveal", this.id);
                                var n = this;
                                if (this.options.animationIn) {
                                    var s = function() {
                                        n.$element.attr({
                                            "aria-hidden": !1,
                                            tabindex: -1
                                        }).focus(), t(), h.a.trapFocus(n.$element)
                                    };
                                    this.options.overlay && f.a.animateIn(this.$overlay, "fade-in"), f.a.animateIn(this.$element, this.options.animationIn, function() {
                                        e.$element && (e.focusableElements = h.a.findFocusable(e.$element), s())
                                    })
                                } else this.options.overlay && this.$overlay.show(0), this.$element.show(this.options.showDelay);
                                this.$element.attr({
                                    "aria-hidden": !1,
                                    tabindex: -1
                                }).focus(), h.a.trapFocus(this.$element), t(), this._extraHandlers(), this.$element.trigger("open.zf.reveal")
                            }
                        }, {
                            key: "_extraHandlers",
                            value: function() {
                                var t = this;
                                this.$element && (this.focusableElements = h.a.findFocusable(this.$element), this.options.overlay || !this.options.closeOnClick || this.options.fullScreen || c()("body").on("click.zf.reveal", function(e) {
                                    e.target !== t.$element[0] && !c.a.contains(t.$element[0], e.target) && c.a.contains(document, e.target) && t.close()
                                }), this.options.closeOnEsc && c()(window).on("keydown.zf.reveal", function(e) {
                                    h.a.handleKey(e, "Reveal", {
                                        close: function() {
                                            t.options.closeOnEsc && t.close()
                                        }
                                    })
                                }))
                            }
                        }, {
                            key: "close",
                            value: function() {
                                function t() {
                                    e.isMobile ? (0 === c()(".reveal:visible").length && c()("html, body").removeClass("is-reveal-open"), e.originalScrollPos && (c()("body").scrollTop(e.originalScrollPos), e.originalScrollPos = null)) : 0 === c()(".reveal:visible").length && c()("body").removeClass("is-reveal-open"), h.a.releaseFocus(e.$element), e.$element.attr("aria-hidden", !0), e.$element.trigger("closed.zf.reveal")
                                }
                                if (!this.isActive || !this.$element.is(":visible")) return !1;
                                var e = this;
                                this.options.animationOut ? (this.options.overlay && f.a.animateOut(this.$overlay, "fade-out"), f.a.animateOut(this.$element, this.options.animationOut, t)) : (this.$element.hide(this.options.hideDelay), this.options.overlay ? this.$overlay.hide(0, t) : t()), this.options.closeOnEsc && c()(window).off("keydown.zf.reveal"), !this.options.overlay && this.options.closeOnClick && c()("body").off("click.zf.reveal"), this.$element.off("keydown.zf.reveal"), this.options.resetOnClose && this.$element.html(this.$element.html()), this.isActive = !1, e.options.deepLink && (window.history.replaceState ? window.history.replaceState("", document.title, window.location.href.replace("#" + this.id, "")) : window.location.hash = ""), this.$anchor.focus()
                            }
                        }, {
                            key: "toggle",
                            value: function() {
                                this.isActive ? this.close() : this.open()
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.options.overlay && (this.$element.appendTo(c()(this.options.appendTo)), this.$overlay.hide().off().remove()), this.$element.hide().off(), this.$anchor.off(".zf"), c()(window).off(".zf.reveal:" + this.id)
                            }
                        }]), e
                    }(p.a);
                v.defaults = {
                    animationIn: "",
                    animationOut: "",
                    showDelay: 0,
                    hideDelay: 0,
                    closeOnClick: !0,
                    closeOnEsc: !0,
                    multipleOpened: !1,
                    vOffset: "auto",
                    hOffset: "auto",
                    fullScreen: !1,
                    btmOffsetPct: 10,
                    overlay: !0,
                    resetOnClose: !1,
                    deepLink: !1,
                    updateHistory: !1,
                    appendTo: "body",
                    additionalOverlayClasses: ""
                }
            },
                // Slider
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }

                function a(t, e) {
                    return t / e
                }

                function r(t, e, i, n) {
                    return Math.abs(t.position()[e] + t[n]() / 2 - i)
                }

                function l(t, e) {
                    return Math.log(e) / Math.log(t)
                }
                i.d(e, "a", function() {
                    return b
                });
                var u = i(0),
                    c = i.n(u),
                    h = i(3),
                    d = i(6),
                    f = i(1),
                    p = i(2),
                    m = i(10),
                    g = i(5),
                    v = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    b = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), v(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = c.a.extend({}, e.defaults, this.$element.data(), i), this.className = "Slider", m.a.init(c.a), g.a.init(c.a), this._init(), h.a.register("Slider", {
                                    ltr: {
                                        ARROW_RIGHT: "increase",
                                        ARROW_UP: "increase",
                                        ARROW_DOWN: "decrease",
                                        ARROW_LEFT: "decrease",
                                        SHIFT_ARROW_RIGHT: "increase_fast",
                                        SHIFT_ARROW_UP: "increase_fast",
                                        SHIFT_ARROW_DOWN: "decrease_fast",
                                        SHIFT_ARROW_LEFT: "decrease_fast",
                                        HOME: "min",
                                        END: "max"
                                    },
                                    rtl: {
                                        ARROW_LEFT: "increase",
                                        ARROW_RIGHT: "decrease",
                                        SHIFT_ARROW_LEFT: "increase_fast",
                                        SHIFT_ARROW_RIGHT: "decrease_fast"
                                    }
                                })
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                this.inputs = this.$element.find("input"), this.handles = this.$element.find("[data-slider-handle]"), this.$handle = this.handles.eq(0), this.$input = this.inputs.length ? this.inputs.eq(0) : c()("#" + this.$handle.attr("aria-controls")), this.$fill = this.$element.find("[data-slider-fill]").css(this.options.vertical ? "height" : "width", 0);
                                (this.options.disabled || this.$element.hasClass(this.options.disabledClass)) && (this.options.disabled = !0, this.$element.addClass(this.options.disabledClass)), this.inputs.length || (this.inputs = c()().add(this.$input), this.options.binding = !0), this._setInitAttr(0), this.handles[1] && (this.options.doubleSided = !0, this.$handle2 = this.handles.eq(1), this.$input2 = this.inputs.length > 1 ? this.inputs.eq(1) : c()("#" + this.$handle2.attr("aria-controls")), this.inputs[1] || (this.inputs = this.inputs.add(this.$input2)), !0, this._setInitAttr(1)), this.setHandles(), this._events()
                            }
                        }, {
                            key: "setHandles",
                            value: function() {
                                var t = this;
                                this.handles[1] ? this._setHandlePos(this.$handle, this.inputs.eq(0).val(), !0, function() {
                                    t._setHandlePos(t.$handle2, t.inputs.eq(1).val(), !0)
                                }) : this._setHandlePos(this.$handle, this.inputs.eq(0).val(), !0)
                            }
                        }, {
                            key: "_reflow",
                            value: function() {
                                this.setHandles()
                            }
                        }, {
                            key: "_pctOfBar",
                            value: function(t) {
                                var e = a(t - this.options.start, this.options.end - this.options.start);
                                switch (this.options.positionValueFunction) {
                                    case "pow":
                                        e = this._logTransform(e);
                                        break;
                                    case "log":
                                        e = this._powTransform(e)
                                }
                                return e.toFixed(2)
                            }
                        }, {
                            key: "_value",
                            value: function(t) {
                                switch (this.options.positionValueFunction) {
                                    case "pow":
                                        t = this._powTransform(t);
                                        break;
                                    case "log":
                                        t = this._logTransform(t)
                                }
                                return (this.options.end - this.options.start) * t + this.options.start
                            }
                        }, {
                            key: "_logTransform",
                            value: function(t) {
                                return l(this.options.nonLinearBase, t * (this.options.nonLinearBase - 1) + 1)
                            }
                        }, {
                            key: "_powTransform",
                            value: function(t) {
                                return (Math.pow(this.options.nonLinearBase, t) - 1) / (this.options.nonLinearBase - 1)
                            }
                        }, {
                            key: "_setHandlePos",
                            value: function(t, e, n, s) {
                                if (!this.$element.hasClass(this.options.disabledClass)) {
                                    e = parseFloat(e), e < this.options.start ? e = this.options.start : e > this.options.end && (e = this.options.end);
                                    var o = this.options.doubleSided;
                                    if (this.options.vertical && !n && (e = this.options.end - e), o)
                                        if (0 === this.handles.index(t)) {
                                            var r = parseFloat(this.$handle2.attr("aria-valuenow"));
                                            e = e >= r ? r - this.options.step : e
                                        } else {
                                            var l = parseFloat(this.$handle.attr("aria-valuenow"));
                                            e = e <= l ? l + this.options.step : e
                                        }
                                    var u = this,
                                        c = this.options.vertical,
                                        h = c ? "height" : "width",
                                        f = c ? "top" : "left",
                                        p = t[0].getBoundingClientRect()[h],
                                        m = this.$element[0].getBoundingClientRect()[h],
                                        g = this._pctOfBar(e),
                                        v = (m - p) * g,
                                        b = (100 * a(v, m)).toFixed(this.options.decimal);
                                    e = parseFloat(e.toFixed(this.options.decimal));
                                    var y = {};
                                    if (this._setValues(t, e), o) {
                                        var w, _ = 0 === this.handles.index(t),
                                            $ = ~~(100 * a(p, m));
                                        if (_) y[f] = b + "%", w = parseFloat(this.$handle2[0].style[f]) - b + $, s && "function" == typeof s && s();
                                        else {
                                            var k = parseFloat(this.$handle[0].style[f]);
                                            w = b - (isNaN(k) ? (this.options.initialStart - this.options.start) / ((this.options.end - this.options.start) / 100) : k) + $
                                        }
                                        y["min-" + h] = w + "%"
                                    }
                                    this.$element.one("finished.zf.animate", function() {
                                        u.$element.trigger("moved.zf.slider", [t])
                                    });
                                    var C = this.$element.data("dragging") ? 1e3 / 60 : this.options.moveTime;
                                    i.i(d.b)(C, t, function() {
                                        isNaN(b) ? t.css(f, 100 * g + "%") : t.css(f, b + "%"), u.options.doubleSided ? u.$fill.css(y) : u.$fill.css(h, 100 * g + "%")
                                    }), clearTimeout(u.timeout), u.timeout = setTimeout(function() {
                                        u.$element.trigger("changed.zf.slider", [t])
                                    }, u.options.changedDelay)
                                }
                            }
                        }, {
                            key: "_setInitAttr",
                            value: function(t) {
                                var e = 0 === t ? this.options.initialStart : this.options.initialEnd,
                                    n = this.inputs.eq(t).attr("id") || i.i(f.b)(6, "slider");
                                this.inputs.eq(t).attr({
                                    id: n,
                                    max: this.options.end,
                                    min: this.options.start,
                                    step: this.options.step
                                }), this.inputs.eq(t).val(e), this.handles.eq(t).attr({
                                    role: "slider",
                                    "aria-controls": n,
                                    "aria-valuemax": this.options.end,
                                    "aria-valuemin": this.options.start,
                                    "aria-valuenow": e,
                                    "aria-orientation": this.options.vertical ? "vertical" : "horizontal",
                                    tabindex: 0
                                })
                            }
                        }, {
                            key: "_setValues",
                            value: function(t, e) {
                                var i = this.options.doubleSided ? this.handles.index(t) : 0;
                                this.inputs.eq(i).val(e), t.attr("aria-valuenow", e)
                            }
                        }, {
                            key: "_handleEvent",
                            value: function(t, e, n) {
                                var s, o;
                                if (n) s = this._adjustValue(null, n), o = !0;
                                else {
                                    t.preventDefault();
                                    var l = this,
                                        u = this.options.vertical,
                                        h = u ? "height" : "width",
                                        d = u ? "top" : "left",
                                        p = u ? t.pageY : t.pageX,
                                        m = (this.$handle[0].getBoundingClientRect()[h], this.$element[0].getBoundingClientRect()[h]),
                                        g = u ? c()(window).scrollTop() : c()(window).scrollLeft(),
                                        v = this.$element.offset()[d];
                                    t.clientY === t.pageY && (p += g);
                                    var b, y = p - v;
                                    b = y < 0 ? 0 : y > m ? m : y;
                                    var w = a(b, m);
                                    if (s = this._value(w), i.i(f.a)() && !this.options.vertical && (s = this.options.end - s), s = l._adjustValue(null, s), o = !1, !e) {
                                        e = r(this.$handle, d, b, h) <= r(this.$handle2, d, b, h) ? this.$handle : this.$handle2
                                    }
                                }
                                this._setHandlePos(e, s, o)
                            }
                        }, {
                            key: "_adjustValue",
                            value: function(t, e) {
                                var i, n, s, o, a = this.options.step,
                                    r = parseFloat(a / 2);
                                return i = t ? parseFloat(t.attr("aria-valuenow")) : e, n = i % a, s = i - n, o = s + a, 0 === n ? i : i = i >= s + r ? o : s
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                this._eventsForHandle(this.$handle), this.handles[1] && this._eventsForHandle(this.$handle2)
                            }
                        }, {
                            key: "_eventsForHandle",
                            value: function(t) {
                                var e, i = this;
                                if (this.inputs.off("change.zf.slider").on("change.zf.slider", function(t) {
                                    var e = i.inputs.index(c()(this));
                                    i._handleEvent(t, i.handles.eq(e), c()(this).val())
                                }), this.options.clickSelect && this.$element.off("click.zf.slider").on("click.zf.slider", function(t) {
                                    if (i.$element.data("dragging")) return !1;
                                    c()(t.target).is("[data-slider-handle]") || (i.options.doubleSided ? i._handleEvent(t) : i._handleEvent(t, i.$handle))
                                }), this.options.draggable) {
                                    this.handles.addTouch();
                                    var n = c()("body");
                                    t.off("mousedown.zf.slider").on("mousedown.zf.slider", function(s) {
                                        t.addClass("is-dragging"), i.$fill.addClass("is-dragging"), i.$element.data("dragging", !0), e = c()(s.currentTarget), n.on("mousemove.zf.slider", function(t) {
                                            t.preventDefault(), i._handleEvent(t, e)
                                        }).on("mouseup.zf.slider", function(s) {
                                            i._handleEvent(s, e), t.removeClass("is-dragging"), i.$fill.removeClass("is-dragging"), i.$element.data("dragging", !1), n.off("mousemove.zf.slider mouseup.zf.slider")
                                        })
                                    }).on("selectstart.zf.slider touchmove.zf.slider", function(t) {
                                        t.preventDefault()
                                    })
                                }
                                t.off("keydown.zf.slider").on("keydown.zf.slider", function(t) {
                                    var e, n = c()(this),
                                        s = i.options.doubleSided ? i.handles.index(n) : 0,
                                        o = parseFloat(i.inputs.eq(s).val());
                                    h.a.handleKey(t, "Slider", {
                                        decrease: function() {
                                            e = o - i.options.step
                                        },
                                        increase: function() {
                                            e = o + i.options.step
                                        },
                                        decrease_fast: function() {
                                            e = o - 10 * i.options.step
                                        },
                                        increase_fast: function() {
                                            e = o + 10 * i.options.step
                                        },
                                        min: function() {
                                            e = i.options.start
                                        },
                                        max: function() {
                                            e = i.options.end
                                        },
                                        handled: function() {
                                            t.preventDefault(), i._setHandlePos(n, e, !0)
                                        }
                                    })
                                })
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.handles.off(".zf.slider"), this.inputs.off(".zf.slider"), this.$element.off(".zf.slider"), clearTimeout(this.timeout)
                            }
                        }]), e
                    }(p.a);
                b.defaults = {
                    start: 0,
                    end: 100,
                    step: 1,
                    initialStart: 0,
                    initialEnd: 100,
                    binding: !1,
                    clickSelect: !0,
                    vertical: !1,
                    draggable: !0,
                    disabled: !1,
                    doubleSided: !1,
                    decimal: 2,
                    moveTime: 200,
                    disabledClass: "disabled",
                    invertVertical: !1,
                    changedDelay: 500,
                    nonLinearBase: 5,
                    positionValueFunction: "linear"
                }
            },
                // Sticky
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }

                function a(t) {
                    return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * t
                }
                i.d(e, "a", function() {
                    return p
                });
                var r = i(0),
                    l = i.n(r),
                    u = i(1),
                    c = i(4),
                    h = i(2),
                    d = i(5),
                    f = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    p = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), f(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = l.a.extend({}, e.defaults, this.$element.data(), i), this.className = "Sticky", d.a.init(l.a), this._init()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                c.a._init();
                                var t = this.$element.parent("[data-sticky-container]"),
                                    e = this.$element[0].id || i.i(u.b)(6, "sticky"),
                                    n = this;
                                t.length ? this.$container = t : (this.wasWrapped = !0, this.$element.wrap(this.options.container), this.$container = this.$element.parent()), this.$container.addClass(this.options.containerClass), this.$element.addClass(this.options.stickyClass).attr({
                                    "data-resize": e,
                                    "data-mutate": e
                                }), "" !== this.options.anchor && l()("#" + n.options.anchor).attr({
                                    "data-mutate": e
                                }), this.scrollCount = this.options.checkEvery, this.isStuck = !1, l()(window).one("load.zf.sticky", function() {
                                    n.containerHeight = "none" == n.$element.css("display") ? 0 : n.$element[0].getBoundingClientRect().height, n.$container.css("height", n.containerHeight), n.elemHeight = n.containerHeight, "" !== n.options.anchor ? n.$anchor = l()("#" + n.options.anchor) : n._parsePoints(), n._setSizes(function() {
                                        var t = window.pageYOffset;
                                        n._calc(!1, t), n.isStuck || n._removeSticky(!(t >= n.topPoint))
                                    }), n._events(e.split("-").reverse().join("-"))
                                })
                            }
                        }, {
                            key: "_parsePoints",
                            value: function() {
                                for (var t = "" == this.options.topAnchor ? 1 : this.options.topAnchor, e = "" == this.options.btmAnchor ? document.documentElement.scrollHeight : this.options.btmAnchor, i = [t, e], n = {}, s = 0, o = i.length; s < o && i[s]; s++) {
                                    var a;
                                    if ("number" == typeof i[s]) a = i[s];
                                    else {
                                        var r = i[s].split(":"),
                                            u = l()("#" + r[0]);
                                        a = u.offset().top, r[1] && "bottom" === r[1].toLowerCase() && (a += u[0].getBoundingClientRect().height)
                                    }
                                    n[s] = a
                                }
                                this.points = n
                            }
                        }, {
                            key: "_events",
                            value: function(t) {
                                var e = this,
                                    i = this.scrollListener = "scroll.zf." + t;
                                this.isOn || (this.canStick && (this.isOn = !0, l()(window).off(i).on(i, function(t) {
                                    0 === e.scrollCount ? (e.scrollCount = e.options.checkEvery, e._setSizes(function() {
                                        e._calc(!1, window.pageYOffset)
                                    })) : (e.scrollCount--, e._calc(!1, window.pageYOffset))
                                })), this.$element.off("resizeme.zf.trigger").on("resizeme.zf.trigger", function(i, n) {
                                    e._eventsHandler(t)
                                }), this.$element.on("mutateme.zf.trigger", function(i, n) {
                                    e._eventsHandler(t)
                                }), this.$anchor && this.$anchor.on("mutateme.zf.trigger", function(i, n) {
                                    e._eventsHandler(t)
                                }))
                            }
                        }, {
                            key: "_eventsHandler",
                            value: function(t) {
                                var e = this,
                                    i = this.scrollListener = "scroll.zf." + t;
                                e._setSizes(function() {
                                    e._calc(!1), e.canStick ? e.isOn || e._events(t) : e.isOn && e._pauseListeners(i)
                                })
                            }
                        }, {
                            key: "_pauseListeners",
                            value: function(t) {
                                this.isOn = !1, l()(window).off(t), this.$element.trigger("pause.zf.sticky")
                            }
                        }, {
                            key: "_calc",
                            value: function(t, e) {
                                if (t && this._setSizes(), !this.canStick) return this.isStuck && this._removeSticky(!0), !1;
                                e || (e = window.pageYOffset), e >= this.topPoint ? e <= this.bottomPoint ? this.isStuck || this._setSticky() : this.isStuck && this._removeSticky(!1) : this.isStuck && this._removeSticky(!0)
                            }
                        }, {
                            key: "_setSticky",
                            value: function() {
                                var t = this,
                                    e = this.options.stickTo,
                                    i = "top" === e ? "marginTop" : "marginBottom",
                                    n = "top" === e ? "bottom" : "top",
                                    s = {};
                                s[i] = this.options[i] + "em", s[e] = 0, s[n] = "auto", this.isStuck = !0, this.$element.removeClass("is-anchored is-at-" + n).addClass("is-stuck is-at-" + e).css(s).trigger("sticky.zf.stuckto:" + e), this.$element.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function() {
                                    t._setSizes()
                                })
                            }
                        }, {
                            key: "_removeSticky",
                            value: function(t) {
                                var e = this.options.stickTo,
                                    i = "top" === e,
                                    n = {},
                                    s = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
                                    o = i ? "marginTop" : "marginBottom",
                                    a = t ? "top" : "bottom";
                                n[o] = 0, n.bottom = "auto", n.top = t ? 0 : s, this.isStuck = !1, this.$element.removeClass("is-stuck is-at-" + e).addClass("is-anchored is-at-" + a).css(n).trigger("sticky.zf.unstuckfrom:" + a)
                            }
                        }, {
                            key: "_setSizes",
                            value: function(t) {
                                this.canStick = c.a.is(this.options.stickyOn), this.canStick || t && "function" == typeof t && t();
                                var e = this.$container[0].getBoundingClientRect().width,
                                    i = window.getComputedStyle(this.$container[0]),
                                    n = parseInt(i["padding-left"], 10),
                                    s = parseInt(i["padding-right"], 10);
                                this.$anchor && this.$anchor.length ? this.anchorHeight = this.$anchor[0].getBoundingClientRect().height : this._parsePoints(), this.$element.css({
                                    "max-width": e - n - s + "px"
                                });
                                var o = this.$element[0].getBoundingClientRect().height || this.containerHeight;
                                if ("none" == this.$element.css("display") && (o = 0), this.containerHeight = o, this.$container.css({
                                    height: o
                                }), this.elemHeight = o, !this.isStuck && this.$element.hasClass("is-at-bottom")) {
                                    var a = (this.points ? this.points[1] - this.$container.offset().top : this.anchorHeight) - this.elemHeight;
                                    this.$element.css("top", a)
                                }
                                this._setBreakPoints(o, function() {
                                    t && "function" == typeof t && t()
                                })
                            }
                        }, {
                            key: "_setBreakPoints",
                            value: function(t, e) {
                                if (!this.canStick) {
                                    if (!e || "function" != typeof e) return !1;
                                    e()
                                }
                                var i = a(this.options.marginTop),
                                    n = a(this.options.marginBottom),
                                    s = this.points ? this.points[0] : this.$anchor.offset().top,
                                    o = this.points ? this.points[1] : s + this.anchorHeight,
                                    r = window.innerHeight;
                                "top" === this.options.stickTo ? (s -= i, o -= t + i) : "bottom" === this.options.stickTo && (s -= r - (t + n), o -= r - n), this.topPoint = s, this.bottomPoint = o, e && "function" == typeof e && e()
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this._removeSticky(!0), this.$element.removeClass(this.options.stickyClass + " is-anchored is-at-top").css({
                                    height: "",
                                    top: "",
                                    bottom: "",
                                    "max-width": ""
                                }).off("resizeme.zf.trigger").off("mutateme.zf.trigger"), this.$anchor && this.$anchor.length && this.$anchor.off("change.zf.sticky"), l()(window).off(this.scrollListener), this.wasWrapped ? this.$element.unwrap() : this.$container.removeClass(this.options.containerClass).css({
                                    height: ""
                                })
                            }
                        }]), e
                    }(h.a);
                p.defaults = {
                    container: "<div data-sticky-container></div>",
                    stickTo: "top",
                    anchor: "",
                    topAnchor: "",
                    btmAnchor: "",
                    marginTop: 1,
                    marginBottom: 1,
                    stickyOn: "medium",
                    stickyClass: "sticky",
                    containerClass: "sticky-container",
                    checkEvery: -1
                }
            },
                // Toggler
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return d
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(6),
                    u = i(2),
                    c = i(5),
                    h = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    d = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), h(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, t.data(), i), this.className = "", this.className = "Toggler", c.a.init(r.a), this._init(), this._events()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                var t;
                                this.options.animate ? (t = this.options.animate.split(" "), this.animationIn = t[0], this.animationOut = t[1] || null) : (t = this.$element.data("toggler"), this.className = "." === t[0] ? t.slice(1) : t);
                                var e = this.$element[0].id;
                                r()('[data-open="' + e + '"], [data-close="' + e + '"], [data-toggle="' + e + '"]').attr("aria-controls", e), this.$element.attr("aria-expanded", !this.$element.is(":hidden"))
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                this.$element.off("toggle.zf.trigger").on("toggle.zf.trigger", this.toggle.bind(this))
                            }
                        }, {
                            key: "toggle",
                            value: function() {
                                this[this.options.animate ? "_toggleAnimate" : "_toggleClass"]()
                            }
                        }, {
                            key: "_toggleClass",
                            value: function() {
                                this.$element.toggleClass(this.className);
                                var t = this.$element.hasClass(this.className);
                                t ? this.$element.trigger("on.zf.toggler") : this.$element.trigger("off.zf.toggler"), this._updateARIA(t), this.$element.find("[data-mutate]").trigger("mutateme.zf.trigger")
                            }
                        }, {
                            key: "_toggleAnimate",
                            value: function() {
                                var t = this;
                                this.$element.is(":hidden") ? l.a.animateIn(this.$element, this.animationIn, function() {
                                    t._updateARIA(!0), this.trigger("on.zf.toggler"), this.find("[data-mutate]").trigger("mutateme.zf.trigger")
                                }) : l.a.animateOut(this.$element, this.animationOut, function() {
                                    t._updateARIA(!1), this.trigger("off.zf.toggler"), this.find("[data-mutate]").trigger("mutateme.zf.trigger")
                                })
                            }
                        }, {
                            key: "_updateARIA",
                            value: function(t) {
                                this.$element.attr("aria-expanded", !!t)
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.$element.off(".zf.toggler")
                            }
                        }]), e
                    }(u.a);
                d.defaults = {
                    animate: !1
                }
            },
                // Tooltip
                function(t, e, i) {
                "use strict";

                function n(t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
                }

                function s(t, e) {
                    if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    return !e || "object" != typeof e && "function" != typeof e ? t : e
                }

                function o(t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
                    t.prototype = Object.create(e && e.prototype, {
                        constructor: {
                            value: t,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
                }
                i.d(e, "a", function() {
                    return p
                });
                var a = i(0),
                    r = i.n(a),
                    l = i(1),
                    u = i(4),
                    c = i(5),
                    h = i(15),
                    d = function() {
                        function t(t, e) {
                            for (var i = 0; i < e.length; i++) {
                                var n = e[i];
                                n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                            }
                        }
                        return function(e, i, n) {
                            return i && t(e.prototype, i), n && t(e, n), e
                        }
                    }(),
                    f = function t(e, i, n) {
                        null === e && (e = Function.prototype);
                        var s = Object.getOwnPropertyDescriptor(e, i);
                        if (void 0 === s) {
                            var o = Object.getPrototypeOf(e);
                            return null === o ? void 0 : t(o, i, n)
                        }
                        if ("value" in s) return s.value;
                        var a = s.get;
                        if (void 0 !== a) return a.call(n)
                    },
                    p = function(t) {
                        function e() {
                            return n(this, e), s(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
                        }
                        return o(e, t), d(e, [{
                            key: "_setup",
                            value: function(t, i) {
                                this.$element = t, this.options = r.a.extend({}, e.defaults, this.$element.data(), i), this.className = "Tooltip", this.isActive = !1, this.isClick = !1, c.a.init(r.a), this._init()
                            }
                        }, {
                            key: "_init",
                            value: function() {
                                u.a._init();
                                var t = this.$element.attr("aria-describedby") || i.i(l.b)(6, "tooltip");
                                this.options.tipText = this.options.tipText || this.$element.attr("title"), this.template = this.options.template ? r()(this.options.template) : this._buildTemplate(t), this.options.allowHtml ? this.template.appendTo(document.body).html(this.options.tipText).hide() : this.template.appendTo(document.body).text(this.options.tipText).hide(), this.$element.attr({
                                    title: "",
                                    "aria-describedby": t,
                                    "data-yeti-box": t,
                                    "data-toggle": t,
                                    "data-resize": t
                                }).addClass(this.options.triggerClass), f(e.prototype.__proto__ || Object.getPrototypeOf(e.prototype), "_init", this).call(this), this._events()
                            }
                        }, {
                            key: "_getDefaultPosition",
                            value: function() {
                                var t = this.$element[0].className.match(/\b(top|left|right|bottom)\b/g);
                                return t ? t[0] : "top"
                            }
                        }, {
                            key: "_getDefaultAlignment",
                            value: function() {
                                return "center"
                            }
                        }, {
                            key: "_getHOffset",
                            value: function() {
                                return "left" === this.position || "right" === this.position ? this.options.hOffset + this.options.tooltipWidth : this.options.hOffset
                            }
                        }, {
                            key: "_getVOffset",
                            value: function() {
                                return "top" === this.position || "bottom" === this.position ? this.options.vOffset + this.options.tooltipHeight : this.options.vOffset
                            }
                        }, {
                            key: "_buildTemplate",
                            value: function(t) {
                                var e = (this.options.tooltipClass + " " + this.options.positionClass + " " + this.options.templateClasses).trim();
                                return r()("<div></div>").addClass(e).attr({
                                    role: "tooltip",
                                    "aria-hidden": !0,
                                    "data-is-active": !1,
                                    "data-is-focus": !1,
                                    id: t
                                })
                            }
                        }, {
                            key: "_setPosition",
                            value: function() {
                                f(e.prototype.__proto__ || Object.getPrototypeOf(e.prototype), "_setPosition", this).call(this, this.$element, this.template)
                            }
                        }, {
                            key: "show",
                            value: function() {
                                if ("all" !== this.options.showOn && !u.a.is(this.options.showOn)) return !1;
                                var t = this;
                                this.template.css("visibility", "hidden").show(), this._setPosition(), this.template.removeClass("top bottom left right").addClass(this.position), this.template.removeClass("align-top align-bottom align-left align-right align-center").addClass("align-" + this.alignment), this.$element.trigger("closeme.zf.tooltip", this.template.attr("id")), this.template.attr({
                                    "data-is-active": !0,
                                    "aria-hidden": !1
                                }), t.isActive = !0, this.template.stop().hide().css("visibility", "").fadeIn(this.options.fadeInDuration, function() {}), this.$element.trigger("show.zf.tooltip")
                            }
                        }, {
                            key: "hide",
                            value: function() {
                                var t = this;
                                this.template.stop().attr({
                                    "aria-hidden": !0,
                                    "data-is-active": !1
                                }).fadeOut(this.options.fadeOutDuration, function() {
                                    t.isActive = !1, t.isClick = !1
                                }), this.$element.trigger("hide.zf.tooltip")
                            }
                        }, {
                            key: "_events",
                            value: function() {
                                var t = this,
                                    e = (this.template, !1);
                                this.options.disableHover || this.$element.on("mouseenter.zf.tooltip", function(e) {
                                    t.isActive || (t.timeout = setTimeout(function() {
                                        t.show()
                                    }, t.options.hoverDelay))
                                }).on("mouseleave.zf.tooltip", function(i) {
                                    clearTimeout(t.timeout), (!e || t.isClick && !t.options.clickOpen) && t.hide()
                                }), this.options.clickOpen ? this.$element.on("mousedown.zf.tooltip", function(e) {
                                    e.stopImmediatePropagation(), t.isClick || (t.isClick = !0, !t.options.disableHover && t.$element.attr("tabindex") || t.isActive || t.show())
                                }) : this.$element.on("mousedown.zf.tooltip", function(e) {
                                    e.stopImmediatePropagation(), t.isClick = !0
                                }), this.options.disableForTouch || this.$element.on("tap.zf.tooltip touchend.zf.tooltip", function(e) {
                                    t.isActive ? t.hide() : t.show()
                                }), this.$element.on({
                                    "close.zf.trigger": this.hide.bind(this)
                                }), this.$element.on("focus.zf.tooltip", function(i) {
                                    if (e = !0, t.isClick) return t.options.clickOpen || (e = !1), !1;
                                    t.show()
                                }).on("focusout.zf.tooltip", function(i) {
                                    e = !1, t.isClick = !1, t.hide()
                                }).on("resizeme.zf.trigger", function() {
                                    t.isActive && t._setPosition()
                                })
                            }
                        }, {
                            key: "toggle",
                            value: function() {
                                this.isActive ? this.hide() : this.show()
                            }
                        }, {
                            key: "_destroy",
                            value: function() {
                                this.$element.attr("title", this.template.text()).off(".zf.trigger .zf.tooltip").removeClass("has-tip top right left").removeAttr("aria-describedby aria-haspopup data-disable-hover data-resize data-toggle data-tooltip data-yeti-box"), this.template.remove()
                            }
                        }]), e
                    }(h.a);
                p.defaults = {
                    disableForTouch: !1,
                    hoverDelay: 200,
                    fadeInDuration: 150,
                    fadeOutDuration: 150,
                    disableHover: !1,
                    templateClasses: "",
                    tooltipClass: "tooltip",
                    triggerClass: "has-tip",
                    showOn: "small",
                    template: "",
                    tipText: "",
                    touchCloseText: "Tap to close.",
                    clickOpen: !0,
                    positionClass: "",
                    position: "auto",
                    alignment: "auto",
                    allowOverlap: !1,
                    allowBottomOverlap: !1,
                    vOffset: 0,
                    hOffset: 0,
                    tooltipHeight: 14,
                    tooltipWidth: 12,
                    allowHtml: !1
                }
            },
                function(t, e, i) {
                t.exports = i(19)
            }
            ]);
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),

/* 67  TextDialogTemplate*/
/***/ (function(module, exports) {

module.exports = "<div class="reveal">
                    <h3 data-bind="html: title"></h3>
                    <input type="text" tabindex="1" data-bind="textInput: text,hasSelectedFocus: focusText"></input>
                    <div class="buttons">
                      <button type="submit" class="secondary button" tabindex="2" data-bind="click: okClicked">OK
                      </button>
                      <button class="secondary button" tabindex="3" data-bind="click: cancelClicked">Cancel
                      </button>
                     </div>
                  </div>";

/***/ }),
/* 68  MessageDialogTemplate*/
/***/ (function(module, exports) {

module.exports = "<div class="reveal" data-bind="event: { keydown: onKeyDown }"><!--- SweetAlert icons t4t5.github.io/sweetalert --><!-- Error icon -->
        <div class="sa-icon sa-error" data-bind="visible: icon === 'error'">
            <span class="sa-x-mark">
            <span class="sa-line sa-left"></span>
            <span class="sa-line sa-right"></span>
            </span>
            </div>
            <!-- Warning icon -->
            <div class="sa-icon sa-warning" data-bind="visible: icon === 'warning'">
            <span class="sa-body"></span>
            <span class="sa-dot"></span>
            </div>
            <!-- Info icon -->
            <div class="sa-icon sa-info" data-bind="visible: icon === 'info'"></div>
            <!-- Success icon -->
            <div class="sa-icon sa-success" data-bind="visible: icon === 'success'">
            <span class="sa-line sa-tip"></span>
            <span class="sa-line sa-long"></span>
            <div class="sa-placeholder"></div>
            <div class="sa-fix"></div>
            </div>
            <h3 data-bind="html: title"></h3>
            <p data-bind="html: text"></p>
            <div class="buttons" data-bind="foreach: buttons">
            <button class="secondary button" data-bind="attr: { tabindex: $index },click: $parent.onClick,html: label">
            </button>
            </div>
            </div>";

/***/ }),
/* 69  Library*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Library

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var Group = __webpack_require__(70)
var Skill = __webpack_require__(71)
var Timeline = __webpack_require__(38)
var util = __webpack_require__(4)

function Library(groups, skills, timelines) {
  this.groups = ko.observableArray()
  this.skills = ko.observableArray()
  this.timelines = ko.observableArray()
  this.updateGroups(groups)
  this.updateSkills(skills)
  this.updateTimelines(timelines)
}

Library.prototype.updateGroups = function(groups) {
  if (!groups) {
    return
  }
  util.updateObservableArray(this.groups, groups, function(data) {
    return new Group(data)
  }, function(group, data) {
    group.update(data)
  })
}

Library.prototype.updateSkills = function(skills) {
  if (!skills) {
    return
  }
  util.updateObservableArray(this.skills, skills, function(data) {
    return new Skill(data)
  }, function(skill, data) {
    skill.update(data)
  })
}

Library.prototype.updateTimelines = function(timelines) {
  if (!timelines) {
    return
  }
  util.updateObservableArray(this.timelines, timelines, function(data) {
    return new Timeline(data, this)
  }.bind(this), function(timeline, data) {
    timeline.update(data)
  })
}

/**
 * Returns the library skill matching the specified skill id.
 *
 * @param {string} id The id of the skill to load.
 */
Library.prototype.getSkill = function(id) {
  return _.findWhere(this.skills(), { id: id })
}

/**
 * Returns the library group matching the specified id.
 *
 * @param {string} id The id of the group to load.
 */
Library.prototype.getGroup = function(id) {
  return _.findWhere(this.groups(), { id: id })
}


/***/ }),
/* 70 Group*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Group

var ko = __webpack_require__(1)
var $ = __webpack_require__(6)

__webpack_require__(14)
var util = __webpack_require__(4)

function Group(data) {
  this.id = data.id
  this.name = ko.observable(data.name)
  this.color = ko.observable(data.color)
  this.tags = ko.observableArray(data.tags)
  this.image = ko.observable().extend({writer: function(value) {
    return util.parseImage(value)
  }})
  this.image(data.image)
  this.contextMenu = ko.observable().extend({writer: function(value) {
    return $.parseHTML(value, null, true)
  }})
  this.contextMenu(data.contextMenu)
  this.components = ko.observable(data.components)
  this.hiddenInLibrary = ko.observable(data.hiddenInLibrary)
}

Group.prototype.update = function(data) {
  // IDs don't change, so we don't need to update the id.
  this.name(data.name)
  this.color(data.color)
  this.tags(data.tags)
  this.image(data.image)
  this.contextMenu(data.contextMenu)
  this.components(data.components)
  this.hiddenInLibrary(data.hiddenInLibrary)
}

Group.prototype.equal = function(other) {
  return other instanceof Group && this.id === other.id
}


/***/ }),
/* 71 Skill*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Skill

var ko = __webpack_require__(1)
var $ = __webpack_require__(6)

__webpack_require__(14)
var util = __webpack_require__(4)

function Skill(data) {
  this.id = data.id
  this.name = ko.observable(data.name)
  this.color = ko.observable(data.color)
  this.tags = ko.observableArray(data.tags)
  this.image = ko.observable().extend({writer: function(value) {
    return util.parseImage(value)
  }})
  this.image(data.image)
  this.contextMenu = ko.observable().extend({writer: function(value) {
    return $.parseHTML(value, null, true)
  }})
  this.contextMenu(data.contextMenu)
  this.components = ko.observable(data.components)
  this.hiddenInLibrary = ko.observable(data.hiddenInLibrary)
}

Skill.prototype.update = function(data) {
  // IDs don't change, so we don't need to update the id.
  this.name(data.name)
  this.color(data.color)
  this.tags(data.tags)
  this.image(data.image)
  this.contextMenu(data.contextMenu)
  this.components(data.components)
  this.hiddenInLibrary(data.hiddenInLibrary)
}

Skill.prototype.equal = function(other) {
  return other instanceof Skill && this.id === other.id
}


/***/ }),
/* 72 OneAPI*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = OneAPI

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var poseDialog = __webpack_require__(73)
var assert = __webpack_require__(7)
var Com = __webpack_require__(19)

/**
 * The OneAPI object provides context menus with interface
 * general, i.e. non-element-specific, functions to interact with the
 * //RACE.Core. OneAPI对象提供具有接口通用的上下文菜单，即非元素特定的功能，以与RACE.Core交互。
 */
function OneAPI(controller) {
  // Sound API
  this.sounds = {
    "attention": "sounds/attention.mp3",
    "confirm": "sounds/confirmation.mp3",
    "exit": "sounds/exit.mp3",
    "finish": "sounds/end_finish.mp3",
    "navigate": "sounds/navigation.mp3",
    "save": "sounds/save.mp3",
    "set": "sounds/set.mp3",
    "error": "sounds/error.mp3",
    "test": "sounds/test.mp3"
  }
  var cache = {}
  this.playSound = function(url) {
    var audio = cache[url] = cache[url] || new Audio(url)
    audio.currentTime = 0
    audio.play()
  }

  // Teaching API
  this.robotConfiguration = ko.observable({
    jointAngles: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    cartesianPose: [ 1.0, 0.0, 0.0, 0.0,
                     0.0, 1.0, 0.0, 0.0,
                     0.0, 0.0, 1.0, 0.0,
                     0.0, 0.0, 0.0, 1.0 ],
  })
  this.gripperState = ko.observable({
    width: 0.0,
    maxWidth: 0.11
  })
  this.relativeGripperWidth = ko.pureComputed(function() {
    var state = this.gripperState()
    return state.width / state.maxWidth
  }, this)
  controller.com.onRobotConfigurationReceived({ onData: this.robotConfiguration })
  controller.com.onGripperStateReceived({ onData: this.gripperState })
  controller.com.onNotification({
    onData: function(msg) {
      if (_.eq(msg.namespace, ["sound"])) {
        this.playSound(this.sounds[msg.message])
      }
    }.bind(this)
  })
  this.modbus = {
    configuration: Com.getModbusConfiguration
  }
  this.adjustPose = function(pose) {
    assert.keys(pose, "pose")
    assert(pose.pose, "pose.pose is not valid")
    if (pose.gripper) {
      assert.keys(pose.gripper, "width")
      pose.gripper.maxWidth = this.gripperState().maxWidth
    }
    return poseDialog.show(pose)
  }
}


/***/ }),
/* 73 poseDialog*/
/***/ (function(module, exports, __webpack_require__) {

var poseDialog = module.exports = {}

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)
var THREE = __webpack_require__(40)

var Dialog = __webpack_require__(8).Dialog
var settings = __webpack_require__(11)
var template = __webpack_require__(74)

var white = new THREE.Color(0xffffff)

/**
 * Shows a dialog to adjust a given pose and returns a promise for the
 * modified pose. Both, argument and the resolved promise are 4x4 matrices
 * stacked column major into a flat array.
 * 显示一个对话框，用于调整给定姿势，并返回修改后姿势的promise，
 * 参数和返回的resolved promise都是4x4矩阵
 *
 * @param {Number[]} pose - Array holding a 4x4 homogenous matrix column major.
 *
 * @example
 * poseDialog.show([1,0,0,0, 0,1,0,0, 0,0,1,0, 0.1,0.2,0.3,1])
 *   .then(function(modified) { console.log("adjusted", modified) })
 *   .catch(function(e) { console.log(e) })
 */
poseDialog.show = function(pose) {
  var dialog = new Dialog(template)
  var canvas = dialog.element.querySelector("canvas")
  return new Promise(function(resolve, reject) {
    var poseAdjuster = new PoseAdjuster(pose, canvas, 700, 400, resolve, reject)
    var cancelRendering = poseAdjuster.render()
    dialog.show(poseAdjuster, function() {
      cancelRendering()
      reject("dialog closed")
    })
  })
    .then(function(adjusted) {
      dialog.close()
      var result = {}
      result.pose = new THREE.Matrix4()
        .setPosition(new THREE.Vector3(pose.pose[12], pose.pose[13], pose.pose[14]))
        .multiply(adjusted.pose).toArray()
      result.gripper = adjusted.gripper
      return result
    })
    .catch(function() {
      dialog.close()
      throw new Error("canceled")
    })
}

function PoseAdjuster(pose, canvas, width, height, onSave, onCancel) {
  this.renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  })
  this.renderer.setSize(width, height)
  this.renderer.setClearColor(settings.reveal.background.color)

  this.camera = new THREE.PerspectiveCamera(45, width / height, 0.001, 10)
  var cameraPosition = new THREE.Vector3(-0.75, 0.0, 0.0)
  this.camera.applyMatrix(new THREE.Matrix4()
                          .lookAt(cameraPosition,
                                  new THREE.Vector3(0, 0, 0),
                                  new THREE.Vector3(0, 0, 1))
                          .setPosition(cameraPosition))

  this.scene = new THREE.Scene()
  this.scene.add(new THREE.AmbientLight(0xffffff, 1))
  this.scene.add(createCoordinateSystem(new THREE.Matrix4().setPosition(new THREE.Vector3(0, -0.35, -0.25)), 0.5))

  var initialPose = new THREE.Matrix4().fromArray(pose.pose.slice(0, 12).concat(0, 0, 0, 1))

  this.ghost = createPose(0.1, 0xd0d0d0)
  this.ghost.applyMatrix(initialPose)
  this.scene.add(this.ghost)

  this.pose = createPose(0.1, settings.contextMenu.highlight.color)
  this.pose.applyMatrix(initialPose)
  this.scene.add(this.pose)

  // Observables writing to the scene graph
  this.position = {
    x: adjustableObservable(this.pose, "position.x", 0.001, displayMM),
    y: adjustableObservable(this.pose, "position.y", 0.001, displayMM),
    z: adjustableObservable(this.pose, "position.z", 0.001, displayMM),
  }
  this.rotation = {
    x: adjustableObservable(this.pose, "rotation.x", Math.PI / 180, displayDeg),
    y: adjustableObservable(this.pose, "rotation.y", Math.PI / 180, displayDeg),
    z: adjustableObservable(this.pose, "rotation.z", Math.PI / 180, displayDeg),
  }
  this.gripper = null
  if (pose.gripper) {
    this.gripper = new GripperAdjuster(pose.gripper, 0.001)
  }
  // Button callbacks
  this.onSave = function() {
    var adjusted = {}
    adjusted.pose = new THREE.Matrix4()
    adjusted.pose.makeRotationFromEuler(this.pose.rotation)
    adjusted.pose.setPosition(this.pose.position)
    adjusted.gripper = {}
    if (this.gripper) {
      adjusted.gripper.width = this.gripper.width()
    }
    onSave(adjusted)
  }.bind(this)
  this.onCancel = onCancel
}

PoseAdjuster.prototype.render = function() {
  var currentRequestId
  var isCancelled = false
  var cancelCallback = function() {
    isCancelled = true
  }
  var _render = function() {
    if (!isCancelled) {
      this.renderer.render(this.scene, this.camera)
      currentRequestId = requestAnimationFrame(_render)
    } else {
      // Cancel current frame rendering request
      cancelAnimationFrame(currentRequestId)
    }
  }.bind(this)
  _render()
  return cancelCallback
}

/* eslint complexity: 0 */
PoseAdjuster.prototype.onKeyDown = function(self, event) {
  var axis = String.fromCharCode(event.which).toLowerCase()
  console.debug(axis)
  if (_.contains(["x", "y", "z"], axis)) {
    if (event.ctrlKey) {
      self.rotation[axis][event.shiftKey ? "decrease" : "increase"]()
    } else {
      self.position[axis][event.shiftKey ? "decrease" : "increase"]()
    }
  }
  var delta = 0.01
  /* eslint no-duplicate-case: 0 */
  switch (event.which) {
  case 48: // 0
    self.position.x(0)
    self.position.y(0)
    self.position.z(0)
    self.rotation.x(0)
    self.rotation.y(0)
    self.rotation.z(0)
    break
  case 37: // left
  case 72: // h
    self.scene.rotateZ(delta)
    break
  case 39: // right
  case 76: // l
    self.scene.rotateZ(-delta)
    break
  case 38: // up
  case 75: // k
    self.scene.position.z += delta
    break
  case 39: // down
  case 74: // j
    self.scene.position.z -= delta
    break
  }
}

function createAxes(length) {
  var lineWidth = 2
  var red = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: lineWidth
  })
  var green = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    linewidth: lineWidth
  })
  var blue = new THREE.LineBasicMaterial({
    color: 0x0000ff,
    linewidth: lineWidth
  })

  var xAxis = new THREE.Geometry()
  xAxis.vertices.push(new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(length, 0, 0))
  var yAxis = new THREE.Geometry()
  yAxis.vertices.push(new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(0, length, 0))
  var zAxis = new THREE.Geometry()
  zAxis.vertices.push(new THREE.Vector3(0, 0, 0),
                      new THREE.Vector3(0, 0, length))

  return {
    x: new THREE.Line(xAxis, red),
    y: new THREE.Line(yAxis, green),
    z: new THREE.Line(zAxis, blue)
  }
}

function createCoordinateSystem(matrix, length) {
  var axes = createAxes(length)
  var object = new THREE.Object3D()
  object.add(axes.x)
  object.add(axes.y)
  object.add(axes.z)
  object.applyMatrix(matrix)
  return object
}

function createPose(radius, color) {
  var pose = new THREE.Object3D()
  var sphereMat = new THREE.MeshLambertMaterial({
    color: color
  })
  var circleMat = new THREE.MeshLambertMaterial({
    color: color,
    transparent: true,
    opacity: 0.8
  })
  circleMat.color.lerp(white, 0.5)
  pose.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 0.7, 32, 32), sphereMat))
  pose.add(new THREE.Mesh(new THREE.CircleGeometry(radius, 32), circleMat))
  var axes = createAxes(radius * 1.2)
  pose.add(axes.x)
  pose.add(axes.y)
  pose.add(axes.z)
  return pose
}

function adjustableObservable(object, path, delta, readFunc) {
  delta = delta || 0.1
  readFunc = readFunc || _.identity
  // Special observable used to trigger re-evaluation of pureComputed
  var trigger = ko.observable().extend({ notify: "always" })
  var observable = ko.pureComputed({
    read: function() {
      trigger()
      return readFunc(_.get(object, path))
    },
    write: function(value) {
      _.set(object, path, value)
      trigger.valueHasMutated()
    }
  })
  observable.decrease = function() {
    _.set(object, path, _.get(object, path) - delta)
    trigger.valueHasMutated()
  }
  observable.increase = function() {
    _.set(object, path, _.get(object, path) + delta)
    trigger.valueHasMutated()
  }
  return observable
}

function GripperAdjuster(gripper, delta) {
  delta = delta || 0.1
  var width = this.width = ko.observable(gripper.width)
  this.display = ko.pureComputed(function() { return displayMM(width()) })
  this.config = gripper.config
  this.decrease = function() {
    var w = _.round(width(), 5)
    width(w - delta >= 0 ? w - delta : w)
  }
  this.increase = function() {
    var w = _.round(width(), 5)
    width(gripper.maxWidth >= w + delta ? w + delta : w)
  }
}

function displayDeg(rad) {
  var round2 = _.partial(_.round, _, 2)
  return _.flow(THREE.Math.radToDeg, round2, function(v) { return v + "°" })(rad)
}

function displayMM(m) {
  var round2 = _.partial(_.round, _, 2)
  var mul1000 = function(v) { return v * 1000 }
  return _.flow(mul1000, round2, function(v) { return v + " mm" })(m)
}


/***/ }),
/* 74 poseDialog template*/
/***/ (function(module, exports) {

module.exports =  "<div class=\"reveal pose-dialog\" data-bind=\"event: { keydown: onKeyDown }\">
    <h3>Fine-adjust pose</h3>
        <canvas></canvas>
        <div class=\"pose-controls\">
        <div>
        <h4>Position</h4>
        <div class=\"pose-input\">
        <span>X</span>
        <button data-bind=\"click: position.x.decrease\">-</button>
        <span data-bind=\"text: position.x\"></span>
        <button data-bind=\"click: position.x.increase\">+</button>
        </div>
        <div class=\"pose-input\">
        <span>Y</span>
        <button data-bind=\"click: position.y.decrease\">-</button>
        <span data-bind=\"text: position.y\"></span>
        <button data-bind=\"click: position.y.increase\">+</button>
        </div>
        <div class=\"pose-input\">
        <span>Z</span>
        <button data-bind=\"click: position.z.decrease\">-</button>
        <span data-bind=\"text: position.z\"></span>
        <button data-bind=\"click: position.z.increase\">+</button>
        </div>
        </div>
        <div>
        <h4>Rotation</h4>
        <div class=\"pose-input\">
        <span>X</span>
        <button data-bind=\"click: rotation.x.decrease\">-</button>
        <span data-bind=\"text: rotation.x\"></span>
        <button data-bind=\"click: rotation.x.increase\">+</button>
        </div>
        <div class=\"pose-input\">
        <span>Y</span>
        <button data-bind=\"click: rotation.y.decrease\">-</button>
        <span data-bind=\"text: rotation.y\"></span>
        <button data-bind=\"click: rotation.y.increase\">+</button>
        </div>
        <div class=\"pose-input\">
        <span>Z</span>
        <button data-bind=\"click: rotation.z.decrease\">-</button>
        <span data-bind=\"text: rotation.z\"></span>
        <button data-bind=\"click: rotation.z.increase\">+</button>
        </div>
        </div>
        <!-- ko with : gripper -->
        <div>
        <h4>Gripper</h4>
        <h6>
        <i>width when&nbsp;
    <span data-bind=\"text: config\"></span>
        </i>
        </h6>
        <div class=\"pose-input\">
        <button data-bind=\"click: decrease\">-</button>
        <span data-bind=\"text: display\"></span>
        <button data-bind=\"click: increase\">+</button>
        </div>
        </div>
        <!-- /ko -->
        <div class=\"pose-buttons\">
        <button class=\"cancel button\" data-bind=\"click: onCancel\" tabindex=\"1\">Cancel</button>
        <button class=\"success button\" data-bind=\"click: onSave\" tabindex=\"0\">Save</button>
        </div>
        </div>
        </div>";

/***/ }),
/* 75 Pilot*/
/***/ (function(module, exports, __webpack_require__) {

/**
 *pilot模块提供：注册和通知从服务器接收的pilot navigation事件的功能
 */
var _ = __webpack_require__(0)
var settings = __webpack_require__(11)
var auth = __webpack_require__(12)

var keyDefinitions = [
  { name: "check" },
  { name: "circle" },
  { name: "cross" },
  { name: "left", repeat: true },
  { name: "up", repeat: true },
  { name: "right", repeat: true },
  { name: "down", repeat: true }
]

settings.pilot = settings.pilot || {
  repeatDelay: 0.5,
  repeatRate: 33,
  expectedEventRate: 10
}

function PilotButtonEvents(events) {
  _.forEach(keyDefinitions, function(e) {
    events.register(e.name)
  })
  this.notify = _.bind(events.notify, events)
  this.repeatNotify = _.bind(this.repeatNotify, this)
  this.watchdog = _.debounce(function() {
    if (this.keyRepeater) {
      window.clearTimeout(this.keyRepeater)
    }
  }.bind(this), 2 * 1000 / settings.pilot.expectedEventRate)
}

PilotButtonEvents.prototype.handleEvent = function(event) {
  var active
  _.forEach(keyDefinitions, function(e) {
    if (event[e.name]) {
      this.watchdog()
      active = e
    }
  }, this)
  if (this.keyRepeater && (!active || !_.isEqual(this.currentlyActiveEvent, active))) {
    window.clearTimeout(this.keyRepeater)
  }
  if (active && !_.isEqual(this.currentlyActiveEvent, active)) {
    this.notify(active.name)
    if (active.repeat) {
      this.keyRepeater = window.setTimeout(this.repeatNotify, settings.pilot.repeatDelay * 1000)
    }
  }
  this.currentlyActiveEvent = active
}

PilotButtonEvents.prototype.repeatNotify = function() {
  this.notify(this.currentlyActiveEvent.name)
  this.keyRepeater = window.setTimeout(this.repeatNotify, 1000 / settings.pilot.repeatRate)
}

function Pilot(events, com) {
  this.com = com
  events.register("connected")
  events.register("disconnected")

  var pilotEventHandler = new PilotButtonEvents(events)
  var navSubscription

  // Debounce updates and wait for pending requests to finish
  // to avoid outdated pilot states due to variying request times
  var nextColors = null
  var pending = null
  var update = function(colors) {
    nextColors = colors
    if (!pending) {
      var tmp = nextColors
      nextColors = null
      pending = com.setPilotColors(tmp)
        .then(function() {
          pending = null
          if (nextColors) {
            return update(nextColors)
          }
        })
    }
    return pending
  }
  this.sendPilotColors = _.debounce(update, 120)

  this.reconnect = function() {
    if (navSubscription) {
      navSubscription.dispose()
    }
    navSubscription = com.onNavigationEventReceived({
      onOpen: events.notifyConnected.bind(events),
      onData: pilotEventHandler.handleEvent.bind(pilotEventHandler),
      onClose: events.notifyDisconnected.bind(events)
    })
  }

  this.reconnect()
}

Pilot.prototype.setColors = function(config) {
  if (!auth.hasResourcePermission("Status", "ReadWrite")) {
    return
  }
  if (this.setColorsCache === JSON.stringify(config)) {
    return
  }
  this.setColorsCache = JSON.stringify(config)
  function off() { return 0; }
  function on(color) { return (1 << 3) | color } // eslint-disable-line no-bitwise
  function dim(color) { return (2 << 3) | color } // eslint-disable-line no-bitwise
  function blink(pattern, color) {
    if (pattern === "pulse-fast") {
      return (4 << 3) | color // eslint-disable-line no-bitwise
    } else if (pattern === "pulse-slow") {
      return (5 << 3) | color // eslint-disable-line no-bitwise
    } else if (pattern === "decay") {
      return (6 << 3) | color // eslint-disable-line no-bitwise
    } else {
      return (3 << 3) | color // eslint-disable-line no-bitwise
    }
  }

  config = config || {}
  var buttonMap = {
    center: 7,
    check: 4,
    circle: 6,
    cross: 5,
    down: 3,
    left: 1,
    right: 2,
    up: 0
  }
  var colorMap = {
    red: 0,
    green: 1,
    blue: 2,
    yellow: 3,
    white: 4,
  }
  var colors = _.fill(Array(9), 0)
  for (var key in config) {
    var value = config[key]
    if (key in buttonMap) {
      if (!value.color || value.color === "off") {
        colors[buttonMap[key]] = off()
      } else {
        var color = colorMap[value.color]
        if ("dim" in value) {
          colors[buttonMap[key]] = dim(color)
        } else if ("blink" in value) {
          colors[buttonMap[key]] = blink(value.blink, color)
        } else {
          colors[buttonMap[key]] = on(color)
        }
      }
    }
  }
  return this.sendPilotColors(colors)
}

Pilot.prototype.colorsOff = function() {
  if (auth.hasResourcePermission("Status", "ReadWrite")) {
    return this.com.setPilotColors(_.fill(Array(9), 0))
  }
}

module.exports = Pilot


/***/ }),
/* 76 Startup*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Startup

var ko = __webpack_require__(1)
var _ = __webpack_require__(0)

function Startup(com, isShutDown, isReboot, requestInterval) {
  this.requestInterval = requestInterval >= 0 ? requestInterval : 1000
  this.com = com
  this.isShutDown = isShutDown
  this.isReboot = isReboot
  this.message = ko.observable()
  this.errorMessage = ko.observable()
  this.continueChecking = false
  this.isRunning = ko.observable(false)
  this.disableActions = ko.observable(false)

  _.bindAll(this, "shutdown", "reboot", "stopObserving", "startObserving",
    "checkStatus", "clearErrorMessage")
}

Startup.prototype.clearErrorMessage = function() {
  this.errorMessage(null)
}

Startup.prototype.updateStatus = function(status) {
  var disable = status.tag === "FirmwareUpdate" && status.contents &&
    status.contents.indexOf("Downloading") > -1
  this.disableActions(disable)
  this.message(parseMessage(status))
}

Startup.prototype.startObserving = function() {
  if (!this.continueChecking) {
    this.continueChecking = true
    this.checkStatus()
  }
}

Startup.prototype.stopObserving = function() {
  this.continueChecking = false
  this.isRunning(false)
  this.clearErrorMessage()
}

Startup.prototype.checkStatus = function() {
  var self = this
  return this.com.getIsStartupRunning()
    .then(function(response) {
      self.isRunning(true)
      self.updateStatus(response)
      self.isShutDown(false)
      self.isReboot(false)
    })
    .catch(function() {
      // startup server seems to be not running
      self.isRunning(false)
    })
    .then(function() {
      return new Promise(function(resolve) {
        setTimeout(resolve, self.requestInterval)
      })
    })
    .then(function() {
      if (self.continueChecking) {
        return self.checkStatus()
      }
    })
}

function parseMessage(response) {
  if (response.tag === "WaitingForSystem") {
    return "Waiting for the system"
  } else if (response.tag === "Started") {
    return "System started"
  } else if (response.tag === "FirmwareUpdate") {
    var mapping = {
      "Initial": "Waiting",
      "Downloading": "Downloading",
      "Ok": "Completed",
      "Failed": "Failed",
      "Flashed": "Flashed",
      "Unknown": "Unknown"
    }
    var result = "<b>Firmware update status of each joint:</b><br />"
    _.forEach(response.contents, function(key, idx) {
      var updateStatus
      if (key in mapping) {
        updateStatus = mapping[key]
      } else {
        updateStatus = "..."
      }
      result += (idx + 1) + ": " + updateStatus + "<br />"
    })
    return result + "<br />"
  } else {
    return "..."
  }
}

Startup.prototype.reboot = function() {
  return this.com.rebootStartup()
    .then(function() {
      this.clearErrorMessage()
      this.isReboot(true)
    }.bind(this))
    .catch(function() {
      this.errorMessage("Reboot failed.")
    }.bind(this))
}

Startup.prototype.shutdown = function() {
  return this.com.shutdownStartup()
    .then(function() {
      this.isShutDown(true)
      this.clearErrorMessage()
    }.bind(this))
    .catch(function() {
      this.errorMessage("Shutdown failed.")
    }.bind(this))
}


/***/ }),
/* 77 processMonitor*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = ProcessMonitor

var ko = __webpack_require__(1)
var _ = __webpack_require__(0)

/**
 * Process monitoring. Subscribes to process monitor status published
 * over a web socket by the admin server. If a process dies, the
 * observable ``up`` is set to false.
 * 过程监控。订阅admin服务器通过Web socket发布的进程监视器状态。 如果一个进程死了，可观察的up被设置为false
 */
function ProcessMonitor(com, options) {
  var self = this
  options = options || {}
  this.up = ko.observable(true)
  this.watchdog = _.debounce(function() {
    com.getProcessStatus().catch(function(error) {
      if (error.response) {
        self.up(false)
      } else {
        self.isConnected(false)
      }
    })
  }, options.watchdogTimeout || 10000)
  this.isConnected = ko.observable(false)
  com.onProcessStatus({
    onOpen: this.isConnected.bind(undefined, true),
    onData: this.onEvent.bind(this),
    onClose: this.isConnected.bind(undefined, false)
  })
}

ProcessMonitor.prototype.onEvent = function(event) {
  if (event === "Up") {
    this.up(true)
    this.isConnected(true)
  } else {
    this.up(false)
  }
  this.watchdog()
}


/***/ }),
/* 78 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 79 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 80 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/* 81 App*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = App

/**
* app模块代表整个Web应用程序并提供类 [App]{@link module:app/app.App}.
* @module app/app
* @requires app/drag_drop
* @requires components/library
* @requires components/workspace
*/

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

__webpack_require__(82)
__webpack_require__(83)
__webpack_require__(14)
var auth = __webpack_require__(12)
var util = __webpack_require__(4)

var ArcSlider = __webpack_require__(85)
var arcSliderStyle = __webpack_require__(86)
var arcSliderTemplate = __webpack_require__(87)

var LinearSlider = __webpack_reque__(88)
var linearSliderStyle = __webpackir_require__(89)
var linearSliderTemplate = __webpack_require__(90)

var CheckboxSlider = __webpack_require__(91)
var checkboxSliderStyle = __webpack_require__(92)
var checkboxSliderTemplate = __webpack_require__(93)

var ToggleSlider = __webpack_require__(94)
var toggleSliderStyle = __webpack_require__(95)
var toggleSliderTemplate = __webpack_require__(96)

var DropDownMenu = __webpack_require__(97)
var dropDownMenuStyle = __webpack_require__(99)
var dropDownMenuTemplate = __webpack_require__(100)

var Gripper = __webpack_require__(101)
var gripperStyle = __webpack_require__(102)
var gripperTemplate = __webpack_require__(103)

var GripperControl = __webpack_require__(104)
var gripperControlStyle = __webpack_require__(107)
var gripperControlTemplate = __webpack_require__(108)

var StepNumber = __webpack_require__(109)
var stepNumberStyle = __webpack_require__(110)
var stepNumberTemplate = __webpack_require__(111)

var Resource = __webpack_require__(112)

ko.components.register("one-header", __webpack_require__(113))
ko.components.register("one-robot-status", __webpack_require__(117))
ko.components.register("one-signal-light", __webpack_require__(126))
ko.components.register("one-library", __webpack_require__(130))
ko.components.register("one-timeline", __webpack_require__(139))
ko.components.register("one-execution-status", __webpack_require__(170))

/**
 * Create a new application instance with given url.
 * @class
 * @memberof module:app/app
 * @param {string} url - The base url of the application.
 */
function App(controller) {
  this.controller = controller
  this.library = controller.library
  this.timeline = controller.timeline
  this.execution = controller.execution

  this.mode = ko.observable("program").extend({
    reader: function(value) {
      var execution = controller.execution()
      // When execution fails, One receives an execution update with
      // running === false and state.exitPort === "Error" before errorHandling
      // starts. To prevent flickering this intermediate state is explicitly
      // handled as well
      if (execution && (execution.running ||
                        execution.state && execution.state.exitPort === "Error")) {
        return "work"
      }
      return value
    },
    writer: function(value) {
      var timeline = controller.timeline()
      if (timeline) {
        var unconfiguredPath = _.first(util.getUnconfiguredPaths(timeline))
        if (value === "work" && unconfiguredPath) {
          timeline.contextMenuElement(timeline.getElementAtPath(unconfiguredPath))
          value = "teach"
        }
        if (value === "teach" && !auth.hasResourcePermission("Parameters", "Read")) {
          return "program"
        }
      }
      return value
    }
  })
  this.isStatusPaneExpanded = ko.observable(false)

  // TODO(Lorenz): The three components (arc-slider, checkbox-slider
  // and linear-slider) should be moved to the timeline. As soon as
  // that happens, we can remove the following few lines.
  function makeAPIViewmodel(constructor) {
    return {
      createViewModel: function(params, componentInfo) {
        return new constructor(params, controller.oneAPI, componentInfo.element)
      }
    }
  }

  // Register widgets on component loader
  ko.components.register("arc-slider", {
    viewModel: makeAPIViewmodel(ArcSlider),
    template: "<style scoped>" + arcSliderStyle + "</style>" + arcSliderTemplate
  })
  ko.components.register("checkbox-slider", {
    viewModel: makeAPIViewmodel(CheckboxSlider),
    template: "<style scoped>" + checkboxSliderStyle + "</style>" + checkboxSliderTemplate
  })
  ko.components.register("linear-slider", {
    viewModel: makeAPIViewmodel(LinearSlider),
    template: "<style scoped>" + linearSliderStyle + "</style>" + linearSliderTemplate
  })
  ko.components.register("toggle-slider", {
    viewModel: makeAPIViewmodel(ToggleSlider),
    template: "<style scoped>" + toggleSliderStyle + "</style>" + toggleSliderTemplate
  })
  ko.components.register("drop-down-menu", {
    viewModel: makeAPIViewmodel(DropDownMenu),
    template: "<style scoped>" + dropDownMenuStyle + "</style>" + dropDownMenuTemplate
  })
  ko.components.register("gripper", {
    viewModel: makeAPIViewmodel(Gripper),
    template: "<style scoped>" + gripperStyle + "</style>" + gripperTemplate
  })
  ko.components.register("gripper-control", {
    viewModel: makeAPIViewmodel(GripperControl),
    template: "<style scoped>" + gripperControlStyle + "</style>" + gripperControlTemplate
  })
  ko.components.register("step-number", {
    viewModel: makeAPIViewmodel(StepNumber),
    template: "<style scoped>" + stepNumberStyle + "</style>" + stepNumberTemplate
  })
  ko.components.register("resource", {
    viewModel: makeAPIViewmodel(Resource),
    template: "<style>resource { display: block; }</style>" // no markup
  })
}

App.prototype.handleContextMenu = function(self, event) {
  event.preventDefault()
}

App.prototype.reconnectNavEvents = function() {
  this.controller.pilot.reconnect()
}


/***/ }),
/* 82 创建各种绑定，fullScreen,scroll,tether等*/
/***/ (function(module, exports, __webpack_require__) {

var _ = __webpack_require__(0)
var $ = __webpack_require__(6)
var ko = __webpack_require__(1)
var ResizeObserver = __webpack_require__(41).default
var Tether = __webpack_require__(28)

var util = __webpack_require__(4)

ko.bindingHandlers.clickFullScreen = {
  init: function(element, valueAccessor) {
    // Determine what should be made full screen
    var target = ko.unwrap(valueAccessor())
    if (!util.isNode(target)) {
      target = element
    }
    element.addEventListener("click", function() {
      if (document.fullscreenElement ||
          document.mozFullScreenElement ||
          document.webkitFullscreenElement) {
        if (document.cancelFullScreen) {
          document.cancelFullScreen()
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen()
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen()
        }
      } else {
        if (target.requestFullScreen) {
          target.requestFullScreen()
        } else if (target.mozRequestFullScreen) {
          target.mozRequestFullScreen()
        } else if (target.webkitRequestFullScreen) {
          target.webkitRequestFullScreen()
        }
      }
    })
  }
}

ko.bindingHandlers.scrollIntoViewWhen = {
  update: function(element, valueAccessor) {
    if (ko.unwrap(valueAccessor())) {
      element.scrollIntoView(false)
    }
  }
}

ko.bindingHandlers.capitalText = {
  init: function() {
    return { "controlsDescendantBindings": true }
  },
  update: function(element, valueAccessor) {
    var text = ko.unwrap(valueAccessor())
    ko.utils.setTextContent(element, text.toUpperCase())
  }
}

// absoluteTopAs sets a style="top: ...;", assuming the parent element is its
// relative anchor, to effectively align the element to the current client top
// position of the element referenced by a selector. An offset in px can be set
// optionally.
// Usage:
//   data-bind="absoluteTopAs: 'one-timeline'"
//   data-bind="absoluteTopAs: {selector: 'one-timeline', offset: 5}"
ko.bindingHandlers.absoluteTopAs = {
  update: function(element, valueAccessor) {
    var value = ko.unwrap(valueAccessor())
    var selector = value.selector || value
    var offset = value.offset || 0
    var ref = document.querySelector(selector)
    if (!ref) {
      console.warn("absoluteTopAs binding: invalid selector '" + selector + "'")
      return
    }
    var top = ref.getBoundingClientRect().top - element.parentElement.getBoundingClientRect().top
    top += offset
    element.style.top = top + "px"
  }
}

// absoluteHeightTo sets a style="height: ...;", assuming the parent element
// is its relative anchor, to effectively align the element to the bottom edge
// of the element referenced by a selector. An offset in px can be set
// optionally.
// Usage:
//   data-bind="absoluteHeightTo: 'one-timeline'"
//   data-bind="absoluteHeightTo: {selector: 'one-timeline', offset: 5}"
ko.bindingHandlers.absoluteHeightTo = {
  init: function(element, valueAccessor) {
    window.addEventListener("resize", _.partial(absoluteHeightTo, element, valueAccessor))
  },
  update: absoluteHeightTo
}

function absoluteHeightTo(element, valueAccessor) {
  var value = ko.unwrap(valueAccessor())
  var selector = value.selector || value
  var offset = value.offset || 0
  var ref = document.querySelector(selector)
  if (!ref) {
    console.warn("absoluteHeightTo binding: invalid selector '" + selector + "'")
    return
  }
  var refRect = ref.getBoundingClientRect()
  var elementRect = element.parentElement.getBoundingClientRect()
  var height = refRect.height - (elementRect.top - refRect.bottom)
  height += offset
  element.style.height = height + "px"
}

ko.bindingHandlers.maxWidthAs = {
  init: function(element, valueAccessor) {
    var value = ko.unwrap(valueAccessor())
    var selector = value.selector || value
    var ref = document.querySelector(selector)
    if (!ref) {
      console.warn("maxWidthAs binding: invalid selector '" + selector + "'")
      return
    }
    window.addEventListener("resize", _.partial(maxWidthAs, element, valueAccessor))
    ref.addEventListener("scroll", _.partial(maxWidthAs, element, valueAccessor))
  },
  update: maxWidthAs
}

function maxWidthAs(element, valueAccessor) {
  var value = ko.unwrap(valueAccessor())
  var selector = value.selector || value
  var offset = value.offset || 0
  var ref = document.querySelector(selector)
  if (!ref) {
    console.warn("maxWidthAs binding: invalid selector '" + selector + "'")
    return
  }
  var refRect = ref.getBoundingClientRect()
  element.style.maxWidth = (refRect.width + offset) + "px"
}

ko.bindingHandlers.maxHeightTo = {
  init: function(element, valueAccessor) {
    var value = ko.unwrap(valueAccessor())
    var selector = value.selector || value
    var ref = document.querySelector(selector)
    if (!ref) {
      console.warn("maxHeightTo binding: invalid selector '" + selector + "'")
      return
    }
    window.addEventListener("resize", _.partial(maxHeightTo, element, valueAccessor))
    ref.addEventListener("scroll", _.partial(maxHeightTo, element, valueAccessor))

    // Observe resizes on the reference object
    new ResizeObserver(function() {
      maxHeightTo(element, valueAccessor)
    }).observe(ref);
  },
  update: maxHeightTo
}

function maxHeightTo(element, valueAccessor) {
  var value = ko.unwrap(valueAccessor())
  var selector = value.selector || value
  var offset = value.offset || 0
  var ref = document.querySelector(selector)
  if (!ref) {
    console.warn("maxHeightTo binding: invalid selector '" + selector + "'")
    return
  }
  var refRect = ref.getBoundingClientRect()
  var elementRect = element.getBoundingClientRect()
  var maxHeight = refRect.height - (elementRect.top - refRect.top)
  element.style.maxHeight = (maxHeight + offset) + "px"
}

ko.bindingHandlers.scrollLeftTo = {
  update: function(element, valueAccessor) {
    var value = ko.unwrap(valueAccessor())
    var selector = value.selector || value
    var offset = value.offset || 0
    var when = true
    if (value.when !== undefined) {
      when = ko.unwrap(value.when)
    }
    var disableScrollWhen = false
    if (value.disableScrollWhen !== undefined) {
      disableScrollWhen = ko.unwrap(value.disableScrollWhen)
    }
    var ref = document.querySelector(selector)
    if (!ref) {
      console.warn("scrollLeftTo binding: invalid selector '" + selector + "'")
      return
    }
    if (when) {
      element.dataset.scroll = ref.scrollLeft
      var pos = element.getBoundingClientRect().left + ref.scrollLeft -
                ref.getBoundingClientRect().left + offset
      ref.style.overflow = disableScrollWhen ? "hidden" : ""
      scrollLeftTo(ref, pos, 500)
    } else if (element.dataset.scroll) {
      ref.style.overflow = ""
      scrollLeftTo(ref, element.dataset.scroll, 500)
      delete element.dataset.scroll
    }
  }
}

var scrollLeftTo = function(element, pos, duration, done) {
  if (pos < element.dataset.scroll || element.dataset.scroll === undefined) {
    element.dataset.scroll = pos
  }
  done = done || function() {}
  $(element).stop().animate({ scrollLeft: element.dataset.scroll }, duration, "swing", function() {
    delete element.dataset.scroll
    done()
  })
}

// animateVisible uses the jquery .show() and .hide() to animate the 'display'
// property of an element
ko.bindingHandlers.animateVisible = {
  init: function(element, valueAccessor) {
    if (ko.unwrap(valueAccessor())) {
      element.style.display = ""
    } else {
      element.style.display = "none"
    }
  },
  update: function(element, valueAccessor) {
    if (ko.unwrap(valueAccessor())) {
      $(element).show(300)
    } else {
      $(element).hide(300)
    }
  }
}

// fadeVisible uses the jquery .fadeIn() and .fadeOut() to animate the
// 'display' property of an element
ko.bindingHandlers.fadeVisible = {
  init: function(element, valueAccessor) {
    if (ko.unwrap(valueAccessor())) {
      element.style.display = ""
    } else {
      element.style.display = "none"
    }
  },
  update: function(element, valueAccessor) {
    if (ko.unwrap(valueAccessor())) {
      $(element).fadeIn(100)
    } else {
      $(element).fadeOut(100)
    }
  }
}

ko.bindingHandlers.replaceHTML = {
  init: function() {
    return { controlsDescendantBindings: true }
  },
  update: function(element, value, allbindings, viewmodel, context) {
    value = ko.unwrap(value())
    // If not already HTML, parse to HTML. Note: also strips/ignores all script tags
    if (typeof value === "string") {
      value = $.parseHTML(value)
    }
    if (_.isArray(value)) {
      value = value[0]
    }
    if (!_.isElement(value)) {
      return
    }
    $(value).attr("data-bind", $(element).attr("data-bind"))
    if (value.outerHTML !== element.outerHTML) {
      ko.cleanNode(element)
      var parent = element.parentElement
      parent.replaceChild(value, element)
      ko.applyBindings(context, value)
    }
  }
}

// Radio-button like binding on to an element, which sets a given "value" on
// the bound observable. If the current value in the observable matches "value",
// an "active" attribute is set on the DOM element.
ko.bindingHandlers.radioActive = {
  init: function(element, valueAccessor, allbindings) {
    var currentValue = valueAccessor()
    var value = allbindings.get("value")
    if (!currentValue || !value) {
      throw new Error("radioActive binding requires a target observable and a value!")
    }
    element.addEventListener("click", function() {
      currentValue(value)
    })
  },
  update: function(element, valueAccessor, allbindings) {
    var currentValue = ko.unwrap(valueAccessor())
    var value = ko.unwrap(allbindings.get("value"))
    if (currentValue === value) {
      element.setAttribute("active", "")
    } else {
      element.removeAttribute("active")
    }
  }
}

// Tethers a selector-element to the binded-element.
// If a uniqueFor-element is defined, then the selector-element will be tethered
// only once inside this uniqueFor-element. When the uniqueFor-element is removed
// from the DOM, the selector-element will be destroyed as well.
ko.bindingHandlers.tether = {
  create: function(element, selector, options) {
    var tether = $.data(element, selector + "_tether")
    if (tether) {
      tether.setOptions(options)
    } else {
      var t = new Tether(options)
      // Reposition continuously while binding lives. This fixes wrong tether
      // positions during asynchronous loads (e.g. in components)
      var interval = window.setInterval(t.position, 100)
      $.data(element, selector + "_tether", t)
      $.data(element, selector + "_interval", interval)
    }
  },
  cleanup: function(element, selector) {
    var tether = $.data(element, selector + "_tether")
    if (tether) {
      tether.destroy()
      $.removeData(element, selector + "_tether")
      window.clearInterval($.data(element, selector + "_interval"))

      // remove associated tether element
      $(selector + ".tether-element").remove()
    }
  },
  init: function(element, valueAccessor) {
    var value = ko.unwrap(valueAccessor())
    var selector = value.selector
    var holdingElement = value.uniqueFor ? document.querySelector(value.uniqueFor) : element
    if (!holdingElement) {
      console.warn("tether binding: holding element not found for selector", value.uniqueFor)
      return
    }
    ko.utils.domNodeDisposal.addDisposeCallback(holdingElement, function() {
      ko.bindingHandlers.tether.cleanup(holdingElement, selector)
    })
  },
  update: function(element, valueAccessor) {
    var value = ko.unwrap(valueAccessor())
    var selector = value.selector
    var attachment = value.attachment
    var targetAttachment = value.targetAttachment
    var when
    if (value.when !== undefined) {
      when = ko.unwrap(value.when)
    }
    var ref = document.querySelector(selector)
    if (!ref || !attachment || !targetAttachment) {
      console.warn("tether binding: invalid attributes")
      return
    }

    if (when) {
      var holdingElement = value.uniqueFor ? document.querySelector(value.uniqueFor) : element
      if (!holdingElement) {
        console.warn("tether binding: holding element not found for selector", value.uniqueFor)
        return
      }
      ko.bindingHandlers.tether.create(holdingElement, selector, {
        element: selector,
        target: element,
        attachment: attachment,
        targetAttachment: targetAttachment,
        offset: value.offset || "0",
        constraints: value.constraints || [{
          to: "window",
          pin: true
        }]
      })
    }
  }
}


/***/ }),

/* 83 创建新的绑定drag，drop，依赖DragDropApi（84）*/
/***/ (function(module, exports, __webpack_require__) {

var _ = __webpack_require__(0)
var $ = __webpack_require__(6)
var ko = __webpack_require__(1)

var DragDropApi = __webpack_require__(84)

ko.bindingHandlers.drag = {
  init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
    var value = valueAccessor() || {}
    var dragstart = value.dragstart || (_.isFunction(value) && value) ||
                          function() { return viewModel }
    var dragend = value.dragend || function() {}

    var draggable = new DragDropApi.Draggable(value.group, element, {
      dragstart: function(event) {
        $(event.currentTarget).addClass("hollow")
        return dragstart(event, viewModel) || viewModel
      },
      drag: value.drag,
      dragend: function(dropped, data, event) {
        $(event.currentTarget).removeClass("hollow")
        dragend(dropped, data, event)
      },
      hint: value.hint,
      cursorOffset: value.cursorOffset
    })
    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
      draggable.dispose()
    })
  }
}

ko.bindingHandlers.drop = {
  init: function(element, valueAccessor) {
    var value = valueAccessor() || {}

    var dropTarget = new DragDropApi.DropTarget(value.group, element, {
      drop: value.drop,
      accept: value.accept,
      dragenter: value.dragenter,
      dragleave: value.dragleave
    })
    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
      dropTarget.dispose()
    })
  }
}

/***/ }),

/* 84 DragDropApi*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * 该模块提供了拖放的API。 有了它，可以创建Draggables和DropTargets
*/
module.exports = {
  Draggable: Draggable,
  DropTarget: DropTarget
}

var _ = __webpack_require__(0)
var $ = __webpack_require__(6)

// To enable this Drag&Drop implementation on all browsers, this polyfill is required.js库,主要抚平不同浏览器之间对js实现的差异
__webpack_require__(42)

// Disable default drag/drop behavior of browser
document.addEventListener("dragenter", function(event) {
  event.preventDefault()
})
document.addEventListener("dragleave", function(event) {
  event.preventDefault()
})
document.addEventListener("dragover", function(event) {
  event.preventDefault()
})
document.addEventListener("drop", function(event) {
  event.preventDefault()
})

// In this object, all configurations of DropTargets are stored
var targetConfigs = {}

function getTargetsForGroup(group) {
  group = group || "default"
  if (!(group in targetConfigs)) {
    targetConfigs[group] = []
  }
  return targetConfigs[group]
}

function isInside(xPos, yPos, element) {
  var rect = element.getBoundingClientRect()
  return xPos >= rect.left &&
    xPos <= rect.right &&
    yPos >= rect.top &&
    yPos <= rect.bottom
}

/**
 * Draggables can be dragged and dropped onto DropTargets.
 *   @param {string} group - Defines which Draggable belongs to which DropTarget(s).
 *   @param {Element} element - The element to be dragged.
 *   @param {object} options - The object containing all optional and required parameters.
 *     It contains the following keys:
 *     @param {function(viewModel, event)} drag - Callback during dragging when the pointer moves.
 *     @param {function(viewModel, event)} dragstart - Callback when dragging starts. Whatever dragstart
 *       returns, will be passed to other callbacks.
 *     @param {function(viewModel, event)} dragend - Callback when dragging ends.
 *     @param {function(element)} hint - Callback when dragging starts.
 *     @param {object} cursorOffset - Defines the offset of the element to the cursor,
 *     e.g. {left: -10, top: -10}.
*/
function Draggable(group, element, options) {
  options = _.cloneDeep(options)

  // Prevent the browser from interpreting touch actions on the element itself.
  // This solves the issue of pointercancel events when dragging the element,
  // when the element has a scrollable parent.
  // Setting the attribute instead of the style is required by the pepjs polyfill.
  element.setAttribute("touch-action", "none")

  var dragging = false
  var hintElement = null
  var drag = options.drag || function() {}
  var dragend = options.dragend || function() {}
  var dragstart = options.dragstart || function() {}
  var hint = options.hint || function(element) {
    var clone = $(element).clone()
    clone.addClass("dragging")
    return clone
  }
  var cursorOffset = this.cursorOffset = options.cursorOffset
  var dragStartRadius = options.dragStartRadius
  if (dragStartRadius === null || dragStartRadius === undefined) {
    dragStartRadius = 20
  }
  var dragStartData = null
  var dragStartPosition = null

  function onDown(ev) {
    if (ev.button === 0) {
      ev.currentTarget.setPointerCapture(ev.pointerId)
      dragStartPosition = { x: ev.clientX, y: ev.clientY }
    }
  }
  function onMove(ev) {
    if (dragStartPosition) {
      if (!dragging) {
        var distance = Math.sqrt(
          Math.pow(ev.clientX - dragStartPosition.x, 2) +
          Math.pow(ev.clientY - dragStartPosition.y, 2)
        )
        if (distance >= dragStartRadius) {
          dragStartData = dragstart(ev)
          if (dragStartData) {
            dragging = true
          } else {
            console.error("Dragstart has to return the data to be dragged")
          }
        }
      } else {
        updateHint(ev)
        drag(dragStartData, ev)
        _.forEach(getTargetsForGroup(group), function(target) {
          target.onDrag(dragStartData, ev)
        })
      }
    }
  }
  function onUp(ev) {
    dragStartPosition = null
    var dropData = null
    if (dragging) {
      dragging = false
      _.forEach(getTargetsForGroup(group), function(target) {
        dropData = target.tryDrop(dragStartData, ev)
        if (dropData) {
          // currently, accept only one drop target at a time -
          // so drop at the first one which accepts
          return false
        }
      })
      dragend(!!dropData, dropData, ev)
      removeHint(!!dropData)
    }
    ev.currentTarget.releasePointerCapture(ev.pointerId)
  }
  function onCancel(ev) {
    dragging = false
    dragend(false, undefined, ev)
    removeHint(false)
    dragStartPosition = null
  }
  function updateHint(event) {
    if (hint) {
      if (!hintElement) {
        hintElement = $(hint($(element)))
        hintElement.css({ "z-index": 1000, position: "absolute" })
        hintElement.appendTo(document.body)
      }
      if (hintElement) {
        var left = event.clientX - hintElement.width() / 2
        var top = event.clientY - hintElement.height() / 2
        if (cursorOffset) {
          if (cursorOffset.left) {
            left += cursorOffset.left
          }
          if (cursorOffset.top) {
            top += cursorOffset.top
          }
        }
        $(hintElement).css({"transform": "translate(" + left + "px, " + top + "px)"})
      }
    }
  }
  function removeHint(dropAccepted) {
    function remove() {
      hintElement.remove()
      hintElement = null
    }
    if (hintElement) {
      if (dropAccepted) {
        remove()
      } else {
        var left = element.getBoundingClientRect().left - hintElement.offset().left
        var top = element.getBoundingClientRect().top - hintElement.offset().top
        if (cursorOffset) {
          if (cursorOffset.left) {
            left -= cursorOffset.left
          }
          if (cursorOffset.top) {
            top -= cursorOffset.top
          }
        }
        hintElement.animate(
          {"left": left, "top": top},
          {
            duration: 200,
            specialEasing: {
              width: "linear",
              height: "easeOutBounce"
            },
            complete: remove
          }
        )
      }
    }
  }
  this.dispose = function() {
    element.removeEventListener("pointermove", onMoveListener)
    element.removeEventListener("pointerdown",  onDown)
    element.removeEventListener("pointerup", onUp)
    element.removeEventListener("pointercancel", onCancel)
    element.removeAttribute("touch-action")
    removeHint(false)
  }

  function onMoveListener(event) { _.defer(onMove, event) }
  element.addEventListener("pointermove", onMoveListener, false)
  element.addEventListener("pointerdown",  onDown)
  element.addEventListener("pointerup", onUp)
  element.addEventListener("pointercancel", onCancel)
  element.addEventListener("lostpointercapture", onCancel)
}

/**
 *  On DropTargets, multiple Draggables can be dropped.
 *  @param {string} group - Defines which Draggable(s) this DropTarget(s) accepts.
 *  @param {Element} element - The element on which Draggables can be dropped.
 *  @param {object} options - The object containing all optional and required parameters.
 *    It contains the following keys:
 *    @param {function(viewModel, event)} drop - Callback when the Draggable was dropped.
 *    @param {function(viewModel, event)} dragenter - Callback when DropTarget's area is entered.
 *    @param {function(viewModel, event)} dragleave - Callback when DropTarget's area is left.
 *    @param {function(viewModel, event)} accept - Callback that checks if a Draggable is accepted.
*/
function DropTarget(group, element, options) {
  var groupConfig = getTargetsForGroup(group)
  groupConfig.push(this)

  var drop = options.drop || function() {}
  var dragenter = options.dragenter || function() {}
  var dragleave = options.dragleave || function() {}
  var accept = options.accept || function() { return true }
  var entered = false

  this.dispose = function() {
    targetConfigs[group] = groupConfig.filter(function(target) {
      return target !== this
    }.bind(this))
    if (targetConfigs[group] && targetConfigs[group].length === 0) {
      delete targetConfigs[group]
    }
  }

  this.onDrag = function(data, ev) {
    if (isInside(ev.clientX, ev.clientY, element)) {
      if (!entered && accept(data, ev)) {
        dragenter(data, ev)
        entered = true
      }
    } else if (entered && accept(data, ev)) {
      dragleave(data, ev)
      entered = false
    }
  }
  this.tryDrop = function(dragData, ev) {
    if (isInside(ev.clientX, ev.clientY, element) && accept(dragData, ev)) {
      return drop(dragData, ev) || {}
    }
  }
}


/***/ }),

/* 85 ArcSlider viewModel*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * This module defines a circular slider component.
 *
 * The following example shows hot to use the component in HTML code:
 *
 * ```
 * <arc-slider params="value: parameter('angle')" />
 * ```
 *
 * Only the `value` parameter is required. However, a number of
 * optional parameters are possible as well:
 *
 *  * `value`: The (mandatory) value object containgin the slider's value.
 *  * `min`: The smallest possible value (default 0).
 *  * `max`: The greatest possible value (default infinite).
 *  * `zeroValue`: The value corresponding to 0 degrees.
 *  * `fullValue`: The value corresponding to 360 degrees.
 *  * `unit`: The unit as a string (default '&deg').
 *  * `sound`: A URI of a sound file to play when the user changes the value.
 *  * `step`: A 'Step' object of the owning step of this component.
 *  * `increment`: The step width to use for left and right (requires 'events').
 *
 * @module components/widgets/arc_slider
 */
module.exports = ArcSlider

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)
var $ = __webpack_require__(6)
var util = __webpack_require__(15)

function normalizeVector(v) {
  var norm = Math.sqrt(v.x * v.x + v.y * v.y)
  return { x: v.x / norm, y: v.y / norm }
}

function computeAngleDelta(v1, v2) {
  if ((v1.x === 0 && v1.y === 0) || (v2.x === 0 && v2.y === 0)) {
    return 0
  }
  var deltaAngle = Math.acos(v1.x * v2.x + v1.y * v2.y)
  if (isNaN(deltaAngle)) {
    return 0
  }
  if (v1.x * v2.y - v1.y * v2.x < 0) {
    deltaAngle *= -1
  }
  return deltaAngle * 180 / Math.PI
}

function elementCenter(element) {
  var elementBox = element.getBoundingClientRect()
  return {
    x: elementBox.left + elementBox.width / 2,
    y: elementBox.top + elementBox.height / 2
  }
}

ko.bindingHandlers.svgArcPath = {
  update: function(element, valueAccessor) {
    var params = valueAccessor()
    if (params.angle === undefined ||
        params.radius === undefined ||
        params.x === undefined ||
        params.y === undefined) {
      throw new Error("Missing arguments. Required: angle, radius, x and y")
    }
    var angle = params.angle * Math.PI / 180
    var end = { x: Math.sin(angle), y: Math.cos(angle) }
    if (angle >= 0) {
      element.setAttribute(
        "d", "M" + params.x + "," + params.y +
          " a" + params.radius + "," + params.radius +
          " 0 " + (end.x < 0 ? 1 : 0) + ",1 " +
          end.x * params.radius + "," + (params.radius - end.y * params.radius))
    } else {
      element.setAttribute(
        "d", "M" + params.x + "," + params.y +
          " a" + params.radius + "," + params.radius +
          " 0 " + (end.x < 0 ? 0 : 1) + ",0 " +
          end.x * params.radius + "," + (params.radius - end.y * params.radius))
    }
  }
}

function ArcSlider(params, api) {
  _.bindAll(this, "mouseDown", "touchStart", "dragStart", "drag",
            "startEditing", "commitEditing", "discardEditing", "editingKeydown")

  if (!params.value || !params.step) {
    throw new Error("ArcSlider requires parameters: value, step")
  }

  this.configured = ko.pureComputed(function() {
    return params.value() !== undefined && params.value() !== null
  })
  this.min = util.or(params.min, 0)
  this.max = util.or(params.max, Infinity)
  this.zeroValue = util.or(params.zeroValue, 0)
  this.fullValue = util.or(params.fullValue, 360)
  var increment = this.increment = util.or(params.increment, 1)
  this.unit = util.or(params.unit, "&deg")
  var value = this.value = ko.pureComputed({
    read: function() {
      return util.clamp(util.or(params.value(), this.zeroValue), this.min, this.max)
    },
    write: function(newValue) {
      params.value(util.clamp(util.or(newValue, this.zeroValue), this.min, this.max))
    }
  }, this)
  this.mappedAngle = ko.pureComputed(function() {
    return this.mapRangeToAngle(this.value())
  }, this)
  this.displayUnit = ko.pureComputed(function() {
    return util.pluralize(this.unit, this.value())
  }, this)

  // needed to store unrounded value
  this.arcValue = ko.observable(null)
  this.editValue = ko.observable(null)
  this.editing = ko.pureComputed(function() { return this.editValue() !== null }, this)

  params.sound = params.sound || "navigate"
  var playSound = this.playSound = _.partial(api.playSound, api.sounds[params.sound])

  var minus = function() {
    value(this.roundToIncrement(Math.ceil(value() / increment) * increment - increment))
    playSound()
  }

  var plus = function() {
    value(this.roundToIncrement(Math.floor(value() / increment) * increment + increment))
    playSound()
  }

  params.step.update(function() {
    var pilot = {}
    if (this.editing()) {
      pilot.circle = pilot.check = pilot.cross = pilot.left = pilot.right = pilot.up = pilot.down = {}
    } else {
      pilot.circle = { label: "set" }
      pilot.check = {
        label: "next",
        highlight: true,
      }
      pilot.circle.click = pilot.check.click = function() {
        playSound()
        // ensure a non-null value in the parameter
        this.value(this.value())
        params.step.done()
      }
      if (this.value() > this.min) {
        pilot.left = { click: minus, highlight: true }
      }
      if (this.value() < this.max) {
        pilot.right = { click: plus, highlight: true }
      }
    }
    return { pilot: pilot }
  }, this)
}

ArcSlider.prototype.mouseDown = function(_, event) {
  if (this.editing()) {
    return true
  }
  var onMove = function(event) {
    this.drag(event.clientX, event.clientY)
  }.bind(this)
  $(document).one("mouseup", function() {
    $(document).off("mousemove", onMove);
    this.playSound()
  }.bind(this))
  $(document).on("mousemove", onMove)
  this.dragStart(elementCenter(event.currentTarget), event.clientX, event.clientY)
}

ArcSlider.prototype.touchStart = function(_, event) {
  if (this.editing()) {
    return true
  }
  var onMove = function(event) {
    this.drag(event.originalEvent.touches[0].clientX,
              event.originalEvent.touches[0].clientY)
  }.bind(this)
  $(document).one("touchend", function() {
    $(document).off("touchmove", onMove)
    this.playSound()
  }.bind(this))
  $(document).on("touchmove", onMove)
  this.dragStart(
    elementCenter(event.currentTarget),
    event.originalEvent.touches[0].clientX, event.originalEvent.touches[0].clientY)
}

ArcSlider.prototype.dragStart = function(center, x, y) {
  var v1 = normalizeVector({
    x: x - center.x,
    y: y - center.y
  })
  this.dragData = { center: center, v1: v1 }
  var deltaAngle = computeAngleDelta({x: 0, y: -1}, v1)
  if (deltaAngle < 0 && (this.value() || this.value() === 0)) {
    deltaAngle += 360
  }
  var valueForZeroDegrees = Math.floor((this.value() - this.zeroValue) / this.fullValue) * this.fullValue + this.zeroValue
  this.arcValue(valueForZeroDegrees + this.mapAngleToRange(deltaAngle))
  this.value(this.roundToIncrement(this.arcValue()))
}

ArcSlider.prototype.drag = function(x, y) {
  var v1 = this.dragData.v1
  var v2 = normalizeVector({ x: x - this.dragData.center.x, y: y - this.dragData.center.y })
  var deltaAngle = computeAngleDelta(v1, v2)
  var newValue = this.arcValue() + this.mapAngleToRange(deltaAngle)
  this.value(this.roundToIncrement(newValue))
  if (newValue < this.min) {
    this.arcValue(this.min)
  } else if (newValue > this.max) {
    this.arcValue(this.max)
  } else {
    this.dragData.v1 = v2
    this.arcValue(newValue)
  }
}

// Maps a value to degrees where this.zeroValue corresponds to 0
// degrees and this.fullValue to 360 degrees.
ArcSlider.prototype.mapRangeToAngle = function(value) {
  return (value - this.zeroValue) / (this.fullValue - this.zeroValue) * 360
}

// Maps an angle between 0 and 360 degrees to a value between
// this.zeroValue and this.fullValue
ArcSlider.prototype.mapAngleToRange = function(angle) {
  return (angle * (this.fullValue - this.zeroValue)) / 360 + this.zeroValue
}

ArcSlider.prototype.startEditing = function() {
  this.editValue(this.value())
}

ArcSlider.prototype.commitEditing = function() {
  if (!this.editing()) {
    return
  }
  this.playSound()
  this.value(Number(this.editValue()))
  this.editValue(null)
}

ArcSlider.prototype.discardEditing = function() {
  if (!this.editing()) {
    return
  }
  this.playSound()
  this.editValue(null)
}

ArcSlider.prototype.editingKeydown = function(_, event) {
  switch (event.which) {
  case 13: // enter
    this.editValue(event.currentTarget.value)
    this.commitEditing();
    event.stopPropagation();
    break;
  case 27: // escape
    this.discardEditing();
    event.stopPropagation();
    break;
  }
  return true;
}

ArcSlider.prototype.roundToIncrement = function(value) {
  return Math.round(value / this.increment) * this.increment
}

/***/ }),
/* 86 ArcSlider style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 87 ArcSlider template*/
/***/ (function(module, exports) {

module.exports =

    "<step id="arc-slider" configured="configured()">
        <svg viewBox="-30 -30 360 360" preserveAspectRatio="none meet" class="arc" data-bind="
        event: { mousedown: mouseDown, touchstart: touchStart },
        css: { focused: step.focused },
        requireAuth: {resource: 'Parameters',enableIf: 'ReadWrite'}">
        <circle cx="150" cy="150" r="149" stroke="#888888" stroke-width="1" fill="none"/>
            <!-- ko if: value() > fullValue || value() < -fullValue -->
        <circle cx="150" cy="150" r="135" class="stroke-dark" stroke-width="30" fill="none"/>
            <!-- /ko -->
            <!-- ko if: value() == fullValue -->
            <circle cx="150" cy="150" r="135" class="stroke" stroke-width="30" fill="none"/>
            <!-- /ko -->
            <path class="stroke" stroke-width="30" fill="none"data-bind="svgArcPath: { x: 150, y: 15, angle: mappedAngle(), radius: 135 }" />
            <!-- ko if: value() >= fullValue -->
        <circle cx="150" cy="150" r="149" class="stroke-highlight" fill="none" stroke-width="1" fill="none" />
            <!-- /ko -->
            <!-- ko if: value() < fullValue -->
            <path class="stroke-highlight" stroke-width="2" fill="none"data-bind="svgArcPath: { x: 150, y: 0, angle: mappedAngle(), radius: 150 }" />
            <!-- /ko -->
            <line x1="150" y1="0" x2="150" y2="30" class="stroke-highlight" stroke-width="5" />
            <g class="stroke-highlight" data-bind="attr: { transform: 'rotate(' + mappedAngle() + ' 150 150)' }">
            <line x1="150" y1="-10" x2="150" y2="30" stroke-width="5" />
            <circle class="fill-highlight" cx="150" cy="-20" r="10" />
            </g>
            </svg>
            <div class="arc-value"><!-- ko if : editing() -->
        <input class="percentage" type="number" data-bind="value: editValue, hasFocus: true,attr: { min: min, max: max, step: increment },event: {blur: commitEditing,keydown: editingKeydown}" /><!-- /ko -->
            <!-- ko if : !editing() -->
            <div class="percentage" data-bind="html: value, click: startEditing,css: { focused: step.focused },requireAuth: {resource: 'Parameters',enableIf: 'ReadWrite'}">
            </div>
            <!-- /ko -->
            <div class="percentage unit" data-bind="html: displayUnit, click: startEditing,">
            </div>
            </step>";

/***/ }),

/* 88 LinearSlider viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = LinearSlider

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)
var util = __webpack_require__(15)

__webpack_require__(14)

function LinearSlider(params, api, element) {
  _.bindAll(this, "startEditing", "finishInput", "onValueChange", "plus", "minus")
  if (!params.value) {
    throw new Error("LinearSlider requires parameters: value")
  }
  if (ko.unwrap(params.min) === ko.unwrap(params.max) &&
    ko.unwrap(params.min) !== undefined && ko.unwrap(params.min) !== null) {
    throw new Error("LinearSlider requires parameters min and max to be distinct")
  }

  this.step = params.step
  this.parameterValue = params.value
  this.configured = ko.pureComputed(function() {
    return params.value() !== undefined && params.value() !== null
  })
  this.min = ko.pureComputed(function() {
    return util.or(ko.unwrap(params.min), 0)
  }, this)
  this.max = ko.pureComputed(function() {
    return util.or(ko.unwrap(params.max), 10)
  }, this)
  this.initial = ko.pureComputed(function() {
    return util.or(ko.unwrap(params.initial), this.min())
  }, this)
  this.unit = ko.pureComputed(function() {
    return util.or(ko.unwrap(params.unit), "")
  }, this)
  this.displayFunction = ko.pureComputed(function() {
    return util.or(
      ko.unwrap(params.displayFunction),
      function(val) { return val }
    )
  }, this)
  this.increment = ko.pureComputed(function() {
    return util.or(ko.unwrap(params.increment), 1)
  }, this)
  this.editing = util.or(params.editing, ko.observable(false))

  this.sound = util.or(params.sound, "navigate")
  this.track = element.querySelector(".slider-track")

  this.playSound = _.partial(api.playSound, api.sounds[this.sound])

  this.value = ko.pureComputed({
    read: function() {
      return util.clamp(util.or(this.parameterValue(), this.initial()), this.min(), this.max())
    },
    write: function(newValue) {
      newValue = util.clamp(util.or(newValue, this.initial()), this.min(), this.max())
      if (newValue !== this.parameterValue()) {
        this.playSound()
        this.parameterValue(newValue)
      }
    }
  }, this)

  this.displayValue = ko.pureComputed(function() {
    return this.displayFunction()(this.value())
  }, this)
  this.displayUnit = ko.pureComputed(function() {
    return util.pluralize(this.unit(), this.value())
  }, this)

  this.handlePosition = ko.pureComputed(function() {
    var val = (this.value() - this.min()) * this.stepLength()
    return val + "px"
  }, this)

  params.step.update(function() {
    var pilot = {}
    if (this.editing()) {
      pilot.circle = pilot.check = pilot.cross = pilot.left = pilot.right = pilot.up = pilot.down = {}
    } else {
      pilot.circle = { label: "set" }
      pilot.check = { label: "next", highlight: true }
      pilot.circle.click = pilot.check.click = function() {
        this.playSound()
        this.value(this.value())
        params.step.done()
      }
      pilot.left = { click: this.minus, highlight: this.value() > this.min() }
      pilot.right = { click: this.plus, highlight: this.value() < this.max() }
    }
    return { pilot: pilot }
  }, this)
}

LinearSlider.prototype.stepLength = function() {
  return this.track.clientWidth / (this.max() - this.min())
}

LinearSlider.prototype.dispose = function() {
  _.invoke(this.subs, "dispose")
  this.subs = []
}

LinearSlider.prototype.startEditing = function() {
  this.editing(true)
}

LinearSlider.prototype.minus = function() {
  this.value(this.roundToIncrement(
    Math.ceil((this.value() / this.increment()).toPrecision(8)) * this.increment() - this.increment()
  ))
  this.playSound()
}

LinearSlider.prototype.plus = function() {
  this.value(this.roundToIncrement(
    Math.floor((this.value() / this.increment()).toPrecision(8)) * this.increment() + this.increment()
  ))
  this.playSound()
}

LinearSlider.prototype.onValueChange = function(_, event) {
  var clientX = event.clientX ? event.clientX : event.originalEvent.touches[0].clientX
  var minX = this.track.getBoundingClientRect().left
  var maxX = this.track.getBoundingClientRect().right
  var percentage = (clientX - minX) / (maxX - minX)
  var newValue = this.min() + percentage * (this.max() - this.min())
  this.value(this.roundToIncrement(newValue))
}

LinearSlider.prototype.finishInput = function(newValue) {
  if (newValue) {
    this.playSound()
    this.value(Number(newValue))
  }
  this.editing(false)
}

LinearSlider.prototype.roundToIncrement = function(value) {
  return Math.round(value / this.increment()) * this.increment()
}


/***/ }),
/* 89 LinearSlider style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 90 LinearSlider template*/
/***/ (function(module, exports) {

module.exports = "<step id="linear-slider" configured="configured()">
        <div class="linear-slider" data-bind="css: { focused: step && step.focused },requireAuth: {resource: 'Parameters',enableIf: 'ReadWrite'}">
            <div class="slider-button" data-bind="click: minus" ><</div>
            <div class="slider-inside" data-bind="click: onValueChange">
            <div class="slider-track">
            <div class="slider-filled" data-bind="style: { width: handlePosition }">
            </div>
            </div>
            <div class="slider-cursor" data-bind="style: { left: handlePosition }">
            <div class="draghandle" data-bind="  drag: {    group : 'slider-inside',    drag: onValueChange  }">
            </div>
            </div>
            </div>
            <div class="slider-button" data-bind="click: plus">></div>
            <div class="slider-value-wrapper">
            <!-- ko if: editing() -->
        <input class="slider-value" type="number" data-bind="value: value(),hasFocus: true,attr: { min: min, max: max, step: increment },event: {  blur: function(_, event) { finishInput(event.currentTarget.value); },  keydown: function(_, event) {    if (event.which === 13) { finishInput(event.currentTarget.value); event.stopPropagation() }    else if (event.which === 27) { finishInput(); event.stopPropagation() }    return true  }}" />
            <!-- /ko -->
            <!-- ko if : !editing() -->
            <div class="slider-value-display" data-bind="text: displayValue, click: startEditing,requireAuth: {  resource: 'Parameters',  enableIf: 'ReadWrite'}">
            </div>
            <!-- /ko -->
            <div class="slider-unit" data-bind="html: displayUnit">
            </div>
            </div>
            </div>
            </div>";

/***/ }),

/* 91 CheckboxSlider viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = CheckboxSlider

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)
var util = __webpack_require__(15)

function CheckboxSlider(params, api) {
  _.bindAll(this, "toggle")

  if (!params.value || !params.step) {
    throw new Error("CheckboxSlider requires parameters: value, step")
  }

  this.configured = ko.pureComputed(function() {
    return params.value() !== undefined && params.value() !== null
  })
  this.checkedText = util.or(params.checked, "ON")
  this.uncheckedText = util.or(params.unchecked, "OFF")
  this.checked = ko.pureComputed({
    read: function() { return !!params.value() },
    write: function(newValue) { params.value(!!newValue) }
  })

  var sound = util.or(params.sound, "navigate")
  var playSound = _.partial(api.playSound, api.sounds[sound])

  params.step.update(function() {
    var pilot = {
      check: {
        label: "save",
        highlight: true,
        click: function() {
          playSound()
          params.value(this.checked())
          params.step.done()
        }
      },
      circle: {
        label: "toggle",
        click: this.toggle
      },
      left: { click: this.toggle, highlight: true },
      right: { click: this.toggle, highlight: true }
    }
    return { pilot: pilot }
  }, this)
}

CheckboxSlider.prototype.toggle = function() {
  this.checked(!this.checked())
  return true
}


/***/ }),
/* 92 CheckboxSlider style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 93 CheckboxSlider template*/
/***/ (function(module, exports) {

module.exports = "<step id="checkbox-slider"configured="configured()"data-bind="requireAuth: {resource: 'Parameters',enableIf: 'ReadWrite'}" style="align-items: center">
        <label class="value-text" data-bind="text: uncheckedText,click: checked.bind(undefined, false)" style="pointer-events: initial">
            </label>
            <div class="slider" data-bind="css: {focused: step.focused,checked: checked},click: toggle">
            <div class="value-switch" style="pointer-events: initial">
            </div>
            <div class="value-indicator" style="pointer-events: initial">
            </div>
            </div>
            <label class="value-text" data-bind="text: checkedText,click: checked.bind(undefined, true)" style="pointer-events: initial">
            </label>
            </step>";

/***/ }),

/* 94 ToggleSlider  viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = ToggleSlider

var ko = __webpack_require__(1)
var _ = __webpack_require__(0)
var util = __webpack_require__(15)

function ToggleSlider(params, api) {
  if (!params.parameters) {
    throw new Error("ToggleSlider requires parameter: parameters")
  }

  var focusedIndex = this.focusedIndex = ko.observable(0)
  var attributes = this.attributes = params.parameters.map(function(param, index) {
    return Object.assign({}, param, {
      displayValue: ko.pureComputed(function() {
        return param.value() + (param.unit ? " " + util.pluralize(param.unit, param.value()) : "")
      }),
      configured: ko.pureComputed(function() {
        return param.value() !== null && param.value() !== undefined
      }),
      focused: ko.pureComputed(function() {
        return index === focusedIndex()
      })
    })
  })
  var focusedAttributes = this.focusedAttributes = ko.pureComputed(function() {
    return attributes[focusedIndex()]
  })
  // Re-focus step if focused attributes change, i.e. a different slider is selected
  focusedAttributes.subscribe(function() {
    _.defer(params.step.focus) // defer as the loaded slider needs to render first
  })
  var isFirstButton = ko.pureComputed(function() {
    return focusedIndex() === 0
  })
  var isLastButton = ko.pureComputed(function() {
    return focusedIndex() === attributes.length - 1
  })
  var unconfiguredIndex = ko.pureComputed(function() {
    return attributes.findIndex(function(attribute) {
      return !attribute.configured()
    })
  })
  var configured = this.configured = ko.pureComputed(function() {
    return unconfiguredIndex() === -1
  })
  if (!configured()) {
    focusedIndex(unconfiguredIndex())
  }

  // To intercept interaction definitions from components using sub-steps on the
  // step.pilot API, a derived step from the params.step has to be provided to
  // the components
  // Note: currently the step in between (id "toggle-slider") is not used for
  // any interaction or navigation definitions
  var subStepOptions = ko.observable({ pilot: {} })
  this.subStep = Object.assign({}, params.step, {
    update: function(sliderUpdate, that) {
      this.subStep.updater = ko.computed(function() {
        subStepOptions(sliderUpdate.call(that))
      })
    }.bind(this),
  })
  this.editing = ko.observable(false)
  var playSound = _.partial(api.playSound, api.sounds[params.sound || "navigate"])
  params.step.update(function() {
    var pilot = {}
    if (this.editing()) {
      pilot.circle = pilot.check = pilot.cross = pilot.left = pilot.right = pilot.up = pilot.down = {}
    } else {
      pilot.circle = {
        label: "set",
        click: function() {
          var value = focusedAttributes().value
          if (value() === undefined || value() === null) {
            value(util.or(focusedAttributes().initial, focusedAttributes().min))
          }
          if (!isLastButton()) {
            focusedIndex(focusedIndex() + 1)
            playSound()
          } else if (configured()) {
            params.step.done()
          }
        }
      }
      pilot.check = {
        label: "next",
        click: function() {
          var value = focusedAttributes().value
          if (value() === undefined || value() === null) {
            value(util.or(focusedAttributes().initial, focusedAttributes().min))
          }
          if (!configured()) {
            focusedIndex(unconfiguredIndex())
          } else {
            params.step.done()
          }
        }
      }
      pilot.up = isFirstButton() ? undefined : {
        click: function() {
          focusedIndex(focusedIndex() - 1)
          playSound()
        }
      }
      pilot.down = isLastButton() ? undefined : {
        click: function() {
          focusedIndex(focusedIndex() + 1)
          playSound()
        }
      }
    }
    return { pilot: Object.assign(subStepOptions().pilot, pilot) }
  }, this)
}

/***/ }),
/* 95 ToggleSlider style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 96 ToggleSlider template*/
/***/ (function(module, exports) {

module.exports = "<!-- TODO(SN) discrepancy where interaction (pilot api - on outer / passed in step) and configured/available is specified (if=, configured= - on inner / contained step) -->
    <step id="toggle-slider" configured="configured()">
            <div class="toggle-slider" data-bind="requireAuth: {resource: 'Parameters',enableIf: 'ReadWrite'}">
            <div class="buttons">
            <!-- ko foreach: attributes -->
        <button class="button" data-bind="  click: $parent.focusedIndex.bind(undefined, $index()),  css: {    active: $data.focused,    focused: $data.focused  },  scrollIntoViewWhen: $data.focused">
            <div class="label" data-bind="text: $data.label">
            </div>
            <!-- ko if: $data.configured() -->
            <div class="value" data-bind="text: $data.displayValue">
            </div>
            <!-- /ko -->
            <!-- ko if: !$data.configured() -->
            <div class="value unconfigured">-
            </div>
            <!-- /ko -->
            </button>
            <!-- /ko -->
            </div>
            <div class="slider" data-bind="with: focusedAttributes">
            <div class="label" data-bind="text: $data.label">
            </div>
            <linear-slider params="{value: $data.value,min: $data.min,max: $data.max,initial: $data.initial,increment: $data.increment,unit: $data.unit,displayFunction: $data.displayFunction,step: $component.subStep,editing: $component.editing}">
            </linear-slider>
            </div>
            </div>
            </step>";

/***/ }),

/* 97 DropMenu viewModel*/
/***/ (function(module, exports, __webpack_require__) {


module.exports = DropDownMenu

var ko = __webpack_require__(1)
var _ = __webpack_require__(0)
var $ = __webpack_require__(6)
var Tether = __webpack_require__(28)
var dropDownList = __webpack_require__(98)
var util = __webpack_require__(15)

function DropDownMenu(params, api, element) {
  _.bindAll(this, "toggle", "onClick", "open", "close", "onUp", "onDown", "onSave")

  this.params = params
  this.api = api
  this.element = element
  this.items = ko.pureComputed(function() {
    return _.map(ko.unwrap(params.items).slice(), function(item) {
      item = _.clone(item)
      item.isCurrent = ko.pureComputed(function() {
        return _.eq(this.selectedValue(), item.value)
      }, this)
      return item
    }, this)
  }, this)

  this.isOpen = ko.observable(false)
  this.selectedValue = ko.observable()
  this.selectedItemText = ko.pureComputed(function() {
    var value = util.or(this.params.parameter(), this.params.default)
    var item = _.find(this.items(), function(i) {
      return _.eq(i.value, value)
    })
    return item && item.text
  }, this)
  this.configured = ko.pureComputed(function() {
    return params.parameter() !== undefined && params.parameter() !== null
  })

  params.step.update(function() {
    var pilot = {}
    if (this.isOpen()) {
      pilot.cross = {
        label: "cancel",
        click: function() {
          params.parameter.reset()
          this.close()
        }.bind(this)
      }
      pilot.circle = {
        label: "select",
        highlight: true,
        click: function() {
          params.parameter(this.selectedValue())
          this.close()
        }.bind(this)
      }
      var index = _.findIndex(this.items(), function(i) { return i.isCurrent() })
      pilot.down = { click: this.onDown, highlight: index  < this.items().length - 1 }
      pilot.up = { click: this.onUp, highlight: index > 0 }
    } else {
      pilot.circle = {
        label: "change",
        click: this.open
      }
      if (params.parameter.isDirty() ||
          params.parameter() == null && (this.selectedValue() != null || params.default != null)) { // eslint-disable-line
        pilot.check = {
          label: "save",
          highlight: true,
          click: this.onSave
        }
      }
      if (params.parameter.isDirty()) {
        pilot.cross = {
          label: "reset",
          click: function() {
            params.parameter.reset()
            api.playSound(api.sounds.navigate)
          }
        }
      }
    }
    return { pilot: pilot }
  }, this)

  this.subs = []
  this.subs.push(this.params.step.focused.subscribe(function(focused) {
    if (!focused) {
      this.close()
    }
  }, this))
}

DropDownMenu.prototype.dispose = function() {
  this.close()
  _.invoke(this.subs, "dispose")
}

DropDownMenu.prototype.open = function() {
  var selected = util.or(this.params.parameter(), this.params.default)
  this.selectedValue(selected)
  if (!this.tether) {
    var listElement = $.parseHTML(dropDownList)[0]
    // Fix width to drop down width (customizable by component user)
    listElement.style.width = this.element.clientWidth + "px"
    document.body.appendChild(listElement)
    ko.applyBindings(this, listElement)
    this.tether = new Tether({
      element: listElement,
      target: this.element,
      attachment: "top left",
      targetAttachment: "bottom left"
    })
    // Manually update tether position when timeline is scrolled until
    // https://github.com/HubSpot/tether/pull/141 is merged
    $(this.element).closest("one-timeline").on("scroll", this.tether.position);
    this.api.playSound(this.api.sounds.navigate)
    this.isOpen(true)
  }
}

DropDownMenu.prototype.close = function() {
  if (this.tether) {
    $(this.element).closest("one-timeline").off("scroll", this.tether.position);
    var element = this.tether.element
    this.tether.destroy()
    delete this.tether
    ko.removeNode(element)
    this.api.playSound(this.api.sounds.navigate)
    this.isOpen(false)
  }
}

DropDownMenu.prototype.toggle = function() {
  if (this.tether) {
    this.close()
  } else {
    this.open()
  }
}

DropDownMenu.prototype.onUp = function() {
  var index = _.findIndex(this.items(), function(i) { return i.isCurrent() })
  if (this.isOpen() && index > 0) {
    this.api.playSound(this.api.sounds.navigate)
    this.selectedValue(this.items()[index - 1].value)
  }
  return this.isOpen()
}

DropDownMenu.prototype.onDown = function() {
  var index = _.findIndex(this.items(), function(i) { return i.isCurrent() })
  if (this.isOpen() && index < this.items().length - 1) {
    this.api.playSound(this.api.sounds.navigate)
    this.selectedValue(this.items()[index + 1].value)
  }
  return this.isOpen()
}

DropDownMenu.prototype.onSave = function() {
  // TODO(SN): this is the wrong way around and a code smell: this should be as simple asparams.parameter(this.selectedValue())
  // ensure a non-null value in the parameter
  var index = _.findIndex(this.items(), function(i) { return i.isCurrent() })
  this.params.parameter(index === -1 ? this.params.default : this.items()[index].value)
  this.api.playSound(this.api.sounds.save)
  this.params.step.done()
  return true
}

DropDownMenu.prototype.onClick = function(item) {
  this.selectedValue(item.value)
  this.params.parameter(item.value)
  this.close()
}


/***/ }),
/* 98 Dropdown list template*/
/***/ (function(module, exports) {

module.exports = "<ul class="dropdown-list" data-bind="foreach: items,requireAuth: {  resource: 'Parameters',  enableIf: 'ReadWrite'}">
        <li data-bind="  css: { current: isCurrent },  click: $parent.onClick,  html: text"></li>
            </ul>";

/***/ }),
/* 99 DropMenu style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 100 DropMenu template*/
/***/ (function(module, exports) {

module.exports = "<step id="drop-down-menu" configured="configured()">
        <div class="dropdown-toggle" data-bind="click: toggle,css: {focused: !isOpen() && params.step.focused(),open: isOpen()},requireAuth: {resource: 'Parameters',enableIf: 'ReadWrite'}" style="pointer-events: initial">
            <div data-bind="html: selectedItemText()">
            </div>
            <span class="arrow" data-bind="css: { open: !isOpen(), close: isOpen() }">
            </span>
            </div>
            </step>";

/***/ }),

/* 101 Gripper viewModel*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * This module defines a component for dynamically visualizing gripper
 * state.
 */
module.exports = Gripper

var ko = __webpack_require__(1)

function Gripper(params) {
  this.width = ko.computed(function() {
    return Math.min(ko.unwrap(params.width) * 100, 100) + "%"
  })
  this.pos = ko.computed(function() {
    return Math.min(ko.unwrap(params.width) * 50, 50) + 50 + "%"
  })
  this.config = params.config
  this.saved = params.saved
  this.focused = params.focused
}


/***/ }),
/* 102 Gripper style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 103 Gripper template*/
/***/ (function(module, exports) {

module.exports = "<div class="gripper" data-bind="  css: {
                'is-open': config === 'open',
                'is-closed': config === 'closed',
                'is-saved': saved,    'is-focused': focused
              },
        requireAuth: {    resource: 'Parameters',    enableIf: 'ReadWrite'  }">
        <div class="area outside"></div>
            <div class="area inside" data-bind="style: { width: width }"></div>
            <div class="tip left" data-bind="style: { right: pos }"></div>
            <div class="tip right" data-bind="style: { left: pos }"></div>
            </div>";

/***/ }),

/* 104 GripperControl viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = GripperControl

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var assert = __webpack_require__(7)

function ensureLimits(value, max) {
  if (value <= 0) {
    return 0
  } else if (value < max) {
    return value
  } else {
    return max
  }
}

function GripperControl(params, api) {
  _.bindAll(this, "startEditing", "commitEditing", "discardEditing", "editingKeydown")

  assert.keys(params, "width", "step", "config")
  if (params.config !== "open" && params.config !== "closed") {
    throw new Error("GripperControl requires config == 'open' or config == 'closed' parameter")
  }

  if (params.config === "open") {
    this.gripperIcon = __webpack_require__(105)
  } else if (params.config === "closed") {
    this.gripperIcon = __webpack_require__(106)
  }
  this.maxMillimeter = ko.computed(function() {
    return api.gripperState().maxWidth * 1000
  })

  this.taughtWidth = ko.computed({
    read: function() {
      // Parameter is in meter, read as millimeter
      return Math.round(params.width() * 1000)
    },
    write: function(mmWidth) {
      var roundedMillimeter = ensureLimits(Math.round(mmWidth), this.maxMillimeter())
      // Write as meter
      params.width(roundedMillimeter / 1000)
    }
  }, this)
  this.liveWidth = ko.pureComputed(function() {
    var mmWidth = api.gripperState().width * 1000
    return Math.round(mmWidth)
  })

  this.configured = ko.pureComputed(function() {
    return params.width() !== undefined && params.width() !== null
  }, this)

  this.editValue = ko.observable(null)
  this.editing = ko.computed(function() { return this.editValue() !== null }, this)

  params.sound = params.sound || "navigate"
  var playSound = this.playSound = _.partial(api.playSound, api.sounds[params.sound])

  params.step.update(function() {
    var pilot = {}
    if (this.editing()) {
      pilot.circle = pilot.check = pilot.cross = pilot.left = pilot.right = pilot.up = pilot.down = {}
    } else {
      pilot.circle = {
        label: "set",
        click: function() {
          playSound()
          this.taughtWidth(this.liveWidth())
        }.bind(this)
      }
      if (params.width.isDirty()) {
        pilot.cross = {
          label: "reset",
          click: function() {
            playSound()
            params.width.reset()
          }
        }
        pilot.check = {
          label: "save",
          highlight: true,
          click: function() {
            playSound()
            params.step.done()
          }
        }
      }
    }
    return { pilot: pilot }
  }, this)
}

GripperControl.prototype.startEditing = function() {
  this.editValue(this.taughtWidth())
}

GripperControl.prototype.commitEditing = function() {
  if (!this.editing()) {
    return
  }
  this.playSound()
  this.taughtWidth(Number(this.editValue()))
  this.editValue(null)
}

GripperControl.prototype.discardEditing = function() {
  if (!this.editing()) {
    return
  }
  this.playSound()
  this.editValue(null)
}

GripperControl.prototype.editingKeydown = function(_, event) {
  switch (event.which) {
  case 13: // enter
    this.editValue(event.currentTarget.value)
    this.commitEditing();
    event.stopPropagation();
    break;
  case 27: // escape
    this.discardEditing();
    event.stopPropagation();
    break;
  }
  return true;
}


/***/ }),
/* 105  little grasp SVG */
/***/ (function(module, exports) {

module.exports = "<svg id=\"icon\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 111.35815 87.603462\"><g transform=\"matrix(1.3333 0 0 -1.3333 -224.98 198.34)\"><g transform=\"translate(225.07 141.8)\"><path d=\"m0 0-2.296 6.128c-0.212 0.458-0.863 0.829-1.455 0.829h-21.612c-0.592 0-1.234-0.374-1.434-0.835l-2.244-6.121z\" fill=\"currentColor\"></path></g><g transform=\"translate(185.71 104.03)\"><path d=\"m0 0 10.97-9.921c1.04-1.032 1.564-2.475 1.428-3.934l-0.227-1.619 0.66 4.375c0.079 1.181-0.355 2.34-1.193 3.187l-11.861 11.008c-0.309-0.424-0.492-0.933-0.511-1.466 5e-3 -0.622 0.272-1.213 0.734-1.63\" fill=\"currentColor\"></path></g><g transform=\"translate(224.31 94.111)\"><path d=\"m0 0 10.97 9.921c0.462 0.417 0.728 1.008 0.734 1.63-0.019 0.533-0.202 1.042-0.512 1.466l-11.86-11.008c-0.838-0.847-1.272-2.006-1.193-3.187l0.659-4.375-0.227 1.618c-0.135 1.459 0.389 2.903 1.429 3.935\" fill=\"currentColor\"></path></g><g transform=\"translate(239.65 122.25)\"><path d=\"m0 0c4.581-3.427 8.526-6.419 10.505-8.207 0.497-0.433 0.883-0.863 1.199-1.294l-2.287 4.525c-0.242 0.473-0.773 1.126-1.193 1.452-3.551 2.747-18.102 13.721-22.801 17.263v-2.468c4.218-3.445 9.64-7.526 14.577-11.271\" fill=\"currentColor\"></path></g><g transform=\"translate(170.83 114.05)\"><path d=\"m0 0c1.979 1.788 5.925 4.78 10.506 8.207 4.979 3.777 10.451 7.896 14.684 11.359v2.461c-4.586-3.457-19.332-14.578-22.908-17.344-0.42-0.326-0.951-0.979-1.193-1.452l-2.287-4.525c0.316 0.431 0.702 0.861 1.198 1.294\" fill=\"currentColor\"></path></g><g transform=\"translate(216.18 89.403)\"><path d=\"m0 0-1.361-0.952 2.891-1.479h-14.321l2.892 1.479-1.361 0.952-6.448-3.157 4.562-3.195 2.375 0.875-2.53 1.594h15.342l-2.531-1.594 2.375-0.875 4.562 3.195z\" fill=\"#777\"></path></g></g><g><path d=\"m111.27 50.35c-0.15333-0.792-0.536-1.572-1.1093-2.3493-0.42134-0.57333-0.936-1.148-1.5987-1.7253-2.6387-2.384-7.8987-6.3733-14.007-10.943-6.584-4.9933-13.813-10.435-19.436-15.028v-3.2907c0-4.268-0.0027-7.696-0.0093-7.7387l-38.721-0.00267c-8e-3 0.042667-0.0093 3.4147-0.0093 7.6333v3.2813c-5.644 4.6187-12.94 10.109-19.58 15.145-6.108 4.5693-11.369 8.5587-14.007 10.943-0.66133 0.57733-1.176 1.152-1.5987 1.7253-0.572 0.77733-0.95467 1.5573-1.1107 2.3493-0.312 1.608 0.22133 3.2693 1.648 5.1 5.392 6.2427 11.201 12.112 17.389 17.568 4.8987 4.5627 9.552 8.8707 13.251 12.943 0.672 0.85333 1.6347 1.4293 2.704 1.62 0.34667 0.04533 0.70133 0.01867 1.0387-0.08133 0.536-0.15733 1.3773-0.68 1.872-2.0587 0.12933-0.35867 0.252-0.73867 0.31733-1.2307l0.55467-3.9493 0.304-2.1587c0.18133-1.9453-0.51867-3.8693-1.9053-5.2453l-14.625-13.228c-0.616-0.556-0.972-1.344-0.98-2.1733 0.02667-0.71067 0.26933-1.3893 0.68267-1.9547 0.15067-0.20667 0.32-0.4 0.51467-0.57067 0.176-0.16533 0.41867-0.38 0.636-0.57333 2.8507-2.5533 8.8947-7.388 13.835-11.345 2.0507-1.6253 3.9027-3.1093 5.34-4.2787h26.036c1.4373 1.1693 3.2893 2.6533 5.3387 4.2787 4.9413 3.9573 10.987 8.792 13.836 11.345 0.216 0.19333 0.45867 0.408 0.63733 0.57333 0.19333 0.17067 0.36267 0.364 0.51333 0.57067 0.41333 0.56533 0.65733 1.244 0.68267 1.9547-8e-3 0.82933-0.36267 1.6173-0.97867 2.1733l-14.627 13.228c-1.3867 1.376-2.0853 3.3-1.9053 5.2453l0.30267 2.1587 0.556 3.9493c0.06667 0.492 0.18933 0.872 0.31733 1.2307 0.49467 1.3787 1.336 1.9013 1.8733 2.0587 0.336 0.1 0.69067 0.12667 1.0387 0.08133 1.0693-0.19067 2.0307-0.76667 2.7013-1.62 3.7013-4.072 8.3533-8.38 13.253-12.943 6.1867-5.456 11.997-11.325 17.389-17.568 1.4253-1.8307 1.9587-3.492 1.6453-5.1\"></path></g></svg>"

/***/ }),
/* 106 large grasp SVG*/
/***/ (function(module, exports) {

module.exports = "<svg id=\"icon\" viewBox=\"0 0 137.51335 108.58133\" xmlns=\"http://www.w3.org/2000/svg\"><g transform=\"matrix(1.3333 0 0 -1.3333 -94.904 163.88)\"><path d=\"m140.74 114.32-2.835 7.568c-0.262 0.565-1.066 1.023-1.796 1.023h-26.689c-0.73 0-1.522-0.462-1.77-1.031l-2.771-7.559z\" fill=\"currentColor\"></path><g transform=\"translate(92.139 67.687)\"><path d=\"m0 0 13.546-12.251c1.285-1.274 1.932-3.057 1.765-4.858l-0.281-1.998 0.814 5.401c0.098 1.459-0.438 2.891-1.472 3.936l-14.647 13.593c-0.382-0.523-0.607-1.151-0.632-1.809 8e-3 -0.769 0.337-1.499 0.907-2.014\" fill=\"currentColor\"></path></g><path d=\"m139.81 55.436 13.546 12.251c0.57 0.515 0.899 1.245 0.907 2.014-0.024 0.658-0.25 1.286-0.632 1.809l-14.646-13.593c-1.035-1.045-1.571-2.477-1.473-3.936l0.815-5.401-0.282 1.998c-0.167 1.801 0.481 3.584 1.765 4.858\" fill=\"currentColor\"></path><g transform=\"translate(158.75 90.189)\"><path d=\"m0 0c5.657-4.232 10.529-7.927 12.973-10.134 0.613-0.535 1.09-1.067 1.48-1.598l-2.824 5.589c-0.299 0.582-0.956 1.39-1.474 1.791-4.384 3.392-22.353 16.944-28.156 21.318v-3.048c5.209-4.254 11.904-9.293 18.001-13.918\" fill=\"currentColor\"></path></g><g transform=\"translate(73.766 80.054)\"><path d=\"m0 0c2.443 2.207 7.316 5.902 12.973 10.134 6.149 4.664 12.906 9.75 18.133 14.027v3.039c-5.664-4.269-23.872-18.001-28.288-21.418-0.518-0.401-1.175-1.209-1.474-1.791l-2.824-5.589c0.391 0.532 0.867 1.063 1.48 1.598\" fill=\"currentColor\"></path></g><path d=\"m108.68 45.198 0.448 1.734h9.152l-1.565 1.354 1.438 1.183 4.144-3.467-4.99-4.525-1.438 1.523 2.422 2.156z\" fill=\"#777\"></path><path d=\"m136.81 45.198-0.448 1.734h-9.153l1.566 1.354-1.439 1.183-4.143-3.467 4.989-4.525 1.439 1.523-2.422 2.156z\" fill=\"#777\"></path></g><path d=\"m137.41 62.176c-0.192-0.97733-0.664-1.94-1.3707-2.9013-0.52133-0.708-1.1573-1.416-1.9747-2.1293-3.2573-2.9427-9.7533-7.8707-17.296-13.513-8.1293-6.1653-17.056-12.885-24.001-18.557v-4.064c0-5.2707-0.0027-9.5027-0.012-9.556l-47.816-0.0027c-8e-3 0.052-0.01067 4.216-0.01067 9.4253v4.052c-6.9693 5.7027-15.98 12.484-24.179 18.703-7.5413 5.6427-14.039 10.571-17.296 13.513-0.81867 0.71333-1.4533 1.4213-1.9747 2.1293-0.70667 0.96133-1.18 1.924-1.3693 2.9013-0.38667 1.9853 0.272 4.0373 2.032 6.2987 6.6587 7.708 13.833 14.956 21.475 21.693 6.0493 5.6347 11.795 10.955 16.364 15.981 0.828 1.0547 2.016 1.768 3.3373 2 0.42933 0.0573 0.86667 0.024 1.284-0.0987 0.66133-0.19333 1.7-0.84133 2.3107-2.5427 0.16-0.44267 0.30933-0.91334 0.39333-1.52l0.68533-4.8773 0.37333-2.664c0.22267-2.4027-0.64-4.7787-2.352-6.4773l-18.061-16.335c-0.76133-0.68667-1.1987-1.66-1.2093-2.6853 0.032-0.87733 0.33333-1.7147 0.84267-2.412 0.18667-0.256 0.39467-0.49467 0.63467-0.70667 0.22-0.204 0.51867-0.46667 0.78667-0.70667 3.52-3.152 10.983-9.124 17.084-14.011 2.532-2.0053 4.8187-3.8387 6.5947-5.284h32.151c1.7747 1.4453 4.0613 3.2787 6.5933 5.284 6.1013 4.8867 13.565 10.859 17.084 14.011 0.268 0.24 0.56667 0.50267 0.78667 0.70667 0.24 0.212 0.44933 0.45067 0.636 0.70667 0.508 0.69733 0.80933 1.5347 0.84133 2.412-9e-3 1.0253-0.44933 1.9987-1.2093 2.6853l-18.061 16.335c-1.712 1.6987-2.5747 4.0747-2.352 6.4773l0.37467 2.664 0.68533 4.8773c0.08267 0.60667 0.232 1.0773 0.39067 1.52 0.61067 1.7013 1.6507 2.3493 2.3133 2.5427 0.416 0.12266 0.85333 0.156 1.284 0.0987 1.32-0.232 2.508-0.94534 3.3373-2 4.5667-5.0267 10.313-10.347 16.363-15.981 7.6427-6.7373 14.816-13.985 21.476-21.693 1.76-2.2613 2.4173-4.3133 2.032-6.2987\"></path></svg>"

/***/ }),
/* 107 GripperControl style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 108 GripperControl template*/
/***/ (function(module, exports) {

module.exports = "<step id="gripper-control" configured="configured()">
        <div class="gripper-control" data-bind="requireAuth: {resource: 'Parameters',enableIf: 'Read'}">
            <div class="wrapper">
            <div class="gripper-icon" data-bind="html: gripperIcon"></div>
            <div class="content-wrapper">
            <div class="pair" data-bind="css: { 'focused': step.focused() }">
            <span class="label">ROBOT</span>
            <div class="value" data-bind="text: liveWidth"></div>
            </div>
            <div class="line">
            <svg viewBox="0 0 80 3">
            <line x1="0" y1="1" x2="80" y2="1" stroke-width="3" />
            </svg>
            <div class="unit" data-bind="visible: step.focused()">mm</div>
            </div>
            <div class="pair teach">
            <span class="label">SAVED</span>
            <!-- ko if: editing() -->
            <input class="value" type="number" min="0" data-bind="  value: editValue,  attr: { max: maxMillimeter() },  hasFocus: editing,  event: {    blur: commitEditing,    keydown: editingKeydown  }" />
            <div class="maxHint" data-bind="text: 'max. ' + maxMillimeter()">
            </div>
            <!-- /ko --><!-- ko if: !editing() -->
            <div class="value" data-bind="  click: startEditing,  text: configured() ? taughtWidth() : '-',  requireAuth: {    resource: 'Parameters',    enableIf: 'ReadWrite'  }">
            </div>
            <button data-bind="click: startEditing">
            <i class="fi-pencil"></i>
            </button>
            <!-- /ko -->
            </div>
            </div>
            </div>
            </div>
            </step>";

/***/ }),

/* 109 StepNumber viewModel*/
/***/ (function(module, exports, __webpack_require__) {

var ko = __webpack_require__(1)

var StepNumber = function(params) {
  if (!params.step) {
    throw new Error("StepNumber requires parameter: step")
  }
  this.stepNumber = ko.pureComputed({
    read: function() {
      var index = params.step.leafIndex()
      if (index < 0) {
        console.warn(
          "The leaf index of step-number component in step (" + params.step.id + ") could not be calculated. Does it have more than one child step?"
        )
      } else {
        return index + 1
      }
    }
  })
  this.focused = params.step.focused
  this.configured = params.step.configured
}

module.exports = StepNumber

/***/ }),
/* 110 StepNumber style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 111 StepNumber template*/
/***/ (function(module, exports) {

module.exports = "<div class="step-number" data-bind="css: {focused: focused,saved: configured}">
        <!-- ko if: stepNumber() -->
        <span data-bind="text: stepNumber" />
            <!-- /ko -->
            <!-- ko if: !stepNumber() -->
            <i class="fi-alert" />
            <!-- /ko -->
            </div>";

/***/ }),

/* 112 Resource*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Resource

var Com = __webpack_require__(19)
var util = __webpack_require__(4)

function Resource(params, api, element) {
  if (!params.src) {
    throw new Error("<resource> requires parameter 'src'")
  }
  Com.fetchBundleResource(params.src)
    .then(util.parseHTML)
    .then(function(elements) {
      while (elements.length > 0) {
        element.appendChild(elements[0])
      }
    })
    .catch(function(error) {
      console.error("<resource> load error:", error.message)
    })
}


/***/ }),

/* 113 Header component对象*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  viewModel: __webpack_require__(114),
  template: "<style scoped>" + __webpack_require__(115) + "</style>" +
            __webpack_require__(116)
}


/***/ }),
/* 114 Header viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Header

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var assert = __webpack_require__(7)
var auth = __webpack_require__(12)
var dialogs = __webpack_require__(8)

function Header(params) {
  assert.keys(params, "controller", "mode", "timeline", "execution")
  this.controller = params.controller
  this.mode = params.mode
  this.timeline = params.timeline
  this.execution = params.execution

  this.idle = ko.pureComputed(function() {
    return !params.execution() ||
           !params.execution().running
  })
  this.running = ko.pureComputed(function() {
    return params.execution() &&
           params.execution().running
  })
  this.error = ko.pureComputed(function() {
    return this.running() &&
           params.execution().errorHandling
  }, this)
  this.userName = auth.getUserName()
  this.roleName = auth.getRoleName()
  this.isAdmin = auth.isAdmin()
  this.isUserDropdownOpen = ko.observable(false)

  // TODO(SN): this is slighlty glitchy when clicking links in the drop down
  // Add click listener on document to close dropdown if clicked something else on the document
  document.addEventListener("click", this.closeUserDropdown.bind(this))

  _.bindAll(this, "executionClick")
}

Header.prototype.executionClick = function() {
  if (this.execution() && !this.execution().running) {
    return this.startExecution()
  }
  return this.stopExecution()
}

Header.prototype.startExecution = function() {
  var self = this
  var timeline = ko.unwrap(this.timeline)

  return this.controller.saveUpdatedParameters()
  .catch(function(e) {
    console.error("Error saving parameters:", e)
    if (self.controller.uiEvents.notifyLogWarn) {
      self.controller.uiEvents.notifyLogWarn("Could not save parameters.")
    }
  })
  .then(function() {
    return self.controller.com.startExecution(timeline.id)
  })
  .then(function() {
    // close all context menus
    if (self.controller.uiEvents.notifyTimelineElementSelected) {
      self.controller.uiEvents.notifyTimelineElementSelected()
    }
  })
  .catch(function(e) {
    if (e.error === "NotFullyParameterized") {
      var unparameterizedElement = timeline.getElementAtPath(e.paths[0])
      timeline.contextMenuElement(unparameterizedElement)
      self.mode("teach")
    } else {
      dialogs.showMessageDialog({
        icon: "error",
        title: "Starting execution failed",
      })
    }
  })
}

Header.prototype.stopExecution = function() {
  this.controller.com.stopExecution()
}

Header.prototype.killExecution = function() {
  this.controller.com.killExecution()
}

Header.prototype.toggleUserDropdown = function(data, event) {
  this.isUserDropdownOpen(!this.isUserDropdownOpen())
  event.stopPropagation()
}

Header.prototype.closeUserDropdown = function() {
  this.isUserDropdownOpen(false)
}

Header.prototype.shutdown = function() {
  return this.controller.shutdown()
}


/***/ }),
/* 115 Header style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 116  Header Template*/
/***/ (function(module, exports) {

module.exports = "<nav>
    <div class="logo" data-bind="clickFullScreen: document.documentElement">
            <img src="img/logo.svg"></img>
            </div>
            <ul class="menu">
            <li data-bind="radioActive: mode, value: 'program'">
            <a>
            <span>PROGRAM</span>
            </a>
            </li>
            <li data-bind="radioActive: mode, value: 'teach',css: { disabled: !timeline() },requireAuth: {resource: 'Parameters',enableIf: 'Read'}">
            <a>
            <span>TEACH</span>
            </a>
            </li>
            <div class="execution-button" data-bind="css: {'fi-play': idle,'fi-stop': !idle(),ready: mode() === 'work',error: error,running: running},click: executionClick,event: { contextmenu: killExecution },requireAuth: {resource: 'Execution',enableIf: 'ReadWrite',displayIf: 'Read'}">
            </div>
            </ul>
            <div class="options">
            <div class="user-dropdown" data-bind="css: { open: isUserDropdownOpen }">
            <div class="user-dropdown-header" data-bind="click: toggleUserDropdown">
            <div class="dropdown-user-icon">
            <i class="fi-torso"></i>
            </div>
            <div class="dropdown-user-name" data-bind="text: userName">
            </div>
            <div class="dropdown-open-icon">
            <i class="fi-play"></i>
            </div>
            </div>
            <div class="user-dropdown-content">
              <ul>
              <!-- ko if: isAdmin -->
                 <li class="link">
                    <a href="/admin"><i class="link-icon fi-widget"></i>Settings</a>
                 </li>
        <!-- /ko -->
                <li class="link">
                  <a href="/manual" target="_blank"><i class="link-icon fi-book"></i>Manual </a>
                  </li>
                <li class="link">
                    <a data-bind="attr: { href: '/admin/logout?redirect=' + location.href }"><i class="link-icon fi-eject"></i>Log out</a>
                </li>
                <li class="link" data-bind="  click: shutdown,  requireAuth: {    resource: 'Scripts',    displayIf: 'ReadWrite'  }">
                  <i class="link-icon fi-power"></i>Shut down
                </li>
              </ul>
            </div>
            </div>
            </div>
            </nav>";

/***/ }),

/* 117 RobotStatus component对象*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  template: "<style scoped>" + __webpack_require__(118) + "</style>" +
            __webpack_require__(119),
  viewModel: __webpack_require__(120)
}


/***/ }),
/* 118 RobotStatus style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 119 RobotStatus template*/
/***/ (function(module, exports) {

module.exports = "<div class="main-content">
        <ul>
        <li class="nav-mode" data-bind="visible: navMode() !== 'robot'">
            <i class="icon" data-bind="html: oneModeIcon"></i>
            <label>DESK</label>
            </li>
            <li class="nav-mode" data-bind="visible: navMode() === 'robot'">
            <i class="icon" data-bind="html: robotModeIcon"></i>
            <label>ROBOT</label>
            </li>
            <li data-bind="css: { active: guidingMode() === 'translation' },click: setTranslationMode,requireAuth: {resource: 'Status',showIf: 'Read',enableIf: 'ReadWrite'}">
            <i class="icon" data-bind="html: zerogTranslationIcon"></i>
            <label>Translation</label>
            </li>
            <li data-bind="css: { active: guidingMode() === 'rotation' },click: setRotationMode,requireAuth: {resource: 'Status',showIf: 'Read',enableIf: 'ReadWrite'}">
            <i class="icon" data-bind="html: zerogRotationIcon"></i>
            <label>Rotation</label>
            </li>
            <li data-bind="css: { active: guidingMode() === 'free' },click: setFreeMode,requireAuth: {resource: 'Status',showIf: 'Read',enableIf: 'ReadWrite'}">
            <i class="icon" data-bind="html: zerogFreeIcon"></i>
            <label>Free</label>
            </li>
            <li class="user" data-bind="css: {active: guidingMode() === 'user',disabled: userConfigurationDisabled()},click: setUserMode,requireAuth: {resource: 'Status',showIf: 'Read',enableIf: 'ReadWrite'}">
            <i class="icon fi-wrench"></i>
            <label>User</label>
            </li>
            <div class="dropdown" data-bind="requireAuth: {resource: 'Status',showIf: 'Read'}">
            <span class="options-button" data-bind="click: toggleStatusPane">
            <i data-bind="css: { 'fi-plus': !isStatusPaneExpanded(), 'fi-minus': isStatusPaneExpanded() }"></i>
            </span>
            <div class="dropdown-content" data-bind="css: { configuring: isStatusPaneExpanded }">
            <div class="toggle-buttons" data-bind="requireAuth: {resource: 'Status',enableIf: 'ReadWrite'}">
            <div class="guiding-header">
            <button data-bind="css: { disabled: userConfigurationDisabled() },click: disableUserGuiding,">Disable</button>
            </div>
            <hr/>
            <span>Translation</span>
            <button data-bind="css: { accent: guidingComputed('translation_x') },click: updateGuiding.bind($data, 'translation_x')">X
            </button>
            <button data-bind="css: { accent: guidingComputed('translation_y') },click: updateGuiding.bind($data, 'translation_y')">Y
            </button>
            <button data-bind="css: { accent: guidingComputed('translation_z') },click: updateGuiding.bind($data, 'translation_z')">Z
            </button>
            </div>
            <div class="toggle-buttons" data-bind="requireAuth: {resource: 'Status',enableIf: 'ReadWrite'}">
            <span>Rotation</span>
            <button data-bind="css: { accent: guidingComputed('rotation_x') },click: updateGuiding.bind($data, 'rotation_x')">X
            </button>
            <button data-bind="css: { accent: guidingComputed('rotation_y') },click: updateGuiding.bind($data, 'rotation_y')">Y
            </button>
            <button data-bind="css: { accent: guidingComputed('rotation_z') },click: updateGuiding.bind($data, 'rotation_z')">Z
            </button>
            </div>
            <div class="toggle-buttons" data-bind="requireAuth: {resource: 'Status',enableIf: 'ReadWrite'}">
            <span>Elbow</span>
            <button data-bind="css: { accent: guidingComputed('elbow') },click: updateGuiding.bind($data, 'elbow'),text: guidingComputed('elbow')() ? 'On' : 'Off'"></button>
            </div>
            </div>
            </div>
            </ul>
            <div class="log" data-bind="css: logClass,requireAuth: {resource: 'Status',showIf: 'Read'}">
            <span data-bind="html: logHTML"></span>
            </div>
            <ul>
            <li class="combined-status transparent" data-bind="click: toggleStatusPane">
            <one-signal-light params="status: systemStatus">
            </one-signal-light>
            <label data-bind="text: statusText()"></label>
            </li>
            <li class="transparent pane-toggle" data-bind="click: toggleStatusPane,css: { opened: isStatusPaneExpanded() }">
            <i class="fi-play"></i>
            </li>
            </ul>
            </div>
            <div class="detail-content">
            <div class="guiding"></div>
            <ul class="status-details">
            <li>
            <one-signal-light params="status: robotCommunicationStatus">
            </one-signal-light>
            <label>Robot</label>
            </li>
            <li>
            <one-signal-light params="status: gripperCommunicationStatus">
            </one-signal-light>
            <label>Gripper</label>
            </li>
            </ul>
            <ul class="status-details">
            <li>
            <one-signal-light params="status: userStopStatus">
            </one-signal-light>
            <label data-bind="text: userStopText"></label>
            </li>
            <li>
            <one-signal-light params="status: brakeStatus">
            </one-signal-light>
            <label data-bind="text: brakesText"></label>
            <button data-bind="text: brakeStatus() === 'ok' ? 'Close' : 'Open',css: { disabled: isSetBrakesPending() || brakeStatus() === 'disabled' },click: toggleBrakes,requireAuth: {resource: 'Status',showIf: 'ReadWrite'}">
            </button>
            </li>
            <li class="errors">
            <div class="error-list-head">
            <one-signal-light params="status: rcuStatus">
            </one-signal-light>
            <label data-bind="css: { highlighted: rcuStatus() === 'error' }">
            <span data-bind="text: rcuErrors().length"></span> Errors
            </label>
            </div>
            <!-- ko if: rcuStatus() === 'error' -->
            <div>
            <!-- ko if: recoveryMode().automatic -->
        <button data-bind="  css: { disabled: isResetErrorsPending() },  click: resetErrors,  requireAuth: {    resource: 'Status',    showIf: 'ReadWrite'  }">Automatic reset
        </button>
        <!-- /ko -->
        <!-- ko if: manualErrorRecovery -->
        <button data-bind="css: { disabled: isResetErrorsPending() },click: resetErrorsManually,requireAuth: {  resource: 'Status',  showIf: 'ReadWrite'}">Manual reset
        </button>
        <!-- /ko -->
        </div>
        <ul class="error-list">
            <!-- ko foreach: rcuErrors() -->
        <li>
        <span data-bind="text: $data" class="highlighted"></span>
            </li>
            <!-- /ko -->
            </ul>
            <!-- /ko -->
            </li>
            </ul>
            </div>";

/***/ }),
/* 120 RobotStatus viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = RobotStatus

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var settings = __webpack_require__(11)
var assert = __webpack_require__(7)
var dialogs = __webpack_require__(8)

var watchdogTimeout = 10000

function RobotStatus(params) {
  assert.keys(params, "controller", "isStatusPaneExpanded")
  this.controller = params.controller
  this.isStatusPaneExpanded = params.isStatusPaneExpanded

  this.navMode = ko.observable("one")
  this.guidingModes = ko.observable()
  this.guidingConfiguration = ko.observable()
  this.rawRcuErrors = ko.observable({})
  this.recoveryMode = ko.observable({})
  this.brakesOpen = ko.observable(false)
  this.userStopOpen = ko.observable(false)
  this.robotConnected = ko.observable(false)
  this.gripperHardwareStatus = ko.observable("disconnected")
  this.pilotHardwareStatus = ko.observable("disconnected")
  this.baseHardwareStatus = ko.observable("disconnected")
  this.robotWatchdog = _.debounce(this.robotConnected.bind(undefined, false), watchdogTimeout)
  this.gripperWatchdog = _.debounce(this.gripperHardwareStatus.bind(undefined, "disconnected"), watchdogTimeout)
  this.pilotWatchdog = _.debounce(this.pilotHardwareStatus.bind(undefined, "disconnected"), watchdogTimeout)
  this.baseLedsWatchdog = _.debounce(this.baseHardwareStatus.bind(undefined, "disconnected"), watchdogTimeout)

  this.subs = []
  this.subs.push(this.controller.com.onNavigationModeChanged({
    onData: this.navMode
  }))
  this.guidingMode = ko.pureComputed(function() {
    var modes = this.guidingModes()
    return modes && modes.availableModes[modes.currentMode]
  }, this)
  this.userConfigurationDisabled = ko.pureComputed(function() {
    var modes = this.guidingModes()
    return modes && modes.availableModes.length !== 4
  }, this)
  this.subs.push(this.controller.com.onGuidingModeChanged({
    onData: this.guidingModes
  }))
  this.subs.push(this.controller.com.onGuidingConfigurationChanged({
    onData: this.guidingConfiguration
  }))
  this.subs.push(this.controller.com.onRobotStatusReceived({
    onData: function(rs) {
      this.rawRcuErrors(rs.robotErrors)
      this.recoveryMode(rs.recoveryMode)
    }.bind(this)
  }))
  this.subs.push(this.controller.com.onSystemStatusReceived({
    onData: function(ss) {
      this.brakesOpen(_.all(ss.brakesOpen))
      this.userStopOpen(ss.userStopOpen)
      this.robotConnected(ss.slavesOperational &&
                          ss.masterStatus === "OP" &&
                          ss.connectedSlaves === 7 &&
                          ss.jointsInError === false)
      this.robotWatchdog()
    }.bind(this)
  }))
  this.subs.push(this.controller.com.onGripperHardwareStateReceived({
    onData: function(gripperData) {
      this.gripperHardwareStatus(gripperData.connectionStatus)
      this.gripperWatchdog()
    }.bind(this)
  }))
  this.subs.push(this.controller.com.onPilotHardwareStateReceived({
    onData: function(pilotData) {
      this.pilotHardwareStatus(pilotData.connectionStatus)
      this.pilotWatchdog()
    }.bind(this)
  }))
  this.subs.push(this.controller.com.onBaseHardwareStateReceived({
    onData: function(baseData) {
      this.baseHardwareStatus(baseData.connectionStatus)
      this.baseLedsWatchdog()
    }.bind(this)
  }))
  this.robotHardwareStatus = ko.pureComputed(function() {
    if (this.robotConnected() &&
        this.baseHardwareStatus() === "connected" &&
        this.pilotHardwareStatus() === "connected") {
      return "connected"
    }
    return "disconnected"
  }, this)
  this.robotCommunicationStatus = ko.pureComputed(function() {
    if (this.robotHardwareStatus() === "connected") {
      return "ok"
    }
    return "error"
  }, this)
  this.gripperCommunicationStatus = ko.pureComputed(function() {
    if (this.gripperHardwareStatus() === "connected") {
      return "ok"
    }
    if (this.gripperHardwareStatus() === "disabled") {
      return "disabled"
    }
    return "error"
  }, this)
  this.userStopStatus = ko.pureComputed(function() {
    if (!this.robotConnected()) {
      return "disabled"
    }
    if (this.userStopOpen()) {
      return "ok"
    }
    if (!this.userStopOpen()) {
      return "error"
    }
  }, this)
  this.brakeStatus = ko.pureComputed(function() {
    if (!this.robotConnected()) {
      return "disabled"
    }
    if (this.brakesOpen()) {
      return "ok"
    }
    if (!this.brakesOpen()) {
      return "error"
    }
  }, this)
  this.rcuStatus = ko.pureComputed(function() {
    if (!this.robotConnected()) {
      return "disabled"
    }
    if (this.rcuErrors().length === 0) {
      return "ok"
    }
    if (this.rcuErrors().length > 0) {
      return "error"
    }
  }, this)
  this.systemStatus = ko.pureComputed(function() {
    if (this.robotHardwareStatus() === "disconnected" ||
        !this.brakesOpen() ||
        !this.userStopOpen() ||
        this.rcuErrors().length > 0) {
      return "error"
    }
    if (this.gripperHardwareStatus() === "disconnected") {
      return "warning"
    }
    return "ok"
  }, this)
  this.brakesText = ko.pureComputed(function() {
    return this.brakesOpen() ? "Brakes Open" : "Brakes Closed"
  }, this)
  this.userStopText = ko.pureComputed(function() {
    return this.userStopOpen() ? "User-Stop Open" : "User-Stop Closed"
  }, this)
  this.statusText = ko.pureComputed(function() {
    if (this.robotHardwareStatus() !== "connected") {
      return "No Connection"
    }
    if (!this.brakesOpen()) {
      return this.brakesText()
    }
    if (!this.userStopOpen()) {
      return this.userStopText()
    }
    if (this.rcuErrors().length > 0) {
      return this.rcuErrors()[0]
    }
    return "Ready"
  }, this)

  this.rcuErrors = ko.pureComputed(function() {
    if (!this.robotConnected()) {
      return []
    }
    var activeErrorNames = _.reduce(this.rawRcuErrors(), function(errors, isActive, errorType) {
      if (isActive) {
        errors.push(settings.rcuErrorMap[errorType] || errorType)
      }
      return errors
    }, [])
    return activeErrorNames
  }, this)

  this.manualErrorRecovery = ko.pureComputed(function() {
    return (
      this.rawRcuErrors().jointPositionViolation ||
      this.rawRcuErrors().cartesianPositionViolation ||
      this.rawRcuErrors().selfCollisionViolation
    )
  }, this)

  this.startUnfolding = ko.computed(function() {
    return !this.controller.showOverlay() && this.recoveryMode().folded
  }, this).subscribe(function(folded) {
    if (folded) {
      dialogs.showMessageDialog({
        icon: "warning",
        title: "Unfold the robot",
        text: "Choose <b>manually</b> if you have attached a custom end-effector. Otherwise you can unfold the robot <b>automatically</b>.",
        buttons: [
          {
            id: "manual",
            label: "Manually"
          },
          {
            id: "automatic",
            label: "Automatically"
          },
        ]
      }).then(function (id) {
        if (id === "manual") {
          this.unfoldManually()
        } else {
          this.unfold()
        }
      }.bind(this))
    }
  }, this)

  // Abuse browserify and knockout bindings to conveniently inline SVG
  this.oneModeIcon = __webpack_require__(121)
  this.robotModeIcon = __webpack_require__(122)
  this.zerogTranslationIcon = __webpack_require__(123)
  this.zerogRotationIcon = __webpack_require__(124)
  this.zerogFreeIcon = __webpack_require__(125)

  // Log message
  this.logTimeout = 10000
  this.logTimer = null
  this.logClass = ko.observable("")
  this.logHTML = ko.observable("")

  this.controller.uiEvents.onLogInfo(this.onLogInfo.bind(this))
  this.controller.uiEvents.onLogWarn(this.onLogWarn.bind(this))
  this.controller.uiEvents.onLogError(this.onLogError.bind(this))

  // Pending request states
  this.isSetBrakesPending = ko.observable(false)
  this.isResetErrorsPending = ko.observable(false)
}

RobotStatus.prototype.guidingComputed = function(key) {
  return ko.pureComputed(function() {
    return this.guidingConfiguration() && this.guidingConfiguration()[key]
  }, this)
}

RobotStatus.prototype.updateGuiding = function(key) {
  var config
  if (this.guidingConfiguration() === null) {
    config = { elbow: false,
               translation_x: false, // eslint-disable-line camelcase
               translation_y: false, // eslint-disable-line camelcase
               translation_z: false, // eslint-disable-line camelcase
               rotation_x: false, // eslint-disable-line camelcase
               rotation_y: false, // eslint-disable-line camelcase
               rotation_z: false // eslint-disable-line camelcase
             }
  } else {
    config = _.cloneDeep(this.guidingConfiguration())
  }
  config[key] = !config[key]
  this.controller.com.setGuidingConfiguration(config)
}

RobotStatus.prototype.dispose = function() {
  _.invoke(this.subs, "dispose")
  this.startUnfolding.dispose()
}

RobotStatus.prototype.onLogInfo = function(message) {
  console.log(message)
  this.logClass("info")
  this.logHTML(message)
  this.scheduleHideLog()
}

RobotStatus.prototype.onLogWarn = function(message) {
  console.warn(message)
  this.logClass("warn")
  this.logHTML("<i class='fi-alert'></i>&nbsp;" + message)
  this.scheduleHideLog()
}

RobotStatus.prototype.onLogError = function(message) {
  console.error(message)
  this.logClass("err")
  this.logHTML("<i class='fi-x'></i>&nbsp;" + message)
  this.scheduleHideLog()
}

RobotStatus.prototype.scheduleHideLog = function() {
  clearTimeout(this.logTimer)
  this.logTimer = setTimeout(this.logHTML.bind(this, ""), this.logTimeout)
}

RobotStatus.prototype.toggleStatusPane = function() {
  this.isStatusPaneExpanded(!this.isStatusPaneExpanded())
}

RobotStatus.prototype.setTranslationMode = function() {
  this.controller.com.setGuidingMode("translation")
}

RobotStatus.prototype.setRotationMode = function() {
  this.controller.com.setGuidingMode("rotation")
}

RobotStatus.prototype.setFreeMode = function() {
  this.controller.com.setGuidingMode("free")
}

RobotStatus.prototype.setUserMode = function() {
  if (this.guidingConfiguration() !== null) {
    this.controller.com.setGuidingMode("user")
  }
}

RobotStatus.prototype.disableUserGuiding = function() {
  if (this.guidingMode() === "user") {
    this.controller.com.setGuidingMode("free").then(function() {
      this.controller.com.deleteGuidingConfiguration()
    }.bind(this))
  } else {
    this.controller.com.deleteGuidingConfiguration()
  }
}

RobotStatus.prototype.resetErrors = function() {
  this.isResetErrorsPending(true)
  this.controller.com.resetErrors()
  .catch(function() {
    dialogs.showMessageDialog({
      icon: "error",
      title: "Resetting errors automatically failed"
    })
  })
  .then(this.isResetErrorsPending.bind(this, false))
}

RobotStatus.prototype.unfold = function() {
  this.isResetErrorsPending(true)
  dialogs.showMessageDialog({
    icon: "warning",
    title: "Wait until the robot is unfolded.",
    buttons: []
  })
  this.controller.com.resetErrors()
  .then(function() {
    dialogs.showMessageDialog({
      icon: "success",
      title: "Robot successfully unfolded.",
    })
  })
  .catch(function() {
    dialogs.showMessageDialog({
      icon: "error",
      title: "Unfolding automatically failed"
    })
  })
  .then(this.isResetErrorsPending.bind(this, false))
}

RobotStatus.prototype.resetErrorsManually = function() {
  this.isResetErrorsPending(true)
  dialogs.showMessageDialog({
    icon: "warning",
    title: "Use the guiding button to resolve the error" +
      (this.rcuErrors().length > 1 ? "s." : "."),
    buttons: []
  })
  this.controller.com.resetErrorsManually()
  .then(function() {
    dialogs.close()
  })
  .catch(function() {
    dialogs.showMessageDialog({
      icon: "error",
      title: "Resetting errors manually failed"
    })
  })
  .then(this.isResetErrorsPending.bind(this, false))
}

RobotStatus.prototype.unfoldManually = function() {
  this.isResetErrorsPending(true)
  dialogs.showMessageDialog({
    icon: "warning",
    title: "Use the guiding button to unfold the robot.",
    buttons: []
  })
  this.controller.com.resetErrorsManually()
  .then(function() {
    dialogs.showMessageDialog({
      icon: "success",
      title: "Robot successfully unfolded.",
    })
  })
  .catch(function() {
    dialogs.showMessageDialog({
      icon: "error",
      title: "Unfolding manually failed"
    })
  })
  .then(this.isResetErrorsPending.bind(this, false))
}

RobotStatus.prototype.toggleBrakes = function() {
  var pending = this.isSetBrakesPending
  if (pending()) {
    return
  }
  pending(true)
  var promise
  if (this.brakesOpen()) {
    var userStopOpen = this.userStopOpen
    promise = this.controller.com.closeBrakes()
    .catch(function() {
      return dialogs.showMessageDialog({
        icon: "error",
        title: "Closing brakes failed",
        text: userStopOpen() ? "Make sure the user stop is closed!" : ""
      })
    })
  } else {
    promise = this.controller.com.openBrakes()
    .catch(function(error) {
      dialogs.showMessageDialog({
        icon: "error",
        title: "Opening brakes failed",
        text: error.message === "eUserStopNotToggled" ? "Please toggle user stop." : ""
      })
    })
  }
  return promise.then(pending.bind(this, false))
}


/***/ }),

/* 121 oneModeIcon*/
/***/ (function(module, exports) {

module.exports = "<svg version=\"1.1\" id=\"Standard\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 70 70\" enable-background=\"new 0 0 70 70\" xml:space=\"preserve\"><g><path d=\"M26.1,68.4c-0.1,0-0.3-0.1-0.4-0.1c-0.8-0.2-1.2-1-1-1.8c0-0.2,0.1-0.3,0.1-0.5c0,0,0.1-0.1,0.1-0.1 c1.7-1.6,3.4-3.1,5.1-4.7c0.1-0.1,0.2-0.2,0.4-0.4c0.1-0.2,0.1-0.3-0.1-0.3c-1.7-0.4-3.4-0.8-5.2-1.2c-1.3-0.3-2.7-0.7-4-1 c-0.3-0.1-0.6-0.2-0.8-0.5c-0.5-0.5-0.5-1.2,0-1.7c0.5-0.5,1.1-0.7,1.7-0.8c0.8-0.1,1.7-0.2,2.5-0.2c1.4-0.1,2.9-0.2,4.3-0.3 c1.2-0.1,2.4-0.2,3.6-0.2c1.3-0.1,2.5-0.2,3.8-0.3c1.2-0.1,2.4-0.2,3.6-0.3c1.3-0.1,2.5-0.2,3.8-0.3c1-0.1,2-0.2,3-0.3 c0.8-0.1,1.6-0.1,2.4-0.4c0.4-0.1,0.8-0.3,1.1-0.6c0.5-0.5,0.6-1.1,0.3-1.7c-0.1-0.3-0.2-0.5-0.4-0.8c-2.4-4.2-4.9-8.3-7.3-12.5 c-1.5-2.6-3.1-5.2-4.6-7.8c0,0-0.1-0.1-0.1-0.2c0,0.1-0.1,0.1-0.1,0.2c-2.9,5-5.8,9.9-8.7,14.9c-0.4,0.8-0.9,1.5-1.4,2.2 c-0.3,0.4-0.6,0.7-0.9,1c-0.7,0.6-1.6,0.7-2.4,0.3c-0.7-0.4-1.3-0.9-1.9-1.5c-1.8-1.9-3.4-3.9-5.1-5.9c-1.1-1.3-2.1-2.7-3.2-4 c-0.4-0.5-0.6-1-0.7-1.6c0,0,0,0,0,0c0-0.2,0-0.5,0-0.7c0,0,0-0.1,0-0.1c0.1-0.6,0.3-1.1,0.5-1.6c5.7-9.7,11.5-19.5,17.2-29.2 c0.1-0.2,0.3-0.5,0.5-0.7c0.4-0.5,1-1,1.6-1.2c0.1,0,0.3-0.1,0.4-0.1c0.2,0,0.4,0,0.6,0C36.8,2,38.9,3.1,41,4 c1.8,0.8,3.6,1.7,5.4,2.6c0.4,0.2,0.9,0.5,1.2,0.8c0.8,0.7,1,1.6,0.8,2.6c-0.2,0.9-0.5,1.7-0.9,2.5c-1.4,2.6-2.8,5.2-4.3,7.7 c-1.2,2.1-2.4,4.2-3.6,6.2c-0.1,0.1-0.1,0.2,0,0.3c6,10,12,20.1,18,30.1c0.3,0.5,0.6,0.9,0.7,1.5c0.1,0.3,0.1,0.5,0.1,0.8 c0,0.2,0,0.5,0,0.7c-0.1,0.3-0.1,0.7-0.2,1c-0.5,1.5-1.5,2.3-3,2.7c-0.9,0.2-1.8,0.4-2.8,0.6c-2,0.4-4.1,0.7-6.1,1.1 c-1.6,0.3-3.3,0.6-4.9,0.8c-1.6,0.3-3.2,0.5-4.8,0.8c-1.6,0.3-3.1,0.5-4.7,0.8c-1.4,0.2-2.7,0.4-4.1,0.6c-0.4,0.1-0.7,0.1-1.1,0.2 C26.6,68.4,26.3,68.4,26.1,68.4z M42.9,11.9c-3.5-1.9-7-3.8-10.5-5.7c0,0.1-0.1,0.1-0.1,0.2c-3.1,4.9-6.2,9.9-9.2,14.8 c-0.7,1.2-1.5,2.3-2.2,3.5c0,0.1,0,0.2-0.2,0.1c0,0-0.1,0.1-0.1,0.1c0.1,0.1,0,0.2-0.1,0.3c-1.3,2.3-2.6,4.7-3.9,7 c-0.1,0.1-0.1,0.2,0,0.3c2.9,3.3,5.9,6.7,8.8,10c0.1,0.1,0.1,0.2,0.2,0.2C31.4,32.5,37.1,22.2,42.9,11.9z M25.7,66.3 c0.1,0,0.2,0.1,0.3,0.1c0.4,0.1,0.8,0.1,1.1,0c1.9-0.3,3.8-0.6,5.7-0.9c1.8-0.3,3.6-0.6,5.4-0.9c1.9-0.3,3.9-0.7,5.8-1 c2.1-0.4,4.3-0.8,6.4-1.2c1.3-0.2,2.5-0.5,3.8-0.8c0.6-0.1,1.2-0.4,1.7-0.8c0.6-0.5,0.8-1.2,0.5-2c-0.1-0.2-0.3-0.5-0.4-0.7 c-3.2-5.3-6.5-10.7-9.7-16c0-0.1-0.1-0.1-0.1-0.2c0,0.1,0,0.1,0.1,0.2c1.3,2.2,2.5,4.3,3.8,6.5c0.3,0.5,0.6,1,0.9,1.6 c0.6,1.3,0.2,2.5-1,3.2c-0.3,0.2-0.7,0.4-1.1,0.5c-0.9,0.3-1.9,0.3-2.9,0.4c-1,0.1-2.1,0.2-3.1,0.3c-1.1,0.1-2.3,0.2-3.4,0.3 c-1,0.1-2.1,0.2-3.1,0.2c-1.3,0.1-2.5,0.2-3.8,0.3c-1.2,0.1-2.4,0.2-3.5,0.2c-1.4,0.1-2.8,0.2-4.2,0.3c-0.9,0.1-1.9,0.1-2.8,0.2 c-0.4,0-0.9,0.2-1.2,0.5c-0.3,0.3-0.3,0.5,0.1,0.7c0.1,0,0.1,0.1,0.2,0.1c0.2,0.1,0.3,0.1,0.5,0.2c2.9,0.7,5.9,1.4,8.8,2.1 c0.5,0.1,0.8,0.6,0.7,1c0,0.4-0.2,0.6-0.5,0.9c-1.6,1.5-3.3,3-4.9,4.5C25.8,66.2,25.8,66.2,25.7,66.3z M44,11.6 c-6.1,10.9-12.2,21.7-18.2,32.6c-3.3-3.8-6.6-7.5-9.9-11.3c-0.3,0.4-0.5,0.8-0.6,1.2c-0.1,0.5,0,0.9,0.2,1.3 c0.2,0.2,0.3,0.4,0.5,0.6c1.9,2.5,4,5,6.1,7.3c0.8,0.9,1.5,1.7,2.3,2.5c0.4,0.4,0.5,0.4,1.1,0.1c0.1,0,0.2-0.1,0.2-0.2 c0.3-0.2,0.6-0.6,0.8-0.9c0.8-1.4,1.6-2.7,2.4-4.1c5.8-10,11.4-20.1,16.8-30.3c0.2-0.3,0.3-0.6,0.4-0.9c0.2-0.4,0.1-0.7-0.3-1.1 C45.4,8.3,45,8,44.5,7.8c-2.8-1.4-5.6-2.7-8.5-4c-0.6-0.3-1.2-0.5-1.8-0.7C34.1,3,33.9,3,33.7,3.2c-0.2,0.2-0.5,0.4-0.7,0.6 c-0.3,0.3-0.5,0.7-0.7,1.1c-0.1,0.1-0.1,0.2-0.2,0.4C36.1,7.3,40.1,9.5,44,11.6z M45.5,12.7C45.5,12.7,45.5,12.7,45.5,12.7 c0.2-0.3,0.4-0.7,0.6-1c0,0,0,0,0,0C45.8,12,45.6,12.4,45.5,12.7z\"></path></g></svg>"

/***/ }),
/* 122 robotModeIcon*/
/***/ (function(module, exports) {

module.exports = "<svg version=\"1.1\" id=\"Standard\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 70 70\" enable-background=\"new 0 0 70 70\" xml:space=\"preserve\"><g><path stroke-width=\"2\" stroke-miterlimit=\"10\" d=\"M54.5,43.9c-0.6,0.9-1.4,1-2.3,1c-0.7,0-1.5-0.1-2.2-0.4 c-1.1-0.3-2.1-1.8-1.6-3.2c0.3-0.9,0.2-1.9-0.3-2.8c-0.4-0.8-0.2-1.6,0-2.4c0.2-0.5,0.1-0.7-0.4-0.8c-0.6,0-1.1-0.1-1.7,0 c-3.7,0.4-6.3-2.2-5.8-5.8c0.2-1.7,1.3-2.9,2.9-3.5c0.7-0.3,1.4-0.4,2.2-0.7c-0.1-0.2-0.3-0.3-0.4-0.4c-1-1-2-2-3-3.1 c-1-1.1-2.3-1.5-3.8-1.3C37.1,20.7,36,20.9,35,21c-0.9,0.1-1.7,0.1-2.6,0c-1.1-0.1-2.1-0.7-2.7-1.7c-1.3-1.8-2.6-3.6-4-5.4 c-0.1-0.1-0.2-0.2-0.3-0.4c-0.6,0.8-1.3,1.5-1.9,2.3c-0.2,0.3-0.2,0.8-0.2,1.2c0.3,2.2,0.7,4.5,1,6.7c0.1,0.5-0.1,1.2-0.3,1.7 c-0.3,0.7-0.7,1.3-1.1,1.9c-0.6,0.9-1,2-1,2.9c0.2,0,0.3-0.1,0.5-0.1c1.7-0.7,3.4-0.8,5.2-0.7c0.5,0,1.2,0.3,1.6,0.6 c1.6,1.2,2.4,3.5,1.9,5.4c-0.2,0.6-0.5,1.1-0.9,1.6c-2.3,2.6-3.6,5.7-4.1,9.1c-0.1,0.8-0.1,1.6-0.2,2.4c-0.2,1.5,0.3,2.9,0.7,4.3 c0.1,0.3,0.5,0.5,0.8,0.6c1.6,0.9,3.2,1.9,4.8,2.8c0.5,0.3,0.9,0.7,1.1,1.3c0.5,1.3,1,2.6,1.6,3.8c0.4,0.8,0.1,1-0.5,1.3 c-1.3,0.6-2.7,1.3-4.1,1.9c-1.5,0.7-2.9,1.4-4.4,2c-0.7,0.3-1.3,0.3-1.9-0.1c-2.8-1.8-5.6-3.6-8.3-5.4c-0.3-0.2-0.7-0.5-1-0.8 c-0.6-0.6-0.8-1.3-0.6-2.2c0.5-1.8,0.8-3.7,1.4-5.5c0.6-2,0.9-4.1,0.7-6.2c-0.1-1.4,0.5-2.5,1.3-3.6c0.2-0.2,0.4-0.4,0.6-0.7 c-1.1,0.1-2,0.2-2.9,0.3c-0.7,0.1-1.4,0-2-0.4c-2.2-1.5-3-4.2-2.1-6.6c0.1-0.3,0.3-0.5,0.5-0.8c2-2.5,2.8-5.4,2.6-8.5 C14,23,13.5,20,13,17.1c-0.1-1-0.3-1.9-0.4-2.9c0-0.4,0.1-0.8,0.2-1.2c0-0.2,0-0.4-0.1-0.6c-1.1-2.1-1-4.2,0.2-6.2 c0.4-0.7,0.9-1.1,1.7-1.3c2.2-0.6,4.4-1.1,6.6-1.6c1.5-0.3,3-0.7,4.5-0.8c1.3-0.1,2.7-0.1,4-0.1c0.4,0,1,0.3,1.3,0.6 c1.3,1.5,2.6,3,3.8,4.6c2.1,2.7,4.7,4.7,7.6,6.4c0.5,0.3,1,0.7,1.4,1.1c2,2.1,4,4.2,6,6.4c0.9,1,2,1.8,3.3,2.2 c1.1,0.4,2,1.1,2.8,1.9c1.1,1.1,1.1,2.5,1,3.9c-0.3,3-0.5,6-0.8,9c-0.1,0.5-0.4,1-0.7,1.6c0.5,0.1-0.6,0-0.3,3.2 C55.1,43.1,54.6,44,54.5,43.9z M15.5,42.1c0.8-0.1,1.4-0.1,2.1-0.2c1-0.1,1.7-0.5,2-1.5c0.3-0.9,0.4-1.9,0.5-2.9 c0.2-1.9,0.3-3.8,0.6-5.7c0.5-2.5,1.2-5,3.1-6.9c0.5-0.5,0.6-1,0.5-1.7c-0.3-1.3-0.4-2.5-0.6-3.8c-3.2,1.2-6.4,1.7-9.8,1.5 c0.9,4.5,1,8.9-1.6,13c1-0.2,1.7,0.3,2.3,0.9c0.9,1,1.4,2.2,1.7,3.5C16.4,39.7,16.4,41,15.5,42.1z M26.8,53.4 c-0.5-0.3-0.5-0.9-0.6-1.3c-0.2-0.5-0.3-1.1-0.4-1.7c-1.3,1.5-3,1.8-4.8,1.8c-1.8,0-3.5-0.3-4.8-1.9c-0.5,2-1,3.9-1.5,5.8 c-0.3,1,0.1,1.7,0.8,2.3c0.5,0.4,1.1,0.8,1.7,1.1c0.8,0.4,1.3,1,1.5,1.9c0.1,0.5,0.4,0.8,0.8,1.1c1.4,0.9,2.8,1.8,4.2,2.7 c0.7,0.5,1.5,0.5,2.2,0.2c0.9-0.4,1.9-0.9,2.8-1.3c1.8-0.8,3.5-1.6,5.3-2.4c0.3-0.1,0.6-0.3,0.5-0.7c-0.5-1.2-1-2.4-1.5-3.6 C32.6,57.7,27.2,53.6,26.8,53.4z M17.4,6c1.5,2.4,2.1,4.8,1.3,7.4c0.8-0.3,1.6-0.6,2.4-0.7c0.9-0.2,1.9-0.2,2.8-0.3 c0.6-0.1,1,0.1,1.4,0.6c0.3,0.5,0.6,0.9,1,1.4c0.3-3,5.5-7,8.6-6.5c-1.4-1.6-2.6-3.2-3.9-4.7c-0.5-0.6-1.2-0.7-1.9-0.5 c-2.6,0.6-4.5,2.1-6,4.3c-0.3,0.5-0.6,0.6-1.1,0.4c-0.9-0.3-1.8-0.6-2.7-0.9C18.7,6.3,18.1,6.2,17.4,6z M20.5,47.7 c1.8,0,3.4-0.9,4.5-2.7c1.6-2.8,2.7-5.7,3.3-8.8c0.4-2.3-0.2-4.3-2-5.9c-0.7-0.7-1.6-0.9-2.6-0.5c-0.5,0.2-1,0.3-1.5,0.5 c-0.6,0.2-0.7,0.8-0.2,1.2c1.8,1.7,2.6,3.8,2.5,6.2c-0.1,1.4-0.7,2.5-2.2,2.9c-1.2,0.3-2.3,0.8-3.4,1.2c-0.2,0.1-0.4,0.1-0.5,0.3 c-0.8,0.8-1.4,1.7-1.8,2.7c-0.4,1-0.1,1.7,0.8,2.3C18.2,47.5,19.2,47.7,20.5,47.7z M52.6,23.9c-0.2-0.2-0.4-0.2-0.6-0.3 c-0.7-0.5-1.5-1-2.1-1.6c-2.1-2.2-4.1-4.4-6.2-6.6c-0.5-0.5-1.1-1-1.7-1.3c-2.4-1.4-4.5-3.2-6.5-5.1c-0.6-0.5-1.1-0.8-1.8-0.6 c-3,0.7-5.2,2.4-6.7,5c-0.1,0.2-0.2,0.5-0.3,0.7c0,0.4-0.1,0.8,0.1,1.1c0.8,1.3,1.8,2.5,2.7,3.8c0-1.4,0.7-2.3,1.5-3.1 c1.2-1.1,2.5-1.8,4-2.1c1-0.2,2-0.4,2.9-0.2c3.1,0.6,5.8,1.9,7.9,4.5c1.6,1.9,3.3,3.6,5,5.5C51.4,23.9,51.9,24,52.6,23.9z M25.5,29.5c2.4,1.5,3.3,3.7,2.9,6.4c-0.5,3.4-1.8,6.5-3.5,9.5c-0.7,1.2-1.8,2-3.1,2.3c-2,0.5-3.9,0.2-5.5-1.2c0,1,0,2,0,2.9 c0,0.8,0.3,1.3,0.9,1.7c1.1,0.7,2.3,0.9,3.5,0.9c1.4,0,2.8-0.1,4-0.9c0.5-0.3,0.9-0.8,0.9-1.4c0-1,0.1-2.1,0.2-3.1 c0.4-3.8,1.8-7.1,4.3-9.9c0.3-0.3,0.5-0.7,0.6-1.1c0.4-1.9-0.1-3.6-1.4-5.1c-0.5-0.6-1.1-1-1.9-1C26.9,29.4,26.3,29.4,25.5,29.5z M20.8,14.3c-0.8,0.2-1.5,0.4-2.2,0.5c-1.5,0.4-3,0.5-4.2-0.7c-0.4-0.4-0.9-0.4-1.4-0.3c0,0.2,0,0.3,0,0.5c0.3,1.9,0.6,3.9,0.9,5.8 c0.1,0.4,0.3,0.6,0.7,0.6c1.3-0.1,2.7-0.1,4-0.3c1.5-0.2,2.9-0.7,4.4-1c0.6-0.1,0.8-0.5,0.6-1.1c-0.1-0.4-0.1-0.9-0.2-1.3 c-0.2-0.8,0.1-1.4,0.6-1.9c0.5-0.6,1-1.2,1.5-1.8c0,0-0.1-0.1-0.1-0.1c-0.9,0.2-1.9,0.5-2.8,0.7c-0.1,0-0.3,0.2-0.3,0.4 c-0.3,1-0.6,1.9-0.5,3c0,0.2,0,0.4-0.1,0.6c-0.1,0-0.1,0-0.2,0C21.2,16.7,21,15.6,20.8,14.3z M48.5,37.7c0.8,0.6,1.6,0.9,2.5,1 c1.4,0.2,2.7,0.3,4.1-0.3c0.6-0.2,0.9-0.6,0.9-1.3c0-1.1,0.2-2.2,0.3-3.3c0.1-1.5,0.2-2.9,0.4-4.4c-1.9,1.1-5.6,1-7.9-0.5 c0.2,0.2,0.4,0.4,0.5,0.6c0.2,0.5,0.6,1,0.6,1.6c-0.1,1.9-0.2,3.8-0.4,5.7C49.5,37.4,49.2,37.7,48.5,37.7z M45.6,25.2 c0,0,0.1-0.1,0.1-0.1c-1.3-1.3-2.5-2.6-3.7-4c-0.6-0.7-1.4-1-2.3-1c-1.2,0-2.5,0-3.7,0c-0.3,0-0.8-0.2-1-0.5 c-0.3-0.4,0-0.8,0.3-1.1c0.7-0.7,1.5-1,2.4-1c1.3,0,2.6,0.1,3.9,0.1c0.7,0,1.3,0.3,1.8,0.8c0.2,0.2,0.4,0.4,0.6,0.7 c1.6,1.6,3.2,3.3,4.8,4.9c0.3,0.3,0.3,0.4-0.1,0.6c-0.1,0.1-0.3,0.1-0.5,0.2c0.4,0.2,0.7,0.3,1,0.5c0.5-0.4,1-0.8,1.4-1.1 c-0.1,0-0.2-0.1-0.3-0.1c-1-0.2-1.8-0.7-2.5-1.5c-1.2-1.4-2.5-2.7-3.7-4.1c-0.4-0.4-0.8-0.8-1.1-1.3c-0.4-0.7-1-1.2-1.7-1.5 c-0.7-0.3-1.4-0.6-2.2-0.8c-2.8-0.9-5.3-0.2-7.6,1.5c-0.5,0.4-1,1-1.3,1.5c-0.7,1.2-0.3,2.4,1.1,2.8c0.9,0.3,1.8,0.4,2.8,0.3 c1.4-0.1,2.8-0.4,4.2-0.6c1.3-0.2,2.5,0.2,3.4,1.1c1.1,1.1,2.2,2.3,3.3,3.4C45.4,25,45.5,25.1,45.6,25.2z M18.9,11.5 c-0.1-0.9-0.2-1.6-0.3-2.2c-0.4-1.5-1-2.9-2.3-3.8c-1.1-0.8-2.3-0.6-3.1,0.5c-2.1,2.9-1,7.2,2.3,8.7c1.1,0.5,2.2,0.3,2.7-0.9 C18.6,13.1,18.8,12.2,18.9,11.5z M48.7,24.4c-0.4-0.5-0.8-1-1.2-1.5c-1.3-1.4-2.7-2.8-4-4.3c-0.6-0.6-1.2-0.9-2-0.9 c-1.3,0-2.5-0.1-3.8,0c-0.6,0-1.2,0.3-1.8,0.6c-0.4,0.2-0.8,0.6-0.7,1.1c0.2,0.6,0.7,0.5,1.2,0.5c1.2,0,2.4,0,3.6,0 c0.8,0,1.5,0.3,2,0.9c1.1,1.2,2.2,2.3,3.2,3.4c0.5,0.6,1,1,1.8,0.5c0.2-0.1,0.5-0.1,0.7-0.1C48.1,24.6,48.5,24.4,48.7,24.4z M19.1,41.5c1.2-0.4,2.3-0.8,3.4-1.2c0.8-0.3,1.3-0.8,1.5-1.6c0.4-1.1,0.3-2.2,0-3.3c-0.4-1.4-1-2.7-2.2-3.7c0,0.3,0,0.2,0,0.3 c-0.1-0.5-0.1-0.7-0.2-0.7c0-0.4-0.1,0.2-0.1-0.1c0-1.6,0.5-3,1.5-4.3c0.4-0.5,0.6-1.1,1-1.6c0,0-0.1-0.1-0.1-0.1 c-0.7,0.8-1.4,1.5-1.8,2.5c-1.2,3.1-1.9,6.4-1.9,9.7C20.2,38.8,20.1,40.1,19.1,41.5z M10.9,37.2c0.1,1.8,1,3.5,2.5,4.5 c1.3,0.9,2.5,0.4,2.8-1.2c0.3-2.2-0.3-4-1.8-5.6c-0.2-0.2-0.5-0.4-0.7-0.5c-0.9-0.4-1.7-0.2-2,0.7C11.2,35.7,11.1,36.5,10.9,37.2z M41.3,27.7c1.5-0.6,2.5,0.1,3.3,1.2c0.7,0.9,1.1,2,1,3.2c0,0.6-0.2,1.2-0.4,1.8c-0.3,0.6-0.8,0.9-1.6,1c1.6,0.6,3.1,0,4.6,0.3 c0.1-1.4,0.2-2.8,0.3-4.2c0-0.5,0-1,0-1.5c0-0.1-0.1-0.3-0.2-0.4c-1-0.8-1.9-1.6-2.9-2.4C44,25.7,42.2,26.1,41.3,27.7z M45.1,32 c0-1.3-0.7-2.8-1.6-3.5c-1.2-1-2.6-0.5-2.9,1c-0.3,1.4,0.1,2.6,0.9,3.7c0.7,0.9,1.6,1.3,2.4,1.1C44.6,34,45.1,33.1,45.1,32z M50.8,23.8c-0.3-0.4-0.7-0.9-1.2-1.5c-1.2-1.4-2.5-2.8-3.8-4.3c-0.9-1-1.8-2-3-2.7c-1.6-0.9-3.2-1.6-5-1.8c-2.7-0.3-5,0.7-7,2.6 c-0.4,0.4-0.8,1-1,1.6c-0.3,0.6-0.2,1.3,0.4,1.9c-0.4-1.2,0-2.2,0.8-2.9c2-2,4.5-2.9,7.3-2.5c0.9,0.1,1.7,0.5,2.6,0.8 c1.1,0.4,2,1,2.6,2.1c0.1,0.2,0.3,0.4,0.5,0.6c1.4,1.5,2.8,2.9,4.1,4.5C48.9,23.2,49.9,23.7,50.8,23.8z M23.6,4.6 c-1.2-0.6-2.3-1.3-3.7-0.9c-1.5,0.4-3,0.7-4.6,1c0.5,0.3,0.9,0.4,1.2,0.7c0.4,0.3,0.8,0.5,1.3,0.6c0.6,0.1,1.2,0.3,1.7,0.4 c0.8,0.3,1.7,0.6,2.5,0.8c0.3,0.1,0.7,0.2,0.7-0.2C22.7,6.1,23.1,5.3,23.6,4.6z M54.4,39.9c-2,0.4-3.9,0.2-5.8-0.8 c0,0.2,0.1,0.4,0.1,0.4c1.1,0.3,2.1,0.7,2.7,1.6c0.2,0.2,0.1,0.7,0,1c-0.3,0.5-0.8,0.7-1.3,0.6c-0.5,0-0.9-0.3-1.1-0.8 c-0.1-0.2-0.1-0.5-0.2-0.7c-0.3,0.8-0.2,1.2,0.5,1.5c0.6,0.3,1.2,0.5,1.8,0.6c0.7,0.1,1.4,0.1,2.1,0 M53.1,43.4c0.3,0,0.6,0,0.8,0 c1.5,0,0.3-2.5,1.4-3.1c0-0.2,0-0.4-0.1-0.6c-0.3,0.1-0.6,0.2-0.9,0.2 M48.5,29c0-0.4,0.1-0.8,0.1-1.1c0.1-0.3,0.1-0.7,0.3-0.9 c0.7-1,0.4-1.7-0.7-2c-0.3-0.1-0.6-0.1-0.8-0.1c-1.1,0.3-2.2,0.7-3.4,1C46.1,26.4,46.9,28.2,48.5,29z M17.7,14.9 c2.5-0.6,5-1.3,7.4-1.9c-0.3-0.6-0.8-0.6-1.3-0.5c-0.6,0.1-1.2,0.2-1.8,0.2C20.3,12.9,18.8,13.3,17.7,14.9z M52.1,24.9 c-0.3-0.3-0.5,0-0.6,0.3c0,0.3,0.1,0.7,0.2,0.9c0.2,0.3,0.5,0.6,0.9,0.7c0.5,0.2,1,0.4,1.5,0.5c0.2,0,0.5-0.1,0.9-0.2 c0.3,0.1,0.6,0,0.6-0.4c0-0.3-0.1-0.7-0.3-0.8c-0.4-0.2-0.5-0.6-0.8-0.7c-0.5-0.2-1.1-0.4-1.7-0.5C52.6,24.6,52.4,24.8,52.1,24.9z M48.2,37.8c-0.1,0.5,0.2,0.9,0.7,1.1c1,0.6,2.1,0.8,3.2,0.9c1.1,0.1,2.2,0,3.1-0.5c0.4-0.2,0.8-0.5,0.7-1 C53.2,39.6,50.7,39.3,48.2,37.8z M14.4,57.6c-0.5,1-0.2,1.9,0.6,2.6c0.3,0.2,0.6,0.5,0.9,0.7c1.6,1,3.1,2,4.7,3 c1.1,0.7,2.2,1.5,3.4,2.2c0.6,0.4,1.3,0.4,2,0.1c-0.2-0.1-0.3,0-0.5-0.1c-0.5-0.1-1.1,0-1.5-0.3c-2.7-1.7-5.4-3.4-8-5.2 c-0.1-0.1-0.3-0.4-0.3-0.5c0.3-0.8-0.1-1.3-0.7-1.8C14.7,58.2,14.6,57.9,14.4,57.6z M54.5,29.3c0-0.1,0-0.1,0.1-0.2 c-0.9-0.5-1.9-1-2.7-1.5c-1.1-0.6-2-1.4-1.7-2.9c-0.6,0.5-0.7,1-0.4,1.7C50.3,28,52.9,29.5,54.5,29.3z M28.7,2.4 c-2.3-0.5-5.9,2.2-5.6,4.1C24.5,4.6,26.3,3.2,28.7,2.4z M29.1,58.6 M55,27.7c-0.4,0-0.9,0-1.4-0.1c0,0.2-0.1,0.5,0,0.6 c0.4,0.3,0.9,0.6,1.3,0.8c0.6,0.2,1.4-0.2,1.6-0.7c0.2-0.5,0-1.2-0.5-1.4c-0.2,0.2-0.3,0.4-0.4,0.5c0,0.3,0,0.5,0,0.7 C55.4,28,55.2,27.9,55,27.7z M21.5,3.3c0.7,0.4,1.3,0.7,1.9,0.9c0.1,0.1,0.4,0.1,0.5,0c0.8-0.6,1.5-1.2,2.3-1.8 C24.6,2.7,23.1,3,21.5,3.3z M18.6,62.2c-0.2-0.9-0.4-1.6-1.2-1.9c-0.2-0.1-0.4-0.3-0.6-0.5c-0.3-0.2-0.5-0.5-0.9-0.8 c-0.1,0.4-0.1,0.6-0.1,0.9c0,0.2,0,0.5,0.1,0.6C16.8,61.1,17.7,61.6,18.6,62.2z M52.8,29.6c-2.4-1.4-2.6-1.5-3.4-2.8 c-0.7,0.7-0.7,1.2,0.1,1.7C50.5,29.1,51.6,29.4,52.8,29.6z M49.1,29.7c0,0-0.1,0-0.1,0c-0.2,2.1-0.3,4.1-0.5,6.2 c0,0.2,0.1,0.4,0.2,0.8c0.1-0.3,0.2-0.4,0.2-0.5c0.1-1.9,0.3-3.8,0.4-5.7C49.3,30.3,49.1,30,49.1,29.7z M50.8,40.8 c0,0.2,0.1,0.3,0,0.4c-0.1,0.3-0.3,0.8-0.4,0.8c-0.3,0-0.7-0.2-0.9-0.4c-0.4-0.5-0.3-1.1,0.1-1.6c-0.3-0.1-0.5-0.1-0.9-0.3 c0.1,0.8,0.2,1.6,0.4,2.2c0.1,0.5,0.6,0.7,1.1,0.6c0.5,0,0.9-0.2,1-0.7C51.5,41.5,51.3,41.2,50.8,40.8z M48.2,36.6 c0,0.4,0.2,0.8,0.6,0.9c0.5,0,0.5-0.4,0.5-0.8c0.1-1.8,0.3-3.6,0.4-5.4c0-0.3-0.1-0.5-0.1-0.8c-0.2,1-0.2,1.9-0.3,2.8 c-0.1,1-0.1,1.9-0.2,2.9c0,0.3-0.2,0.5-0.3,0.8C48.7,36.8,48.4,36.7,48.2,36.6z M58.5,44.6 M48.6,42.6c0.6,1.2,4.1,1.9,5.4,1 C52,43.8,50.2,43.8,48.6,42.6z M42.9,34.5c0.9,0.3,1.6,0.1,2.1-0.7c0.6-1,0.6-2.9,0-3.8c0.1,0.6,0.2,1.4,0.2,2.2 C45.2,33.8,44.4,34.4,42.9,34.5z M25.9,65.8c0,0,0,0.1,0.1,0.1c2.4-1.1,4.8-2.2,7.2-3.3c0,0,0-0.1-0.1-0.1 C30.7,63.5,28.3,64.6,25.9,65.8z M21.3,16.6c0.2-0.9,0.4-1.7,0.6-2.6c-0.4,0.1-0.7,0.2-1,0.3C21.1,15.1,21.2,15.8,21.3,16.6z M50.5,41.5c0.1-0.5-0.3-1.1-0.6-1.1c-0.1,0-0.3,0.2-0.4,0.4c-0.1,0.4,0.3,1,0.6,1C50.3,41.7,50.4,41.5,50.5,41.5z M53.2,28.1 c0.3-0.4,0.2-0.6-0.2-0.7c-0.3-0.1-0.5-0.3-0.8-0.4c-0.4-0.2-0.4-0.2-0.9,0.1C52,27.4,52.6,27.7,53.2,28.1z M51,26.8 c0.2-0.2,0.3-0.4,0.5-0.6c-0.5-0.1-0.2-1.2-1.2-0.8C50.5,25.9,50.8,26.3,51,26.8z M49.1,43.5c1.2,1,4,1.2,5.1,0.4 C52.4,44.4,50.8,44.2,49.1,43.5z M48.9,28.4c0.9,0.9,1.9,1.1,3.1,1.3C50.9,29.3,50,28.9,48.9,28.4z M49.9,44.3 c1.1,0.4,2.3,0.6,3.3,0.2C52.2,44.5,51,44.4,49.9,44.3z M51.5,24.5c-0.6-0.3-1,0-1,0.7C50.9,25.2,50.9,25.2,51.5,24.5z M32.8,57\"></path><path stroke-width=\"2\" stroke-miterlimit=\"10\" d=\"M53.8,26.9c-0.4-0.2-0.7-0.3-1.1-0.6 c-0.1-0.1-0.2-0.4-0.2-0.5c0-0.1,0.3-0.3,0.4-0.2c0.4,0.1,0.8,0.2,1.1,0.5c0.1,0.1,0.2,0.4,0.2,0.5C54.3,26.7,54,26.7,53.8,26.9z M54.1,26.4c-0.2-0.6-0.6-0.8-1.2-0.5C53.1,26.4,53.4,26.6,54.1,26.4z\"></path></g></svg>"

/***/ }),
/* 123 zerogTranslationIcon*/
/***/ (function(module, exports) {

module.exports = "<svg version=\"1.1\" id=\"Standard\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 70 70\" enable-background=\"new 0 0 70 70\" xml:space=\"preserve\"><g><path d=\"M4.1,20.7c0.1-0.1,0.2-0.2,0.3-0.4c9.9,4.6,19.8,9.2,29.7,13.8c0.1-0.1,0.3-0.2,0.4-0.3c0-10.8,0-21.6,0-32.3 c0.2,0,0.3,0,0.5,0c0,0.1,0,0.2,0,0.4c0,10.5,0,21,0,31.5c0,0.1,0,0.3,0,0.4c0.2,0,20.6-10,20.9-10.2c-0.4-0.8-0.8-1.6-1.2-2.4 c3.5-0.4,7-0.7,10.4-1.1c0,0,0,0,0,0.1c-2.4,2.5-4.8,5-7.3,7.6c-0.4-0.8-0.8-1.6-1.2-2.4c-6.5,3.2-13.1,6.4-19.6,9.6 c0.2,0.2,19,9,19.4,9.1c0.4-0.8,0.7-1.6,1.1-2.4c2.5,2.5,4.9,4.9,7.4,7.4c-0.2,0.1-10-0.8-10.4-0.9c0.4-0.8,0.7-1.6,1.1-2.4 c-6.7-3.1-13.3-6.2-20-9.3c0,7.4,0,14.7-0.1,22.1c0.9,0,1.8,0,2.7,0c-1.2,3.3-2.4,6.6-3.6,9.9c0,0,0,0-0.1,0 c-1.2-3.3-2.4-6.6-3.6-9.9c0.9,0,1.8,0,2.7,0c0-7.7,0-15.3,0.1-23C24.1,40,14.3,44.6,4.5,49.1c-0.1-0.1-0.1-0.3-0.2-0.4 C14.1,44.1,24,39.6,33.8,35c0-0.1,0-0.3,0-0.4c-0.1-0.1-0.2-0.1-0.3-0.2c-9.7-4.5-19.4-9-29-13.6C4.3,20.8,4.2,20.8,4.1,20.7 C4.1,20.7,4.1,20.7,4.1,20.7z\"></path></g></svg>"

/***/ }),
/* 124 zerogRotationIcon*/
/***/ (function(module, exports) {

module.exports = "<svg version=\"1.1\" id=\"Standard\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 70 70\" enable-background=\"new 0 0 70 70\" xml:space=\"preserve\"><g><path d=\"M36.2,68.2c-0.9,0-1.8,0-2.7,0c-0.3,0-0.7-0.1-1-0.1c-2.3-0.2-4.5-0.5-6.7-1.2c-9.4-2.7-17.2-9.4-21.1-18.4 c-1.6-3.6-2.5-7.4-2.7-11.3c0-0.2-0.1-0.5-0.1-0.7c0-0.9,0-1.7,0-2.6c0.1-0.1,0.1-0.2,0-0.4c0-0.2,0-0.5,0-0.7c0,0,0.1-0.1,0.1-0.1 c0-0.1,0-0.3,0-0.4c0.1-1.4,0.3-2.8,0.6-4.2c1.2-5.5,3.6-10.4,7.3-14.6c5.9-6.8,14.4-11,23.4-11.3c0.1,0,0.2,0,0.3,0 c0.8,0,1.7,0,2.5,0c0.1,0,0.2,0,0.3,0c0.6,0,1.2,0.1,1.8,0.1c1.8,0.2,3.6,0.5,5.4,1C53,6,60.8,12.6,64.9,21.5 c1.2,2.7,2.1,5.5,2.6,8.5c0.1,0.9,0.2,1.8,0.3,2.7c0,0.1,0,0.1,0.1,0.2c0,0.2,0,0.5,0,0.7c0,0.1,0,0.2,0,0.4c0,0.9,0,1.7,0,2.6 c0,0.1,0,0.2,0,0.3c0,0.4,0,0.8-0.1,1.2c-0.1,1.8-0.5,3.6-0.9,5.4c-2.6,10.2-9.9,18.5-19.7,22.4c-3.2,1.3-6.5,2-10,2.3 C36.9,68.1,36.5,68.2,36.2,68.2z M19.8,48.2c0,0.1,0,0.2,0,0.3c0.2,0.8,0.4,1.6,0.6,2.4c0.8,2.8,1.8,5.4,3.2,7.9 c1,1.8,2.2,3.5,3.7,4.9c0.9,0.9,1.9,1.6,3,2.2c0.1,0.1,0.3,0.1,0.4,0.1c1.2,0.2,2.5,0.3,3.7,0.3c1.3,0,2.6-0.3,3.8-0.9 c1-0.5,1.9-1.2,2.7-1.9c1.4-1.3,2.5-2.9,3.5-4.5c1.9-3.2,3.1-6.6,3.9-10.2c0-0.1,0-0.1,0-0.2c-1.7,0.4-3.5,0.7-5.2,0.9 c-1.7,0.2-3.5,0.4-5.3,0.5c-1.8,0.1-4.9,0.1-5.3,0c0.7-0.3,1.4-0.5,2.1-0.8c-0.7-0.3-1.3-0.6-1.9-0.9c0,0,0,0,0-0.1 c5.4,0.2,10.7-0.3,16-1.6c0.8-3.9,1.1-7.9,1.1-11.9c0,0,0,0,0.1,0c0.3,0.7,0.6,1.4,0.9,2.1c0.3-0.9,0.6-1.7,0.9-2.5 c0.1,3.9-0.2,7.8-0.9,11.7c0.1,0,0.1,0,0.2,0c0.3-0.1,0.6-0.2,1-0.3c2.4-0.8,4.8-1.8,7-3.1c1.6-0.9,3-2,4.2-3.4 c0.8-0.9,1.6-1.9,2.1-3c0.4-1,0.8-2,0.7-3.1c0-0.1,0-0.3,0-0.4c-0.1-1.5-0.4-3-0.7-4.5c0-0.2-0.1-0.4-0.2-0.5 c-0.6-0.9-1.2-1.6-2-2.3c-1.2-1.2-2.6-2.1-4-3c-2.9-1.7-6-2.9-9.3-3.8c-0.1,0-0.1,0-0.2,0c0.3,1.3,0.7,2.5,0.9,3.8 c0.3,1.3,0.5,2.6,0.7,3.9c0.2,1.3,0.3,2.6,0.5,3.9c0.4,0,0.8-0.1,1.2-0.1c-0.7,2-1.3,3.9-2,5.8c0,0,0,0-0.1,0 c-0.7-1.8-1.5-3.6-2.2-5.5c0.4,0,0.8-0.1,1.1-0.1c0-0.3,0-0.5-0.1-0.7c-0.2-1.6-0.4-3.1-0.6-4.7c-0.4-2.2-0.9-4.4-1.6-6.6 c-0.1-0.2-0.1-0.3-0.3-0.3c-2.1-0.4-4.1-0.7-6.2-1c-1.6-0.2-3.1-0.2-4.7-0.3c-3.1-0.1-6.3,0.1-9.4,0.5c-1.9,0.3-3.8,0.6-5.7,1.1 c-0.2,0-0.3,0.1-0.3,0.3c-0.2,0.6-0.4,1.2-0.5,1.9c-1.2,4.3-1.7,8.7-1.8,13.2c0,2,0,4.1,0.1,6.1c0.1,1.7,0.3,3.4,0.6,5.1 c0.1,0.5,0.2,0.9,0.2,1.4c1.6,0.6,7.5,1.7,8.4,1.6c0-0.5,0.1-1,0.1-1.5c0.5,0.2,5.8,2.8,5.9,2.9c-2.1,0.7-4.1,1.5-6.2,2.2 c0-0.6,0-1.2,0.1-1.8C25,49.4,22.4,48.9,19.8,48.2z M20.3,18.5c-0.1,0-0.2,0-0.3,0c-1.9,0.5-3.8,1.1-5.6,1.9 c-2.2,1-4.4,2.1-6.3,3.6c-1.3,1-2.5,2.2-3.4,3.5c-0.1,0.2-0.2,0.3-0.2,0.5c-0.4,1.5-0.6,3-0.7,4.5c-0.1,1.2,0.1,2.2,0.5,3.3 c0.5,1.2,1.3,2.3,2.2,3.3c1.1,1.2,2.3,2.2,3.7,3c2.6,1.7,5.5,2.9,8.5,3.8c0,0,0.1,0,0.2,0C17.3,36.7,17.6,27.6,20.3,18.5z M47.2,17.4c0-0.1-0.1-0.2-0.1-0.3c-0.4-0.9-0.7-1.8-1.1-2.7c-0.9-2.1-2-4.1-3.5-5.9c-1-1.3-2.2-2.4-3.6-3.2 c-1.3-0.8-2.8-1.3-4.3-1.3c-1.2,0-2.4,0.1-3.6,0.2c-0.2,0-0.4,0.1-0.6,0.2c-0.4,0.2-0.7,0.4-1.1,0.7c-1.5,1-2.7,2.3-3.7,3.8 c-1.9,2.6-3.3,5.6-4.3,8.6c0,0,0,0.1,0,0.2C29.8,15.8,38.4,15.7,47.2,17.4z M4,39c-0.1,1.1,1,5.4,1.9,7.6c1,2.5,2.2,4.7,3.8,6.9 c1.5,2.1,3.3,4,5.4,5.7c2,1.7,4.2,3.1,6.6,4.2c2.2,1,6.8,2.5,7.5,2.3c0,0,0,0-0.1-0.1c-1.6-1.1-2.9-2.5-4-4c-1.5-2-2.6-4.2-3.6-6.5 c-0.9-2.2-1.6-4.5-2.1-6.8c0-0.2-0.1-0.3-0.4-0.4c-0.9-0.3-1.9-0.6-2.8-0.9c-2.6-0.9-5-2-7.3-3.5c-1.9-1.2-3.5-2.6-4.9-4.4 C4.1,39.1,4,39.1,4,39z M65.8,39c-0.1,0.1-0.1,0.2-0.2,0.2c-0.7,1-1.5,1.8-2.4,2.6c-1.7,1.5-3.6,2.6-5.6,3.6 c-2.2,1.1-4.5,1.9-6.8,2.6c-0.2,0.1-0.3,0.1-0.4,0.4c-0.3,1.4-0.7,2.9-1.2,4.3c-0.9,2.7-2,5.3-3.4,7.7c-1.2,2-2.6,3.8-4.4,5.2 c0,0-0.1,0.1-0.1,0.1C54,63.2,64.4,52.1,65.8,39z M5,26.5c0,0,0.1-0.1,0.1-0.1c1-1.3,2.3-2.3,3.6-3.3c2.1-1.5,4.3-2.6,6.6-3.5 c1.6-0.6,3.3-1.2,4.9-1.6c0.2,0,0.2-0.1,0.3-0.3c0.1-0.3,0.2-0.5,0.3-0.8c0.9-2.5,2-5,3.5-7.3c1.3-1.9,2.8-3.7,4.7-5 c0,0,0.1-0.1,0.1-0.1C16.7,6.9,7.8,16.4,5,26.5z M41.4,4.7C41.4,4.8,41.4,4.8,41.4,4.7c0,0.1,0.1,0.1,0.1,0.2 c0.4,0.3,0.7,0.6,1.1,1c1.5,1.5,2.7,3.1,3.7,4.9c1.2,2.2,2.2,4.4,2.9,6.8c0.1,0.2,0.2,0.3,0.4,0.4c0.9,0.2,1.8,0.5,2.6,0.8 c2.6,0.8,5.1,1.9,7.4,3.3c1.9,1.2,3.6,2.5,5,4.2c0,0,0.1,0,0.1,0.1c-1.8-5.9-4.9-10.8-9.4-14.8C51.3,8.2,46.6,5.9,41.4,4.7z\"></path></g></svg>"

/***/ }),
/* 125 zerogFreeIcon*/
/***/ (function(module, exports) {

module.exports = "<svg version=\"1.1\" id=\"Standard\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 70 70\" enable-background=\"new 0 0 70 70\" xml:space=\"preserve\"><g><path d=\"M1.8,36.2c0-0.8,0-1.7,0-2.5c0-0.1,0-0.1,0-0.2c0-0.5,0.1-1,0.1-1.4c0.1-1.6,0.4-3.2,0.8-4.8C4,22,6.4,17.2,10,13.1 C16.3,6,24.2,2.1,33.8,1.6c0.1,0,0.2,0,0.4-0.1c0.8,0,1.7,0,2.5,0c0.1,0,0.2,0,0.2,0c0.8,0.1,1.5,0.1,2.3,0.2 c2.4,0.2,4.7,0.8,7,1.5c10.5,3.6,18.6,12.1,21.6,22.8c0.6,2.2,1,4.5,1.1,6.8c0,0.1,0,0.2,0,0.3c0,1.3,0,2.5,0,3.8 c0,0.1,0,0.1,0,0.2c0,0.3,0,0.6,0,0.8c-0.2,1.9-0.5,3.7-1,5.6C64.9,54.3,56.9,63,46.3,66.6c-2.6,0.9-5.3,1.5-8.1,1.7 c-0.4,0-0.7,0.1-1.1,0.1c-1.2,0-2.4,0-3.5,0c-0.4,0-0.7-0.1-1.1-0.1c-1.9-0.1-3.7-0.5-5.5-0.9C16,64.6,7,56.2,3.5,45.3 c-0.9-2.7-1.4-5.5-1.6-8.4C1.9,36.7,1.9,36.5,1.8,36.2z M34.9,16.2c-0.1,0-0.1,0-0.2,0c-2,0-4,0.1-5.9,0.3 c-1.9,0.2-3.8,0.5-5.6,0.9c-2.9,0.6-5.8,1.5-8.5,2.6c-2.3,1-4.5,2.2-6.4,3.7c-1.3,1-2.4,2.2-3.4,3.5c-0.1,0.1-0.2,0.3-0.2,0.4 c-0.4,1.8-0.7,3.6-0.8,5.4c0,0.2,0,0.5,0,0.7C4,34.9,4.4,35.9,5,36.9c0.8,1.3,1.8,2.4,3,3.4c1.8,1.5,3.8,2.7,5.9,3.7 c0.2,0.1,0.4,0.1,0.6,0c1.8-0.9,3.7-1.7,5.5-2.6c4.3-2,8.7-4,13-6.1c0.1,0,0.2-0.1,0.3-0.2C28.2,32.8,23.1,30.4,18,28 c-0.4,0.8-0.8,1.6-1.1,2.4c-0.6-0.5-7.3-7.3-7.4-7.5c3.5,0.3,7,0.6,10.5,1c-0.4,0.8-0.8,1.6-1.1,2.4c0.3,0.2,15.8,7.5,16,7.5 C34.9,28,34.9,22.1,34.9,16.2z M34.2,50.1c-0.1,0-0.3,0-0.4,0c-1.4-0.1-2.9-0.1-4.3-0.2c-2.2-0.2-4.4-0.5-6.6-1 c-3.7-0.8-7.3-1.9-10.7-3.6c-1.2-0.6-2.3-1.2-3.4-2C7,42.1,5.4,40.7,4.1,39c0,0-0.1-0.1-0.1-0.1c0.7,5.2,2.5,10,5.5,14.3 c3.8,5.4,8.8,9.3,15,11.6c3.2,1.2,6.5,1.8,10,1.9c-1-2.7-1.9-5.4-2.9-8.1c0.9,0,1.8,0,2.7,0C34.2,55.7,34.2,52.9,34.2,50.1z M34.9,3.4c-4.6,0.1-8.9,1.1-13,3c-4.1,1.9-7.6,4.6-10.6,8.1c-2.9,3.4-5,7.3-6.3,11.7c0.1,0,0.1-0.1,0.1-0.1 c1.1-1.3,2.3-2.4,3.7-3.3c2.1-1.5,4.4-2.7,6.9-3.6c4.1-1.6,8.3-2.5,12.7-3c2.1-0.2,4.2-0.4,6.3-0.4c0.1,0,0.1,0,0.2,0 C34.9,11.6,34.9,7.5,34.9,3.4z M58.1,28c-0.4-0.8-0.8-1.6-1.2-2.4c-1.6,0.8-3.2,1.5-4.7,2.3c0.3,2.5,0.4,4.9,0.4,7.4 c0,2.5-0.2,4.9-0.4,7.3c0,0,0.1,0,0.1,0.1c1.2,0.6,2.4,1.1,3.6,1.7c0.1,0.1,0.3,0,0.4,0c1.4-0.6,2.8-1.3,4.1-2.2 c1.4-0.9,2.8-2,3.9-3.2c0.9-1,1.7-2.1,2.2-3.3c0.4-1,0.6-1.9,0.5-3c-0.2-1.6-0.4-3.3-0.8-4.9c0-0.1-0.1-0.3-0.2-0.4 c-0.7-1-1.5-1.9-2.4-2.7c-0.4-0.3-0.8-0.7-1.2-1C60.9,25.1,59.5,26.5,58.1,28z M66.7,38.8c-0.1,0.1-0.1,0.1-0.2,0.2 c-0.5,0.5-0.9,1.1-1.4,1.6c-1.5,1.5-3.2,2.8-5.1,3.8c-2.5,1.4-5.2,2.5-7.9,3.3c-0.3,0.1-0.6,0.2-0.9,0.3c0,0.1,0,0.1,0,0.2 c-0.3,1.5-0.7,2.9-1.2,4.4c-0.9,2.7-2,5.3-3.5,7.8c-1.2,2-2.7,3.9-4.5,5.4c0,0,0,0.1-0.1,0.1C55.6,63.1,65.4,51.4,66.7,38.8z M35.4,34c5-2.4,9.9-4.8,14.7-7.2c0-0.1,0-0.1,0-0.2c-0.1-0.8-0.3-1.6-0.4-2.4c-0.4-2.2-0.9-4.3-1.6-6.5c-0.1-0.2-0.1-0.2-0.3-0.3 c-1.5-0.3-3.1-0.6-4.6-0.8c-2.5-0.3-5-0.5-7.5-0.5c-0.1,0-0.2,0-0.4,0C35.4,22.1,35.4,28,35.4,34z M36.1,50.1c0,2.8,0,5.6,0,8.4 c0.9,0,1.8,0,2.7,0c-1,2.7-2,5.4-2.9,8c0.1,0,0.1,0,0.1,0c0.1,0,0.2,0,0.2,0c1-0.2,1.9-0.5,2.8-1c1.2-0.7,2.2-1.5,3.2-2.5 c1.4-1.5,2.5-3.2,3.5-5c1.6-2.9,2.6-6.1,3.4-9.3c0,0,0-0.1,0-0.2C44.8,49.6,40.5,50,36.1,50.1z M34.3,35.7 c-0.2-0.2-0.4-0.2-0.7-0.1c-6.2,2.9-12.4,5.8-18.6,8.7c-0.1,0-0.2,0.1-0.3,0.2c3.1,1.3,6.3,2.2,9.6,2.8c4,0.8,9.2,1.1,9.9,0.9 C34.2,44,34.3,39.8,34.3,35.7z M63.5,20.6C62,17.7,60.2,15.2,58,13c-2.2-2.3-4.7-4.1-7.4-5.7c-2.7-1.5-5.6-2.6-8.7-3.2 c0.1,0.1,0.3,0.3,0.4,0.4c1.6,1.4,3,3.1,4.1,5c1.5,2.4,2.6,5,3.4,7.6c0.1,0.3,0.2,0.4,0.5,0.5c3,0.8,5.9,1.9,8.7,3.3 c0.1,0.1,0.3,0.1,0.4,0.1c1-0.1,2.1-0.2,3.1-0.3C62.9,20.7,63.2,20.6,63.5,20.6z M36.1,48.2c4.6-0.1,9.1-0.6,13.5-1.7 c0.3-1.4,0.5-2.8,0.7-4.3c-4.7-2.2-9.4-4.3-14.1-6.5C36.1,39.9,36.1,44.1,36.1,48.2z M35.4,3.4c0,4.1,0,8.2,0,12.3 c2.1,0,4.2,0.1,6.2,0.3c2.1,0.2,4.1,0.5,6.2,1c0-0.1-0.1-0.2-0.1-0.3c-0.2-0.6-0.5-1.3-0.7-1.9c-0.9-2.2-2-4.3-3.5-6.2 c-0.9-1.2-1.9-2.3-3.1-3.2c-1.1-0.9-2.3-1.5-3.7-1.8C36.3,3.5,35.9,3.4,35.4,3.4z M50.4,28.8c-4.6,2.2-9.1,4.4-13.6,6.7 c0.3,0.2,13.4,6.2,13.6,6.3C50.8,37.4,50.8,33.1,50.4,28.8z M50.2,18c0.8,2.6,1.4,5.3,1.7,7.9c1.4-0.7,2.8-1.4,4.2-2 c-0.4-0.8-0.8-1.6-1.2-2.4c1.2-0.1,2.3-0.2,3.4-0.4c0,0,0,0,0-0.1C55.7,19.7,53,18.8,50.2,18z M51.6,46c1.3-0.4,2.5-0.8,3.8-1.3 c-1.1-0.5-2.2-1-3.3-1.5C51.9,44.1,51.8,45,51.6,46z M64.1,21.8c-0.5,0.5-0.9,1-1.4,1.5c1.1,0.9,2.1,1.8,3,2.8 C65.3,24.6,64.7,23.2,64.1,21.8z\"></path></g></svg>"

/***/ }),

/* 126 SignalLight component对象*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  template: "<style scoped>" + __webpack_require__(127) + "</style>" +
            __webpack_require__(128),
  viewModel: __webpack_require__(129)
}


/***/ }),
/* 127 SignalLight style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 128 SignalLight template*/
/***/ (function(module, exports) {

module.exports = "<div class="signal-light" data-bind="css: { clear: lightStatus() === 'ok',warning: lightStatus() === 'warning',error: lightStatus() === 'error' }">
        <span class="warning-sign">
            <!-- ko if: showWarningSign() -->!
        <!-- /ko -->
        </span>
        </div>
        ";

/***/ }),
/* 129 SignalLight viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = SignalLight

var ko = __webpack_require__(1)

function SignalLight(params) {
  this.lightStatus = params.status
  this.showWarningSign = ko.pureComputed(function() {
    return this.lightStatus() !== "ok"
  }, this)
}


/***/ }),

/* 130 Library component对象，主模块*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * library 主模块定义了library view component,包含一个viewmodel及一个library html template.
 *
 * Library components需要[controller]{@link
 * module:app/controller~Controller} 以及library model
 * (通常是controller的``library`` field) to visualize. 下面的例子显示了如何在HTML代码中使用component
  * ```
 * <library params="controller: controller, model: controller.library"></library>
 * ```
 *
 * This component内部实例化[library timeline]{@link
 * module:components/library/timeline} 和[library skill]{@link
 * module:components/library/library_item} components.
 *
 * @module components/library
 * @requires components/library/library_item
 * @requires components/library/timeline
 */

var ko = __webpack_require__(1)

ko.components.register("one-library-item", __webpack_require__(131))
ko.components.register("one-library-timeline", __webpack_require__(133))

var Library = __webpack_require__(136)
var css = __webpack_require__(137)
var template = __webpack_require__(138)

module.exports = {
  viewModel: Library,
  template: "<style scoped>" + css + "</style>" + template
}


/***/ }),

/* 131 LibraryItem component对象*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * The library item module 定义了library item的视图component，包含一个viewmodel以及一个html模板. Library items需要
 * 两个参数the [controller]{@link module:app/controller~Controller}以及一个表示library item的model (即skills或groups).
 * @module components/library/library_item
 */
module.exports = {
  viewModel: {
    createViewModel: function(params) {
      var LibraryItem = __webpack_require__(43)
      return new LibraryItem(params)
    }
  },
  template: __webpack_require__(132)
}


/***/ }),
/* 132  LibraryItem template*/
/***/ (function(module, exports) {

module.exports = "<div class="skill-icon" data-bind="
    drag: {
      group: 'element',
      dragstart: dragStart,
      drag: drag,
      dragend: dragEnd,
      hint: dragHint},
    event: { dblclick: appendElement },
    style: { backgroundColor: color },
    html: image().icon,
        requireAuth: {resource: 'Tasks',enableEventsIf: 'ReadWrite'}">
        </div>
        <label data-bind="capitalText: name">
            </label>";

/***/ }),

/* 133 LibraryTimeline component对象*/
/***/ (function(module, exports, __webpack_require__) {

var LibraryTimeline = __webpack_require__(134)
var template = __webpack_require__(135)

module.exports = {
  viewModel: {
    createViewModel: function(params) {
      return new LibraryTimeline(params)
    }
  },
  template: template
}


/***/ }),
/* 134 LibraryTimeline viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = LibraryTimeline

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var assert = __webpack_require__(7)
var dialogs = __webpack_require__(8)

/**
 * @class
 * @memberof module:components/workspace/library/timeline
 */
function LibraryTimeline(params) {
  assert.keys(params, "controller", "model")
  this.controller = params.controller
  this.type = "timeline"

  this.model = ko.unwrap(params.model)
  this.id = this.model.id
  this.name = this.model.name
  this.selected = ko.pureComputed(function() {
    return this.controller.timeline() && this.id === this.controller.timeline().id
  }, this)

  _.bindAll(this, "onClick", "handleDownload", "handleDelete", "dragStart", "dragEnd")
}

LibraryTimeline.prototype.onClick = function() {
  if (this.controller.timeline() === undefined || this.id !== this.controller.timeline().id) {
    this.controller.reloadTimeline(this.model)
  }
}

LibraryTimeline.prototype.dragStart = function() {
  this.controller.uiEvents.notifyTimelineDragStart(this)
}

LibraryTimeline.prototype.dragEnd = function() {
  this.controller.uiEvents.notifyTimelineDragEnd(this)
}

LibraryTimeline.prototype.handleDownload = function() {
  this.controller.com.exportTimeline(this.id)
}

LibraryTimeline.prototype.handleDelete = function() {
  dialogs.showMessageDialog({
    icon: "warning",
    title: "Delete task <b>" + ko.unwrap(this.name) + "</b>?",
    buttons: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No", isCancel: true },
    ]
  })
  .then(function(id) {
    if (id === "yes") {
      return this.controller.com.deleteTimeline(this.id)
    }
  }.bind(this))
}

LibraryTimeline.prototype.handleSave = function() {
  var self = this
  var text = "Save task <b>" + ko.unwrap(this.name) + "</b> as"
  dialogs.showTextDialog(text, ko.unwrap(this.name) + " 2", function(name) {
    self.controller.com.copyTimeline(self.id, name)
    .then(function() {
      return self.controller.withTimeline({ name: name })
    }).then(function(timeline) {
      return self.controller.reloadTimeline(timeline)
    }).catch(function(e) {
      dialogs.showMessageDialog({
        icon: "error",
        title: "Failed to clone task",
        text: e.error === "TimelineExists" && "A task with this name already exists" || ""
      })
    })
  })
}

LibraryTimeline.prototype.handleRename = function() {
  var self = this
  dialogs.showTextDialog("Rename task", this.name(), function(name) {
    self.controller.com.renameTimeline(self.id, name)
      .then(function() {
        return self.controller.withTimeline({ name: name })
      }).then(function(timeline) {
        return self.controller.reloadTimeline(timeline)
      }).catch(function(e) {
        dialogs.showMessageDialog({
          icon: "error",
          title: "Failed to rename task",
          text: e.error === "TimelineExists" && "A task with this name already exists" || ""
        })
      })
  })
}

LibraryTimeline.prototype.share = function() {
  this.controller.com.shareTimeline(this.id)
    .then(function() {
      dialogs.showMessageDialog({
        icon: "success",
        title: "Shared task!",
        text: "Task <b>" + this.name() + "</b> is now available in your cloud library."
      })
    }.bind(this))
}


/***/ }),
/* 135 LibraryTimeline template*/
/***/ (function(module, exports) {

module.exports = "<div class="timeline-label" data-bind="click: onClick,css: { selected: selected },scrollIntoViewWhen: selected">
        <span data-bind="text: name"></span>
            <i title="Download" class="icon fi-arrow-down" data-bind="click: handleDownload,clickBubble: false,requireAuth: {  resource: 'Bundles',  displayIf: 'Read'}">
            </i>
            <i title="Clone" class="icon fi-page-copy" data-bind="click: handleSave,clickBubble: false,requireAuth: {  resource: 'Tasks',  displayIf: 'ReadWrite'}">
            </i>
            <i title="Rename" class="icon fi-pencil" data-bind="click: handleRename,clickBubble: false,requireAuth: {  resource: 'Tasks',  displayIf: 'ReadWrite'}">
            </i>
            <i title="Delete" class="icon fi-x" data-bind="click: handleDelete,clickBubble: false,requireAuth: {  resource: 'Tasks',  displayIf: 'ReadWrite'}">
            </i>
            </div>";

/***/ }),

/* 136 Library viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Library

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var assert = __webpack_require__(7)
var TimelineGroup = __webpack_require__(44)
var TimelineSkill = __webpack_require__(45)
var dialogs = __webpack_require__(8)

function Tag(name, skills) {
  this.name = name
  this.skills = skills
  this.active = ko.observable(false)
  _.bindAll(this, "click")
}

Tag.prototype.click = function() {
  this.active(!this.active())
}

function Library(params) {
  assert.keys(params, "controller", "library")
  this.controller = params.controller

  this.skills = params.library.skills
  this.groups = params.library.groups
  this.timelines = params.library.timelines

  // TODO(SN): quick hack to determine whether we created incoming timelines
  this.creatingTimeline = null;
  var oldTimelines = this.timelines()
  this.timelines.subscribe(function(newTimelines) {
    var count = newTimelines.length - oldTimelines.length
    if (oldTimelines.length !== 0 && !this.creatingTimeline && count > 0) {
      var archives = count > 1 ? count + " archives" : "archive";
      dialogs.showMessageDialog({
        icon: "success",
        title: "Task imported!",
        text: "Successfully imported " + archives + ".",
      })
    }
    oldTimelines = newTimelines
  }, this)

  var count = ko.observable(0)
  this.taskDropZoneVisible = ko.pureComputed({
    read: function() {
      return count() > 0
    },
    write: function(value) {
      count(value ? count() + 1 : count() - 1)
    }
  })

  this.visibleGroups = ko.pureComputed(function() {
    return _.filter(this.groups(), function(g) { return !g.hiddenInLibrary() })
  }, this)

  this.sortedGroups = ko.pureComputed(function() {
    return _.sortBy(this.visibleGroups(), function(g) { return g.name() })
  }, this)

  // Determine all tags used in skills
  this.tags = ko.pureComputed(function() {
    var tags = {}
    this.skills().forEach(function(s) {
      s.tags().forEach(function(t) {
        if (tags[t]) {
          tags[t].push(s)
        } else {
          tags[t] = [s]
        }
      })
    })
    return _.chain(_.keys(tags))
      // Ascending lexically (identity) and untagged to the end (false < true)
      .sortBy(_.identity, function(t) { return t === "untagged" })
      .map(function(t) { return new Tag(t, tags[t]) })
      .value()
  }, this)

  this.visibleSkills = ko.pureComputed(function() {
    return _.filter(this.skills(), function(s) { return !s.hiddenInLibrary() })
  }, this)

  this.sortedSkills = ko.pureComputed(function() {
    // Custom sort instead of _.sortByAll as "untagged" is a special case
    var skillsByTag = _.groupBy(this.visibleSkills(), function(s) { return _.first(s.tags()) })
    var sortedTags = _.sortBy(_.keys(skillsByTag))
    _.pull(sortedTags, "untagged")
    sortedTags.push("untagged")
    return _.flatten(_.map(sortedTags, function(t) {
      return _.sortBy(skillsByTag[t], function(s) { return s.name() })
    }))
  }, this)

  this.filteredSkills = ko.pureComputed(function() {
    var activeTags = _.filter(this.tags(), function(t) { return t.active() })
    if (activeTags.length === 0) {
      return this.sortedSkills()
    }
    return _.filter(this.sortedSkills(), function(s) {
      var ts = s.tags()
      return _.some(activeTags, function(t) { return _.includes(ts, t.name) })
    })
  }, this)

  this.skillDropZoneVisible = ko.observable(false)

  _.bindAll(this, "onFileDragEnter", "onFileDragLeave", "onFileDropped",
                  "onCreateTimeline", "clearFilter", "dragEnter", "dragLeave",
                  "dropDelete")
}

Library.prototype.onFileDragEnter = function(element, event) {
  this.taskDropZoneVisible(true)
  event.originalEvent.dataTransfer.dropEffect = "move"
}

Library.prototype.onFileDragLeave = function(element, event) {
  this.taskDropZoneVisible(false)
  event.originalEvent.dataTransfer.dropEffect = "none"
}

Library.prototype.onFileDropped = function(element, event) {
  var com = this.controller.com
  var uiEvents = this.controller.uiEvents
  var files = event.originalEvent.dataTransfer.files
  Promise.all(_.map(files, com.installArchive.bind(com)))
  .then(com.synchronizeBundles.bind(com))
  .then(function() {
    var archives = files.length > 1 ? files.length + " archives" : "archive"
    uiEvents.notifyLogInfo("Successfully imported " + archives)
  })
  .catch(function() {
    dialogs.showMessageDialog({
      icon: "error",
      title: "Failed to import archive"
    })
  })
  this.taskDropZoneVisible(false)
}

Library.prototype.onCreateTimeline = function() {
  var self = this
  dialogs.showTextDialog("Enter name of new task", "Unnamed 1", function(name) {
    self.creatingTimeline = name;
    self.controller.com.createTimeline(name)
    .then(function() {
      return self.controller.withTimeline({ name: name })
    })
    .then(function(timeline) {
      self.creatingTimeline = null;
      return self.controller.reloadTimeline(timeline)
    })
    .catch(function(e) {
      dialogs.showMessageDialog({
        icon: "error",
        title: "Failed to create task",
        text: e.error === "TimelineExists" && "A timeline with this name already exists" || ""
      })
    })
  })
}

Library.prototype.clearFilter = function() {
  _.map(this.tags(), function(t) { t.active(false) })
}

Library.prototype.dragAccept = function(dragged) {
  return dragged instanceof TimelineSkill ||
         dragged instanceof TimelineGroup
}

Library.prototype.dragEnter = function() {
  this.skillDropZoneVisible(true)
}

Library.prototype.dragLeave = function() {
  this.skillDropZoneVisible(false)
}

Library.prototype.dropDelete = function(element) {
  this.skillDropZoneVisible(false)
  if (element.handleDelete !== undefined) {
    element.handleDelete()
    return true
  }
}


/***/ }),
/* 137 Library style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 138 Library template*/
/***/ (function(module, exports) {

module.exports = "<!-- TODO(SN): proper drag & drop with only one API!!! -->
    <div class="library-elements" data-bind="" +
        "event: {dragenter: onFileDragEnter,dragleave: onFileDragLeave,drop: onFileDropped}," +
        "drop: {group: 'element',accept: dragAccept,dragenter: dragEnter,dragleave: dragLeave,drop: dropDelete}," +
        "requireAuth: {resource: 'Bundles',enableEventsIf: 'ReadWrite'}">
            <div class="library-tasks" data-bind="requireAuth: {  resource: 'Tasks',  displayIf: 'Read'}">
            <div class="library-drop-zone" data-bind="  visible: taskDropZoneVisible">
            <i class="fi-plus"></i>
            </div>
            <h5 class="library-title">  TASKS
            <a class="button small" data-bind="click: onCreateTimeline,    requireAuth: {resource: 'Tasks', displayIf: 'ReadWrite'}">
            <i class="fi-plus"></i>
            </a>
            </h5>
            <div class="library-content" data-bind="foreach: timelines">
            <one-library-timeline params="controller: $parent.controller, model: $data">
            </one-library-timeline>
            </div>
            </div>
            <div class="library-skills">
            <div class="library-drop-zone" data-bind="visible: skillDropZoneVisible">
            <i class="fi-trash"></i>
            </div>
            <div class="library-content-wrapper" data-bind="requireAuth: {resource: 'Skills', displayIf: 'Read'}">
            <h5 class="library-title">APPS</h5>
            <div class="library-content library-skill-container library-groups " data-bind="foreach: sortedGroups">
            <one-library-item params="controller: $parent.controller, model: $data">
            </one-library-item>
            </div>
            <div class="library-content library-skill-container" data-bind="foreach: filteredSkills">
            <one-library-item params="controller: $parent.controller, model: $data">
            </one-library-item>
            </div>
            </div>
            </div>
            </div>";

/***/ }),

/* 139 Timeline component对象,主模块*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * The timeline main module defines the Timeline view component. and consists
 * of a view model and the timeline html template.
 *
 * The timeline component requires the [controller]{@link
 * module:app/controller~Controller} as well as the timeline model
 * (normally the controller's ``timeline`` field). The following
 * example shows how to use the component in HTML code.
 *
 * ```
 * <timeline params="controller: $parent.controller, model: timeline"></timeline>
 * ```
 *
 * Internally, the timeline instantiates [timeline task]{@link
 * module:components/workspace/timeline/task} components for each task in the
 * timeline. In addition, the timeline creates new tasks when library
 * tasks are dropped onto the timeline.
 *
 * @module components/workspace/timeline
 * @requires components/workspace/timeline/task
 */

var ko = __webpack_require__(1)

ko.components.register("one-drop-zone", __webpack_require__(140))
ko.components.register("one-context-menu", __webpack_require__(143))
ko.components.register("one-timeline-skill", __webpack_require__(152))
ko.components.register("one-timeline-group", __webpack_require__(154))
ko.components.register("one-error-badge", __webpack_require__(159))
ko.components.register("one-selection-menu", __webpack_require__(163))

var Timeline = __webpack_require__(167)
var css = __webpack_require__(168)
var template = __webpack_require__(169)

module.exports = {
  template: "<style scoped>" + css + "</style>" + template,
  viewModel: Timeline
}


/***/ }),

/* 140 DropZone component对象*/
/***/ (function(module, exports, __webpack_require__) {

var _ = __webpack_require__(0)

var DropZone = __webpack_require__(141)
var template = __webpack_require__(142)

module.exports = {
  viewModel: {
    createViewModel: function(params, componentInfo) {
      var controller = params.controller
      var path = params.path
      if (!controller || !path) {
        throw new Error("missing parameter 'controller' or 'path'")
      }
      var dz = new DropZone(controller, path, params.visible)
      controller.uiEvents.notifyDropZoneCreated(dz, componentInfo.element)
      dz.dispose = _.wrap(dz.dispose, function(dispose) {
        _.attempt(dispose)
        controller.uiEvents.notifyDropZoneDisposed(dz)
      })
      return dz
    }
  },
  template: template
}


/***/ }),
/* 141 DropZone 模块*/
/***/ (function(module, exports, __webpack_require__) {

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

__webpack_require__(14)
var util = __webpack_require__(4)
var settings = __webpack_require__(11)
var dialogs = __webpack_require__(8)

var DropZone = function(controller, path, visible) {
  this.controller = controller
  this.path = path

  this.visible = ko.observable(false).extend({reader: function(value) {
    return value || !!ko.unwrap(visible)
  }})
  this.color = ko.observable(settings.dropZone.color)
  this.highlight = ko.observable(false)

  _.bindAll(this, "drop", "enter", "leave")
}

DropZone.prototype.drop = function(dragged) {
  var to = ko.unwrapDeep(this.path)
  if (dragged.path) { // dragged is a timeline element
    var from = ko.unwrapDeep(dragged.path)
    // Decrease index if dragged element was to the left in the same parent
    if (util.leftOf(from, to)) {
      to.indices[to.indices.length - 1]--
    }
    this.controller.com.moveElement(from, to, "keep")
      .catch(function(e) {
        if (e.error === "MovePreconditionViolated") {
          if (e.parameterViolations.length > 0) {
            return dialogs.showMessageDialog({
              title: "Parameter reset required. Really move?",
              buttons: [{ id: "reset", label: "Reset", isDefault: true },
                        { id: "cancel", label: "Cancel", isCancel: true }
                       ]
            }).then(function(result) {
              if (result === "reset") {
                return this.controller.com.moveElement(from, to, "adjust")
              }
            }.bind(this))
          } else if (e.componentViolations.length > 0) {
            return dialogs.showMessageDialog({
              title: "Additional configuration available",
              text: "Keep parameters or reset parameter source?",
              buttons: [{ id: "keep", label: "Keep", isDefault: true },
                        { id: "reset", label: "Reset" },
                        { id: "cancel", label: "Cancel", isCancel: true }
                       ]
            }).then(function(result) {
              if (result === "keep") {
                return this.controller.com.moveElement(from, to, "adjust")
              } else if (result === "reset") {
                return this.controller.com.moveElement(from, to, "reset")
              }
            }.bind(this))
          }
        } else {
          throw e
        }
      }.bind(this))
  } else { // library item
    this.controller.com.insertElement(dragged.id, to)
  }
  this.visible(false)
  this.highlight(false)
}

DropZone.prototype.enter = function() {
  this.highlight(true)
}

DropZone.prototype.leave = function() {
  this.highlight(false)
}

module.exports = DropZone


/***/ }),
/* 142 DropZone template*/
/***/ (function(module, exports) {

module.exports = "<div data-bind="  visible: visible,  css: {visible: visible, highlighted: highlight},  style: {backgroundColor: color},  requireAuth: {    resource: 'Tasks',    displayIf: 'ReadWrite'  }">
        <i class="fi-plus"></i>
            </div>";

/***/ }),

/* 143 ContextMenu component对象*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * The context menu module defines the ContextMenu view component and consists
 * of a view model, the timeline html template and some knockout bindings.
 *
 * The timeline component requires the [controller]{@link
 * module:app/controller~Controller} as well as the timeline skill and task to
 * load the context menu from. The following example shows how to use the
 * component in HTML code.
 * ```
 * <context-menu params="controller: $parent.controller, model: {
 *   skill: selectedSkill,
 *   task: selectedTask
 * }"></context-menu>
 * ```
 *
 * @module components/workspace/context_menu
 */
__webpack_require__(144)
var ContextMenu = __webpack_require__(145)
var css = __webpack_require__(150)
var template = __webpack_require__(151)

module.exports = {
  template: "<style scoped>" + css + "</style>" + template,
  viewModel: ContextMenu
}


/***/ }),
/* 144 // 自定义sandbox绑定,用于创建step的内容*/
/***/ (function(module, exports, __webpack_require__) {

var _ = __webpack_require__(0)
var $ = __webpack_require__(6)
var ko = __webpack_require__(1)

var util = __webpack_require__(4)

// 自定义绑定,用以创建step的内容
ko.bindingHandlers.sandbox = {
  init: function() {
    return { controlsDescendantBindings: true }
  },
  update: function(element, value, allbindings, viewmodel, context) {
    var sandboxHTML = ko.unwrap(value())
    if (!sandboxHTML) {
      console.warn("sandbox empty markup", sandboxHTML, viewmodel)
      return
    }
    try {
      // If not already HTML, parse to HTML. Note: also strips/ignores all script tags
      if (typeof sandboxHTML === "string") {
        sandboxHTML = $.parseHTML(sandboxHTML, null, true)
      }
      if (!_.isArray(sandboxHTML)) {
        sandboxHTML = [sandboxHTML]
      }
      console.debug("sandbox loading", sandboxHTML)

      // Ignore knockout observable dependencies in a call to sandboxContext(),
      // as they would lead to a re-invocation of update
      var sandboxContext = allbindings.get("context")
      if (_.isFunction(sandboxContext)) {
        sandboxContext = ko.ignoreDependencies(sandboxContext, viewmodel, [context])
      }

      // Provide sandboxContext already when loading (to script tags)
      var modules = { lodash: _, jquery: $, knockout: ko }
      util.loadScriptsCommonJS(sandboxHTML, sandboxContext, modules)
      // Filter script tags (or they would be loaded again when injecting)
      // TODO: traverse dom tree to remove script tags
      sandboxHTML = _.filter(sandboxHTML, function(node) {
        return !node.tagName || node.tagName.toLowerCase() !== "script"
      })

      // Inject new HTML into DOM node
      while (element.firstChild) {
        ko.removeNode(element.firstChild)
      }
      _.each(sandboxHTML, function(node) {
        element.appendChild(node)
      })
      ko.cleanNode(element)
      ko.applyBindingsToDescendants(sandboxContext, element)
    } catch (e) {
      $(element).html("")
      console.warn("Error on creating sandbox", e)
    }
  }
}


/***/ }),
/* 145 ContextMenu viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = ContextMenu

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

__webpack_require__(146)(ko)
var ComponentProviders = __webpack_require__(29)
var ElementAPI = __webpack_require__(24)
var StepNavigator = __webpack_require__(147)
var assert = __webpack_require__(7)
var auth = __webpack_require__(12)
var franka = __webpack_require__(148)
var settings = __webpack_require__(11)
var util = __webpack_require__(4)

function Row(step, contextMenu) {
  this.settings = settings
  this.step = step
  this.focused = ko.pureComputed(function() {
    return contextMenu.focusedRow() === this
  }, this)
  var componentProviderAPI = new ComponentProviders.ComponentProviderAPI(contextMenu.controller,
                                                                         contextMenu.path,
                                                                         step.id)
  this.createContext = function(context) {
    return contextMenu.createSandboxContext(context, componentProviderAPI)
  }
  var linkableComponent = this.linkableComponent = ko.pureComputed(function() {
    var html = ko.unwrap(contextMenu.html) || []
    return util.contextMenuComponents(html, step.id, contextMenu.controller.componentLoader.linkableNames)[0]
  })
  this.linkable = ko.pureComputed(function() {
    var sinks = contextMenu.componentLinkManager.findAllComponentSinks(step.id, linkableComponent())
    return sinks.length > 0
  })
  this.linked = componentProviderAPI.sharesComponentProviders
  var linking = this.linking = ko.observable(false)
  linking.subscribe(function(v) {
    var sink = null
    if (v) {
      sink = contextMenu.componentLinkManager.getComponentSink(step.id, linkableComponent())
      sink.callback = function(source) {
        contextMenu.controller.componentSinkEvents.notifyLinkableComponentSinks()
        contextMenu.componentLinkManager.linkComponents(source)
        linking(false)
      }
      sourceSelect(false)
    }
    contextMenu.controller.componentSinkEvents.notifyLinkableComponentSinks(sink)
  })
  this.linking.toggle = function() { linking(!linking()) }
  this.unlink = componentProviderAPI.componentProviderEvents.notifyCloneConfiguration
  this.showSourceSelect = ko.pureComputed(function() {
    var s = contextMenu.componentLinkManager.getComponentSources(step.id, linkableComponent())
    return s.numberOfSources() > 1
  })
  var sourceSelect = this.sourceSelect = ko.observable(false)
  this.sourceSelect.subscribe(function(v) {
    var sources = null
    if (v) {
      sources = contextMenu.componentLinkManager.getComponentSources(step.id, linkableComponent())
      sources.callback = function(path) {
        contextMenu.controller.componentSinkEvents.notifyLinkableComponentSources()
        contextMenu.componentLinkManager.setSource(path, step.id)
        sourceSelect(false)
      }
      linking(false)
    }
    contextMenu.controller.componentSinkEvents.notifyLinkableComponentSources(sources)
  })
  sourceSelect.toggle = function() { sourceSelect(!sourceSelect()) }
  this.showReset = ko.pureComputed(function() {
    var path = ko.ignoreDependencies(function() { return ko.unwrapDeep(contextMenu.path) })
    if (linkableComponent()) {
      var componentLoader = contextMenu.controller.componentLoader
      var actualComponentPath = componentLoader.componentPath(path, linkableComponent(), step.id)
      var defaultComponentPath = componentLoader.componentPath(path, linkableComponent())
      return actualComponentPath !== defaultComponentPath
    }
  })
  this.reset = function() {
    if (linkableComponent()) {
      contextMenu.componentLinkManager.resetLink(linkableComponent(), step.id)
    }
  }

  this.subStepLabels = ko.pureComputed(function() {
    var namedSteps = []
    function isNamedStep(step) {
      return !!step.name() && !step.onlyNavigate && step.available()
    }
    function traverse(step) {
      var namedChildren = _.map(step.steps(), traverse)
      if (!_.some(namedChildren) && isNamedStep(step)) {
        namedSteps.push(step)
        return true
      }
    }
    traverse(step)
    _.remove(namedSteps, step)
    return namedSteps
  })
}

/**
 * Create a new context menu using the given controller and model. The model
 * is required to have a 'contextMenu' property holding the HTML to present
 * as context menu.
 * @class
 * @memberof module:components/workspace/context_menu
 */
function ContextMenu(params) {
  assert.keys(params, "controller", "model")
  this.settings = settings
  this.controller = params.controller
  this.model = params.model
  this.path = this.model.path

  this.requestClose = params.requestClose || _.noop

  this.subs = []
  this.subs.push(this.controller.navEvents.onUp(this.closeUp.bind(this)))
  this.subs.push(this.controller.navEvents.onDown(this.closeDown.bind(this)))
  this.subs.push(this.controller.navEvents.onCross(this.close.bind(this)))

  var readOnly = !auth.hasResourcePermission("Parameters", "ReadWrite")
  this.stepNavigator = new StepNavigator(this.controller.navEvents,
                                         this.requestClose,
                                         this.requestClose,
                                         readOnly)
  this.finalStep = this.createContinueStep()
  this.componentLinkManager = new ComponentProviders.ComponentLinkManager(this.controller, this.path)

  // Observables for context menu content
  this.html = this.model.contextMenu
  this.title = ko.observable()
  this.closingUp = ko.observable(false)
  this.closingDown = ko.observable(false)

  // Parse top-level steps and add these to the stepNavigator right away, in
  // order to create a custom view (dialog) view for each of these steps
  var steps = ko.pureComputed(function() {
    // Get (and create dependency) on context menu markup
    var stepElements = _.filter(this.html.peek(), function(node) {
      return util.isElement(node) && node.tagName.toLowerCase() === "step"
    })
    // Ignore knockout dependencies when computing steps and the next to avoid
    // recomputation of the steps when step navigator steps change
    // TODO(sn): this is too complicated and somehow duplicates the behavior
    // already present in the step binding handler. Thus, this could be improved
    // by also using "<step>" or "data-bind: step" in the context menu markup.
    return ko.ignoreDependencies(function() {
      // Explicitly remove steps not in new context menu
      _.map(this.stepNavigator.steps(), function(step) {
        if (!_.find(stepElements, { id: step.id }) && step !== this.finalStep) {
          this.stepNavigator.removeStep(step)
        }
      }, this)
      // Parse, create and update steps
      var steps = _.map(stepElements, function(element, index) {
        var s = this.stepNavigator.parseStep(element, null, index)
        // provide a default human-readable step name if none is given.
        if (!s.name()) {
          s.name(_.startCase(s.id))
        }
        return s
      }, this)
      // Make sure final step is appended
      if (!readOnly) {
        this.stepNavigator.addStep(this.finalStep)
        steps.push(this.finalStep)
      }
      return steps
    }, this)
  }, this)

  // Create the row viewmodel for each step
  this.rows = ko.pureComputed(function() {
    return _.map(steps(), function(s) { return new Row(s, this) }, this)
  }, this)

  this.focusedRow = ko.pureComputed(function() {
    return _.find(this.rows(), function(r) { return r.step.focused() })
  }, this).extend({
    rateLimit: 0,
    useEquality: function(a, b) {
      return a && b && a.step.id === b.step.id
    }
  })

  this.subs.push(ko.computed(function() {
    var focusedRow = this.focusedRow()
    if (focusedRow && this.model.componentProviders) {
      var cp = this.model.componentProviders()[focusedRow.step.id]
      this.controller.componentSinkEvents.notifyLatchCurrentComponentProvider({
        sourcePath: cp && cp.sourcePath(),
        model: this.model,
        stepId: focusedRow.step.id,
        component: focusedRow.linkableComponent()
      })
    } else {
      this.controller.componentSinkEvents.notifyLatchCurrentComponentProvider(null)
    }
  }, this))

  this.subs.push(this.focusedRow.subscribe(function() {
    this.closingUp(false)
    this.closingDown(false)
    // Always save parameters when the currently focused row changes.
    this.controller.saveUpdatedParameters()
  }, this))

  var highlightColors = {
    check: "green",
    circle: "blue",
    cross: "red",
    up: "blue",
    down: "blue",
    left: "blue",
    right: "blue"
  }
  var supportedButtons = ["cross", "circle", "check"]
  this.pilotButtons = ko.computed(function() {
    // Abort if context menu is not open
    var timeline = this.controller.timeline.peek()
    if (!timeline || !timeline.contextMenuElement.peek()) {
      return
    }
    var pilot = _.clone(this.stepNavigator.pilot()) || {}
    // Map pilot config to color values for the pilot
    var colors = {}
    for (var key in pilot) {
      if (pilot[key].click) {
        var color = pilot[key].highlight || key === "check" || key === "circle" || key === "cross" ? highlightColors[key] : "white"
        colors[key] = { color: color }
      }
    }
    this.controller.pilot.setColors(colors)
    // Generate pilot buttons viewmodel
    var navEvents = this.controller.navEvents
    var buttons = {}
    supportedButtons.forEach(function(key) {
      if (pilot[key] && pilot[key].click) {
        // Use label and highlight from pilot spec,
        // but issue navigation events on click
        buttons[key] = Object.assign({}, pilot[key], {
          click: function(_, ev) {
            navEvents.notify(key)
            ev.stopPropagation()
            return true
          }
        })
      } else {
        buttons[key] = { disabled: true }
      }
    })
    return buttons
  }, this).extend({ rateLimit: 0 })

  _.bindAll(this, "createSandboxContext", "dragComponentSinkStart", "dragComponentSinkEnd")
}

ContextMenu.prototype.dispose = function() {
  this.controller.componentSinkEvents.notifyLinkableComponentSinks(null)
  this.controller.componentSinkEvents.notifyLinkableComponentSources(null)
  this.controller.componentSinkEvents.notifyLatchCurrentComponentProvider(null)
  // TODO: api calls on dispose should be collected in oneAPI as a component dispose / onBlur might also make calls
  this.controller.saveUpdatedParameters()
  this.stepNavigator.dispose()
  _.invoke(this.subs, "dispose")
  this.subs = []
}

/**
 * Close context menu. This is currently implemented by notifying unselect the
 * corresponding timeline element.
 */
ContextMenu.prototype.close = function() {
  this.requestClose()
  return true
}

/**
 * Open the context menu of the next unconfigured timeline element. If there is
 * none, false is returned.
 * @return {bool} True if next unconfigured element was found.
 */
ContextMenu.prototype.openNextUnconfigured = function() {
  var next = this.nextUnconfiguredPath()
  if (next) {
    this.requestClose(next)
    return true
  }
}

ContextMenu.prototype.nextUnconfiguredPath = function() {
  var path = ko.unwrapDeep(this.path)
  return _.find(util.getUnconfiguredPaths(this.controller.timeline()), function(p) {
    return !_.eq(path, p)
  }, this)
}

ContextMenu.prototype.nextUnconfiguredStep = function() {
  return _.find(this.stepNavigator.steps(), function(s) {
    return s.available() && !s.configured()
  })
}

ContextMenu.prototype.createContinueStep = function() {
  var allConfigured = !this.nextUnconfiguredStep()
  var step = this.stepNavigator.createStep("continue", null, {
    content: __webpack_require__(149)
  })
  step.name = step.label = ko.observable().extend({reader: function() {
    if (this.nextUnconfiguredStep()) {
      return "Configure next step?"
    } else if (this.nextUnconfiguredPath()) {
      return "Configure next skill?"
    } else {
      return "Start working?"
    }
  }.bind(this)})
  step.configured(allConfigured)
  step.done = function() {
    var nextUnconfigured = this.nextUnconfiguredStep()
    if (nextUnconfigured) {
      return this.stepNavigator.focus(nextUnconfigured)
    } else if (this.nextUnconfiguredPath()) {
      return this.openNextUnconfigured()
    } else {
      return this.close()
    }
  }.bind(this)
  return step
}

/**
 * Create sandbox binding context (``ko.bindingContext``) using the given
 * context and step information. The sandboxed context will contain only
 * whitelisted observables and functions.
 * @param {ko.bindingContext} context - A knockout binding context.
 */
ContextMenu.prototype.createSandboxContext = function(context, componentProviderAPI) {
  // TODO: Resetting knockout specific variable should actually be done by the
  // sandbox binding handler.
  var ctx = context.createChildContext()
  ctx.$component = undefined
  ctx.$componentTemplateNodes = []
  ctx.$index = undefined
  ctx.$parent = undefined
  ctx.$parents = []
  ctx.$parentContext = undefined
  ctx.$root = undefined
  ctx.$data = undefined
  ctx.icons = {
    teach: franka
  }

  // Sandbox content
  ctx.title = this.title
  ctx.api = this.controller.oneAPI
  _.extend(ctx, new ElementAPI(this.controller, this.model))
  ctx.componentProviderAPI = componentProviderAPI
  ctx.stepNavigator = this.stepNavigator

  return ctx
}

ContextMenu.prototype.dragComponentSinkStart = function(_, row) {
  var sink = this.componentLinkManager.getComponentSink(row.step.id, row.linkableComponent())
  this.controller.componentSinkEvents.notifyLinkableComponentSinks(sink)
  return sink
}

ContextMenu.prototype.dragComponentSinkEnd = function(dropped, source) {
  this.controller.componentSinkEvents.notifyLinkableComponentSinks()
  if (dropped) {
    this.componentLinkManager.linkComponents(source)
  }
}

ContextMenu.prototype.closeUp = function() {
  this.closingDown(false)
  if (this.closingUp()) {
    this.close()
  } else {
    this.closingUp(true)
    clearTimeout(this.timeout)
    this.timeout = setTimeout(this.closingUp.bind(this, false), 3000)
  }
  return true
}

ContextMenu.prototype.closeDown = function() {
  this.closingUp(false)
  if (this.closingDown()) {
    this.close()
  } else {
    this.closingDown(true)
    clearTimeout(this.timeout)
    this.timeout = setTimeout(this.closingDown.bind(this, false), 3000)
  }
  return true
}


/***/ }),
/* 146 WEBPACK VAR INJECTION*/
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {var _ = __webpack_require__(0)

module.exports = function(ko) {

  function isNode(o) {
    if (global.Node !== undefined) {
      return o instanceof Node
    }
    return o && typeof o === "object" &&
           typeof o.nodeType === "number" &&
           typeof o.nodeName === "string"
  }

  ko.unwrapDeep = function(value) {
    if (ko.isObservable(value)) {
      value = ko.unwrap(value)
    }
    if (_.isArray(value)) {
      value = _.map(value, ko.unwrapDeep)
    } else if (_.isObject(value) && !isNode(value) && !_.isFunction(value)) {
      value = _.mapValues(value, ko.unwrapDeep)
    }
    return value
  }

  ko.wrapDeep = function(value) {
    var v = ko.unwrap(value)
    if (_.isArray(v)) {
      v = _.map(v, ko.wrapDeep)
    } else if (_.isObject(v) && !isNode(v) && !_.isFunction(value)) {
      v = _.mapValues(v, ko.wrapDeep)
    }
    if (ko.isObservable(value)) {
      value(v)
    } else if (_.isArray(v)) {
      value = ko.observableArray(v)
    } else {
      value = ko.observable(v)
    }
    return value
  }

  // TODO: tests

  return ko
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(17)))

/***/ }),

/* 147 StepNavigator*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * The step_navigator module defines the StepNavigator class, which can be used
 * to group DOM elements into sections using the `<step>` tag. This module
 * integrates with knockout and provides these steps with a [Step]{@link
 * module:app/step_navigator.Step} API in the knockout binding context.
 * 可以使用`<step>`标签将DOM元素分组为多个部分。 此模块与knockout集成，并在knockout绑定上下文中为这些步骤提供[Step] API。
 * @module app/step_navigator
 */
module.exports = StepNavigator

var _ = __webpack_require__(0)
var $ = __webpack_require__(6)
var ko = __webpack_require__(1)

__webpack_require__(14)
var util = __webpack_require__(4)
var ComponentUtil = __webpack_require__(15)

/**
 * Step represents a single step in the step hierarchy of the step navigator.
 * This is the main entry point into context menu structure and navigation. An
 * instance of this class is provided as API to DOM elements inside `<step>`
 * tags via the knockout binding context.
 *
 * @class
 * @memberOf module:app/step_navigator
 * @param  {string} id Identfier of the step.
 * @param  {Step} parent (optional) Parent step.
 * @param  {Object} options Step properties, see {@link Step.update}
 */
function Step(id, parent, options) {
  options = options || {}
  /** @member {string} */
  this.id = id
  /** @member {Step} */
  this.parent = parent

  /** @member {string} */
  this.content = options.content
  /**
   * Short name of this step to be displayed in collapsed or sub-steps list.
   */
  this.name = ko.observable(options.name)
  /**
   * Detailed label or prompt for this step. Note that labels of child steps are
   * used instead, where the focused step always wins.
   * @member {ko.observable(string)}
   */
  this.label = ko.observable(options.label).extend({reader: function(label) {
    var focused = _.find(this.steps(), function(s) { return s.focused() })
    var first = _.first(available(this.steps()))
    return focused && focused.label() || first && first.label() || label || this.name()
  }.bind(this)})
  /**
   * Pilot specification of available buttons and their click handlers. This
   * property behaves similar to the {@link label} as specs of children are
   * merged with the parent configuration.
   *
   * Each entry in a pilot configuration describes a named button on the pilot
   * interface, where all of them are optional:
   *   {
   *     check: {...},
   *     circle: {...},
   *     cross: {...},
   *     down: {...},
   *     left: {...},
   *     right: {...},
   *     up: {...}
   *   }
   *
   * If the entry exists, it has to be an object. An empty object `{}` means the
   * button shall be disabled explicitly. To use the button, a `click` handler
   * needs to be specified. Also buttons can be labeled and highlighted:
   *   {
   *     check: {
   *       click: function() {...},
   *       label: "press me", // optional
   *       highlight: true    // optional
   *     }
   *   }
   * @member {ko.observable(object)}
   */
  this.pilot = ko.observable(options.pilot).extend({
    reader: function(spec) {
      var focused = _.find(this.steps(), function(s) { return s.focused() })
      return merge(spec, focused && focused.pilot())
    }.bind(this),
    deferred: true // steps and focused are deferred
  })
  /**
   * Marks this step to be focused initially.
   * @member {boolean}
   */
  this.initial = options.initial || false
  /**
   * Whether the step can is excluded from next steps.
   * @member {boolean}
   */
  this.onlyNavigate = options.onlyNavigate || false
  /**
   * The condition which evaluates to {@link available}.
   * @member {string}
   */
  this.condition = options.condition || "true"
  /**
   * The expression which evaluates to {@link configured}.
   * @member {string}
   */
  this.configures = options.configures || "true"
  /**
   * Current focus state. Do not modify this directly, see {@link focus()}.
   * @member {ko.observable(boolean)}
   */
  this.focused = ko.observable(false).extend({ deferred: true })
  /**
   * Observable, stating whether the step is currently available, and thus
   * considered on navigation. A step is available when the {@link condition}
   * evaluates to true.
   * Do not modify this directly, see ${@link update()}.
   * @member {ko.observable(boolean)}
   */
  this.available = ko.observable(true)
  /**
   * Observable stating whether the step is currently configured. A step is
   * configured when the {@link configures} condition evaluates to true and all
   * child steps are configured as well.
   * Do not modify this directly, see ${@link update()}.
   * @member {ko.observable(boolean)}
   */
  this.configured = ko.observable(false).extend({reader: function(configured) {
    return configured && _.all(this.steps(), function(s) {
      return s.configured() || !s.available()
    })
  }.bind(this)})

  /**
   * Observable array holding child steps.
   * Do not modify this directly, see ${@link StepNavigator.addStep()}.
   * Note: This is deferred as steps are sometimes removed and added in one go
   * @member {ko.observableArray(Step)}
   */
  this.steps = ko.observableArray().extend({ deferred: true })
  /**
   * Object pointing to the next step.
   * Do not modify this directly, see ${@link StepNavigator.addStep()}.
   * @member {Object}
   */
  this.next = null
  /**
   * Object pointing to the previous step.
   * Do not modify this directly, see ${@link StepNavigator.addStep()}.
   * @member {Object}
   */
  this.prev = null
  /**
   * Focus this step.
   * @function
   */
  this.focus = _.noop
  /**
   * Mark this step as done and focus the next leaf step.
   * @function
   */
  this.done = _.noop
  /**
   * Abort this step and focus the previous leaf step.
   * @function
   */
  this.abort = _.noop

  // DEPRECATED API
  var deprecated = console.warn.bind(console, "DEPRECATED: use Step.pilot() instead")
  this.pilotLegend = ko.pureComputed({
    read: deprecated,
    write: deprecated
  })
  this.events = {
    onContinue: deprecated,
    onCancel: deprecated,
    onSave: deprecated,
    onUp: deprecated,
    onDown: deprecated,
    onLeft: deprecated,
    onRight: deprecated
  }
}

/**
 * Update step properties using properties returned by a given function. This
 * function will be evaluated immediately and as soon as any observable
 * dependencies are updated.
 * @callback func Function which returns an options object:
 *   * `content` - has no effect if updated after render
 *   * `name`
 *   * `label`
 *   * `pilot`
 *   * `initial`
 *   * `onlyNavigate`
 *   * `condition`
 *   * `configures`
 * @param {Object} that (optional) This pointer for `func` and pilot click handlers
 */
Step.prototype.update = function(func, that) {
  if (this._updater) {
    this._updater.dispose()
  }
  function updateProp(obj, data, prop) {
    var value = data[prop]
    if (value !== undefined) {
      if (ko.isObservable(obj[prop])) {
        obj[prop](value)
      } else {
        obj[prop] = value
      }
    }
  }
  this._updater = ko.computed(function() {
    var options = func.call(that) || {}
    for (var key in options.pilot) {
      var v = options.pilot[key]
      if (v && v.click) {
        v.click = v.click.bind(that)
      }
    }
    updateProp(this, options, "content")
    updateProp(this, options, "name")
    updateProp(this, options, "label")
    updateProp(this, options, "pilot")
    updateProp(this, options, "initial")
    updateProp(this, options, "onlyNavigate")
    updateProp(this, options, "condition")
    updateProp(this, options, "configures")
  }, this)
}

/**
 * Get a list with all step ids up to the top level step.
 * @return {String[]} List of ancestor step ids.
 */
Step.prototype.path = function() {
  var path = [this.id]
  var step = this
  while (step.parent) {
    step = step.parent
    path.unshift(step.id)
  }
  return path
}

/**
 * Get top level step for this step. Top level steps are direct children of a
 * step navigator and the 'root' step of a step tree, i.e. they do not have a
 * parent step.
 * @return {Step} The top level step for given step.
 */
Step.prototype.topLevel = function() {
  if (this.parent) {
    return this.parent.topLevel()
  } else {
    return this
  }
}

/**
 * Returns true if the step can be focused.
 */
Step.prototype.focusable = function() {
  if (this.steps().length > 0) {
    return _.some(this.steps(), function(s) { return s.focusable() })
  } else {
    return !!_.find(focusable(available(leafSteps(this.topLevel()))), this)
  }
}

/**
 * Calculate this step's index by counting all leafs of the tree, starting
 * from left, until this step was found. If this function is used on a non-leaf step,
 * we give it the index of its first leaf.
 * @return {number} The index of this step if it's a leaf or the index of
 * this step's first leaf.
 */
Step.prototype.leafIndex = function() {
  if (this.steps().length > 1) {
    return -1
  }
  var found = false
  var searched = this
  var index = -1
  function traverse(step) {
    if (step === searched) {
      found = true
      index++
      return false
    }
    if (available(step.steps()).length === 0) {
      index++
    }
    _.each(available(step.steps()), traverse)
    return !found
  }
  traverse(this.topLevel())
  return index
}

function focusStep(step) {
  if (!(step instanceof Step)) {
    return
  }
  focusStep(step.parent)
  if (step.focused()) {
    return
  }
  step.focused(true)
}

function blurStep(step) {
  if (!(step instanceof Step)) {
    return
  }
  // Blur children
  _.map(step.steps(), function(s) {
    blurStep(s)
  })
  if (!step.focused()) {
    return
  }
  step.focused(false)
}

/**
 * The StepNavigator class represents the main entry point for creating and
 * navigating a step hierarchy. As soon as steps are registered with it using
 * `parseStep()` or directly via `createStep()`, one step gets initially
 * focused. The focus can be directly set using `focus()` or navigated in a
 * certain direction with `navigate()`. The latter is used to handle
 * corresponding events on the given event dispatcher instance.
 *
 * @param {Events} - Event dispatcher to use for currently focused step.
 * @param {function} - Callback when all steps are done.
 * @param {function} - Callback when abort reached root of step tree.
 * @param {boolean} - If true, only top level steps shall be navigatable.
 *                    This results in kind of a "read only" access.
 * @class
 */
function StepNavigator(events, doneCallback, abortCallback, readOnly) {
  /**
   * Writable knockout observable array holding child steps.
   * @type {ko.observableArray(Step)}
   */
  this.steps = ko.observableArray()
  /**
   * Computed knockout observable, stating whether all child steps are
   * configured.
   * @type {ko.pureComputed()}
   */
  this.configured = ko.pureComputed(function() {
    return _.all(this.steps(), function(s) {
      return s.configured() || !s.available()
    })
  }, this)
  /**
   * Currently focused step.
   * @type {Step}
   */
  this.focusedStep = ko.observable(null)
  // Use of a knockout computed is important here to properly cache the
  // resulting pilot spec between rendering and handling events
  this.pilot = ko.computed(this.mergePilot, this)

  this.toFocus = null
  this.doneCallback = doneCallback || function() { return false }
  this.abortCallback = abortCallback || function() { return false }
  this.readOnly = readOnly
  // Flag whether user interacted yet (used for setting up initial focus).
  this.userInteracted = false

  this.subs = []
  if (!readOnly) {
    // Map all navigation events onto merged pilot click handlers
    var eventNames = ["check", "circle", "cross", "down", "left", "right", "up"]
    this.subs = _.map(eventNames, function(name) {
      return events.subscribe(name, function() {
          this.userInteracted = true
          var pilot = this.pilot()
          if (pilot[name]) {
            // Routing the return value of pilot click to events is kind of an
            // escape hatch to re-enter bubbling of "Events" by returning false
            return pilot[name].click ? pilot[name].click() !== false : true
          }
        }.bind(this))
    }, this)
  }
}

/**
 * Dispose step navigator and all its steps.
 */
StepNavigator.prototype.dispose = function() {
  _.map(ancestors(this.focusedStep()), blurStep)
  this.focusedStep(null)
  _.invoke(this.subs, "dispose")
  this.subs = []
}

// Return only available steps.
function available(steps) {
  return _.filter(steps, function(s) { return s.available() })
}

// Return all leave steps for given step root.
function leafSteps(root) {
  var leafs = []
  function collectLeafs(step) {
    if (step.steps().length > 0) {
      _.each(step.steps(), collectLeafs)
    } else if (step instanceof Step) {
      leafs.push(step)
    }
  }
  collectLeafs(root)
  return leafs
}

// Return last item before given item which matches the predicate.
function previous(array, item, predicate) {
  predicate = predicate || _.constant(true)
  var index = _.findIndex(array, item)
  return _.find(array.slice(0, index).reverse(), predicate)
}

// Returns first after given item which matches the predicate.
function next(array, item, predicate) {
  predicate = predicate || _.constant(true)
  var index = _.findIndex(array, item)
  return _.find(array.slice(index + 1), predicate)
}

StepNavigator.prototype.navigateLeft = function() {
  var step = _.first(available(this.steps()))
  var focused = this.focusedStep()
  if (focused) {
    var availableSteps = focusable(available(leafSteps(focused.topLevel())))
    step = previous(availableSteps, focused) || _.first(availableSteps) || focused
  }
  this.focus(step)
  return true
}

StepNavigator.prototype.navigateRight = function() {
  var step = _.first(available(this.steps()))
  var focused = this.focusedStep()
  if (focused) {
    step = next(focusable(available(leafSteps(focused.topLevel()))), focused) ||
           focused
  }
  this.focus(step)
  return true
}

StepNavigator.prototype.navigateUp = function() {
  var availableSteps = available(this.steps())
  var step = _.first(availableSteps)
  var focused = this.focusedStep()
  if (focused) {
    step = previous(availableSteps, focused.topLevel()) || focused
  }
  // If step does not change, false is returned to close the context menu
  var handled = step !== focused
  this.focus(step)
  return handled
}

StepNavigator.prototype.navigateDown = function() {
  var availableSteps = available(this.steps())
  var step = _.first(availableSteps)
  var focused = this.focusedStep()
  if (focused) {
    step = next(availableSteps, focused.topLevel()) || focused
  }
  var handled = step !== focused
  this.focus(step)
  return handled
}

/**
 * Returns the overall pilot spec for the currently focused step.
 */
StepNavigator.prototype.mergePilot = function() {
  var focused = this.focusedStep()
  var topLevel = focused && focused.topLevel()
  var pilot = {
    down: { click: this.navigateDown.bind(this) },
    left: { click: this.navigateLeft.bind(this) },
    right: { click: this.navigateRight.bind(this) },
    up: { click: this.navigateUp.bind(this) }
  }
  if (focused) {
    pilot.check = {
      click: focused.done,
      label: "next"
    }
    var previousTopLevel = previous(available(this.steps()), focused.topLevel())
    var isFirstStep = focused === _.first(available(leafSteps(topLevel)))
    if (!isFirstStep || previousTopLevel) {
      pilot.cross = {
        click: focused.abort,
        label: "back"
      }
    } else if (!previousTopLevel) {
      pilot.cross = {
        click: this.abortCallback,
        label: "close"
      }
    }
  }
  return merge(pilot, topLevel && topLevel.pilot())
}

/**
 * Create a step with given id and options. The step is not added to any
 * parent, but must be added using addStep.
 *
 * @param  {string} id Identfier of the step to create/update.
 * @param  {Object} options Step properties, see {@link Step.update}
 * @return {Step} The created step
 */
StepNavigator.prototype.createStep = function(id, parent, options) {
  var step = new Step(id, parent, options)
  var self = this
  step.focus = _.bind(this.focus, this, step)
  step.done = function() {
    console.debug("step", step.id, "done")
    // Do nothing if step already lost focus
    if (!step.focused()) {
      return false
    }
    var steps = step.parent ? step.parent.steps() : self.steps()
    // Focus next unconfigured step on top-level only, as skipping steps in the
    // left-right navigation of deeper steps is unintuitive.
    var nextStep
    if (step.topLevel() === step) {
      nextStep = next(steps, step, function(s) {
        return s.available() && !s.configured() && !s.onlyNavigate
      })
      if (nextStep && self.focus(nextStep)) {
        return true
      }
    }
    // Focus next step on same level, if there is one.
    nextStep = next(steps, step, function(s) {
      return s.available() && !s.onlyNavigate
    })
    if (nextStep && self.focus(nextStep)) {
      return true
    }
    // No next step was found, thus focus next step on parent level.
    if (step.parent) {
      return step.parent.done()
    }
    // Last top-level step reached, cannot focus a "next" step.
    return self.doneCallback()
  }
  step.abort = function() {
    console.debug("step", step.id, "aborted")
    // Do nothing if step already lost focus
    if (!step.focused()) {
      return false
    }
    var steps = step.parent ? step.parent.steps() : self.steps()
    // Focus previous step on same level, if there is one.
    var prevStep = previous(steps, step, function(s) {
      return s.available() && !s.onlyNavigate
    })
    if (prevStep && self.focus(prevStep)) {
      return true
    }
    // No previous step was found, thus focus previous step on parent level.
    if (step.parent) {
      return step.parent.abort()
    }
    // First top-level step reached, cannot focus a "previous" step.
    return self.abortCallback()
  }
  return step
}

/**
 * Add the passed step to the end of the steps of the passed
 * parents. If the step already exists, addStep is a noop.
 *
 * @param  {Step} step The step to be added.
 * @param  {Step} parent Parent step, if none given the step gets added on the
 *     top-level.
 */
StepNavigator.prototype.addStep = function(step, index) {
  console.debug("addStep", step, index)
  // Run scheduled tasks early to assure all observables are updated, i.e.
  // step.parent.steps is a deferred computed
  ko.tasks.runEarly()
  var parentSteps = step.parent ? step.parent.steps : this.steps
  index = index >= 0 && index <= parentSteps().length ? index : parentSteps().length
  // Remove from old position first
  if (_.findIndex(parentSteps(), { id: step.id }) !== -1) {
    this.removeStep(step)
  }
  // Connect and insert at index
  var prevStep = parentSteps()[index - 1]
  if (prevStep) {
    prevStep.next = step
    step.prev = prevStep
  }
  var nextStep = parentSteps()[index + 1]
  if (nextStep) {
    nextStep.prev = step
    step.next = nextStep
  }
  parentSteps.splice(index, 0, step)
  // Update focus if user did not interact yet
  if (!this.userInteracted) {
    if (this.focusTask) {
      ko.tasks.cancel(this.focusTask)
    }
    this.focusTask = ko.tasks.schedule(this.focus.bind(this))
  }
}

StepNavigator.prototype.removeStep = function(step) {
  var parentSteps = step.parent ? step.parent.steps : this.steps
  var index = _.findIndex(parentSteps(), step)
  if (index === -1) {
    return
  }
  // Shortcut and remove from index
  var prevStep = parentSteps()[index - 1]
  if (prevStep) {
    prevStep.next = null
  }
  var nextStep = parentSteps()[index + 1]
  if (nextStep) {
    nextStep.prev = prevStep
  }
  parentSteps.splice(index, 1)
}

/**
 * Parse `<step>` html element and create/update corresponding step instance.
 * Only `<step>` tags **with `id`** are considered and an optional parent step can
 * be passed to create a step hierarchy.
 * @param  {HTMLElement} element HTML element to parse.
 * @param  {Step} parent (optional) Parent step for newly created step.
 * @return {Step|null}
 */
StepNavigator.prototype.parseStep = function(element, parent, index) {
  if (_.isString(element)) {
    element = _.first(util.parseHTML(element))
  }
  if (!util.isElement(element)) {
    console.warn("parseStep expects a DOM element", element)
    return null
  }
  if (element.tagName.toLowerCase() !== "step" || !element.id) {
    console.warn("parseStep only supports <step> tags with a valid id", element)
    return null
  }
  var parentSteps = parent ? parent.steps : this.steps
  var options = {
    content: element.outerHTML,
    name: element.getAttribute("name"),
    label: element.getAttribute("label"),
    onlyNavigate: element.hasAttribute("only-navigate") || false,
    condition: element.getAttribute("if") || "true",
    configures: element.getAttribute("configured") || "true"
  }
  var step = _.find(parentSteps(), {id: element.id})
  if (step instanceof Step) {
    // TODO(SN): allow evaluation in attributes? -> light-weight updatable steps
    step.update(function() { return options })
  } else {
    step = this.createStep(element.id, parent, options)
    this.addStep(step, index)
  }
  return step
}

function ancestors(step) {
  if (!(step instanceof Step)) {
    return []
  }
  return ancestors(step.parent).concat([step])
}

function difference(a1, a2) {
  var i = 0, length = Math.min(a1.length, a2.length)
  while (i < length && a1[i] === a2[i]) { i++ }
  return a1.slice(i)
}

function focusable(steps) {
  var result = []
  var allPreviousConfigured = true
  _.each(steps, function(s) {
    var focusable = s.configured() || s.onlyNavigate || s.initial
    if (focusable || allPreviousConfigured) {
      result.push(s)
    }
    allPreviousConfigured = allPreviousConfigured && focusable
  })
  return result
}

/**
 * Focus the given step. If the given step is not a leaf step, child steps are
 * recursively focused until a leaf is reached. On each level the step to focus
 * is selected in the following order:
 *  1. (first) initial step
 *  2. (first) unconfigured step
 *  3. first step
 * @param  {Step} step Step to focus.
 * @return {boolean} True if focus changed.
 */
StepNavigator.prototype.focus = function(step) {
  // Check if focusable and if only top level steps should be focused
  if (step && !step.focusable() || step && step.parent && this.readOnly) {
    return false
  }
  var changedFocus = false
  // Blur non-common ancestors
  var nonCommon = _.first(difference(ancestors(this.focusedStep()), ancestors(step)))
  if (nonCommon) {
    blurStep(nonCommon)
    this.focusedStep(null)
    changedFocus = true
  }
  if (step) {
    focusStep(step)
    this.focusedStep(step)
    console.debug("focused step", step.path())
    changedFocus = true
  }
  // Focus initial, unconfigured or first child step, if available
  step = step || this
  var availableSteps = available(step.steps())
  if (availableSteps.length > 0) {
    var initial = _.find(availableSteps, "initial")
    var unconfigured = _.find(availableSteps, function(s) {
      return !s.configured()
    })
    var first = _.first(availableSteps)
    return this.focus(initial || unconfigured || first)
  }
  return changedFocus
}

var preprocessNode = ko.bindingProvider.instance.preprocessNode || _.identity
/**
 * Knockout preprocessing step for HTML nodes to be bound. The step navigator
 * preserves the original implementation (if present) and injects the `step`
 * binding into `<step>` tags.
 *
 * @param  {HTMLNode} node HTML node to preprocess
 * @memberOf module:app/step_navigator
 */
ko.bindingProvider.instance.preprocessNode = function(node) {
  preprocessNode(node)
  if (node.tagName && node.tagName.toLowerCase() === "step") {
    // Add binding step: 'step' if not found
    var result = /\bstep\s*:/.exec(node.dataset.bind)
    if (!result) {
      var bind = "step: 'step'"
      bind += node.dataset.bind ? ", " + node.dataset.bind : ""
      node.dataset.bind = bind
    }
  }
}

/**
 * Knockout bindingHandler `step` which is to be used on `<step>` tags.
 * The binding handler
 *   * registers the step with the navigator (it requires `navigator` to be set
 *     in the binding context),
 *   * changes the binding context to hold a reference to the created step
 *     (`step`)
 *   * creates updaters for the step's `available` and `configured` observables
 *   * updates the `<step>` element's `class` according to `focused`
 *     and hides it (via `style.display`) if not available
 * @memberOf module:app/step_navigator
 */
ko.bindingHandlers.step = {
  init: function(element, valueAccessor, allbindings, viewmodel, context) {
    if (!element.tagName || element.tagName.toLowerCase() !== "step" || element.id === "") {
      throw new Error("step binding: only allowd on <step> tags with id")
    }
    var value = ko.unwrap(valueAccessor())
    if (value !== "step") {
      throw new Error("step binding: requires a placeholder value 'step'")
    }
    if (!context.stepNavigator) {
      throw new Error("step binding: requires 'stepNavigator' in binding context")
    }
    element.id = context.step ? nextUniqueStepId(context.step, element.id) : element.id
    // Parse, create or update step and initialize binding context
    var step = context.stepNavigator.parseStep(element, context.step, findStepIndex(element))
    // Create new context for descendants
    context = context.extend({step: step})
    // Process the 'viewmodel' tag and add it to the binding context
    // if a viewmodel tag is present.
    var lightweightViewmodel = _.find(element.children, function(c) {
      return c.tagName.toLowerCase() === "viewmodel"
    })
    if (lightweightViewmodel) {
      var modules = { lodash: _,
                      jquery: $,
                      knockout: ko,
                      component_util: ComponentUtil // eslint-disable-line camelcase
                    }
      var model = util.loadCommonJS(lightweightViewmodel.textContent, context, modules)
      context = context.extend({viewmodel: model})
    }
    // Create updaters to determine whether the step is available and
    // configured. These are computed to create a dependency onto potentially
    // accessed observables in the context on evaluation.
    var availableUpdater = ko.computed(function() {
      step.available(!!evaluateInContext(step.condition, context))
    })
    var configuredUpdater = ko.computed(function() {
      step.configured(!!evaluateInContext(step.configures, context))
    })
    // Update step element if availability or focus changes
    var elementUpdater = ko.computed(function() {
      updateStepElement(element, step)
    })
    var availableSubscription = step.available.subscribe(function(available) {
      if (!available && step.focused()) {
        step.topLevel().focus()
      }
    })
    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
      // Cleanup subscriptions and viewmodel before removing step from DOM
      availableSubscription.dispose()
      elementUpdater.dispose()
      configuredUpdater.dispose()
      availableUpdater.dispose()
      if (context.viewmodel && _.isFunction(context.viewmodel.dispose)) {
        context.viewmodel.dispose()
      }
      context.stepNavigator.removeStep(step)
    })
    // Add default click handler
    element.addEventListener("click", function(event) {
      event.stopPropagation()
      var topLevel = step.topLevel()
      if (!topLevel.focused()) {
        topLevel.focus()
        return
      }
      if (!step.focused()) {
        step.focus()
      }
    })
    // Finally, initialize bindings inside the step element
    ko.applyBindingsToDescendants(context, element)
    return { controlsDescendantBindings: true }
  }
}

function nextUniqueStepId(step, id) {
  var max = _.reduce(step.steps(), function(max, s) {
    if (!_.startsWith(s.id, id)) {
      return max
    }
    var v = Number.parseInt(s.id.slice(id.length + 1))
    return v > max ? v : max
  }, -1)
  return id + "-" + (max + 1)
}

function findStepIndex(element) {
  function isStep(node) {
    return util.isElement(node) && node.tagName.toLowerCase() === "step" && node.id
  }
  function closest(node, predicate) {
    if (!node || predicate(node)) {
      return node
    }
    return closest(node.parentNode, predicate) || node
  }
  var root = closest(element.parentNode, isStep)
  // Walk nodes (DFS) with early exit and find all <step> tags in root
  function dfs(node, fn) {
    if (!node || fn(node)) {
      return
    }
    _.map(node.children, function(node) { dfs(node, fn) })
  }
  // Find closest <step> in element ancestors (if none found, return top-most node)
  var steps = []
  dfs(root, function(node) {
    if (node !== root && isStep(node)) {
      steps.push(node.id)
      return true
    }
  })
  return steps.indexOf(element.id)
}

// Update the step element according to current values of the step viewmodel
function updateStepElement(element, step) {
  if (!element || !step) {
    return
  }
  // Hide if not available
  element.style.display = !step.available() ? "none" : ""
  // Add corresponding css classes
  classListToggle(element, "leaf", available(step.steps()).length === 0)
  classListToggle(element, "focused", step.focused())
  classListToggle(element, "configured", step.configured())
  classListToggle(element, "focusable", step.focusable())
}

// Custom class list toggle, as phantomjs does not properly support the builtin
// element.classList.toggle(): https://github.com/ariya/phantomjs/issues/12782
function classListToggle(element, name, value) {
  if (value) {
    element.classList.add(name)
  } else {
    element.classList.remove(name)
  }
}

// Evaluate a javascript string in a given binding context
// Taken from knockout bindingProvider@createBindingsStringEvaluator
function evaluateInContext(str, context) {
  var functionBody = "with($context){with($data||{}){return " + str + "}}";
  try {
    /* jshint evil: true */
    return new Function("$context", functionBody)(context)
  } catch (e) {
    console.warn("step binding: error evaluating", functionBody, "in", context, ":", e)
  }
  return undefined
}

// Merge two or more objects like Object.assign but always produce a new object
// and disregard undefined values
function merge() {
  var dst = {}
  for (var i = 0; i < arguments.length; i++) {
    var src = arguments[i]
    for (var key in src) {
      if (src[key] !== undefined) {
        dst[key] = src[key]
      }
    }
  }
  return dst
}


/***/ }),
/* 148 franka svg*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "db08385fcc0ff4670e36f8686a44b4b5.svg";

/***/ }),
/* 149 Step(#continue) template*/
/***/ (function(module, exports) {

module.exports = "<step id="continue">
        <button class="icon button save continue-button" data-bind="    click: step.done, clickBubble: false,    css: { success: step.focused }  ">
            <i class="check"></i>
            </button>
            </step>";

/***/ }),

/* 150 ContextMenu style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 151 ContextMenu template*/
/***/ (function(module, exports) {

module.exports = "<div class="close-alert" data-bind="css: { closing: closingUp }">
        Press <b>UP</b> again to leave the context menu.
        </div>
        <div class="body" data-bind="foreach: rows">
            <!-- TODO(sn): We should definitely think about using the step binding here!<step id="toplevel">-->
            <div class="step" data-bind="visible: step.available,css: {focused: step.focused,configured: step.configured},scrollIntoViewWhen: step.focused,click: step.focus, clickBubble: false">
            <div class="label-area">
            <div class="step-label">
            <span data-bind="html: step.focused() && subStepLabels().length === 0 ? step.label : step.name">
            </span>
            <!-- ko if: step.focused -->
            <ul class="step-label-substeps" data-bind="foreach: subStepLabels">
            <li data-bind="   css: { focused: focused, saved: configured }, click: focus, clickBubble: false">
            <div class="head">
            <step-number params="step: $data" />
            <span class="substep-label" data-bind="text: name"></span>
            </div>
            <!-- ko if: focused() && label -->
            <div class="hint" data-bind="html: label"></div>
            <!-- /ko -->
            </li>
            </ul>
            <!-- /ko -->
            </div>
            <!-- ko if: focused() -->
            <div class="step-controls" data-bind="      requireAuth: {        resource: 'Parameters',        enableIf: 'ReadWrite'      }    ">
            <button class="icon button" data-bind="visible: linkable() && !linked(),css: { accent: linking, active: linking },click: linking.toggle, clickBubble: false">       	<i class="fi-link"></i>
            <span>Link</span>
            </button>
            <button class="icon button" data-bind="visible: linkable() && linked(),click: unlink, clickBubble: false">
            <i class="fi-unlink"></i>
            <span>Unlink</span>
            </button>
            <button class="icon button" data-bind="visible: showSourceSelect,css: { accent: sourceSelect, active: sourceSelect },click: sourceSelect.toggle, clickBubble: false">    <i class="fi-align-center"></i>
            <span>Source</span>
            </button>
            <button class="icon button" data-bind="visible: showReset,click: reset, clickBubble: false">
            <i class="fi-x"></i>
            <span>Reset</span>
            </button>
            </div>
            <!-- /ko -->
            </div>
            <div class="step-container" data-bind="css: { hidden: !step.focused() }" >
            <div class="content" data-bind="  sandbox: step.content,  context: createContext">
            </div>
            <div class="no-permission-hint" data-bind="requireAuth: {resource: 'Parameters',      hideIf: 'ReadWrite'}">
            <i class="fi-lock"></i>
            </div>
            <div class="pilot-buttons" data-bind="  visible: focused() && step !== $component.finalStep,  with: $component.pilotButtons,  requireAuth: {    resource: 'Parameters',    displayIf: 'ReadWrite'  }">
            <button class="icon button cancel" data-bind="css: { disabled: cross.disabled, highlight: cross.highlight}, click: cross.click  ">
            <i class="cross"></i>
            <span data-bind="text: cross.label, css: { labeled: cross.label }"></span>
            </button>
            <button class="icon button continue" data-bind=" css: {disabled: circle.disabled, highlight: circle.highlight }, click: circle.click">
            <i class="circle"></i>
            <span data-bind="text: circle.label, css: { labeled: circle.label }"></span>
            </button>
            <button class="icon button save" data-bind=" css: { disabled: check.disabled,      highlight: check.highlight },click: check.click  ">
            <i class="check"></i>
            <span data-bind="text: check.label, css: { labeled: check.label }"></span>
            </button>
            </div>
            </div>
            </div>
            </div>
            <div class="continue-alert" data-bind="css: { closing: closingDown }">
            Press <b>DOWN</b> again to leave the context menu.
            </div>";

/***/ }),

/* 152 Timeline Skill component对象*/
/***/ (function(module, exports, __webpack_require__) {

/**
 * 这个模块定义了timeline skill view component，包含一个viewmodel和一个timeline skill html template.
 *
 * The timeline skill component需要3个参数, the
 * [controller]{@link module:app/controller.Controller}, its own path
 * and 待可视化的skill model (通常是一个element of 当前tasks的``skills`` field)
 *
 * skill的path参数必须是一个具有以下布局的JSON对象:
 *
 * ```
 * {
 *    timelineId: <timeline id>,
 *    taskIndex: <index>
 *    skillIndex: <index>
 * }
 * ```
 *
 * 以下为如何在HTML code中使用component.
 *
 * ```
 * <div class="skills" data-bind="foreach: skills">
 *   <timeline-skill
 *      params="controller: $parent.controller,
 *              path: {
 *                timelineId: $parent.path.timelineId,
 *                taskIndex: $parent.path.taskIndex,
 *                skillIndex: $index
 *              },
 *              model: $data" />
 * </div>
 * ```
 *
 * @module components/workspace/timeline/skill
 */
module.exports = {
  template: __webpack_require__(153),
  viewModel: __webpack_require__(45)
}


/***/ }),
/* 153 Timeline Skill template*/
/***/ (function(module, exports) {

module.exports = "<div class="skill" data-bind="
        css: {
            active: active,
                error: isLastError,
                hollow: dragging,
                focused: focused() && !showContextMenu() && !model.isSelected(),
                link: linkable() || linked()
        },
        tether: {
            selector: 'one-selection-menu',
                uniqueFor: 'one-timeline',
                when: showSelectionMenu,
                offset: '-20px 0px',
                attachment: 'top center',
                targetAttachment: 'bottom center'
        },
        scrollIntoViewWhen: focused,
            scrollLeftTo: {
            selector: 'one-timeline',
                when: showContextMenu() || model.active() || linkable() || lookForSource(),
                disableScrollWhen: showContextMenu(),
                offset: -settings.element.scrollOffset
        }">
        <div class="skill-icon" data-bind="
        css: {
            'show-context': showContextMenu,
                'disabled-look': !enabled()
        },
        style: {
            backgroundColor: color,
                borderColor: model.isSelected() ? undefined : color
        },
        click: click,
            event: { contextmenu: rightClick }">
        <!-- ko if: !linkable() && !linked() && !showContextMenu() -->
        <div class="skill-overlay"></div>
            <!-- /ko -->
            <div class="badges">
            <!-- ko if: !configured() -->
        <div class="badge badge-unconfigured" data-bind="style: { backgroundColor: color }">
            <!-- ko if: !linkable() && !linked() && !showContextMenu() -->
        <div class="badge badge-overlay"></div>
            <!-- /ko -->
            </div>
            <!-- /ko -->
            <!-- ko if: (linkable() && !showContextMenu()) || linked() -->
            <div class="badge badge-link" data-bind="style: { backgroundColor: color }"></div>
            <!-- /ko -->
            </div>
            <div data-bind="replaceHTML: image().icon"></div>
            <label data-bind="capitalText: name"></label>
            <div class="drag-area" data-bind="
        drag: {
            group: 'element',
                dragstart: dragStart,
                drag: drag,
                dragend: dragEnd,
                hint: dragHint
        },
        requireAuth: {
            resource: 'Tasks',
                enableEventsIf: 'ReadWrite'
        }">
        </div>
        </div>
        <!-- ko if: showContextMenu() -->
        <one-context-menu data-bind="maxHeightTo: { selector: 'one-timeline', offset: settings.scrollBar.height}" params="controller: controller,model: model,requestClose: contextMenuRequestClose"></one-context-menu>
            <!-- /ko -->
            <!-- ko if: isLastError -->
            <one-error-badge params="com: controller.com,execution: controller.execution"></one-error-badge>
        "<!-- /ko -->
        "</div>";

/***/ }),

/* 154 TimelineGroup component*/
/***/ (function(module, exports, __webpack_require__) {

var ko = __webpack_require__(1)

ko.components.register("one-container", __webpack_require__(155))

var TimelineGroup = __webpack_require__(44)
var template = __webpack_require__(158)

module.exports = {
  template: template,
  viewModel: TimelineGroup
}


/***/ }),

/* 155 Container component对象*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  template: __webpack_require__(156),
  viewModel: __webpack_require__(157)
}


/***/ }),
/* 156 Container template*/
/***/ (function(module, exports) {

module.exports = "<div class="elements">
        <one-drop-zone params="controller: controller,path: extendPath(0),visible: elements().length === 0">
            </one-drop-zone>
            <!-- ko foreach: elements -->
            <!-- ko if: $data.containers === undefined -->
            <one-timeline-skill params="
        controller: $component.controller,
            model: $data,
            clicked: $component.elementClicked,
            rightClicked: $component.elementRightClicked,
            contextMenuRequestClose: $component.contextMenuRequestClose"
        data-bind="css: { selected: $data.isSelected }">
            </one-timeline-skill>
            <!-- /ko -->
            <!-- ko if: $data.containers !== undefined -->
            <one-timeline-group params="
        controller: $component.controller,
            model: $data,
            clicked: $component.elementClicked,
            rightClicked: $component.elementRightClicked,
            contextMenuRequestClose: $component.contextMenuRequestClose,
            dropZonesEnabled: $component.dropZonesEnabled"
        data-bind="css: { selected: $data.isSelected }">
            </one-timeline-group>
            <!-- /ko -->
            <one-drop-zone params="controller: $component.controller,path: $component.extendPath($index()+1)">
            </one-drop-zone>
        <!-- /ko -->
        "</div>";

/***/ }),
/* 157 Container viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Container

var ko = __webpack_require__(1)

__webpack_require__(46)(ko)
var assert = __webpack_require__(7)
var util = __webpack_require__(4)

/**
 * @class
 * @memberof module:components/workspace/timeline/group/container
 */
function Container(params) {
  assert.keys(params, "controller", "model")
  this.controller = params.controller
  var model = ko.unwrap(params.model)
  this.id = model.id
  this.elements = model.elements
  this.active = model.active
  this.extendPath = function(index) {
    return util.extendPath(model.path(), index)
  }
  this.elementClicked = params.elementClicked
  this.elementRightClicked = params.elementRightClicked
  this.contextMenuRequestClose = params.contextMenuRequestClose
  this.dropZonesEnabled = params.dropZonesEnabled
}


/***/ }),

/* 158 TimelineGroup template*/
/***/ (function(module, exports) {

module.exports = "<div class="group" data-bind="css: {
            active: isLastActive,
                error: isLastError,
                linear: isLinear,
                hollow: dragging,
                focused: focused() && !showContextMenu(),
                link: linkable() || linked() || currentSource()
        },
        tether: {
            selector: 'one-selection-menu',
                uniqueFor: 'one-timeline',
                when: showSelectionMenu,
                offset: '-30px 0',
                attachment: 'top center',
                targetAttachment: 'bottom left'
        },
        scrollIntoViewWhen: focused,
            scrollLeftTo: {
            selector: 'one-timeline',
                when: showContextMenu() || linkable(),
                disableScrollWhen: showContextMenu(),
                offset: -settings.element.scrollOffset
        }">
        <!-- ko if: !linkable() && !linked() && !currentSource() && !showContextMenu() -->
        <div   class="group-overlay" data-bind="{ css: { linear: $component.isLinear }, }">	</div>
            <!-- /ko --><!-- ko if: isLinear -->
            <div class="skill-icon" data-bind=" css: {'show-context': showContextMenu},style: {      borderColor: isSelected() ? null : color, backgroundColor: color}, click: click,event: { contextmenu: rightClick } ">
            <div data-bind="replaceHTML: image().icon"></div>
            <div class="drag-area" data-bind="drag: dragGroupConfig(), requireAuth: {resource: 'Tasks',  enableEventsIf: 'ReadWrite' } ">
            </div>
            <div class="badges">
            <!-- ko if: !configured() -->
        <div class="badge badge-unconfigured" data-bind="style: { backgroundColor: color }">        <!-- ko if: !linkable() && !linked() && !currentSource() && !showContextMenu() -->
        <div class="badge badge-overlay"></div>
            <!-- /ko -->
            </div>
            <!-- /ko -->
            </div>
            </div>
            <!-- /ko -->
            <!-- ko ifnot: isLinear -->
            <div class="group-open" data-bind="css: {'show-context': showContextMenu },style: { backgroundColor: color }, click: click, event: { contextmenu: rightClick }, requireAuth: {resource: 'Parameters', enableInteractionIf: 'Read'} ">
            <div data-bind="replaceHTML: image().open"></div>
            <div class="drag-area" data-bind=" drag: dragGroupConfig(), requireAuth: { resource: 'Tasks', enableEventsIf: 'ReadWrite' } ">
            </div>
            <div class="badges">
            <!-- ko if: !configured() -->
        <div class="badge badge-unconfigured" data-bind="style: { backgroundColor: color }">          <!-- ko if: !linkable() && !linked() && !currentSource() && !showContextMenu() -->      <div class="badge badge-overlay"></div>
            <!-- /ko -->
            </div>
            <!-- /ko -->
            <!-- ko if: linkable() || linked() || currentSource() -->
            <div class="badge badge-source" data-bind="style: { backgroundColor: color }">
            </div>
            <!-- /ko -->
            </div>
            </div>
            <!-- /ko -->
            <!-- ko if: showContextMenu() -->
            <one-context-menu data-bind="  maxHeightTo: { selector: 'one-timeline', offset: -settings.scrollBar.height }" params="  controller: controller,  model: model,  requestClose: contextMenuRequestClose">
            </one-context-menu>
            <!-- /ko -->
            <!-- ko if: containers().length == 1 -->
            <div class="group-label" data-bind="text: dragging() ? null : name, drag: dragGroupConfig(),    attr: {title: dragging() ? null : name}, requireAuth: { resource: 'Tasks', enableEventsIf: 'ReadWrite'} ">
            </div>
            <!-- /ko -->
            <!-- TODO: untested with multiple containers! -->
            <div class="group-body" data-bind="  foreach: containers,  visible: !dragging()">
            <div class="background" data-bind="    css: { 'show-context': $component.showContextMenu(), linear: $component.isLinear },    style: { backgroundColor: $component.color() },    click: $component.click, clickBubble: false  ">
            </div>
            <div class="container" data-bind="css: { inline: $component.containers().length > 1 }  ">
            <one-container params="controller: $component.controller, model: $data, elementClicked: $component.clicked, elementRightClicked: $component.rightClicked,      contextMenuRequestClose: $component.contextMenuRequestClose,dropZonesEnabled: $component.dropZonesEnabled">
            </one-container>
            </div>
            </div>
            <!-- ko ifnot: isLinear -->
            <div class="group-close" data-bind="css: { 'show-context': showContextMenu },style: { backgroundColor: color }, drag: dragGroupConfig(), requireAuth: {resource: 'Tasks',      enableEventsIf: 'ReadWrite'}">
            <div data-bind="replaceHTML: image().close"></div>
            </div>
            <!-- /ko --><!-- ko if: isLastError -->
            <one-error-badge params=" com: controller.com, execution: controller.execution  ">
            </one-error-badge>
            <!-- /ko -->
            </div>";

/***/ }),

/* 159 ErrorBadge component*/
/***/ (function(module, exports, __webpack_require__) {

var ErrorBadge = __webpack_require__(160)
var template = __webpack_require__(161)
var style = __webpack_require__(162)

module.exports = {
  viewModel: {
    createViewModel: function(params) {
      return new ErrorBadge(params)
    }
  },
  template: "<style scoped>" + style + "</style>" + template
}


/***/ }),
/* 160 ErrorBadge viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = ErrorBadge

var assert = __webpack_require__(7)

var ko = __webpack_require__(1)
var _ = __webpack_require__(0)

function ErrorBadge(params) {
  assert.keys(params, "com", "execution")

  this.errorMessage = ko.pureComputed(function() {
    return params.execution().error || "Unknown"
  })

  this.continueExecution = function() {
    params.com.continueExecution()
    return true
  }

  this.restartGroup = function() {
    params.com.restartExecution(this.groupPath())
    return true
  }

  this.restartContainer = function() {
    params.com.restartExecution(this.containerPath())
    return true
  }

  this.showGroup = ko.pureComputed(function() {
    return this.groupPath() !== undefined
  }, this)

  this.showContainer = ko.pureComputed(function() {
    return this.containerPath() !== undefined
  }, this)

  this.groupPath = ko.pureComputed(function() {
    return getRestartPath(params.execution(), 2)
  }, this)

  this.containerPath = ko.pureComputed(function() {
    return getRestartPath(params.execution(), 1)
  }, this)

  function getRestartPath(currentExecution, pathOffset) {
    if (currentExecution.errorHandling) {
      var currentPathLength = currentExecution.lastActivePath.indices.length
      if (currentPathLength % 2 === 0) {
        var paths = _.filter(currentExecution.restartPaths, function(p) {
          return p.indices.length + pathOffset === currentPathLength
        })
        if (paths.length === 1) {
          return paths[0]
        }
      }
    }
  }
}


/***/ }),
/* 161 ErrorBadge template*/
/***/ (function(module, exports) {

module.exports = "<div class="error-window">
        <div class="error-row">
            <button class="play-button success highlight" data-bind="    click: continueExecution,    requireAuth: {      resource: 'Execution',      displayIf: 'ReadWrite'    }  ">
            <i class="fi-play"></i>
            </button>
            <span class="error-text" data-bind="text: errorMessage,requireAuth: {resource: 'Status',      displayIf: 'Read', } ">
            </span>
            </div>
            <!-- ko if : showContainer() || showGroup() -->
            <div class="error-row">
            <button class="button" data-bind="style: { visibility: showContainer() ? 'visible' : 'hidden' },click: restartContainer, requireAuth: { resource: 'Execution', displayIf: 'ReadWrite'} ">
            <span>Restart Container</span>
        </button>
        <button class="button" data-bind="style: { visibility: showGroup() ? 'visible' : 'hidden' },    click: restartGroup,requireAuth: {resource: 'Execution',      displayIf: 'ReadWrite'}  ">
            <span>Restart Group</span>
        </button>
        </div><!-- /ko -->
        </div>";

/***/ }),
/* 162 ErrorBadge style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/* 163 selectionMenu component 对象*/
/***/ (function(module, exports, __webpack_require__) {

var SelectionMenu = __webpack_require__(164)
var css = __webpack_require__(165)
var template = __webpack_require__(166)

module.exports = {
  template: "<style scoped>" + css + "</style>" + template,
  viewModel: SelectionMenu
}


/***/ }),
/* 164  selectionMenu viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = SelectionMenu

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var assert = __webpack_require__(7)
var selectionHandler = __webpack_require__(47)
var SkillElement = __webpack_require__(18)

function SelectionMenu(params) {
  assert.keys(params, "elements", "selectedElements", "com")
  this.selectedElements = params.selectedElements
  this.com = params.com
  this.elements = params.elements

  this.isVisible = ko.pureComputed(function() {
    return params.selectedElements().length > 0
  })

  this.showEnable = ko.pureComputed(function() {
    return _.any(params.selectedElements(), function(el) { return el instanceof SkillElement  && !el.enabled() })
  })

  this.showDisable = ko.pureComputed(function() {
    return _.any(params.selectedElements(), function(el) { return el instanceof SkillElement  && el.enabled() })
  })

  this.showRename = ko.pureComputed(function() {
    return params.selectedElements().length === 1
  })

  // Add click listener on body to close menu if user clicked any other element.
  // It's important to not add this listener on document: in Firefox,
  // directly after the contextmenu event, also a click event is sent.
  document.body.addEventListener("click", this.close.bind(this))
}

SelectionMenu.prototype.close = function() {
  this.selectedElements([])
}

SelectionMenu.prototype.preventClose = function(data, event) {
  // Don't close menu when clicking anywhere in the menu
  event.stopPropagation()
}

SelectionMenu.prototype.enable = function() {
  selectionHandler.enable(this.selectedElements, this.com)
}

SelectionMenu.prototype.disable = function() {
  selectionHandler.disable(this.selectedElements, this.com)
}

SelectionMenu.prototype.remove = function() {
  selectionHandler.remove(this.selectedElements, this.com)
}

SelectionMenu.prototype.invert = function() {
  this.selectedElements(selectionHandler.invert(this.selectedElements, this.elements))
}

SelectionMenu.prototype.selectAll = function() {
  this.selectedElements(selectionHandler.selectAll(this.elements))
}

SelectionMenu.prototype.rename = function() {
  selectionHandler.rename(_.first(this.selectedElements()), this.com)
  this.selectedElements([])
}



/***/ }),
/* 165  selectionMenu style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 166 selectionMenu template*/
/***/ (function(module, exports) {

module.exports = "<div class= "body " data-bind= " click: preventClose, visible: isVisible ">
        <div class= "option " data-bind= "   click: enable,   css: { disabled: !showEnable(),   }  ">
            <i class= "fi-plus "></i>
            <span>Enable</span>
            </div>
            <div class= "option " data-bind= "   click: disable,   css: {disabled: !showDisable(),   }  ">
            <i class= "fi-minus "></i>
            <span>Disable</span>
            </div>
            <div class= "option " data-bind= "   click: remove  ">
            <i class= "fi-trash "></i>
            <span>Delete</span>
            </div>
            <div class= "option " data-bind= "   click: rename, css: {disabled: !showRename()}  ">
            <i class= "fi-pencil "></i>
            <span>Rename</span>
            </div>
            <div class= "option " data-bind= "   click: invert  ">
            <i class= "fi-arrows-out "></i>
            <span>Select Others</span>
        </div>
        <div class= "option " data-bind= "   click: selectAll  ">
            <i class= "fi-thumbnails "></i>
            <span>Select All</span>
        </div>
        </div>";

/***/ }),

/* 167  timeline viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = Timeline

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

__webpack_require__(46)(ko)

var assert = __webpack_require__(7)
var auth = __webpack_require__(12)
var settings = __webpack_require__(11)
var selectionHandler = __webpack_require__(47)
var GroupElement = __webpack_require__(25)
var LibraryItem = __webpack_require__(43)
var SkillElement = __webpack_require__(18)
var dialogs = __webpack_require__(8)

/**
 * @class
 * @memberof module:components/workspace/timeline
 */
function Timeline(params) {
  assert.keys(params, "controller", "timeline")
  this.settings = settings
  this.controller = params.controller
  this.model = ko.unwrap(params.timeline)
  this.id = this.model.id
  this.name = this.model.name
  this.containers = this.model.containers
  this.focusedElement = this.model.focusedElement
  this.focused = this.model.focused
  this.showContextMenu = this.model.showContextMenu
  this.contextMenuElement = this.model.contextMenuElement
  this.selectedElements = this.model.selectedElements
  this.selectionMenuElement = this.model.selectionMenuElement
  this.type = "timeline"

  this.dropZonesEnabled = ko.wrap(params.dropZonesEnabled, true)
  this.mode = params.mode

  this.elements = ko.pureComputed(function() {
    var container = _.first(this.model.containers())
    return container && container.elements() || []
  }, this)
  this.contextMenuOpen = ko.pureComputed(function() { return !!this.contextMenuElement() }, this)

  this.dropZones = []

  // Subscribe to navigation events
  var self = this
  var events = ["circle", "cross", "left", "up", "right", "down"]
  this.subs = _.map(events, function(name) {
    var onName = "on" + name[0].toUpperCase() + name.slice(1)
    if (this.controller.navEvents[onName]) {
      return this.controller.navEvents[onName](self[onName].bind(self))
    }
  }, this)

  var uiEvents = this.controller.uiEvents
  this.subs.push(uiEvents.onDropZoneCreated(this.registerDropZone.bind(this)))
  this.subs.push(uiEvents.onDropZoneDisposed(this.unregisterDropZone.bind(this)))
  this.subs.push(uiEvents.onLibraryItemDragEnd(this.onDragEnd.bind(this)))
  this.subs.push(uiEvents.onTimelineElementDragEnd(this.onDragEnd.bind(this)))
  this.subs.push(uiEvents.onLibraryItemDrag(this.onDrag.bind(this)))
  this.subs.push(uiEvents.onTimelineElementDrag(this.onDrag.bind(this)))
  this.subs.push(uiEvents.onTimelineElementDragStart(this.onDragStart.bind(this)))

  this.currentSource = ko.observable(false)
  this.linkable = ko.observable(false)
  this.linkingSource = ko.observable() // Holds a source while linking and if linkable
  var componentSinkEvents = this.controller.componentSinkEvents
  this.subs.push(componentSinkEvents.onCurrentComponentProvider(function(cp) {
    this.currentSource(cp && _.eq(cp.sourcePath, this.model.path()))
  }.bind(this)))
  this.subs.push(componentSinkEvents.onLinkableComponentSources(function(source) {
    var linkable = source && source.isSource(this.model.path())
    this.linkable(linkable)
    this.linkingSource(linkable ? source : null)
  }.bind(this)))

  // Highlight the arrows 'cancel' and 'continue' on the pilot.
  this.subs.push(ko.computed(this.updatePilotLegend, this))

  this.subs.push(this.mode.subscribe(function(value) {
    if (value === "work" && this.focusedElement()) {
      this.focusedElement(null)
    }
    if (value !== "teach" && this.contextMenuElement()) {
      this.contextMenuElement(null)
    }
  }, this))

  _.bindAll(this, "acceptDrop", "onDrop")
}

Timeline.prototype.dispose = function() {
  this.controller.pilot.colorsOff()
  _.invoke(this.subs, "dispose")
}

Timeline.prototype.labelClicked = function() {
  if (this.linkingSource()) {
    this.linkingSource().callback(this.model.path())
  } else {
    this.elementClicked(this.model)
  }
}

Timeline.prototype.elementClicked = function(element, ev) {
  if ((element instanceof SkillElement || element instanceof GroupElement) && this.selectedElements().length > 0) {
    // Don't close seletion-menu when left-clicking other elements
    ev.stopPropagation()
    this.onSelect(element)
  } else if (this.mode() === "teach" && this.contextMenuElement() === element) {
    this.contextMenuElement(null)
    this.mode("program")
  } else if (this.mode() !== "work") {
    this.contextMenuElement(element)
    this.mode("teach")
  }
}

Timeline.prototype.elementRightClicked = function(element) {
  if ((this.mode() === "program" || this.mode() === "teach") && !this.contextMenuElement()) {
    this.onSelect(element)
  }
}

Timeline.prototype.onSelect = function(element) {
  if (auth.hasResourcePermission("Tasks", "ReadWrite")) {
    this.selectedElements(selectionHandler.toggleSelection(this.selectedElements(), element))
    this.selectionMenuElement(element)
  }
}

Timeline.prototype.contextMenuRequestClose = function(nextPath) {
  var nextElement = this.model.getElementAtPath(nextPath)
  if (nextElement) {
    this.contextMenuElement(nextElement)
  } else {
    this.mode("program")
  }
}

// Drag & drop functions

Timeline.prototype.registerDropZone = function(dropZone, element) {
  this.dropZones.push({viewmodel: dropZone, element: element})
}

Timeline.prototype.unregisterDropZone = function(dropZone) {
  _.remove(this.dropZones, {viewmodel: dropZone})
}

Timeline.prototype.onDragStart = function() {
  this.contextMenuElement(null)
  this.mode("program")
}

Timeline.prototype.onDrag = function(dragged, event) {
  this.selectedElements([])

  if (!this.dropZonesEnabled()) {
    _.each(this.dropZones, hideDropZone)
    return
  }
  var min = 250 // px
  var x = event.clientX !== undefined ? event.clientX : event.originalEvent.touches[0].clientX
  var y = event.clientY !== undefined ? event.clientY : event.originalEvent.touches[0].clientY
  this.closestDropZone = undefined
  _.each(this.dropZones, function(entry) {
    var rect = entry.element.getBoundingClientRect()
    var d = Math.sqrt(Math.pow(rect.left - x, 2) +
                      Math.pow(rect.top - y, 2))
    if (d < min) {
      min = d
      this.closestDropZone = entry
    }
  }, this)
  if (this.closestDropZone) {
    this.closestDropZone.viewmodel.color(ko.unwrap(dragged.color))
    this.closestDropZone.viewmodel.visible(true)
  }
  _.each(_.without(this.dropZones, this.closestDropZone), hideDropZone)
}

function hideDropZone(entry) {
  entry.viewmodel.visible(false)
  entry.viewmodel.color(settings.dropZone.color)
}

Timeline.prototype.acceptDrop = function(dragged, event) {
  if (!this.closestDropZone) {
    if (!(dragged instanceof LibraryItem)) {
      return false
    }
    var x = event.clientX
    var y = event.clientY
    var r = document.querySelector("one-timeline").getBoundingClientRect()
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  }
  return true
}

Timeline.prototype.onDrop = function(dragged) {
  if (this.closestDropZone) {
    // TODO: drop-zones not really needed anymore!?
    this.closestDropZone.viewmodel.drop(dragged)
    return true
  } else {
    dragged.appendElement()
  }
}

Timeline.prototype.onDragEnd = function() {
  _.each(this.dropZones, hideDropZone)
}

// Timeline program controls function
Timeline.prototype.handleDelete = function() {
  var self = this
  dialogs.showYesNoDialog("Delete the task <b>" + ko.unwrap(this.name) + "</b>?", function() {
    self.controller.com.deleteTimeline(self.id)
  })
}

Timeline.prototype.handleSave = function() {
  var self = this
  var text = "Save task <b>" + ko.unwrap(this.name) + "</b> as"
  dialogs.showTextDialog(text, ko.unwrap(this.name) + " 2", function(name) {
    self.controller.com.copyTimeline(self.id, name)
    .then(function() {
      return self.controller.withTimeline({ name: name })
    }).then(function(timeline) {
      return self.controller.reloadTimeline(timeline)
    }).catch(function(e) {
      self.controller.uiEvents.notifyLogError("Failed to save task: " + JSON.stringify(e))
    })
  })
}

// Navigation functions

Timeline.prototype.onCircle = function() {
  var focusedElement = this.focusedElement()
  if (!focusedElement) {
    return false
  } else if (this.selectedElements().length > 0) {
    this.onSelect(focusedElement)
    return true
  }
  this.contextMenuElement(focusedElement)
  this.mode("teach")
  return true
}

Timeline.prototype.onCross = function() {
  var contextMenuElement = this.contextMenuElement()
  if (contextMenuElement) {
    this.contextMenuElement(null)
    return true
  }
  var focusedElement = this.focusedElement()
  if (focusedElement) {
    this.focusedElement(null)
    return true
  }
}

function findRightMostFocusableLeaf(element) {
  function focusable(element) {
    return element instanceof GroupElement || element instanceof SkillElement
  }
  var result
  var children = element && (element.containers || element.elements)
  if (children) {
    var lastChild = _.last(children())
    result = lastChild && findRightMostFocusableLeaf(lastChild)
  }
  return result || focusable(element) && element
}

Timeline.prototype.onLeft = function() {
  if (this.mode() === "work") {
    return false
  }
  if (this.contextMenuElement()) {
    this.contextMenuElement(null)
    return true
  }
  var focusedElement = this.focusedElement()
  if (!focusedElement) {
    this.focusFirst()
    return true
  }
  // Focus deepest, right-most element in left sibling
  var left = this.model.getElementAtPath(leftOf(focusedElement.path())) ||
      this.model.getElementAtPath(leftOf(containerOf(focusedElement.path())))
  if (left) {
    this.focusedElement(findRightMostFocusableLeaf(left))
    return true
  }
  // Focus parent
  var parent = this.model.getElementAtPath(parentOf(focusedElement.path()))
  if (parent) {
    this.focusedElement(parent)
  }
  return true
}

Timeline.prototype.onRight = function() {
  if (this.mode() === "work") {
    return false
  }
  var focusedElement = this.focusedElement()
  if (!focusedElement) {
    this.focusFirst()
    return true
  }
  var firstElement
  if (focusedElement instanceof GroupElement) {
    // Focus first child
    var firstContainer = _.first(focusedElement.containers())
    firstElement = firstContainer && _.first(firstContainer.elements())
    if (firstElement) {
      this.focusedElement(firstElement)
      return true
    }
  }
  // Focus right sibling
  var right = this.model.getElementAtPath(rightOf(focusedElement.path()))
  if (right) {
    this.focusedElement(right)
    return true
  }
  var rightContainer = this.model.getElementAtPath(rightOf(containerOf(focusedElement.path())))
  if (rightContainer) {
    firstElement = _.first(rightContainer.elements())
    if (firstElement) {
      this.focusedElement(firstElement)
      return true
    }
  }
  // Focus right of parent
  var path = focusedElement.path()
  while (path.indices.length > 2) {
    path = rightOf(parentOf(path))
    var rightParent = this.model.getElementAtPath(path)
    if (rightParent) {
      this.focusedElement(rightParent)
      return true
    }
  }
  return true
}

Timeline.prototype.onUp = function() {
  if (this.mode() === "work") {
    return false
  } else if (this.mode() === "teach") {
    this.mode("program")
  }
  var focusedElement = this.focusedElement()
  if (!focusedElement) {
    this.focusFirst()
    return true
  }
  // Focus parent
  var parent = this.model.getElementAtPath(parentOf(focusedElement.path()))
  var previousContainerPath = leftOf(containerOf(focusedElement.path()))
  var previousContainer = previousContainerPath && this.model.getElementAtPath(previousContainerPath)
  if (previousContainer) {
    var firstElement = _.first(previousContainer.elements())
    if (firstElement) {
      this.focusedElement(firstElement)
    }
  } else if (parent) {
    this.focusedElement(parent)
  } else {
    this.focusedElement(this.model)
  }
}

Timeline.prototype.onDown = function() {
  if (this.mode() === "work") {
    return false
  }
  var focusedElement = this.focusedElement()
  if (!focusedElement || focusedElement === this.model) {
    this.focusFirst()
    return true
  }
  var firstElement
  if (focusedElement instanceof GroupElement) {
    // Focus first child
    var firstContainer = _.first(focusedElement.containers())
    firstElement = firstContainer && _.first(firstContainer.elements())
    if (firstElement) {
      this.focusedElement(firstElement)
      return true
    }
  } else if (focusedElement instanceof SkillElement) {
    var parent = this.model.getElementAtPath(parentOf(focusedElement.path()))
    if (parent instanceof GroupElement) {
      var nextContainerPath = rightOf(containerOf(focusedElement.path()))
      var nextContainer = nextContainerPath && this.model.getElementAtPath(nextContainerPath)
      firstElement = nextContainer && _.first(nextContainer.elements())
      if (firstElement) {
        this.focusedElement(firstElement)
        return true
      }
    }
  }
  return true
}

Timeline.prototype.focusFirst = function() {
  var firstElement = _.first(_.first(this.model.containers()).elements())
  if (firstElement) {
    this.focusedElement(firstElement)
  } else {
    this.focusedElement(null)
  }
}

Timeline.prototype.updatePilotLegend = function() {
  function hasRight(path, timeline) {
    if (path.indices.length > 0) {
      if (timeline.getElementAtPath(rightOf(path))) {
        return true
      } else {
        var element = timeline.getElementAtPath(path)
        if (element instanceof GroupElement && element.containers().length > 0) {
          return true
        }
      }
      return hasRight(rightOf(parentOf(path)), timeline)
    }  else {
      return false
    }
  }
  // Do not update when context menu open
  if (this.contextMenuElement()) {
    return
  }
  var config = { center: { color: "white" } }
  var focusedElement = this.focusedElement()
  if (this.elements().length > 0) {
    if (!focusedElement) {
      config.up = { color: "white" }
      config.down = { color: "white" }
      config.left = { color: "white" }
      config.right = { color: "white" }
    } else {
      ko.ignoreDependencies(function() {
        if (focusedElement.path().indices.length > 1) {
          config.up = { color: "white" }
        }
        if (focusedElement === this.model ||
            (focusedElement instanceof GroupElement &&
            focusedElement.containers().length > 0 &&
            _.some(focusedElement.containers(), function(c) { return c.elements().length > 0 }))) {
          config.down = { color: "white" }
        }
        if (!_.isEqual(focusedElement.path().indices, []) && !_.isEqual(focusedElement.path().indices, [0, 0])) {
          config.left = { color: "white" }
        }
        if (hasRight(focusedElement.path(), this.model)) {
          config.right = { color: "white" }
        }
        config.cross = { color: "red" }
      }, this)
      config.circle = { color: "blue" }
    }
  }
  this.controller.pilot.setColors(config)
}

function copyPath(path) {
  return {id: path.id, indices: path.indices.slice()}
}

function leftOf(path) {
  var p = copyPath(path)
  p.indices[p.indices.length - 1]--
  return p
}

function rightOf(path) {
  var p = copyPath(path)
  p.indices[p.indices.length - 1]++
  return p
}

function parentOf(path) {
  var p = copyPath(path)
  p.indices.pop()
  p.indices.pop()  // container index
  return p
}

function containerOf(path) {
  var p = copyPath(path)
  p.indices.pop()
  return p
}


/***/ }),
/* 168 timeline style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 169 timeline template*/
/***/ (function(module, exports) {

module.exports = "<div class="timeline-header" data-bind="css: {'show-context': showContextMenu,   focused: focused,   link: linkable() || currentSource() }, click: labelClicked.bind($component), requireAuth: {   resource: 'Parameters',   enableInteractionIf: 'Read' }">
        "   <div class="timeline-label" data-bind="   text: name "></div>
        "   <div class="badges">
        "      <!-- ko if: linkable() || currentSource() -->
        "      <div class="badge badge-source"></div>   <!-- /ko -->
        "   </div>
        "   <!-- ko if: showContextMenu -->
        "   <one-context-menu data-bind="     maxHeightTo: { selector: 'one-timeline', offset: -settings.scrollBar.height }   " params="     controller: controller,     model: model,     requestClose: contextMenuRequestClose.bind($component)   ">
        "   </one-context-menu>
        "   <!-- /ko -->
        "</div>
        "<div class="timeline-body">
        "   <div class="timeline-overlay" data-bind="   css: { visible: contextMenuOpen } ">
        "   </div>
        "   <div class="timeline" data-bind="   drop: {     group: 'element',     accept: acceptDrop,     drop: onDrop   } ">
        "      <!-- ko foreach: containers -->
        "      <one-container params="       controller: $component.controller,       model: $data,       elementClicked: $component.elementClicked.bind($component),       elementRightClicked: $component.elementRightClicked.bind($component),       contextMenuRequestClose: $component.contextMenuRequestClose.bind($component),       dropZonesEnabled: $component.dropZonesEnabled     ">
        "      </one-container>
        "      <!-- /ko -->
        "      <div style="min-width: 100vh" />
        "   </div>
        "</div>
        "<one-selection-menu params=" elements: elements, selectedElements: selectedElements, com: controller.com">
        "</one-selection-menu>";
        "<div class="timeline-header" data-bind=css: {'show-context': showContextMenu,focused: focused,link: linkable() || currentSource()}, click: labelClicked.bind($component), requireAuth: {resource: 'Parameters',enableInteractionIf: 'Read'}>
        "   <div class="timeline-label" data-bind="text: name"></div>
        "   <div class="badges">
        "        <!-- ko if: linkable() || currentSource() -->
        "        <div class="badge badge-source"></div>
        "        <!-- /ko -->
        "    </div>
        "        <!-- ko if: showContextMenu -->
        "    <one-context-menu data-bind="maxHeightTo: { selector: 'one-timeline', offset: -settings.scrollBar.height }" params="controller: controller,model: model,requestClose: contextMenuRequestClose.bind($component)">
        "    </one-context-menu>
        "        <!-- /ko -->
        "</div>";

/***/ }),

/* 170 ExecutionStatus component 对象*/
/***/ (function(module, exports, __webpack_require__) {

var ExecutionStatus = __webpack_require__(171)
var style = __webpack_require__(172)
var template = __webpack_require__(173)

module.exports = {
  template: "<style scoped>" + style + "</style>" + template,
  viewModel: ExecutionStatus
}


/***/ }),
/* 171  ExecutionStatus viewModel*/
/***/ (function(module, exports, __webpack_require__) {

module.exports = ExecutionStatus

var _ = __webpack_require__(0)
var ko = __webpack_require__(1)

var assert = __webpack_require__(7)

function ExecutionStatus(params) {
  assert.keys(params, "com", "execution")

  this.subs = []

  this.brakesOpen = ko.observable(false)
  this.userStopOpen = ko.observable(false)
  this.subs.push(params.com.onSystemStatusReceived({
    onData: function(ss) {
      this.brakesOpen(_.all(ss.brakesOpen))
      this.userStopOpen(ss.userStopOpen)
    }.bind(this)
  }))

  this.rcuErrors = ko.observable({})
  this.subs.push(params.com.onRobotStatusReceived({
    onData: function(rs) {
      this.rcuErrors(_.size(_.pick(rs.robotErrors, function (val) {return val})) > 0)
    }.bind(this)
  }))

  this.status = ko.pureComputed(function() {
    if (!this.userStopOpen()) {
      return { text: "USER-STOP CLOSED", css: "warning" }
    } else if (!this.brakesOpen()) {
      return { text: "BRAKES CLOSED", css: "warning" }
    } else if (params.execution() && params.execution().running && params.execution().errorHandling) {
      return { text: "EXECUTION ERROR", css: "error" }
    } else if (this.rcuErrors()) {
      return { text: "ROBOT ERROR", css: "error" }
    } else if (params.execution() && params.execution().running) {
      return { text: "EXECUTION RUNNING", css: "running" }
    } else {
      return { text: "", css: "" }
    }
  }, this)

  this.splitString = function(string) {
    string = string.toUpperCase()
    var m = Math.floor(string.length / 2)
    var b = string.lastIndexOf(" ", m)
    var a = string.indexOf(" ", m + 1)
    m = m - b < Math.abs(a - m) ? b : a
    return [string.substr(0, m), string.substr(m + 1)]
  }
}


/***/ }),
/* 172  ExecutionStatus style*/
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 173  ExecutionStatus template*/
/***/ (function(module, exports) {

module.exports = "<div class="execution-status" data-bind="css: status().css">" +
        "<div class="left">" +
        "<h5 data-bind="text: splitString(status().text)[0]" />" +
        "</div>" +
        "<div>" +
        "<h5 data-bind="text: splitString(status().text)[1]" />" +
        "</div>" +
        "</div>" ;

/***/ })
],[56]);