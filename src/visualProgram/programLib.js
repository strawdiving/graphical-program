import $ from 'jquery'
import joint from 'jointjs'
// import Backbone from 'backbone'

let V = joint.V,
    g = joint.g;

joint.dia.Element.define('logic.If', {
  optionHeight: 30,
  questionHeight: 40,
  paddingBottom: 30,
  minWidth: 100,
  inPorts: [],
  outPorts: [],
  attrs: {
    '.': {
      magnet: false
    },
    '.body': {
      refWidth: '100%',
      refHeight: '100%',
      rx: '1%',
      ry: '2%',
      stroke: 'none',
      fill: {
        type: 'linearGradient',
        stops: [
          { offset: '0%', color: '#FEB663' },
          { offset: '80%', color: '#31D0C6' },
          { offset: '100%', color: '#FEB663' }
        ],
        // Top-to-bottom gradient.
        attrs: { x1: '0%', y1: '0%', x2: '0%', y2: '80%' ,x3: '0%', y3: '100%'}
      }
    },
    // '.btn-add-option': {
    //     refX: 10,
    //     refDy: -50,
    //     cursor: 'pointer',
    //     fill: 'white'
    // },
    '.btn-remove-option': {
      xAlignment: 10,
      yAlignment: 13,
      cursor: 'pointer',
      fill: 'white'
    },
    '.options': {
      refX: 0
    },
    '.end-rect': {
      rx: 3,
      ry: 3,
      refDy: -30,
      stroke: 'white',
      strokeWidth: 1,
      strokeOpacity: .8,
      fillOpacity: 0,
      fill: 'white',
      refWidth: '100%',
      height: 30
    },

    // Text styling.
    text: {
      fontFamily: 'Arial'
    },
    '.option-text': {
      fontSize: 11,
      fill: '#4b4a67',
      refX: 30,
      yAlignment: 'middle'
    },
    '.end-text': {
      fontSize: 14,
      fontWeight: 'Bold',
      fill: 'white',
      textAnchor: 'middle',
      refX: '50%',
      refDy: -18,
      yAlignment: 'middle'
    },
    '.question-text': {
      fill: 'white',
      refX: '50%',
      refY: 15,
      fontSize: 15,
      textAnchor: 'middle',
      style: {
        textShadow: '1px 1px 0px gray'
      }
    },

    // Options styling.
    '.option-rect': {
      rx: 3,
      ry: 3,
      stroke: 'white',
      strokeWidth: 1,
      strokeOpacity: .5,
      fillOpacity: .5,
      fill: 'white',
      refWidth: '100%'
    }
  },
  ports: {
    groups: {
      'in': {
        position: 'top',
        attrs: {
          circle: {
            magnet: 'passive',
            stroke: 'white',
            fill: '#feb663',
            r: 8
          },
          text: {
            pointerEvents: 'none',
            fontSize: 12,
            fill: 'white'
          }
        },
        label: {
          position: {
            name: 'left',
            args: { x: 5 }
          }
        }
      },
      out: {
        position: 'right',
        attrs: {
          'circle': {
            magnet: true,
            stroke: 'none',
            fill: '#31d0c6',
            r: 8
          }
        }
      },
      end: {
        position: 'bottom',
        attrs: {
          'circle': {
            magnet: true,
            stroke: 'white',
            fill: '#feb663',
            r: 8
          }
        }
      }
    },
    items: [{
      group: 'in',
      attrs: {text: { text: 'in' }}
    },
      {group: 'end'}]
  }
}, {
  markup: '<rect class="body"/><text class="question-text"/><g class="options"></g><rect class="end-rect"/><text class="end-text">End</text>',
  optionMarkup: '<g class="option"><rect class="option-rect"/><path class="btn-remove-option" d="M0,0 15,0 15,5 0,5z"/><text class="option-text"/></g>',

  initialize: function() {

    joint.dia.Element.prototype.initialize.apply(this, arguments);

    this.on('change:options', this.onChangeOptions, this);
    this.on('change:question', function() {
      this.attr('.question-text/text', this.get('question') || '');
      this.autoresize();
    }, this);

    this.on('change:questionHeight', function() {
      this.attr('.options/refY', this.get('questionHeight'), { silent: true });
      this.autoresize();
    }, this);

    this.on('change:optionHeight', this.autoresize, this);

    this.attr('.options/refY', this.get('questionHeight'), { silent: true });
    this.attr('.question-text/text', this.get('question'), { silent: true });

    this.onChangeOptions();
  },

  onChangeOptions: function() {

    var options = this.get('options');
    var optionHeight = this.get('optionHeight');

    // First clean up the previously set attrs for the old options object.
    // We mark every new attribute object with the `dynamic` flag set to `true`.
    // This is how we recognize previously set attributes.
    var attrs = this.get('attrs');
    _.each(attrs, function(attrs, selector) {

      if (attrs.dynamic) {
        // Remove silently because we're going to update `attrs`
        // later in this method anyway.
        this.removeAttr(selector, { silent: true });
      }
    }, this);

    // Collect new attrs for the new options.
    var offsetY = 0;
    var attrsUpdate = {};
    var questionHeight = this.get('questionHeight');

    _.each(options, function(option) {

      var selector = '.option-' + option.id;

      attrsUpdate[selector] = { transform: 'translate(0, ' + offsetY + ')', dynamic: true };
      attrsUpdate[selector + ' .option-rect'] = { height: optionHeight, dynamic: true };
      attrsUpdate[selector + ' .option-text'] = { text: option.text, dynamic: true, refY: optionHeight / 2};

      offsetY += optionHeight;

      var portY = offsetY - optionHeight / 2 + questionHeight;
      var portX ;
      if (!this.getPort(option.id)) {
        if(option.id === 'yes')  {portX = 0;}
        this.addPort({ group: 'out', id: option.id, args: { x:portX, y: portY } });
      } else {
        this.portProp(option.id, 'args/y', portY);
      }
    }, this);

    this.attr(attrsUpdate);
    this.autoresize();
  },

  autoresize: function() {

    var options = this.get('options') || [];
    var gap = this.get('paddingBottom') || 20;
    var height = options.length * this.get('optionHeight') + this.get('questionHeight') + gap;
    var width = joint.util.measureText(this.get('question'), {
      fontSize: this.attr('.question-text/fontSize')
    }).width;
    this.resize(Math.max(this.get('minWidth') || 150, width), height);
  },

  addOption: function(option) {

    var options = JSON.parse(JSON.stringify(this.get('options')));
    options.push(option);
    this.set('options', options);
  },

  removeOption: function(id) {
    // var options = JSON.parse(JSON.stringify(this.get('options')));
    // this.removePort(id);
    // this.set('options', _.without(options, _.findWhere(options, { id: id })));
  },

  changeOption: function(id, option) {

    if (!option.id) {
      option.id = id;
    }

    var options = JSON.parse(JSON.stringify(this.get('options')));
    options[_.findIndex(options, { id: id })] = option;
    this.set('options', options);
  }
});

joint.shapes.logic.IfView = joint.dia.ElementView.extend({

  events: {
    'click .btn-add-option': 'onAddOption',
    'click .btn-remove-option': 'onRemoveOption'
  },

  initialize: function() {

    joint.dia.ElementView.prototype.initialize.apply(this, arguments);
    this.listenTo(this.model, 'change:options', this.renderOptions, this);
  },

  renderMarkup: function() {

    joint.dia.ElementView.prototype.renderMarkup.apply(this, arguments);

    // A holder for all the options.
    this.$options = this.$('.options');
    // Create an SVG element representing one option. This element will
    // be cloned in order to create more options.
    this.elOption = V(this.model.optionMarkup);

    this.renderOptions();
  },

  renderOptions: function() {

    this.$options.empty();

    _.each(this.model.get('options'), function(option, index) {

      var className = 'option-' + option.id;
      var elOption = this.elOption.clone().addClass(className);
      elOption.attr('option-id', option.id);
      this.$options.append(elOption.node);

    }, this);

    // Apply `attrs` to the newly created SVG elements.
    this.update();
  },

  onAddOption: function() {

    this.model.addOption({
      id: _.uniqueId('option-'),
      text: 'Option ' + this.model.get('options').length
    });
  },

  onRemoveOption: function(evt) {

    this.model.removeOption(V(evt.target.parentNode).attr('option-id'));
  }
});

joint.dia.Element.define('logic.While', {
  optionHeight: 50,
  questionHeight: 40,
  paddingBottom: 30,
  minWidth: 100,
  inPorts: [],
  outPorts: [],
  attrs: {
    '.': {
      magnet: false
    },
    '.body': {
      refWidth: '100%',
      refHeight: '100%',
      rx: '1%',
      ry: '2%',
      stroke: 'none',
      fill: {
        type: 'linearGradient',
        stops: [
          { offset: '0%', color: '#FEB663' },
          { offset: '80%', color: '#31D0C6' },
          { offset: '100%', color: '#FEB663' }
        ],
        // Top-to-bottom gradient.
        attrs: { x1: '0%', y1: '0%', x2: '0%', y2: '80%' ,x3: '0%', y3: '100%'}
      }
    },
    // '.btn-add-option': {
    //     refX: 10,
    //     refDy: -50,
    //     cursor: 'pointer',
    //     fill: 'white'
    // },
    '.options': {
      refX: 0
    },
    '.end-rect': {
      rx: 3,
      ry: 3,
      refDy: -30,
      stroke: 'white',
      strokeWidth: 1,
      strokeOpacity: .8,
      fillOpacity: 0,
      fill: 'white',
      refWidth: '100%',
      height: 30
    },

    // Text styling.
    text: {
      fontFamily: 'Arial'
    },
    '.option-text': {
      fontSize: 11,
      fill: '#4b4a67',
      refX: 15,
      yAlignment: 'middle'
    },
    '.end-text': {
      fontSize: 14,
      fontWeight: 'Bold',
      fill: 'white',
      textAnchor: 'middle',
      refX: '50%',
      refDy: -18,
      yAlignment: 'middle'
    },
    '.question-text': {
      fill: 'white',
      refX: '50%',
      refY: 15,
      fontSize: 15,
      textAnchor: 'middle',
      style: {
        textShadow: '1px 1px 0px gray'
      }
    },

    // Options styling.
    '.option-rect': {
      rx: 3,
      ry: 3,
      stroke: 'white',
      strokeWidth: 1,
      strokeOpacity: .5,
      fillOpacity: .5,
      fill: 'white',
      refWidth: '100%'
    }
  },
  ports: {
    groups: {
      'in': {
        position: 'top',
        attrs: {
          circle: {
            magnet: 'passive',
            stroke: 'white',
            fill: '#feb663',
            r: 8
          },
          text: {
            pointerEvents: 'none',
            fontSize: 12,
            fill: 'white'
          }
        },
        label: {
          position: {
            name: 'left',
            args: { x: 5 }
          }
        }
      },
      out: {
        position: 'right',
        attrs: {
          'circle': {
            magnet: true,
            stroke: 'none',
            fill: '#31d0c6',
            r: 8
          }
        }
      },
      end: {
        position: 'bottom',
        attrs: {
          'circle': {
            magnet: true,
            stroke: 'white',
            fill: '#feb663',
            r: 8
          }
        }
      }
    },
    items: [{
      group: 'in',
      attrs: {
        text: { text: 'in' }
      }
    },
      {
        group: 'end'
      }]
  }
}, {
  markup: '<rect class="body"/><text class="question-text"/><g class="options"></g><rect class="end-rect"/><text class="end-text">End</text>',
  optionMarkup: '<g class="option"><rect class="option-rect"/><text class="option-text"/></g>',

  initialize: function() {

    joint.dia.Element.prototype.initialize.apply(this, arguments);

    this.on('change:options', this.onChangeOptions, this);
    this.on('change:question', function() {
      this.attr('.question-text/text', this.get('question') || '');
      this.autoresize();
    }, this);

    this.on('change:questionHeight', function() {
      this.attr('.options/refY', this.get('questionHeight'), { silent: true });
      this.autoresize();
    }, this);

    this.on('change:optionHeight', this.autoresize, this);

    this.attr('.options/refY', this.get('questionHeight'), { silent: true });
    this.attr('.question-text/text', this.get('question'), { silent: true });

    this.onChangeOptions();
  },

  onChangeOptions: function() {

    var options = this.get('options');
    var optionHeight = this.get('optionHeight');

    // First clean up the previously set attrs for the old options object.
    // We mark every new attribute object with the `dynamic` flag set to `true`.
    // This is how we recognize previously set attributes.
    var attrs = this.get('attrs');
    _.each(attrs, function(attrs, selector) {

      if (attrs.dynamic) {
        // Remove silently because we're going to update `attrs`
        // later in this method anyway.
        this.removeAttr(selector, { silent: true });
      }
    }, this);

    // Collect new attrs for the new options.
    var offsetY = 0;
    var attrsUpdate = {};
    var questionHeight = this.get('questionHeight');

    _.each(options, function(option) {

      var selector = '.option-' + option.id;

      attrsUpdate[selector] = { transform: 'translate(0, ' + offsetY + ')', dynamic: true };
      attrsUpdate[selector + ' .option-rect'] = { height: optionHeight, dynamic: true };
      attrsUpdate[selector + ' .option-text'] = { text: option.text, dynamic: true, refY: optionHeight / 2};

      offsetY += optionHeight;

      var portY = offsetY - optionHeight / 2 + questionHeight;
      var portX ;
      if (!this.getPort(option.id)) {
        if(option.id === 'yes')  {portX = 0;}
        this.addPort({ group: 'out', id: option.id, args: { x:portX, y: portY } });
      } else {
        this.portProp(option.id, 'args/y', portY);
      }
    }, this);

    this.attr(attrsUpdate);
    this.autoresize();
  },

  autoresize: function() {
    var options = this.get('options') || [];
    var gap = this.get('paddingBottom') || 20;
    var height = options.length * this.get('optionHeight') + this.get('questionHeight') + gap;
    var width = joint.util.measureText(this.get('question'), {
      fontSize: this.attr('.question-text/fontSize')
    }).width;
    this.resize(Math.max(this.get('minWidth') || 150, width), height);
  },

  addOption: function(option) {

    var options = JSON.parse(JSON.stringify(this.get('options')));
    options.push(option);
    this.set('options', options);
  },

  removeOption: function(id) {

    // var options = JSON.parse(JSON.stringify(this.get('options')));
    // this.removePort(id);
    // this.set('options', _.without(options, _.findWhere(options, { id: id })));
    // var graph = new joint.dia.Graph;
    // var paper = new joint.dia.Paper({ width: 400, height: 200, model: graph, gridSize: 1 });

    // (new joint.ui.Dialog({
    //     width: 420,
    //     draggable: true,
    //     title: 'A dialog box with a diagram',
    //     content: paper.$el
    // })).open();

    // (new joint.shapes.basic.Rect({
    //     id: 'a',
    //     position: { x: 20, y: 20 },
    //     size: { width: 80, height: 40 },
    //     attrs: { text: { text: 'A' } }
    // })).addTo(graph);
    //
    // (new joint.shapes.basic.Rect({
    //     id: 'b',
    //     position: { x: 200, y: 20 },
    //     size: { width: 80, height: 40 },
    //     attrs: { text: { text: 'B' } }
    // })).addTo(graph);
    //
    // (new joint.shapes.basic.Rect({
    //     id: 'c',
    //     position: { x: 200, y: 150 },
    //     size: { width: 80, height: 40 },
    //     attrs: { text: { text: 'C' } }
    // })).addTo(graph);
    //
    // (new joint.dia.Link({
    //     source: { id: 'a' },
    //     target: { id: 'b' },
    //     attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' } }
    // })).addTo(graph);
    //
    // (new joint.dia.Link({
    //     source: { id: 'c' },
    //     target: { id: 'b' },
    //     attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' } }
    // })).addTo(graph);
  },

  changeOption: function(id, option) {

    if (!option.id) {
      option.id = id;
    }

    var options = JSON.parse(JSON.stringify(this.get('options')));
    options[_.findIndex(options, { id: id })] = option;
    this.set('options', options);
  }
});

joint.shapes.logic.WhileView = joint.dia.ElementView.extend({

  events: {
    'click .btn-add-option': 'onAddOption',
    'click .btn-remove-option': 'onRemoveOption'
  },

  initialize: function() {

    joint.dia.ElementView.prototype.initialize.apply(this, arguments);
    this.listenTo(this.model, 'change:options', this.renderOptions, this);
  },

  renderMarkup: function() {

    joint.dia.ElementView.prototype.renderMarkup.apply(this, arguments);

    // A holder for all the options.
    this.$options = this.$('.options');
    // Create an SVG element representing one option. This element will
    // be cloned in order to create more options.
    this.elOption = V(this.model.optionMarkup);

    this.renderOptions();
  },

  renderOptions: function() {

    this.$options.empty();

    _.each(this.model.get('options'), function(option, index) {

      var className = 'option-' + option.id;
      var elOption = this.elOption.clone().addClass(className);
      elOption.attr('option-id', option.id);
      this.$options.append(elOption.node);

    }, this);

    // Apply `attrs` to the newly created SVG elements.
    this.update();
  },

  onAddOption: function() {

    this.model.addOption({
      id: _.uniqueId('option-'),
      text: 'Option ' + this.model.get('options').length
    });
  },

  onRemoveOption: function(evt) {

    this.model.removeOption(V(evt.target.parentNode).attr('option-id'));
  }
});

joint.util.measureText = function (text, attrs) {

  var fontSize = parseInt(attrs.fontSize, 10) || 10;

  var svgDocument = V('svg').node;
  var textElement = V('<text><tspan></tspan></text>').node;
  var textSpan = textElement.firstChild;
  var textNode = document.createTextNode('');

  textSpan.appendChild(textNode);
  svgDocument.appendChild(textElement);
  document.body.appendChild(svgDocument);

  var lines = text.split('\n');
  var width = 0;

  // Find the longest line width.
  _.each(lines, function (line) {

    textNode.data = line;
    var lineWidth = textSpan.getComputedTextLength();

    width = Math.max(width, lineWidth);
  });

  var height = lines.length * (fontSize * 1.2);

  V(svgDocument).remove();

  return {width: width, height: height};
};

joint.shapes.basic.Ellipse.define('state.Start', {
  size: {width: 60, height: 36},
  attrs: {
    '.': {
      'data-tooltip': 'Start State',
      'data-tooltip-position': 'left',
      'data-tooltip-position-selector': '.joint-stencil'
    },
    ellipse: {
      fill: "transparent",
      width: 60,
      height: 36,
      "stroke": "#b75d32",
      "stroke-width": 2
    },
    text: {
      text: 'Start',
      fill: '#b75d32',
      'font-family': 'Arial',
      'font-weight': 'Bold',
      'font-size': 16,
      'stroke-width': 0
    }
  }
});

joint.shapes.basic.Generic.define('basic.Rect', {
  attrs: {
    'rect': {
      fill: '#ffffff',
      stroke: '#000000',
      width: 100,
      height: 60
    },
    'text': {
      fill: '#000000',
      text: '',
      'font-size': 14,
      'ref-x': .5,
      'ref-y': .5,
      'text-anchor': 'middle',
      'y-alignment': 'middle',
      'font-family': 'Arial, helvetica, sans-serif'
    }
  }
}, {
  markup: '<g class="rotatable"><g class="scalable"><rect/></g><text/></g>'
});

joint.shapes.basic.Image.define('basic.Image', {
  attrs: {
    'text': {
      'font-size': 14,
      text: '',
      'text-anchor': 'middle',
      'ref-x': .5,
      'ref-dy': 20,
      'y-alignment': 'middle',
      fill: '#000000',
      'font-family': 'Arial, helvetica, sans-serif'
    }
  }
}, {
  markup: '<g class="rotatable"><g class="scalable"><image/></g><text/></g>',
});

joint.shapes.basic.Generic.define('basic.SVG', {
  attrs: {
    'text': {
      'font-size': 14,
      text: '',
      'text-anchor': 'middle',
      'ref-x': .5,
      'ref-dy': 20,
      'y-alignment': 'middle',
      fill: '#000000',
      'font-family': 'Arial, helvetica, sans-serif'
    }
  }
}, {
  markup: '<g class="rotatable"><g class="scalable"><image/><text/></g></g>',
});

joint.shapes.basic.SVG.define('state.Rectangle',{
  size: { width: 5, height: 3 },
  attrs: {
    'text': {
      'font-size': 20,
      text: 'state.Rectangle',
      'text-anchor': 'middle',
      'ref-x': .5,
      'ref-dy': 15,
      'y-alignment': 'middle',
      fill: '#000000',
      'font-family': 'Arial, helvetica, sans-serif'
    },
    image: {
      xlinkHref: './assets/method-draw-image.svg',
      height: 80
    }
    // 'use': {
    //     xlinkHref:'#icon-connection',
    //     width: 20,
    //     height: 5
    // }
  }
});

joint.shapes.basic.Rect.define('motionControl', {
  size: {width: 5, height: 2},
  attrs: {
    '.': {
      'data-tooltip-position': 'left',
      'data-tooltip-position-selector': '.joint-stencil'
    },
    rect: {
      fill: '#feb663',
      width: 25,
      height: 15,
      rx: 2,
      ry: 2,
      stroke: '#3c4260',
      'stroke-width': 2,
      'stroke-dasharray': '0'
    },
    text: {
      text: '',
      fill: '#3c4260',
      'font-family': 'Arial',
      'font-weight': 'Normal',
      'font-size': 12,
      'stroke-width': 0
    }
  }
});

joint.shapes.motionControl.define('motionControl.movel', {
  attrs: {
    image: {
      'xlink:href': '../static/img/image-icon2.svg'
      // xlinkHref: 'src/assets/image-icon2.svg'
      //   'xlink:href': 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgo8c3ZnCiAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyIKICAgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIgogICB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIKICAgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiCiAgIHdpZHRoPSIxMDAiCiAgIGhlaWdodD0iNTAiCiAgIGlkPSJzdmcyIgogICBzb2RpcG9kaTp2ZXJzaW9uPSIwLjMyIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIwLjQ2IgogICB2ZXJzaW9uPSIxLjAiCiAgIHNvZGlwb2RpOmRvY25hbWU9Ik5PVCBBTlNJLnN2ZyIKICAgaW5rc2NhcGU6b3V0cHV0X2V4dGVuc2lvbj0ib3JnLmlua3NjYXBlLm91dHB1dC5zdmcuaW5rc2NhcGUiPgogIDxkZWZzCiAgICAgaWQ9ImRlZnM0Ij4KICAgIDxpbmtzY2FwZTpwZXJzcGVjdGl2ZQogICAgICAgc29kaXBvZGk6dHlwZT0iaW5rc2NhcGU6cGVyc3AzZCIKICAgICAgIGlua3NjYXBlOnZwX3g9IjAgOiAxNSA6IDEiCiAgICAgICBpbmtzY2FwZTp2cF95PSIwIDogMTAwMCA6IDAiCiAgICAgICBpbmtzY2FwZTp2cF96PSI1MCA6IDE1IDogMSIKICAgICAgIGlua3NjYXBlOnBlcnNwM2Qtb3JpZ2luPSIyNSA6IDEwIDogMSIKICAgICAgIGlkPSJwZXJzcGVjdGl2ZTI3MTQiIC8+CiAgICA8aW5rc2NhcGU6cGVyc3BlY3RpdmUKICAgICAgIHNvZGlwb2RpOnR5cGU9Imlua3NjYXBlOnBlcnNwM2QiCiAgICAgICBpbmtzY2FwZTp2cF94PSIwIDogMC41IDogMSIKICAgICAgIGlua3NjYXBlOnZwX3k9IjAgOiAxMDAwIDogMCIKICAgICAgIGlua3NjYXBlOnZwX3o9IjEgOiAwLjUgOiAxIgogICAgICAgaW5rc2NhcGU6cGVyc3AzZC1vcmlnaW49IjAuNSA6IDAuMzMzMzMzMzMgOiAxIgogICAgICAgaWQ9InBlcnNwZWN0aXZlMjgwNiIgLz4KICAgIDxpbmtzY2FwZTpwZXJzcGVjdGl2ZQogICAgICAgaWQ9InBlcnNwZWN0aXZlMjgxOSIKICAgICAgIGlua3NjYXBlOnBlcnNwM2Qtb3JpZ2luPSIzNzIuMDQ3MjQgOiAzNTAuNzg3MzkgOiAxIgogICAgICAgaW5rc2NhcGU6dnBfej0iNzQ0LjA5NDQ4IDogNTI2LjE4MTA5IDogMSIKICAgICAgIGlua3NjYXBlOnZwX3k9IjAgOiAxMDAwIDogMCIKICAgICAgIGlua3NjYXBlOnZwX3g9IjAgOiA1MjYuMTgxMDkgOiAxIgogICAgICAgc29kaXBvZGk6dHlwZT0iaW5rc2NhcGU6cGVyc3AzZCIgLz4KICAgIDxpbmtzY2FwZTpwZXJzcGVjdGl2ZQogICAgICAgaWQ9InBlcnNwZWN0aXZlMjc3NyIKICAgICAgIGlua3NjYXBlOnBlcnNwM2Qtb3JpZ2luPSI3NSA6IDQwIDogMSIKICAgICAgIGlua3NjYXBlOnZwX3o9IjE1MCA6IDYwIDogMSIKICAgICAgIGlua3NjYXBlOnZwX3k9IjAgOiAxMDAwIDogMCIKICAgICAgIGlua3NjYXBlOnZwX3g9IjAgOiA2MCA6IDEiCiAgICAgICBzb2RpcG9kaTp0eXBlPSJpbmtzY2FwZTpwZXJzcDNkIiAvPgogICAgPGlua3NjYXBlOnBlcnNwZWN0aXZlCiAgICAgICBpZD0icGVyc3BlY3RpdmUzMjc1IgogICAgICAgaW5rc2NhcGU6cGVyc3AzZC1vcmlnaW49IjUwIDogMzMuMzMzMzMzIDogMSIKICAgICAgIGlua3NjYXBlOnZwX3o9IjEwMCA6IDUwIDogMSIKICAgICAgIGlua3NjYXBlOnZwX3k9IjAgOiAxMDAwIDogMCIKICAgICAgIGlua3NjYXBlOnZwX3g9IjAgOiA1MCA6IDEiCiAgICAgICBzb2RpcG9kaTp0eXBlPSJpbmtzY2FwZTpwZXJzcDNkIiAvPgogICAgPGlua3NjYXBlOnBlcnNwZWN0aXZlCiAgICAgICBpZD0icGVyc3BlY3RpdmU1NTMzIgogICAgICAgaW5rc2NhcGU6cGVyc3AzZC1vcmlnaW49IjMyIDogMjEuMzMzMzMzIDogMSIKICAgICAgIGlua3NjYXBlOnZwX3o9IjY0IDogMzIgOiAxIgogICAgICAgaW5rc2NhcGU6dnBfeT0iMCA6IDEwMDAgOiAwIgogICAgICAgaW5rc2NhcGU6dnBfeD0iMCA6IDMyIDogMSIKICAgICAgIHNvZGlwb2RpOnR5cGU9Imlua3NjYXBlOnBlcnNwM2QiIC8+CiAgICA8aW5rc2NhcGU6cGVyc3BlY3RpdmUKICAgICAgIGlkPSJwZXJzcGVjdGl2ZTI1NTciCiAgICAgICBpbmtzY2FwZTpwZXJzcDNkLW9yaWdpbj0iMjUgOiAxNi42NjY2NjcgOiAxIgogICAgICAgaW5rc2NhcGU6dnBfej0iNTAgOiAyNSA6IDEiCiAgICAgICBpbmtzY2FwZTp2cF95PSIwIDogMTAwMCA6IDAiCiAgICAgICBpbmtzY2FwZTp2cF94PSIwIDogMjUgOiAxIgogICAgICAgc29kaXBvZGk6dHlwZT0iaW5rc2NhcGU6cGVyc3AzZCIgLz4KICA8L2RlZnM+CiAgPHNvZGlwb2RpOm5hbWVkdmlldwogICAgIGlkPSJiYXNlIgogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxLjAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAuMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnpvb209IjgiCiAgICAgaW5rc2NhcGU6Y3g9Ijg0LjY4NTM1MiIKICAgICBpbmtzY2FwZTpjeT0iMTUuMjg4NjI4IgogICAgIGlua3NjYXBlOmRvY3VtZW50LXVuaXRzPSJweCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgc2hvd2dyaWQ9InRydWUiCiAgICAgaW5rc2NhcGU6Z3JpZC1iYm94PSJ0cnVlIgogICAgIGlua3NjYXBlOmdyaWQtcG9pbnRzPSJ0cnVlIgogICAgIGdyaWR0b2xlcmFuY2U9IjEwMDAwIgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTM5OSIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI4NzQiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9IjMzIgogICAgIGlua3NjYXBlOndpbmRvdy15PSIwIgogICAgIGlua3NjYXBlOnNuYXAtYmJveD0idHJ1ZSI+CiAgICA8aW5rc2NhcGU6Z3JpZAogICAgICAgaWQ9IkdyaWRGcm9tUHJlMDQ2U2V0dGluZ3MiCiAgICAgICB0eXBlPSJ4eWdyaWQiCiAgICAgICBvcmlnaW54PSIwcHgiCiAgICAgICBvcmlnaW55PSIwcHgiCiAgICAgICBzcGFjaW5neD0iMXB4IgogICAgICAgc3BhY2luZ3k9IjFweCIKICAgICAgIGNvbG9yPSIjMDAwMGZmIgogICAgICAgZW1wY29sb3I9IiMwMDAwZmYiCiAgICAgICBvcGFjaXR5PSIwLjIiCiAgICAgICBlbXBvcGFjaXR5PSIwLjQiCiAgICAgICBlbXBzcGFjaW5nPSI1IgogICAgICAgdmlzaWJsZT0idHJ1ZSIKICAgICAgIGVuYWJsZWQ9InRydWUiIC8+CiAgPC9zb2RpcG9kaTpuYW1lZHZpZXc+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNyI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICBpbmtzY2FwZTpsYWJlbD0iTGF5ZXIgMSIKICAgICBpbmtzY2FwZTpncm91cG1vZGU9ImxheWVyIgogICAgIGlkPSJsYXllcjEiPgogICAgPHBhdGgKICAgICAgIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiMwMDAwMDA7c3Ryb2tlLXdpZHRoOjEuOTk5OTk5ODg7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGQ9Ik0gNzkuMTU2OTEsMjUgTCA5NSwyNSIKICAgICAgIGlkPSJwYXRoMzA1OSIKICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0iY2MiIC8+CiAgICA8cGF0aAogICAgICAgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6IzAwMDAwMDtzdHJva2Utd2lkdGg6MjtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2Utb3BhY2l0eToxIgogICAgICAgZD0iTSAyOS4wNDM0NzgsMjUgTCA1LjA0MzQ3ODEsMjUiCiAgICAgICBpZD0icGF0aDMwNjEiIC8+CiAgICA8cGF0aAogICAgICAgc3R5bGU9ImZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MztzdHJva2UtbGluZWpvaW46bWl0ZXI7bWFya2VyOm5vbmU7c3Ryb2tlLW9wYWNpdHk6MTt2aXNpYmlsaXR5OnZpc2libGU7ZGlzcGxheTppbmxpbmU7b3ZlcmZsb3c6dmlzaWJsZTtlbmFibGUtYmFja2dyb3VuZDphY2N1bXVsYXRlIgogICAgICAgZD0iTSAyOC45Njg3NSwyLjU5Mzc1IEwgMjguOTY4NzUsNSBMIDI4Ljk2ODc1LDQ1IEwgMjguOTY4NzUsNDcuNDA2MjUgTCAzMS4xMjUsNDYuMzQzNzUgTCA3Mi4xNTYyNSwyNi4zNDM3NSBMIDcyLjE1NjI1LDIzLjY1NjI1IEwgMzEuMTI1LDMuNjU2MjUgTCAyOC45Njg3NSwyLjU5Mzc1IHogTSAzMS45Njg3NSw3LjQwNjI1IEwgNjguMDkzNzUsMjUgTCAzMS45Njg3NSw0Mi41OTM3NSBMIDMxLjk2ODc1LDcuNDA2MjUgeiIKICAgICAgIGlkPSJwYXRoMjYzOCIKICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0iY2NjY2NjY2NjY2NjYyIgLz4KICAgIDxwYXRoCiAgICAgICBzb2RpcG9kaTp0eXBlPSJhcmMiCiAgICAgICBzdHlsZT0iZmlsbDpub25lO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTojMDAwMDAwO3N0cm9rZS13aWR0aDozO3N0cm9rZS1saW5lam9pbjptaXRlcjttYXJrZXI6bm9uZTtzdHJva2Utb3BhY2l0eToxO3Zpc2liaWxpdHk6dmlzaWJsZTtkaXNwbGF5OmlubGluZTtvdmVyZmxvdzp2aXNpYmxlO2VuYWJsZS1iYWNrZ3JvdW5kOmFjY3VtdWxhdGUiCiAgICAgICBpZD0icGF0aDI2NzEiCiAgICAgICBzb2RpcG9kaTpjeD0iNzYiCiAgICAgICBzb2RpcG9kaTpjeT0iMjUiCiAgICAgICBzb2RpcG9kaTpyeD0iNCIKICAgICAgIHNvZGlwb2RpOnJ5PSI0IgogICAgICAgZD0iTSA4MCwyNSBBIDQsNCAwIDEgMSA3MiwyNSBBIDQsNCAwIDEgMSA4MCwyNSB6IgogICAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEsMCkiIC8+CiAgPC9nPgo8L3N2Zz4K'
    },
    text: {text: '直线运动'} //'movel'
  }
});
joint.shapes.motionControl.define('motionControl.movej', {
  attrs: {
    rect: {fill: '#26ca14'},
    text: {text: '关节运动'} //'movej'
  }
});
joint.shapes.motionControl.define('motionControl.movej_pose', {
  attrs: {
    rect: {fill: '#eaea31'},
    text: {text: 'movej_pose'} //'movej_pose'
  }
});
joint.shapes.motionControl.define('motionControl.movec', {
  attrs: {
    rect: {fill: '#ff9900'},
    text: {text: '圆弧运动'} //'movec'
  }
});
joint.shapes.motionControl.define('motionControl.tcp_move', {
  attrs: {
    rect: {fill: '#6fa8dc'},
    text: {text: 'tcp_move'}
  }
});

joint.shapes.basic.Rect.define('socket', {
  size: {width: 5, height: 2},
  attrs: {
    '.': {
      'data-tooltip-position': 'left',
      'data-tooltip-position-selector': '.joint-stencil'
    },
    rect: {
      fill: '#feb663',
      width: 25,
      height: 15,
      rx: 2,
      ry: 2,
      stroke: '#3c4260',
      'stroke-width': 2,
      'stroke-dasharray': '0'
    },
    text: {
      text: '',
      fill: '#3c4260',
      'font-family': 'Arial',
      'font-weight': 'Normal',
      'font-size': 12,
      'stroke-width': 0
    }
  }
});
joint.shapes.socket.define('socket.open', {
  attrs: {
    rect: {
      fill: '#feb663'
    },
    text: {
      text: '打开网口'//'socket_open'
    }
  }
});
joint.shapes.socket.define('socket.close', {
  attrs: {
    rect: {
      fill: '#feb663'
    },
    text: {
      text: '关闭网口'//'socket_close'
    }
  }
});
joint.shapes.socket.define('socket.read', {
  attrs: {
    rect: {fill:'#ffffff'},
    text: {text: '读取数据'}
  }
});

joint.shapes.socket.define('socket.send', {
  attrs: {
    rect: {fill:'#eaea31'},
    text: {text: '发送数据'}
  }
});
// joint.shapes.socket.define('socket.read_string', {
//     attrs: {
//         rect: {fill:'#ffffff'},
//         text: {text: 'read_string'}
//     }
// });
// joint.shapes.socket.define('socket.read_float', {
//     attrs: {
//         rect: {fill:'#ffffff'},
//         text: {text: 'read_float'}
//     }
// });
// joint.shapes.socket.define('socket.send_string', {
//     attrs: {
//         rect: {fill:'#eaea31'},
//         text: {text: 'send_string'}
//     }
// });
// joint.shapes.socket.define('socket.send_float', {
//     attrs: {
//         rect: {fill:'#eaea31'},
//         text: {text: 'send_float'}
//     }
// });
joint.shapes.basic.Rect.define('system', {
  size: {width: 5, height: 2},
  attrs: {
    '.': {
      'data-tooltip-position': 'left',
      'data-tooltip-position-selector': '.joint-stencil'
    },
    rect: {
      fill: '#feb663',
      width: 25,
      height: 15,
      rx: 2,
      ry: 2,
      stroke: '#3c4260',
      'stroke-width': 2,
      'stroke-dasharray': '0'
    },
    text: {
      text: 'sleep',
      fill: '#3c4260',
      'font-family': 'Arial',
      'font-weight': 'Normal',
      'font-size': 12,
      'stroke-width': 0
    }
  }
});
joint.shapes.system.define('system.sleep', {
  attrs: {
    rect: {fill: '#feb663'},
    text: {text: '休眠'} //'sleep'
  }
});

joint.shapes.basic.Rect.define('IO_tool', {
  size: { width: 5, height: 2 },
  attrs: {
    '.': {
      'data-tooltip-position': 'left',
      'data-tooltip-position-selector': '.joint-stencil'
    },
    rect: {
      fill:'#26ca14',
      width: 25,
      height: 15,
      rx: 2,
      ry: 2,
      stroke: '#3c4260',
      'stroke-width': 2,
      'stroke-dasharray': '0'
    },
    text: {
      text: '',
      fill: '#3c4260',
      'font-family': 'Arial',
      'font-weight': 'Normal',
      'font-size': 12,
      'stroke-width': 0
    }
  }
});
joint.shapes.IO_tool.define('IO_tool.io_out', {
  attrs: {
    rect: {fill:'#26ca14'},
    text: {text: 'I/O输出'}
  }
});
joint.shapes.IO_tool.define('IO_tool.io_in', {
  attrs: {
    rect: {fill:'#26ca14'},
    text: {text: 'I/O输入'}
  }
});
// joint.shapes.IO_tool.define('IO_tool.io_v_out', {
//     attrs: {
//         rect: {fill:'#ff9900'},
//         text: {text: 'io_v_out'}
//     }
// });
// joint.shapes.IO_tool.define('IO_tool.io_v_in', {
//     attrs: {
//         rect: {fill:'#ff9900'},
//         text: {text: 'io_v_in'}
//     }
// });
// joint.shapes.IO_tool.define('IO_tool.tool_out', {
//     attrs: {
//         rect: {fill: '#6fa8dc'},
//         text: {text: 'tool_out'}
//     }
// });
// joint.shapes.IO_tool.define('IO_tool.tool_in', {
//     attrs: {
//         rect: {fill:'#6fa8dc'},
//         text: {text: 'tool_in'}
//     }
// });

joint.shapes.IO_tool.define('IO_tool.coordinate_user', {
  attrs: {
    rect: {fill: '#ffffff'},
    text: {text: '设置用户坐标系'} //'coord_user'
  }
});
joint.shapes.IO_tool.define('IO_tool.coordinate_tool', {
  attrs: {
    rect: {fill: '#ffffff'},
    text: {text: '设置工具坐标系'} //'coord_tool'
  }
});
joint.shapes.IO_tool.define('IO_tool.coordinate_clear', {
  attrs: {
    rect: {fill: '#ffffff'},
    text: {text: '清除坐标系设置'} //'coord_clear'
  }
});
joint.shapes.IO_tool.define('IO_tool.get_flange_pos', {
  attrs: {
    rect: {fill: '#f576dc'},
    text: {text: '获取末端位置'} //'get_flange_pos'
  }
});
joint.shapes.IO_tool.define('IO_tool.get_joint_pos', {
  attrs: {
    rect: {fill: '#f576dc'},
    text: {text: '获取关节角度'} //'get_joint_pos'
  }
});

joint.shapes.basic.Rect.define('expressions.expression', {
  size: {width: 5, height: 2},
  attrs: {
    '.': {
      'data-tooltip-position': 'left',
      'data-tooltip-position-selector': '.joint-stencil'
    },
    rect: {
      fill: '#26ca14',
      width: 25,
      height: 15,
      rx: 2,
      ry: 2,
      stroke: '#3c4260',
      'stroke-width': 2,
      'stroke-dasharray': '0'
    },
    text: {
      text: '表达式', //'expression'
      fill: '#3c4260',
      'font-family': 'Arial',
      'font-weight': 'Normal',
      'font-size': 12,
      'stroke-width': 0
    }
  }
});

joint.shapes.basic.Rect.define('function.define_func', {
  size: {width: 5, height: 2},
  attrs: {
    '.': {
      'data-tooltip-position': 'left',
      'data-tooltip-position-selector': '.joint-stencil'
    },
    rect: {
      fill: '#feb663',
      width: 25,
      height: 15,
      rx: 2,
      ry: 2,
      stroke: '#3c4260',
      'stroke-width': 2,
      'stroke-dasharray': '0'
    },
    text: {
      text: '函数定义', //'define_func'
      fill: '#3c4260',
      'font-family': 'Arial',
      'font-weight': 'Normal',
      'font-size': 12,
      'stroke-width': 0
    }
  }
});

// joint.shapes.basic.Rect.define('camera', {
//   size: {width: 5, height: 2},
//   attrs: {
//     '.': {
//       'data-tooltip-position': 'left',
//       'data-tooltip-position-selector': '.joint-stencil'
//     },
//     rect: {
//       fill: '#feb663',
//       width: 25,
//       height: 15,
//       rx: 2,
//       ry: 2,
//       stroke: '#3c4260',
//       'stroke-width': 2,
//       'stroke-dasharray': '0'
//     },
//     text: {
//       text: 'camera',
//       fill: '#3c4260',
//       'font-family': 'Arial',
//       'font-weight': 'Normal',
//       'font-size': 12,
//       'stroke-width': 0
//     }
//   },
// });
// joint.shapes.camera.define('camera.calpos', {
//   attrs: {
//     rect: {fill: '#26ca14'},
//     text: {text: '相机坐标转换'} //'calpos'
//   }
// });
// joint.shapes.camera.define('camera.capture', {
//   attrs: {
//     rect: {fill: '#feb663'},
//     text: {text: '获取相机数据'} //'capture'
//   }
// });

joint.shapes.basic.Rect.define('modbus', {
  size: {width: 5, height: 1},
  attrs: {
    '.': {
      'data-tooltip-position': 'left',
      'data-tooltip-position-selector': '.joint-stencil'
    },
    rect: {
      fill: '#feb663',
      width: 50,
      height: 10,
      rx: 4,
      ry: 4,
      stroke: '#3c4260',
      'stroke-width': 2,
      'stroke-dasharray': '0'
    },
    text: {
      text: 'modbus',
      fill: '#3c4260',
      'font-family': 'Arial',
      'font-weight': 'Normal',
      'font-size': 12,
      'stroke-width': 0
    }
  }
});
joint.shapes.modbus.define('modbus.modbus_read', {
  attrs: {
    rect: {fill: '#feb663'},
    text: {text: '读节点数据'} //'modbus_read'
  }
});
joint.shapes.modbus.define('modbus.modbus_write', {
  attrs: {
    rect: {fill:'#26ca14'},
    text: {text: '写节点数据'}
  }
});
// joint.shapes.modbus.define('modbus.modbus_write_d', {
//   attrs: {
//     rect: {fill: '#26ca14'},
//     text: {text: '写digital类型节点'} //'modbus_write_d'
//   }
// });
// joint.shapes.modbus.define('modbus.modbus_write_r', {
//   attrs: {
//     rect: {fill: '#26ca14'},
//     text: {text: '写register类型节点'} //'modbus_write_r'
//   }
// });
joint.shapes.modbus.define('modbus.modbus_set_frequency', {
  attrs: {
    rect: {
      fill: '#26ca14'
    },
    text: {
      text: '设置节点刷新频率'// 'modbus_set_frequency'
    }
  }
});
joint.shapes.modbus.define('modbus.modbus_add_signal', {
  attrs: {
    '.': {
      'data-tooltip': '添加modbus节点'
    },
    rect: {fill: '#26ca14'},
    text: {text: '添加节点'} //'modbus_add_signal'
  }
});
joint.shapes.modbus.define('modbus.modbus_delete_signal', {
  attrs: {
    rect: {fill: '#feb663'},
    text: {text: '删除节点'} //'modbus_delete_signal'
  }
});

joint.dia.Link.define('app.Link', {
  router: {
    name: 'normal'
  },
  connector: {
    name: 'normal'
  },
  attrs: {
    '.tool-options': {
      'data-tooltip-class-name': 'small',
      'data-tooltip': 'Click to open Inspector for this link',
      'data-tooltip-position': 'left'
    },
    '.marker-source': {
      d: 'M 10 0 L 0 5 L 10 10 z',
      stroke: 'transparent',
      fill: '#222138',
      transform: 'scale(0.001)'
    },
    '.marker-target': {
      d: 'M 10 0 L 0 5 L 10 10 z',
      stroke: 'transparent',
      fill: '#222138',
      transform: 'scale(0.7)'
    },
    '.connection': {
      stroke: '#222138',
      strokeDasharray: '0',
      strokeWidth: 2,
      fill: 'none'
    },
    '.connection-wrap': {
      fill: 'none'
    }
  }
});

joint.dia.CommandManager = Backbone.Model.extend({
  defaults: {
    cmdBeforeAdd: null,
    cmdNameRegex: /^(?:add|remove|change:\w+)$/,
    applyOptionsList: ["propertyPath"],
    revertOptionsList: ["propertyPath"]
  },
  PREFIX_LENGTH: 7,
  //a: {graph: graph}
  initialize: function (a) {
    joint.util.bindAll(this, "initBatchCommand", "storeBatchCommand"),
      this.graph = a.graph,
      this.reset(),
      this.listen()
  },
  listen: function () {
    this.listenTo(this.graph, "all", this.addCommand, this),
      this.listenTo(this.graph, "batch:start", this.initBatchCommand, this),
      this.listenTo(this.graph, "batch:stop", this.storeBatchCommand, this)
  },
  // 根据a设置batch属性，返回一个新的command对象
  createCommand: function (a) {
    var b = {
      action: void 0,
      data: {
        id: void 0,
        type: void 0,
        previous: {},
        next: {}
      },
      batch: a && a.batch
    };
    return b
  },
  push: function (cmd) {
    this.redoStack = [],
      // 触发batch事件，再次调用addCommand函数
      cmd.batch ? (this.lastCmdIndex = Math.max(this.lastCmdIndex, 0), this.trigger("batch", cmd)) : (this.undoStack.push(cmd), this.trigger("add", cmd))
  },
  // a: cmdName, b:cell, c:grapgCells, d:{add: true, remove: false, merge: false, stencil: "view58"}
  // 或a: cmdName, b:grapgCells, c:{add: true, remove: false, merge: false, stencil: "view58"}
  addCommand: function (cmdName, b, c, d) {
    if ((!d || !d.dry) && this.get("cmdNameRegex").test(cmdName) && ("function" != typeof this.get("cmdBeforeAdd") || this.get("cmdBeforeAdd").apply(this, arguments))) {
      var e = void 0,
        f = b instanceof joint.dia.Graph;
      if (this.batchCommand) {
        e = this.batchCommand[Math.max(this.lastCmdIndex, 0)];
        var g = f && !e.graphChange || e.data.id !== b.id,
          h = e.action !== cmdName;
        if (this.lastCmdIndex >= 0 && (g || h)) {
          var i = this.batchCommand.findIndex(function (c, d) {
            return (f && c.graphChange || c.data.id === b.id) && c.action === cmdName
          });
          i < 0 || "add" === cmdName || "remove" === cmdName ? e = this.createCommand({
            batch: !0
          }) : (
            e = this.batchCommand[i],
              this.batchCommand.splice(i, 1)
          ),
            this.lastCmdIndex = this.batchCommand.push(e) - 1
        }
      } else
      // 创建一个基础command
        e = this.createCommand({batch: !1});
      if ("add" === cmdName || "remove" === cmdName)
        return e.action = cmdName,
          e.data.id = b.id,
          e.data.type = b.attributes.type,
          e.data.attributes = joint.util.merge({}, b.toJSON()),
          e.options = d || {},
          void this.push(e);
      // change:xxx，去掉change：之后剩下的右半部分
      var j = cmdName.substr(this.PREFIX_LENGTH);
      e.batch && e.action || (
        e.action = cmdName,
          // 如position，data.previous["position"] = joint.util.clone(cell.previous("position"))
          e.data.previous[j] = joint.util.clone(b.previous(j)),
          e.options = d || {}, // {restrictedArea:..., translateBy:...等}
          f ? e.graphChange = !0 : (e.data.id = b.id, e.data.type = b.attributes.type)
      ),
        // data.next["position"] = joint.util.clone(cell.get("position"))
        e.data.next[j] = joint.util.clone(b.get(j)),
        this.push(e)
    }
  },
  initBatchCommand: function () {
    this.batchCommand ? this.batchLevel++ : (
      this.batchCommand = [this.createCommand({batch: !0})],
        this.lastCmdIndex = -1,
        this.batchLevel = 0
    )
  },
  storeBatchCommand: function () {
    // batchCommand:[
    // {action,"add",batch:true, options:{add: true, remove: false, merge: false, stencil: "view58", changes:
    // {added: Array(1), removed: Array(0), merged: Array(0)}},
    // data:{id: "7d1138aa-acbb-41d0-8b79-712f6238a7d0", type: "motionControl.movel", previous: {…}, next: {…}, attributes: {…}}}
    // ]
    if (this.batchCommand && this.batchLevel <= 0) {
      var a = this.filterBatchCommand(this.batchCommand);
      a.length > 0 && (
        this.redoStack = [],
          this.undoStack.push(a),
          this.trigger("add", a)
      ),
        this.batchCommand = null,
        this.lastCmdIndex = null,
        this.batchLevel = null
    }
    else
      this.batchCommand && this.batchLevel > 0 && this.batchLevel--
  },
  // a: commands
  filterBatchCommand: function (commands) {
    for (var b = commands.slice(), c = []; b.length > 0;) {
      // d: cmd,e:id
      var cmd = b.shift(),
        id = cmd.data.id; //"7d1138aa-acbb-41d0-8b79-712f6238a7d0"
      if (null != cmd.action && (null != id || cmd.graphChange)) {
        if ("add" === cmd.action) {
          var f = b.findIndex(function (a) {
            return "remove" === a.action && a.data && a.data.id === id
          });
          if (f >= 0) {
            b = b.filter(function (a, b) {
              return b > f || a.data.id !== id
            });
            continue
          }
        } else if ("remove" === cmd.action) {
          var g = b.findIndex(function (a) {
            return "add" === a.action && a.data && a.data.id == id
          });
          if (g >= 0) {
            b.splice(g, 1);
            continue
          }
        } else if (0 === cmd.action.indexOf("change") && joint.util.isEqual(cmd.data.previous, cmd.data.next))
          continue;
        c.push(cmd)
      }
    }
    return c
  },
  // undo 时调用，a: commands
  revertCommand: function (a, b) {
    this.stopListening();
    var c;
    c = Array.isArray(a) ? this.constructor.sortBatchCommands(a) : [a];
    for (var d = this.graph, e = c.length - 1; e >= 0; e--) {
      var f = c[e],
        g = f.graphChange ? d : d.getCell(f.data.id),
        h = joint.util.assign(
          {commandManager: this.id || this.cid},
          b,
          joint.util.pick(f.options, this.get("revertOptionsList"))
        );
      switch (f.action) {
        case "add":
          g.remove(h);
          break;
        case "remove":
          d.addCell(f.data.attributes, h);
          break;
        default:
          var i = f.action.substr(this.PREFIX_LENGTH);
          g.set(i, f.data.previous[i], h)
      }
    }
    this.listen()
  },
  applyCommand: function (a, b) {
    this.stopListening();
    var c;
    c = Array.isArray(a) ? this.constructor.sortBatchCommands(a) : [a];
    for (var d = this.graph, e = 0; e < c.length; e++) {
      var f = c[e],
        g = f.graphChange ? d : d.getCell(f.data.id),
        h = joint.util.assign(
          {commandManager: this.id || this.cid},
          b,
          joint.util.pick(f.options, this.get("applyOptionsList"))
        );
      switch (f.action) {
        case "add":
          d.addCell(f.data.attributes, h);
          break;
        case "remove":
          g.remove(h);
          break;
        default:
          var i = f.action.substr(this.PREFIX_LENGTH);
          g.set(i, f.data.next[i], h)
      }
    }
    this.listen()
  },
  undo: function (a) {
    var b = this.undoStack.pop();
    b && (this.revertCommand(b, a), this.redoStack.push(b))
  },
  redo: function (a) {
    var b = this.redoStack.pop();
    b && (this.applyCommand(b, a), this.undoStack.push(b))
  },
  cancel: function (a) {
    this.hasUndo() && (this.revertCommand(this.undoStack.pop(), a), this.redoStack = [])
  },
  // 清空redo和undo stack
  reset: function () {
    this.undoStack = [], this.redoStack = []
  },
  hasUndo: function () {
    return this.undoStack.length > 0
  },
  hasRedo: function () {
    return this.redoStack.length > 0
  }
}, {
  sortBatchCommands: function (commands) {
    for (var b = [], c = 0; c < commands.length; c++) {
      var cmd = commands[c],
        e = null;
      if ("add" === cmd.action)
        for (var f = cmd.data.id, g = 0; g < c; g++)
          if (commands[g].data.id === f) {
            e = g - 1;
            break
          }
      null !== e ? b.splice(e, 0, cmd) : b.push(cmd)
    }
    return b
  }
});

joint.dia.Validator = Backbone.Model.extend({
  initialize: function (a) {
    this._map = {},
      this._commandManager = a.commandManager,
      this.listenTo(this._commandManager, "add", this._onCommand)
  },
  defaults: {
    cancelInvalid: !0
  },
  _onCommand: function (a) {
    return Array.isArray(a) ? a.find(function (a) {
      return !this._validateCommand(a)
    }, this) : this._validateCommand(a)
  },
  _validateCommand: function (a) {
    if (a.options && a.options.validation === !1) return !0;
    var b;
    return joint.util.toArray(this._map[a.action]).forEach(function (c) {
      function d(f) {
        var g = c[e++];
        try {
          if (!g) return void(b = f);
          g(f, a, d)
        } catch (f) {
          d(f)
        }
      }

      var e = 0;
      d(b)
    }),
    !b || (this.get("cancelInvalid") && this._commandManager.cancel(), this.trigger("invalid", b), !1)
  },
  validate: function (a) {
    var b = Array.prototype.slice.call(arguments, 1);
    return b.forEach(function (b) {
      if (!joint.util.isFunction(b)) throw new Error(a + " requires callback functions.")
    }),
      a.split(" ").forEach(function (a) {
        (this._map[a] = this._map[a] || []).push(b)
      }, this),
      this
  }
});

joint.ui.PaperScroller = joint.mvc.View.extend({
  className: "paper-scroller",
  options: {
    paper: void 0,
    padding: function () {
      var a = Math.max(this.options.minVisiblePaperSize, 1) || 1,
        b = {};
      return b.left = b.right = Math.max(this.el.clientWidth - a, 0),
        b.top = b.bottom = Math.max(this.el.clientHeight - a, 0),
        b
    },
    minVisiblePaperSize: 50,
    autoResizePaper: !1, //true
    baseWidth: void 0, //1000
    baseHeight: void 0, //1000
    contentOptions: void 0,
    cursor: "default" // 'grab'
  },
  _padding: {
    left: 0,
    top: 0
  },
  init: function () {
    joint.util.bindAll(this, "startPanning", "stopPanning", "pan", "onBackgroundEvent");
    //a:paper
    var paper = this.options.paper,
      scale = paper.scale();
    this._sx = scale.sx,
      this._sy = scale.sy,
    void 0 === this.options.baseWidth && (this.options.baseWidth = paper.options.width),
    void 0 === this.options.baseHeight && (this.options.baseHeight = paper.options.height),
      this.$background = $("<div/>").addClass("paper-scroller-background").css({
        width: paper.options.width,
        height: paper.options.height
      }).append(paper.el).appendTo(this.el),
      // <div class="joint-paper-scroller joint-theme-material">
      // <div class="paper-scroller-background" style="width: 1000px; height: 1000px;">
      // <div class="joint-paper joint-theme-material" style="width: 1000px; height: 1000px;">
      // <div class="joint-paper-background"></div>
      // <div class="joint-paper-grid" style="background-image: url();">
      // </div>
      // <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="v-81" width="100%" height="100%">
      // <g id="v-82" class="joint-viewport"></g>
      // <defs id="v-83"></defs>
      // </svg>
      // </div>
      // </div>
      // </div>
      this.listenTo(paper, "scale", this.onScale).listenTo(paper, "resize", this.onResize).listenTo(paper, "beforeprint beforeexport", this.storeScrollPosition).listenTo(paper, "afterprint afterexport", this.restoreScrollPosition),
    this.options.autoResizePaper && (
      this.listenTo(paper.model, "change add remove reset", this.adjustPaper),
      paper.options.async && this.listenTo(paper, "render:done", this.adjustPaper)
    ),
      this.delegateBackgroundEvents(),
      this.setCursor(this.options.cursor)
  },
  lock: function () {
    return this.$el.css("overflow", "hidden"), this
  },
  unlock: function () {
    return this.$el.css("overflow", "scroll"), this
  },
  setCursor: function (a) {
    switch (a) {
      case "grab":
        this.$el.css("cursor", "");
        break;
      default:
        this.$el.css("cursor", a)
    }
    return this.$el.attr("data-cursor", a),
      this.options.cursor = a,
      this
  },
  delegateBackgroundEvents: function (a) {
    function b(b, c) {
      var d = a[c];
      return c.indexOf(" ") === -1 && (b[c] = joint.util.isFunction(d) ? d : this.options.paper[d]),
        b
    }

    function c(a) {
      this.delegate(a, {guarded: !1}, this.onBackgroundEvent)
    }

    a || (a = joint.util.result(this.options.paper, "events"));
    // paper 的events的keys
    var d = this.paperEvents = Object.keys(a || {}).reduce(b.bind(this), {});
    return Object.keys(d).forEach(c, this), this
  },
  onBackgroundEvent: function (evt) {
    if (this.$background.is(evt.target)) {
      var b = this.paperEvents[evt.type];
      joint.util.isFunction(b) && b.apply(this.options.paper, arguments)
    }
  },
  onResize: function () {
    this._center && this.center(this._center.x, this._center.y)
  },
  onScale: function (a, b, c, d) {
    this.adjustScale(a, b),
      this._sx = a,
      this._sy = b,
    (c || d) && this.center(c, d)
  },
  storeScrollPosition: function () {
    this._scrollLeftBeforePrint = this.el.scrollLeft,
      this._scrollTopBeforePrint = this.el.scrollTop
  },
  restoreScrollPosition: function () {
    this.el.scrollLeft = this._scrollLeftBeforePrint,
      this.el.scrollTop = this._scrollTopBeforePrint,
      this._scrollLeftBeforePrint = null,
      this._scrollTopBeforePrint = null
  },
  beforePaperManipulation: function () {
    (joint.env.test("msie") || joint.env.test("msedge")) && this.$el.css("visibility", "hidden")
  },
  afterPaperManipulation: function () {
    (joint.env.test("msie") || joint.env.test("msedge")) && this.$el.css("visibility", "visible")
  },
  clientToLocalPoint: function (a, b) {
    var c = this.options.paper.matrix();
    return a += this.el.scrollLeft - this._padding.left - c.e,
      a /= c.a,
      b += this.el.scrollTop - this._padding.top - c.f,
      b /= c.d,
      g.point(a, b)
  },
  localToBackgroundPoint: function (a, b) {
    var c = g.Point(a, b),
      d = this.options.paper.matrix(),
      e = this._padding;
    return V.transformPoint(c, d).offset(e.left, e.top)
  },
  adjustPaper: function () {
    this._center = this.clientToLocalPoint(this.el.clientWidth / 2, this.el.clientHeight / 2);
    var a = joint.util.assign(
      {
        gridWidth: this.options.baseWidth,
        gridHeight: this.options.baseHeight,
        allowNewOrigin: "negative"
      },
      this.options.contentOptions
    );
    return this.options.paper.fitToContent(this.transformContentOptions(a)), this
  },
  adjustScale: function (a, b) {
    var c = this.options.paper.options,
      d = a / this._sx,
      e = b / this._sy;
    this.options.paper.setOrigin(c.origin.x * d, c.origin.y * e),
      this.options.paper.setDimensions(c.width * d, c.height * e)
  },
  transformContentOptions: function (a) {
    var b = this._sx,
      c = this._sy;
    return a.gridWidth && (a.gridWidth *= b),
    a.gridHeight && (a.gridHeight *= c),
    a.minWidth && (a.minWidth *= b),
    a.minHeight && (a.minHeight *= c),
      joint.util.isObject(a.padding) ? a.padding = {
        left: (a.padding.left || 0) * b,
        right: (a.padding.right || 0) * b,
        top: (a.padding.top || 0) * c,
        bottom: (a.padding.bottom || 0) * c
      } : joint.util.isNumber(a.padding) && (a.padding = a.padding * b), a
  },
  center: function (a, b, c) {
    var matrix = this.options.paper.matrix(),
      e = -matrix.e,
      f = -matrix.f,
      g = e + this.options.paper.options.width,
      h = f + this.options.paper.options.height;
    void 0 === a || void 0 === b ? (a = (e + g) / 2, b = (f + h) / 2) : (a *= matrix.a, b *= matrix.d);
    var i = this.getPadding(),
      j = this.el.clientWidth / 2,
      k = this.el.clientHeight / 2,
      l = j - i.left - a + e,
      m = j - i.right + a - g,
      n = k - i.top - b + f,
      o = k - i.bottom + b - h;
    return this.addPadding(Math.max(l, 0), Math.max(m, 0), Math.max(n, 0), Math.max(o, 0)),
      this.scroll(a, b, void 0 !== c ? c : a || null),
      this
  },
  centerContent: function (a) {
    var b = V(this.options.paper.viewport).bbox(!0, this.options.paper.svg);
    return this.center(b.x + b.width / 2, b.y + b.height / 2, a),
      this
  },
  centerElement: function (a) {
    this.checkElement(a, "centerElement");
    var b = a.getBBox().center();
    return this.center(b.x, b.y)
  },
  scroll: function (a, b, c) {
    var d = this.options.paper.matrix(),
      e = {};
    if (joint.util.isNumber(a)) {
      var f = this.el.clientWidth / 2;
      e.scrollLeft = a - f + d.e + (this._padding.left || 0)
    }
    if (joint.util.isNumber(b)) {
      var g = this.el.clientHeight / 2;
      e.scrollTop = b - g + d.f + (this._padding.top || 0)
    }
    c && c.animation ? this.$el.animate(e, c.animation) : this.$el.prop(e)
  },
  scrollToElement: function (a, b) {
    this.checkElement(a, "scrollToElement");
    var c = a.getBBox().center(),
      d = this._sx,
      e = this._sy;
    return c.x *= d,
      c.y *= e,
      this.scroll(c.x, c.y, b)
  },
  addPadding: function (a, b, c, d) {
    var e = this.getPadding(),
      f = this._padding = {
        left: Math.round(e.left + (a || 0)),
        top: Math.round(e.top + (c || 0)),
        bottom: Math.round(e.bottom + (d || 0)),
        right: Math.round(e.right + (b || 0))
      };
    return this.$background.css({
      width: f.left + this.options.paper.options.width + f.right,
      height: f.top + this.options.paper.options.height + f.bottom
    }),
      this.options.paper.$el.css({left: f.left, top: f.top}),
      this
  },
  zoom: function (a, b) {
    if (void 0 === a) return this._sx;
    b = b || {};
    var c, d, e = this.clientToLocalPoint(this.el.clientWidth / 2, this.el.clientHeight / 2),
      f = a,
      g = a;
    if (
      b.absolute || (f += this._sx, g += this._sy),
      b.grid && (f = Math.round(f / b.grid) * b.grid, g = Math.round(g / b.grid) * b.grid),
      b.max && (f = Math.min(b.max, f), g = Math.min(b.max, g)),
      b.min && (f = Math.max(b.min, f), g = Math.max(b.min, g)),
      void 0 === b.ox || void 0 === b.oy
    )
      c = e.x, d = e.y;
    else {
      var h = f / this._sx,
        i = g / this._sy;
      c = b.ox - (b.ox - e.x) / h,
        d = b.oy - (b.oy - e.y) / i
    }
    return this.beforePaperManipulation(),
      this.options.paper.scale(f, g),
      this.center(c, d),
      this.afterPaperManipulation(),
      this
  },
  zoomToFit: function (a) {
    a = a || {};
    var paper = this.options.paper,
      c = joint.util.assign({}, paper.options.origin);
    return a.fittingBBox = a.fittingBBox || joint.util.assign({}, g.point(c), {
      width: this.$el.width(),
      height: this.$el.height()
    }),
      this.beforePaperManipulation(),
      paper.scaleContentToFit(a),
      paper.setOrigin(c.x, c.y),
      this.adjustPaper().centerContent(),
      this.afterPaperManipulation(),
      this
  },
  transitionClassName: "transition-in-progress",
  transitionEventName: "transitionend.paper-scroller-transition",
  transitionToPoint: function (a, b, c) {
    joint.util.isObject(a) && (c = b, b = a.y, a = a.x),
    c || (c = {});
    var d, e, f = this._sx,
      h = Math.max(c.scale || f, 1e-6),
      i = g.Point(a, b),
      j = this.clientToLocalPoint(this.el.clientWidth / 2, this.el.clientHeight / 2);
    if (f === h) {
      var k = j.difference(i).scale(f, f).round();
      d = "translate(" + k.x + "px," + k.y + "px)"
    } else {
      var l = h / (f - h) * i.distance(j),
        m = j.clone().move(i, l),
        n = this.localToBackgroundPoint(m).round();
      d = "scale(" + h / f + ")",
        e = n.x + "px " + n.y + "px"
    }
    return this.$el.addClass(this.transitionClassName),
      this.$background.off(this.transitionEventName).on(
        this.transitionEventName,
        function (a) {
          var b = this.paperScroller;
          b.syncTransition(this.scale, {x: this.x, y: this.y});
          var c = this.onTransitionEnd;
          joint.util.isFunction(c) && c.call(b, a)
        }.bind({paperScroller: this, scale: h, x: a, y: b, onTransitionEnd: c.onTransitionEnd})
      ).css({
        transition: "transform",
        transitionDuration: c.duration || "1s",
        transitionDelay: c.delay,
        transitionTimingFunction: c.timingFunction,
        transformOrigin: e,
        transform: d
      }),
      this
  },
  syncTransition: function (a, b) {
    return this.beforePaperManipulation(),
      this.options.paper.scale(a),
      this.removeTransition().center(b.x, b.y),
      this.afterPaperManipulation(),
      this
  },
  removeTransition: function () {
    return this.$el.removeClass(this.transitionClassName),
      this.$background.off(this.transitionEventName).css({
        transition: "",
        transitionDuration: "",
        transitionDelay: "",
        transitionTimingFunction: "",
        transform: "",
        transformOrigin: ""
      }), this
  },
  transitionToRect: function (a, b) {
    a = g.Rect(a), b || (b = {});
    var c = b.maxScale || 1 / 0,
      d = b.minScale || Number.MIN_VALUE,
      e = b.scaleGrid || null,
      f = b.visibility || 1,
      h = b.center ? g.Point(b.center) : a.center(),
      i = this.el.clientWidth * f,
      j = this.el.clientHeight * f,
      k = g.Rect({
        x: h.x - i / 2,
        y: h.y - j / 2,
        width: i,
        height: j
      }),
      l = k.maxRectUniformScaleToFit(a, h);
    return l = Math.min(l, c),
    e && (l = Math.floor(l / e) * e),
      l = Math.max(d, l),
      this.transitionToPoint(h, joint.util.defaults({scale: l}, b))
  },
  startPanning: function (a) {
    a = joint.util.normalizeEvent(a),
      this._clientX = a.clientX,
      this._clientY = a.clientY,
      this.$el.addClass("is-panning"),
      this.trigger("pan:start", a),
      $(document.body).on({
        "mousemove.panning touchmove.panning": this.pan,
        "mouseup.panning touchend.panning": this.stopPanning
      }),
      $(window).on("mouseup.panning", this.stopPanning)
  },
  pan: function (a) {
    a = joint.util.normalizeEvent(a);
    var b = a.clientX - this._clientX,
      c = a.clientY - this._clientY;
    this.el.scrollTop -= c,
      this.el.scrollLeft -= b,
      this._clientX = a.clientX,
      this._clientY = a.clientY
  },
  stopPanning: function (a) {
    $(document.body).off(".panning"),
      $(window).off(".panning"),
      this.$el.removeClass("is-panning"),
      this.trigger("pan:stop", a)
  },
  getPadding: function () {
    var a = this.options.padding;
    return joint.util.isFunction(a) && (a = a.call(this)),
      joint.util.normalizeSides(a)
  },
  getVisibleArea: function () {
    var a = this.options.paper.matrix(),
      b = {
        x: this.el.scrollLeft || 0,
        y: this.el.scrollTop || 0,
        width: this.el.clientWidth,
        height: this.el.clientHeight
      },
      c = V.transformRect(b, a.inverse());
    return c.x -= (this._padding.left || 0) / this._sx,
      c.y -= (this._padding.top || 0) / this._sy,
      g.rect(c)
  },
  isElementVisible: function (a, b) {
    this.checkElement(a, "isElementVisible"),
      b = b || {};
    var c = b.strict ? "containsRect" : "intersect";
    return !!this.getVisibleArea()[c](a.getBBox())
  },
  isPointVisible: function (a) {
    return this.getVisibleArea().containsPoint(a)
  },
  checkElement: function (a, b) {
    if (!(a && a instanceof joint.dia.Element))
      throw new TypeError("ui.PaperScroller." + b + "() accepts instance of joint.dia.Element only")
  },
  onRemove: function () {
    this.stopPanning()
  }
}),

  joint.env.addTest("msie", function () {
    var a = window.navigator.userAgent;
    return a.indexOf("MSIE") !== -1 || a.indexOf("Trident") !== -1
  }),
  joint.env.addTest("msedge", function () {
    return /Edge\/\d+/.test(window.navigator.userAgent)
  });

joint.ui.Selection = joint.mvc.View.extend({
  options: {
    paper: void 0,
    graph: void 0,
    boxContent: function (a) {
      return joint.util.template("<%= length %> elements selected.")({
        length: this.model.length
      })
    },
    handles: [{
      name: "remove",
      position: "nw",
      events: {
        pointerdown: "removeElements"
      }
    }, {
      name: "rotate",
      position: "sw",
      events: {
        pointerdown: "startRotating",
        pointermove: "doRotate",
        pointerup: "stopBatch"
      }
    }, {
      name: "resize",
      position: "se",
      events: {
        pointerdown: "startResizing",
        pointermove: "doResize",
        pointerup: "stopBatch"
      }
    }],
    useModelGeometry: !1,
    strictSelection: !1,
    rotateAngleGrid: 15,
    allowTranslate: !0
  },
  className: "selection",
  events: {
    "mousedown .selection-box": "onSelectionBoxPointerDown",
    "touchstart .selection-box": "onSelectionBoxPointerDown",
    "mousedown .handle": "onHandlePointerDown",
    "touchstart .handle": "onHandlePointerDown"
  },
  init: function () {
    this.options.model && (this.options.collection = this.options.model);
    //a:collection,b:paper,c:graph
    var collection = this.collection = this.options.collection || this.collection || new Backbone.Collection;
    if (collection.comparator || (collection.comparator = this.constructor.depthComparator, collection.sort()), this.model = collection, !this.options.paper) throw new Error("Selection: paper required");
    joint.util.defaults(this.options, {
      graph: this.options.paper.model
    }),
      joint.util.bindAll(this, "startSelecting", "stopSelecting", "adjustSelection", "pointerup"),
      $(document.body).on("mousemove.selection touchmove.selection", this.adjustSelection),
      $(document).on("mouseup.selection touchend.selection", this.pointerup);
    var paper = this.options.paper,
      graph = this.options.graph;
    this.listenTo(graph, "reset", this.cancelSelection),
      this.listenTo(paper, "scale translate", this.updateSelectionBoxes),
      this.listenTo(graph, "remove change", function (a, b) {
        b.selection !== this.cid && this.updateSelectionBoxes()
      }),
      this.listenTo(collection, "remove", this.onRemoveElement),
      this.listenTo(collection, "reset", this.onResetElements),
      this.listenTo(collection, "add", this.onAddElement),
      paper.$el.append(this.$el),
      this._boxCount = 0,
      this.$selectionWrapper = this.createSelectionWrapper(),
      this.handles = [],
      joint.util.toArray(this.options.handles).forEach(this.addHandle, this)
  },
  cancelSelection: function () {
    this.model.reset([], {
      ui: !0
    })
  },
  addHandle: function (handle) {
    this.handles.push(handle);
    var b = $("<div/>", {
      "class": "handle " + (handle.position || "") + " " + (handle.name || ""),
      "data-action": handle.name
    });
    return handle.icon && b.css("background-image", "url(" + handle.icon + ")"),
      b.html(handle.content || ""),
      joint.util.setAttributesBySelector(b, handle.attrs),
      this.$selectionWrapper.append(b),
      joint.util.forIn(handle.events, function (b, c) {
        joint.util.isString(b) ? this.on("action:" + handle.name + ":" + c, this[b], this) : this.on("action:" + handle.name + ":" + c, b)
      }.bind(this)), this
  },
  stopSelecting: function (a) {
    var b, c = this.options.paper;
    switch (this._action) {
      case "selecting":
        var d = this.$el.offset(),
          e = this.$el.width(),
          f = this.$el.height();
        b = c.pageToLocalPoint(d.left, d.top);
        var h = c.scale();
        e /= h.sx, f /= h.sy;
        var i = g.rect(b.x, b.y, e, f),
          j = this.getElementsInSelectedArea(i),
          k = this.options.filter;
        Array.isArray(k) ? j = j.filter(function (a) {
          return !k.includes(a.model) && !k.includes(a.model.get("type"))
        }) : joint.util.isFunction(k) && (j = j.filter(function (a) {
          return !k(a.model)
        }));
        var l = j.map(function (a) {
          return a.model
        });
        this.model.reset(l, {
          ui: !0
        });
        break;
      case "translating":
        this.options.graph.stopBatch("selection-translate"), b = c.snapToGrid({
          x: a.clientX,
          y: a.clientY
        }), this.notify("selection-box:pointerup", a, b.x, b.y);
        break;
      default:
        this._action || this.cancelSelection()
    }
    this._action = null
  },
  removeHandle: function (a) {
    var b = joint.util.toArray(this.handles).findIndex(function (b) {
        return b.name === a
      }),
      c = this.handles[b];
    return c && (joint.util.forIn(c.events, function (b, c) {
      this.off("action:" + a + ":" + c)
    }.bind(this)), this.$(".handle." + a).remove(), this.handles.splice(b, 1)), this
  },
  startSelecting: function (a) {
    a = joint.util.normalizeEvent(a), this.cancelSelection();
    var b, c, d = this.options.paper.el;
    if (null != a.offsetX && null != a.offsetY && $.contains(d, a.target)) b = a.offsetX, c = a.offsetY;
    else {
      var e = $(d).offset(),
        f = d.scrollLeft,
        g = d.scrollTop;
      b = a.clientX - e.left + window.pageXOffset + f, c = a.clientY - e.top + window.pageYOffset + g
    }
    this.$el.css({
      width: 1,
      height: 1,
      left: b,
      top: c
    }), this.showLasso(), this._action = "selecting", this._clientX = a.clientX, this._clientY = a.clientY, this._offsetX = b, this._offsetY = c
  },
  changeHandle: function (a, b) {
    var c = joint.util.toArray(this.handles).find(function (b) {
      return b && b.name === a
    });
    return c && (this.removeHandle(a), this.addHandle(joint.util.merge({
      name: a
    }, c, b))), this
  },
  onSelectionBoxPointerDown: function (a) {
    a.stopPropagation(), a = joint.util.normalizeEvent(a), this.options.allowTranslate && this.startTranslatingSelection(a), this._activeElementView = this.getCellView(a.target);
    var b = this.options.paper.snapToGrid({
      x: a.clientX,
      y: a.clientY
    });
    this.notify("selection-box:pointerdown", a, b.x, b.y)
  },
  startTranslatingSelection: function (a) {
    this._action = "translating", this.options.graph.startBatch("selection-translate");
    var b = this.options.paper.snapToGrid({
      x: a.clientX,
      y: a.clientY
    });
    this._snappedClientX = b.x, this._snappedClientY = b.y
  },
  adjustSelection: function (a) {
    a = joint.util.normalizeEvent(a);
    var b, c;
    switch (this._action) {
      case "selecting":
        b = a.clientX - this._clientX, c = a.clientY - this._clientY;
        var d = parseInt(this.$el.css("left"), 10),
          e = parseInt(this.$el.css("top"), 10);
        this.$el.css({
          left: b < 0 ? this._offsetX + b : d,
          top: c < 0 ? this._offsetY + c : e,
          width: Math.abs(b),
          height: Math.abs(c)
        });
        break;
      case "translating":
        var f = this.options.paper.snapToGrid({
            x: a.clientX,
            y: a.clientY
          }),
          g = f.x,
          h = f.y;
        if (b = g - this._snappedClientX, c = h - this._snappedClientY, b || c) {
          if (this.translateSelectedElements(b, c), this.boxesUpdated) this.model.length > 1 && this.updateSelectionBoxes();
          else {
            var i = this.options.paper.scale();
            this.$el.children(".selection-box").add(this.$selectionWrapper).css({
              left: "+=" + b * i.sx,
              top: "+=" + c * i.sy
            })
          }
          this._snappedClientX = g, this._snappedClientY = h
        }
        this.notify("selection-box:pointermove", a, g, h);
        break;
      default:
        this._action && this.pointermove(a)
    }
    this.boxesUpdated = !1
  },
  translateSelectedElements: function (a, b) {
    var c = {};
    this.model.each(function (d) {
      if (!c[d.id]) {
        var e = {
          selection: this.cid
        };
        d.translate(a, b, e), d.getEmbeddedCells({
          deep: !0
        }).forEach(function (a) {
          c[a.id] = !0
        });
        var f = this.options.graph.getConnectedLinks(d);
        f.forEach(function (d) {
          c[d.id] || (d.translate(a, b, e), c[d.id] = !0)
        })
      }
    }.bind(this))
  },
  notify: function (a, b) {
    var c = Array.prototype.slice.call(arguments, 1);
    this.trigger.apply(this, [a, this._activeElementView].concat(c))
  },
  getElementsInSelectedArea: function (a) {
    var b = this.options.paper,
      c = {
        strict: this.options.strictSelection
      };
    if (this.options.useModelGeometry) {
      var d = b.model.findModelsInArea(a, c);
      return d.map(b.findViewByModel, b).filter(function (a) {
        return !!a
      })
    }
    return b.findViewsInArea(a, c)
  },
  pointerup: function (a) {
    this._action && (this.triggerAction(this._action, "pointerup", a), this.stopSelecting(a), this._activeElementView = null, this._action = null)
  },
  destroySelectionBox: function (a) {
    this.$('[data-model="' + a.get("id") + '"]').remove(), 0 === this.$el.children(".selection-box").length && this.hide(), this._boxCount = Math.max(0, this._boxCount - 1)
  },
  hide: function () {
    this.$el.removeClass("lasso selected")
  },
  showSelected: function () {
    this.$el.addClass("selected")
  },
  showLasso: function () {
    this.$el.addClass("lasso")
  },
  destroyAllSelectionBoxes: function () {
    this.hide(), this.$el.children(".selection-box").remove(), this._boxCount = 0
  },
  createSelectionBox: function (a) {
    var b = a.findView(this.options.paper);
    if (b) {
      var c = b.getBBox({
        useModelGeometry: this.options.useModelGeometry
      });
      $("<div/>").addClass("selection-box").attr("data-model", a.get("id")).css({
        left: c.x,
        top: c.y,
        width: c.width,
        height: c.height
      }).appendTo(this.el), this.showSelected(), this._boxCount++
    }
  },
  createSelectionWrapper: function () {
    var a = $("<div/>", {
        "class": "selection-wrapper"
      }),
      b = $("<div/>", {
        "class": "box"
      });
    return a.append(b), a.attr("data-selection-length", this.model.length), this.$el.prepend(a), a
  },
  updateSelectionWrapper: function () {
    var a = {
        x: 1 / 0,
        y: 1 / 0
      },
      b = {
        x: 0,
        y: 0
      };
    if (this.model.each(function (c) {
        var d = this.options.paper.findViewByModel(c);
        if (d) {
          var e = d.getBBox({
            useModelGeometry: this.options.useModelGeometry
          });
          a.x = Math.min(a.x, e.x), a.y = Math.min(a.y, e.y), b.x = Math.max(b.x, e.x + e.width), b.y = Math.max(b.y, e.y + e.height)
        }
      }.bind(this)), this.$selectionWrapper.css({
        left: a.x,
        top: a.y,
        width: b.x - a.x,
        height: b.y - a.y
      }).attr("data-selection-length", this.model.length), joint.util.isFunction(this.options.boxContent)) {
      var c = this.$(".box"),
        d = this.options.boxContent.call(this, c[0]);
      d && c.html(d)
    }
  },
  updateSelectionBoxes: function () {
    if (this._boxCount) {
      this.hide();
      for (var a = this.$el.children(".selection-box"), b = 0, c = a.length; b < c; b++) {
        var d = a[b],
          e = $(d).remove().attr("data-model"),
          f = this.model.get(e);
        f && this.createSelectionBox(f)
      }
      this.updateSelectionWrapper(), this.boxesUpdated = !0
    }
  },
  onRemove: function () {
    $(document.body).off(".selection", this.adjustSelection), $(document).off(".selection", this.pointerup)
  },
  onHandlePointerDown: function (a) {
    this._action = $(a.target).closest(".handle").attr("data-action"), this._action && (a.preventDefault(), a.stopPropagation(), a = joint.util.normalizeEvent(a), this._clientX = a.clientX, this._clientY = a.clientY, this._startClientX = this._clientX, this._startClientY = this._clientY, this.triggerAction(this._action, "pointerdown", a))
  },
  getCellView: function (a) {
    var b = this.model.get(a.getAttribute("data-model"));
    return b && b.findView(this.options.paper)
  },
  pointermove: function (a) {
    if (this._action) {
      var b = this.options.paper.snapToGrid({
          x: a.clientX,
          y: a.clientY
        }),
        c = this.options.paper.snapToGrid({
          x: this._clientX,
          y: this._clientY
        }),
        d = b.x - c.x,
        e = b.y - c.y;
      this.triggerAction(this._action, "pointermove", a, d, e, a.clientX - this._startClientX, a.clientY - this._startClientY), this._clientX = a.clientX, this._clientY = a.clientY
    }
  },
  triggerAction: function (a, b, c) {
    var d = Array.prototype.slice.call(arguments, 2);
    d.unshift("action:" + a + ":" + b), this.trigger.apply(this, d)
  },
  onRemoveElement: function (a) {
    this.destroySelectionBox(a), this.updateSelectionWrapper()
  },
  onResetElements: function (a) {
    this.destroyAllSelectionBoxes(), a.each(this.createSelectionBox.bind(this)), this.updateSelectionWrapper()
  },
  onAddElement: function (a) {
    this.createSelectionBox(a), this.updateSelectionWrapper()
  },
  removeElements: function (a) {
    var b = this.collection.toArray();
    this.cancelSelection(), this.options.graph.removeCells(b, {
      selection: this.cid
    })
  },
  startRotating: function (a) {
    this.options.graph.trigger("batch:start");
    var b = this.options.graph.getBBox(this.model.models).center(),
      c = this.options.paper.snapToGrid({
        x: a.clientX,
        y: a.clientY
      }),
      d = this.model.toArray().reduce(function (a, b) {
        return a[b.id] = g.normalizeAngle(b.get("angle") || 0), a
      }, {});
    this._rotation = {
      center: b,
      clientAngle: g.point(c).theta(b),
      initialAngles: d
    }
  },
  startResizing: function (a) {
    var b = this.options.paper,
      c = this.options.graph,
      d = b.options.gridSize,
      e = this.model.toArray(),
      f = c.getBBox(e),
      g = joint.util.invoke(e, "getBBox"),
      h = g.reduce(function (a, b) {
        return b.width < a ? b.width : a
      }, 1 / 0),
      i = g.reduce(function (a, b) {
        return b.height < a ? b.height : a
      }, 1 / 0);
    this._resize = {
      cells: c.getSubgraph(e),
      bbox: f,
      minWidth: d * f.width / h,
      minHeight: d * f.height / i
    }, c.trigger("batch:start")
  },
  doResize: function (a, b, c) {
    var d = this._resize,
      e = d.bbox,
      f = e.width,
      g = e.height,
      h = Math.max(f + b, d.minWidth),
      i = Math.max(g + c, d.minHeight);
    (Math.abs(f - h) > .001 || Math.abs(g - i) > .001) && (this.options.graph.resizeCells(h, i, d.cells, {
      selection: this.cid
    }), e.width = h, e.height = i, this.updateSelectionBoxes())
  },
  doRotate: function (a) {
    var b = this._rotation,
      c = this.options.rotateAngleGrid,
      d = this.options.paper.snapToGrid({
        x: a.clientX,
        y: a.clientY
      }),
      e = b.clientAngle - g.point(d).theta(b.center);
    Math.abs(e) > .001 && (this.model.each(function (a) {
      var d = g.snapToGrid(b.initialAngles[a.id] + e, c);
      a.rotate(d, !0, b.center, {
        selection: this.cid
      })
    }, this), this.updateSelectionBoxes())
  },
  stopBatch: function () {
    this.options.graph.trigger("batch:stop")
  },
  getAction: function () {
    return this._action
  }
}, {
  depthComparator: function (a) {
    return a.getAncestors().length
  }
}),
  joint.ui.SelectionView = joint.ui.Selection;

joint.ui.Clipboard = Backbone.Collection.extend({
  LOCAL_STORAGE_KEY: "joint.ui.Clipboard.cells",
  defaults: {
    useLocalStorage: !0
  },
  //a:Backbone.Collection,b:graph
  copyElements: function (collection, graph, c) {
    this.options = joint.util.assign({}, this.defaults, c), c = this.options;
    var d = collection.toArray(),
      e = joint.util.sortBy(graph.cloneSubgraph(d, c), function (a) {
        return a.isLink() ? 2 : 1
      });
    return this.reset(e), c.useLocalStorage && window.localStorage && localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.toJSON())), d
  },
  cutElements: function (collection, graph, c) {
    var d = this.copyElements(collection, graph, c);
    return graph.trigger("batch:start", {
      batchName: "cut"
    }), joint.util.invoke(d, "remove"), graph.trigger("batch:stop", {
      batchName: "cut"
    }), d
  },
  pasteCells: function (graph, b) {
    if (b = joint.util.defaults(b || {}, this.options), b.useLocalStorage && this.isEmpty() && window.localStorage) {
      var c = {
          cells: JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_KEY))
        },
        graph = (new joint.dia.Graph).fromJSON(c, {
          sort: !1
        });
      this.reset(graph.getCells())
    }
    var cellsArray = this.map(function (cell) {
      return this.modifyCell(cell, b)
    }.bind(this));
    return graph.trigger("batch:start", {
      batchName: "paste"
    }),
      graph.addCells(cellsArray),
      graph.trigger("batch:stop", {
        batchName: "paste"
      }),
      this.copyElements(this, graph),
      cellsArray
  },
  clear: function () {
    this.options = {}, this.reset([]), window.localStorage && localStorage.removeItem(this.LOCAL_STORAGE_KEY)
  },
  modifyCell: function (cell, b) {
    return cell.unset("z"),
    cell.isLink() && b.link && cell.set(b.link),
    b.translate && cell.translate(b.translate.dx || 20, b.translate.dy || 20),
      cell.collection = null,
      cell
  }
});

// ui.Halo
!function (joint) {
  "use strict";
  //b: linkHalo
  var linkHalo = function () {
    this.options = {
      handles: [{
        name: "remove",
        position: "nw",
        events: {
          pointerdown: "removeElement"
        },
        icon: null
      }, {
        name: "direction",
        position: "se",
        events: {
          pointerdown: "directionSwap"
        },
        icon: null
      }],
      //a: linkView
      bbox: function (linkView) {
        var b = .5 * linkView.getConnectionLength();
        return linkView.getPointAtLength(b)
      },
      typeCssName: "type-link",
      tinyThreshold: -1,
      smallThreshold: -1,
      boxContent: !1
    }
  };
  linkHalo.prototype.directionSwap = function () {
    var cell = this.options.cellView.model;
    cell.set({source: cell.get("target"), target: cell.get("source")}, {halo: this.cid})
  };
  // c: elementHalo
  var elementHalo = function () {
    this.options = {
      handles: [
        {
          name: "remove",
          position: "nw",
          events: {
            pointerdown: "removeElement"
          },
          icon: null
        },
        {
          name: "resize",
          position: "se",
          events: {
            pointerdown: "startResizing",
            pointermove: "doResize",
            pointerup: "stopBatch"
          },
          icon: null
        },
        {
          name: "clone",
          position: "n",
          events: {
            pointerdown: "startCloning",
            pointermove: "doClone",
            pointerup: "stopCloning"
          },
          icon: null
        },
        {
          name: "link",
          position: "s",
          events: {
            pointerdown: "startLinking",
            pointermove: "doLink",
            pointerup: "stopLinking"
          },
          icon: null
        },
        {
          name: "unlink",
          position: "w",
          events: {
            pointerdown: "unlinkElement"
          },
          icon: null
        },
        {
          name: "rotate",
          position: "sw",
          events: {
            pointerdown: "startRotating",
            pointermove: "doRotate",
            pointerup: "stopBatch"
          },
          icon: null
        }],
      bbox: function (a, b) {
        return a.getBBox({
          useModelGeometry: b.options.useModelGeometry
        })
      },
      typeCssName: "type-element",
      tinyThreshold: 40,
      smallThreshold: 80,
      // <g></g> 该cellView对应的SVGElement
      magnet: function (cellView) {
        return cellView.el
      },
      loopLinkPreferredSide: "top",
      loopLinkWidth: 40,
      rotateAngleGrid: 15,
      linkAttributes: {},
      smoothLinks: void 0
    }
  };
  elementHalo.prototype.startLinking = function (evt, localX, localY) {
    this.startBatch();
    // e:paper,f:graph,g:link
    var paper = this.options.paper,
      graph = this.options.graph,
      link = this.createLinkConnectedToSource();
    link.set({target: {x: localX, y: localY}}).addTo(graph, {
      validation: !1,
      halo: this.cid,
      async: !1
    });
    var linkView = this._linkView = link.findView(paper);
    linkView.startArrowheadMove("target", {
      whenNotAllowed: "remove"
    })
  },
    elementHalo.prototype.startForking = function (b, c, d) {
      var e = this.options,
        f = e.paper,
        g = e.graph;
      this.startBatch();
      var h = e.clone(e.cellView.model, {
        fork: !0
      });
      if (!(h instanceof joint.dia.Cell))
        throw new Error('ui.Halo: option "clone" has to return a cell.');
      this.centerElementAtCursor(h, c, d),
        h.addTo(g, {halo: this.cid, async: !1});
      var i = this.createLinkConnectedToSource(),
        j = this._cloneView = h.findView(f),
        k = this.getElementMagnet(j, "target"),
        l = this.getLinkEnd(j, k);
      i.set("target", l).addTo(g, {halo: this.cid, async: !1}),
        j.pointerdown(b, c, d)
    },
    // 获得元素的cellView的el，即对应的SVGElement
    elementHalo.prototype.getElementMagnet = function (cellView, c) {
      var d = this.options.magnet;
      if (joint.util.isFunction(d)) {
        var e = d.call(this, cellView, c);
        if (e instanceof SVGElement) return e
      }
      throw new Error("ui.Halo: magnet() has to return an SVGElement.")
    },
    //
    elementHalo.prototype.getLinkEnd = function (cellView, b) {
      var c = {id: cellView.model.id};
      // element magnet有port的情形
      if (b !== cellView.el) {
        var port = b.getAttribute("port");
        port ? c.port = port : c.selector = cellView.getSelector(b)
      }
      return c
    },
    //创建并返回连接到source的link
    elementHalo.prototype.createLinkConnectedToSource = function () {
      // c:paper d:cellView，e:magnet, f:linkEnd, g:defaultLink
      var paper = this.options.paper,
        cellView = this.options.cellView,
        magnet = this.getElementMagnet(cellView, "source"),
        // 在element magnet 没有port时，返回cellView的model id {id:xxxxx}
        linkEnd = this.getLinkEnd(cellView, magnet),
        // 返回default Link的clone,将cellView的modelId设为source
        defaultLink = paper.getDefaultLink(cellView, magnet).set("source", linkEnd);
      // 用linkAttributes部分重写link的属性，这里为{},则不改变其属性
      return defaultLink.attr(this.options.linkAttributes),
      joint.util.isBoolean(this.options.smoothLinks) && defaultLink.set("smooth", this.options.smoothLinks),
        defaultLink
    },
    elementHalo.prototype.startResizing = function (a) {
      this.startBatch(),
        this._flip = [1, 0, 0, 1, 1, 0, 0, 1][Math.floor(g.normalizeAngle(this.options.cellView.model.get("angle")) / 45)]
    },
    elementHalo.prototype.startRotating = function (a, b, c) {
      this.startBatch();
      var d = this.options.cellView.model.getBBox().center(),
        e = g.normalizeAngle(this.options.cellView.model.get("angle"));
      this._center = d,
        this._rotationStartAngle = e || 0,
        this._clientStartAngle = g.point(b, c).theta(d)
    },
    elementHalo.prototype.doResize = function (a, b, c, d, e) {
      var f = this.options.cellView.model.get("size"),
        g = Math.max(f.width + (this._flip ? d : e), 1),
        h = Math.max(f.height + (this._flip ? e : d), 1);
      this.options.cellView.model.resize(g, h, {absolute: !0})
    },
    elementHalo.prototype.doRotate = function (a, b, c) {
      var d = this._clientStartAngle - g.point(b, c).theta(this._center),
        e = g.snapToGrid(this._rotationStartAngle + d, this.options.rotateAngleGrid);
      this.options.cellView.model.rotate(e, !0)
    },
    elementHalo.prototype.doClone = function (a, b, c) {
      var d = this._cloneView;
      d && d.pointermove(a, b, c)
    },
    elementHalo.prototype.startCloning = function (b, c, d) {
      var e = this.options;
      this.startBatch();
      var f = e.clone(e.cellView.model, {clone: !0});
      if (!(f instanceof joint.dia.Cell))
        throw new Error('ui.Halo: option "clone" has to return a cell.');
      this.centerElementAtCursor(f, c, d),
        f.addTo(e.graph, {halo: this.cid, async: !1}),
        this._cloneView = f.findView(e.paper),
        this._cloneView.pointerdown(b, c, d)
    },
    elementHalo.prototype.centerElementAtCursor = function (a, b, c) {
      var d = a.getBBox().center(),
        e = b - d.x,
        f = c - d.y;
      a.translate(e, f)
    },
    elementHalo.prototype.doFork = function (a, b, c) {
      var d = this._cloneView;
      d && d.pointermove(a, b, c)
    },
    elementHalo.prototype.doLink = function (evt, x, y) {
      this._linkView && this._linkView.pointermove(evt, x, y)
    },
    elementHalo.prototype.stopLinking = function (evt) {
      this._linkView && (
        this._linkView.pointerup(evt),
        this._linkView.model.hasLoop() && this.makeLoopLink(this._linkView.model),
          this.stopBatch(),
          // 触发link:add事件
          this.triggerAction("link", "add", this._linkView.model),
          this._linkView = null
      )
    },
    elementHalo.prototype.stopForking = function (a, b, c) {
      var d = this._cloneView;
      d && d.pointerup(a, b, c),
        this.stopBatch()
    },
    elementHalo.prototype.stopCloning = function (a, b, c) {
      var d = this._cloneView;
      d && d.pointerup(a, b, c),
        this.stopBatch()
    },
    elementHalo.prototype.unlinkElement = function (a) {
      this.startBatch(),
        this.options.graph.removeLinks(this.options.cellView.model),
        this.stopBatch()
    },
    elementHalo.prototype.makeLoopLink = function (b) {
      var c, d, e = this.options.loopLinkWidth,
        f = this.options.paper.options,
        h = g.rect({
          x: 0,
          y: 0,
          width: f.width,
          height: f.height
        }),
        i = V(this.options.cellView.el).bbox(!1, this.options.paper.viewport),
        j = joint.util.uniq([this.options.loopLinkPreferredSide, "top", "bottom", "left", "right"]),
        k = j.find(function (a) {
          var b, f = 0,
            j = 0;
          switch (a) {
            case "top":
              b = g.point(i.x + i.width / 2, i.y - e), f = e / 2;
              break;
            case "bottom":
              b = g.point(i.x + i.width / 2, i.y + i.height + e), f = e / 2;
              break;
            case "left":
              b = g.point(i.x - e, i.y + i.height / 2), j = e / 2;
              break;
            case "right":
              b = g.point(i.x + i.width + e, i.y + i.height / 2), j = e / 2
          }
          return c = g.point(b).offset(-f, -j),
            d = g.point(b).offset(f, j),
          h.containsPoint(c) && h.containsPoint(d)
        }, this);
      k && b.set("vertices", [c, d])
    },

    joint.ui.Halo = joint.mvc.View.extend({
      className: "halo",
      events: {
        "mousedown .handle": "onHandlePointerDown",
        "touchstart .handle": "onHandlePointerDown"
      },
      options: {
        clearAll: !0,
        clearOnBlankPointerdown: !0,
        useModelGeometry: !1,
        clone: function (a, b) {
          return a.clone().unset("z")
        },
        type: "surrounding"
      },
      init: function () {
        // d = this.options, f:cell，h:paper，i:graph
        var e = this.options.cellView,
          cell = e.model,
          g = cell.isLink() ? new linkHalo : new elementHalo;
        joint.util.assign(this, joint.util.omit(g, "options"));
        var paper = e.paper,
          graph = paper.model;
        joint.util.defaults(this.options, g.options, {paper: paper, graph: graph}),
          joint.util.bindAll(this, "pointermove", "pointerup", "render", "update"),
        this.options.clearAll && this.constructor.clear(paper),
          this.listenTo(graph, "reset", this.remove),
          this.listenTo(cell, "remove", this.remove),
          this.listenTo(paper, "halo:create", this.remove),
        this.options.clearOnBlankPointerdown && this.listenTo(paper, "blank:pointerdown", this.remove),
          this.listenTo(graph, "all", this.update),
          this.listenTo(paper, "scale translate", this.update),
          $(document.body).on("mousemove touchmove", this.pointermove),
          $(document).on("mouseup touchend", this.pointerup),
          this.handles = [],
          joint.util.toArray(this.options.handles).forEach(this.addHandle, this)
      },
      render: function () {
        var b = this.options;
        switch (
          this.$el.empty(),
            this.$handles = $("<div/>").addClass("handles").appendTo(this.el),
            this.$box = $("<label/>").addClass("box").appendTo(this.el),
            this.$pieToggles = {},
            this.$el.addClass(b.type),
            this.$el.addClass(this.cellTypeCssClass()),
            this.$el.attr("data-type", b.cellView.model.get("type")),
            this.$handles.append(joint.util.toArray(this.handles).map(this.renderHandle, this)),
            b.type
          ) {
          case "toolbar":
          case "surrounding":
            this.hasHandle("fork") && this.toggleFork();
            break;
          default:
            throw new Error("ui.Halo: unknown type")
        }
        return this.update(),
          this.$el.addClass("animate").appendTo(b.paper.el),
          this
      },
      update: function () {
        if (this.isRendered()) {
          this.updateBoxContent();
          var a = this.getBBox();
          this.$el.toggleClass("tiny", a.width < this.options.tinyThreshold && a.height < this.options.tinyThreshold),
            this.$el.toggleClass("small", !this.$el.hasClass("tiny") && a.width < this.options.smallThreshold && a.height < this.options.smallThreshold),
            this.$el.css({width: a.width, height: a.height, left: a.x, top: a.y}),
          this.hasHandle("unlink") && this.toggleUnlink()
        }
      },
      getBBox: function () {
        var b = this.options.cellView,
          c = this.options.bbox,
          d = joint.util.isFunction(c) ? c(b, this) : c;
        return d = joint.util.defaults({}, d, {
          x: 0,
          y: 0,
          width: 1,
          height: 1
        }),
          g.rect(d)
      },
      cellTypeCssClass: function () {
        return this.options.typeCssName
      },
      updateBoxContent: function () {
        this.$box.remove();
      },
      extendHandles: function (b) {
        joint.util.forIn(b, function (b) {
          var c = this.getHandle(b.name);
          c && joint.util.assign(c, b)
        }.bind(this))
      },
      addHandle: function (handle) {
        var c = this.getHandle(handle.name);
        return c || (
          this.handles.push(handle),
            joint.util.forIn(handle.events, function (c, d) {
              joint.util.isString(c) ? this.on("action:" + handle.name + ":" + d, this[c], this) : this.on("action:" + handle.name + ":" + d, c)
            }.bind(this)),
          this.$handles && this.renderHandle(handle).appendTo(this.$handles)),
          this
      },
      renderHandle: function (handle) {
        var c = this.getHandleIdx(handle.name),
          d = $("<div/>").addClass("handle").addClass(handle.name).attr("data-action", handle.name).prop("draggable", !1);
        switch (this.options.type) {
          case "toolbar":
          case "surrounding":
            d.addClass(handle.position),
            handle.content && d.html(handle.content);
            break;
        }
        return handle.icon && this.setHandleIcon(d, handle.icon),
          joint.util.setAttributesBySelector(d, handle.attrs),
          d
      },
      setHandleIcon: function (a, b) {
        switch (this.options.type) {
          case "toolbar":
          case "surrounding":
            a.css("background-image", "url(" + b + ")")
        }
      },
      removeHandle: function (handleName) {
        //c: idx,d:handle
        var idx = this.getHandleIdx(handleName),
          handle = this.handles[idx];
        return handle && (
          joint.util.forIn(handle.events, function (a, c) {
            this.off("action:" + handleName + ":" + c)
          }.bind(this)),
            this.$(".handle." + handleName).remove(),
            this.handles.splice(idx, 1)
        ),
          this
      },
      hasHandle: function (handleName) {
        return this.getHandleIdx(handleName) !== -1
      },
      getHandleIdx: function (handleName) {
        return joint.util.toArray(this.handles).findIndex(function (a) {
          return a.name === handleName
        })
      },
      getHandle: function (handleName) {
        return joint.util.toArray(this.handles).find(function (a) {
          return a.name === handleName
        })
      },
      toggleHandle: function (handleName, b) {
        var handle = this.getHandle(handleName);
        if (handle) {
          var d = this.$(".handle." + handleName);
          void 0 === b && (b = !d.hasClass("selected")),
            d.toggleClass("selected", b);
          var e = b ? handle.iconSelected : handle.icon;
          e && this.setHandleIcon(d, e)
        }
        return this
      },
      selectHandle: function (handleName) {
        return this.toggleHandle(handleName, !0)
      },
      deselectHandle: function (handleName) {
        return this.toggleHandle(handleName, !1)
      },

      onHandlePointerDown: function (evt) {
        if (this._action = $(evt.target).closest(".handle").attr("data-action"), this._action) {
          evt.preventDefault(),
            evt.stopPropagation(),
            evt = joint.util.normalizeEvent(evt);
          var c = this.options.paper.snapToGrid({x: evt.clientX, y: evt.clientY});
          this._localX = c.x,
            this._localY = c.y,
            this._evt = evt,
            this.triggerAction(this._action, "pointerdown", evt, c.x, c.y)
        }
      },
      // b: "pointerdown"
      triggerAction: function (action, b, evt) {
        var d = Array.prototype.slice.call(arguments, 2);
        // ["action:link:pointerdown", evt, 430, 380]
        d.unshift("action:" + action + ":" + b),
          this.trigger.apply(this, d)
      },
      stopBatch: function () {
        this.options.graph.stopBatch("halo", {halo: this.cid})
      },
      startBatch: function () {
        this.options.graph.startBatch("halo", {halo: this.cid})
      },
      pointermove: function (evt) {
        if (this._action) {
          evt.preventDefault(),
            evt.stopPropagation(),
            evt = joint.util.normalizeEvent(evt);
          var c = this.options.paper.snapToGrid({x: evt.clientX, y: evt.clientY}),
            d = c.x - this._localX,
            e = c.y - this._localY;
          this._localX = c.x,
            this._localY = c.y,
            this._evt = evt,
            this.triggerAction(this._action, "pointermove", evt, c.x, c.y, d, e)
        }
      },
      pointerup: function (evt) {
        var b = this._action;
        if (b) {
          this._action = null,
            this._evt = null;
          var c = this.options.paper.snapToGrid({x: evt.clientX, y: evt.clientY});
          this.triggerAction(b, "pointerup", evt, c.x, c.y)
        }
      },
      onRemove: function () {
        $(document.body).off("mousemove touchmove", this.pointermove),
          $(document).off("mouseup touchend", this.pointerup),
        this._action && this._evt && this.pointerup(this._evt),
        this.options.graph.hasActiveBatch("halo") && this.stopBatch()
      },
      onSetTheme: function () {
        // this.setPieIcons()
      },
      removeElement: function () {
        this.options.cellView.model.remove()
      },
      toggleUnlink: function () {
        var a = this.options.graph.getConnectedLinks(this.options.cellView.model).length > 0;
        this.$handles.children(".unlink").toggleClass("hidden", !a)
      },
      toggleFork: function () {
        var a = this.options.cellView.model.clone(),
          b = this.options.paper.createViewForModel(a),
          c = this.options.paper.options.validateConnection(this.options.cellView, null, b, null, "target");
        this.$handles.children(".fork").toggleClass("hidden", !c),
          b.remove(),
          a = null
      },
      isOpen: function (a) {
        return !!this.isRendered() && (a ? this.$pieToggles[a].hasClass("open") : this.$el.hasClass("open"))

      },
      isRendered: function () {
        return void 0 !== this.$box
      }
    }, {
      clear: function (a) {
        a.trigger("halo:create")
      }
    })
}(joint);

// ui.Toolbar
!function (joint, b) {
  joint.ui.Toolbar = joint.mvc.View.extend({
    options: {},
    align: ["left", "right"],
    className: "toolbar",
    defaultGroup: "default",
    widgets: [],
    groupViews: [],
    init: function () {
      this.tools = joint.util.toArray(this.options.tools),
        this.groups = this.options.groups || {}
    },
    getWidgetByName: function (widgetName) {
      return this.widgets.find(function (b) {
        return b.options.name === widgetName
      })
    },
    getWidgets: function () {
      return this.widgets
    },
    groupsWithItemsPairs: function () {
      //b:groups
      var groups = {};
      this.tools.forEach(function (tool) {
        var groupName = tool.group || this.defaultGroup;
        groups[groupName] = groups[groupName] || {items: [], group: {}},
          groups[groupName].items.push(tool),
          groups[groupName].group = this.groups[groupName] || {}
      }, this);
      // c:groupNames
      for (var groupNames = Object.keys(groups), d = [], e = 0; e < groupNames.length; e++) {
        var gName = groupNames[e];
        d.push([gName, groups[gName]])
      }
      // 按group的index排序
      var h = joint.util.sortBy(d, function (a) {
        return a[1].group.index
      });
      return joint.util.sortBy(h, function (a) {
        return a[1].group.align || "left"
      })
    },
    render: function () {
      // [groupName, groups[groupName]]
      var a = this.groupsWithItemsPairs(),
        b = !1;
      return a.forEach(function (a) {
        var groupName = a[0],
          groupObj = a[1],
          e = this.renderGroup(groupName, groupObj);
        !b && groupObj.group.align && "right" === groupObj.group.align && (b = !0, e.addClass("group-first")),
          e.appendTo(this.el)
      }, this), this
    },
    renderGroup: function (groupName, groupObj) {
      // d:groupView
      var groupView = new toolbarGroupView({
        name: groupName,
        align: groupObj.group.align,
        items: groupObj.items,
        references: this.options.references
      });
      return this.groupViews.push(groupView),
        groupView.on("all", function () {
          this.trigger.apply(this, arguments)
        }.bind(this)),
        groupView.render(),
        this.widgets = this.widgets.concat(groupView.widgets),
        groupView.$el
    },
    onRemove: function () {
      joint.util.invoke(this.groupViews, "off"),
        joint.util.invoke(this.groupViews, "remove")
    }
  });
  //c:toolbarGroupView
  var toolbarGroupView = joint.mvc.View.extend({
    className: "toolbar-group",
    init: function () {
      this.widgets = []
    },
    onRender: function () {
      this.$el.attr("data-group", this.options.name),
        this.$el.addClass(this.options.align),
        this.renderItems()
    },
    renderItems: function () {
      joint.util.toArray(this.options.items).forEach(function (toolItem) {
        var b = this.createWidget(toolItem);
        this.$el.append(b.$el)
      }, this)
    },
    //b:toolItem，c:widget
    createWidget: function (toolItem) {
      var widget = joint.ui.Widget.create(toolItem, this.options.references);
      return widget.on("all", function (a) {
        var c = Array.prototype.slice.call(arguments, 1);
        this.trigger.apply(this, [toolItem.name + ":" + a].concat(c))
      }.bind(this)),
        this.widgets.push(widget),
        widget
    },
    onRemove: function () {
      joint.util.invoke(this.widgets, "off"), joint.util.invoke(this.widgets, "remove")
    }
  })
}(joint, _),
  // ui.Widget
  function (joint) {
    joint.ui.Widget = joint.mvc.View.extend({
      className: "widget",
      references: [],
      constructor: function (b, c) {
        this.availableReferences = c || {},
          joint.mvc.View.prototype.constructor.call(this, b)
      },
      updateAttrs: function (b) {
        joint.util.setAttributesBySelector(this.$el, b)
      },
      bindEvents: function () {
      },
      validateReferences: function () {
        var a = this.references || [],
          b = [];
        return a.forEach(function (a) {
          void 0 === this.availableReferences[a] && b.push(a)
        }, this), b
      },
      getReference: function (a) {
        return this.availableReferences[a]
      },
      getReferences: function () {
        return this.availableReferences
      }
    }, {
      //b:item，c:references, d:type
      create: function (item, references) {
        var type = joint.util.camelCase(joint.util.isString(item) ? item : item.type);
        if (!joint.util.isFunction(joint.ui.widgets[type]))
          throw new Error('Widget: unable to find widget: "' + type + '"');
        // e: widget,f:validReferences
        var widget = new joint.ui.widgets[type](item, references),
          validReferences = widget.validateReferences(references);
        if (validReferences.length > 0)
          throw new Error('Widget: "' + type + '" missing dependency: ' + validReferences.join(", "));
        return widget.render(),
          widget.updateAttrs(item.attrs),
          widget.bindEvents(),
          widget.$el.attr("data-type", type),
        item.name && widget.$el.attr("data-name", item.name),
          widget
      }
    }),
      joint.ui.widgets = {
        checkbox: joint.ui.Widget.extend({
          tagName: "label",
          events: {
            "change .input": "onChange",
            mousedown: "pointerdown",
            touchstart: "pointerdown",
            mouseup: "pointerup",
            touchend: "pointerup"
          },
          init: function () {
            joint.util.bindAll(this, "pointerup")
          },
          render: function () {
            var a = this.options,
              c = $("<span/>").text(a.label || "");
            return this.$input = $("<input/>",
              {
                type: "checkbox",
                "class": "input"
              }).prop("checked", !!a.value),
              this.$span = $("<span/>"),
              this.$el.append([c, this.$input, this.$span]),
              this
          },
          onChange: function (a) {
            this.trigger("change", !!a.target.checked, a)
          },
          pointerdown: function (evt) {
            evt = joint.util.normalizeEvent(evt),
              this.$el.addClass("is-in-action"),
              this.trigger("pointerdown", evt),
              $(document).on("mouseup.checkbox touchend.checkbox", this.pointerup)
          },
          pointerup: function (evt) {
            evt = joint.util.normalizeEvent(evt),
              $(document).off("mouseup.checkbox touchend.checkbox"),
              this.trigger("pointerdown", evt),
              this.$el.removeClass("is-in-action")
          }
        }),
        toggle: joint.ui.Widget.extend({
          tagName: "label",
          events: {
            "change input.toggle": "onChange",
            mousedown: "pointerdown",
            touchstart: "pointerdown",
            mouseup: "pointerup",
            touchend: "pointerup"
          },
          init: function () {
            joint.util.bindAll(this, "pointerup")
          },
          render: function () {
            var a = this.options,
              c = $("<span/>").text(a.label || ""),
              d = $("<span><i/></span>"),
              e = $("<input/>", {
                type: "checkbox",
                "class": "toggle"
              }).prop("checked", !!a.value),
              f = $("<div/>").addClass(a.type);
            return this.$el.append([c, f.append(e, d)]), this
          },
          onChange: function (a) {
            this.trigger("change", !!a.target.checked, a)
          },
          pointerdown: function (c) {
            c = joint.util.normalizeEvent(c), this.$el.addClass("is-in-action"), this.trigger("pointerdown", c), $(document).on("mouseup.toggle touchend.toggle", this.pointerup)
          },
          pointerup: function (c) {
            c = joint.util.normalizeEvent(c), $(document).off("mouseup.toggle touchend.toggle"), this.$el.removeClass("is-in-action"), this.trigger("pointerup", c)
          }
        }),
        separator: joint.ui.Widget.extend({
          render: function () {
            return this.options.width && this.$el.css({
              width: this.options.width
            }), this
          }
        }),
        label: joint.ui.Widget.extend({
          tagName: "label",
          render: function () {
            return this.$el.text(this.options.text), this
          }
        }),
        range: joint.ui.Widget.extend({
          events: {
            "change .input": "onChange",
            "input .input": "onChange"
          },
          render: function () {
            var a, c = this.options;
            return this.$output = $("<output/>").text(c.value),
              a = $("<span/>").addClass("units").text(c.unit),
              this.$input = $("<input/>", {
                type: "range",
                name: c.type,
                min: c.min,
                max: c.max,
                step: c.step,
                "class": "input"
              }).val(c.value),
              this.$el.append([this.$input, this.$output, a]), this
          },
          onChange: function (a) {
            var b = parseInt(this.$input.val(), 10);
            b !== this.currentValue && (this.currentValue = b, this.$output.text(b), this.trigger("change", b, a))
          },
          setValue: function (a) {
            this.$input.val(a),
              this.$output.text(a),
              this.$input.trigger("change")
          }
        }),
        selectBox: joint.ui.Widget.extend({
          render: function () {
            var b = joint.util.omit(this.options, "type", "group", "index");
            return this.selectBox = new joint.ui.SelectBox(b), this.selectBox.render().$el.appendTo(this.el), this
          },
          bindEvents: function () {
            this.selectBox.on("all", this.trigger, this)
          }
        }),
        button: joint.ui.Widget.extend({
          events: {
            mousedown: "pointerdown",
            touchstart: "pointerdown",
            click: "pointerclick",
            touchend: "pointerclick"
          },
          tagName: "button",
          render: function () {
            var a = this.options;
            return this.$el.text(a.text), this
          },
          pointerclick: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerclick", b)
          },
          pointerdown: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerdown", b)
          }
        }),
        inputText: joint.ui.Widget.extend({
          events: {
            mousedown: "pointerdown",
            touchstart: "pointerdown",
            mouseup: "pointerup",
            touchend: "pointerup",
            click: "pointerclick",
            focusin: "pointerfocusin",
            focusout: "pointerfocusout"
          },
          tagName: "div",
          render: function () {
            var a = this.options;
            return this.$label = $("<label/>").text(a.label), this.$input = $("<div/>").addClass("input-wrapper").append($("<input/>", {
              type: "text",
              "class": "input"
            }).val(a.value)), this.$el.append([this.$label, this.$input]), this
          },
          pointerclick: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerclick", b)
          },
          pointerdown: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerdown", b)
          },
          pointerup: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerup", b)
          },
          pointerfocusin: function (b) {
            b = joint.util.normalizeEvent(b), this.$el.addClass("is-focused"), this.trigger("pointerfocusin", b)
          },
          pointerfocusout: function (b) {
            b = joint.util.normalizeEvent(b), this.$el.removeClass("is-focused"), this.trigger("pointerfocusout", b)
          }
        }),
        inputNumber: joint.ui.Widget.extend({
          events: {
            mousedown: "pointerdown",
            touchstart: "pointerdown",
            mouseup: "pointerup",
            touchend: "pointerup",
            click: "pointerclick",
            focusin: "pointerfocusin",
            focusout: "pointerfocusout"
          },
          tagName: "div",
          render: function () {
            var a = this.options;
            return this.$label = $("<label/>").text(a.label), this.$input = $("<div/>").addClass("input-wrapper").append($("<input/>", {
              type: "number",
              "class": "number",
              max: a.max,
              min: a.min
            }).val(a.value)), this.$el.append([this.$label, this.$input]), this
          },
          pointerclick: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerclick", b)
          },
          pointerdown: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerdown", b)
          },
          pointerup: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerup", b)
          },
          pointerfocusin: function (b) {
            b = joint.util.normalizeEvent(b), this.$el.addClass("is-focused"), this.trigger("pointerfocusin", b)
          },
          pointerfocusout: function (b) {
            b = joint.util.normalizeEvent(b), this.$el.removeClass("is-focused"), this.trigger("pointerfocusout", b)
          }
        }),
        textarea: joint.ui.Widget.extend({
          events: {
            mousedown: "pointerdown",
            touchstart: "pointerdown",
            mouseup: "pointerup",
            touchend: "pointerup",
            click: "pointerclick",
            focusin: "pointerfocusin",
            focusout: "pointerfocusout"
          },
          tagName: "div",
          render: function () {
            var a = this.options;
            return this.$label = $("<label/>").text(a.label), this.$input = $("<div/>").addClass("input-wrapper").append($("<textarea/>", {
              "class": "textarea"
            }).text(a.value)), this.$el.append([this.$label, this.$input]), this
          },
          pointerclick: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerclick", b)
          },
          pointerdown: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerdown", b)
          },
          pointerup: function (b) {
            b = joint.util.normalizeEvent(b), this.trigger("pointerup", b)
          },
          pointerfocusin: function (b) {
            b = joint.util.normalizeEvent(b), this.$el.addClass("is-focused"), this.trigger("pointerfocusin", b)
          },
          pointerfocusout: function (b) {
            b = joint.util.normalizeEvent(b), this.$el.removeClass("is-focused"), this.trigger("pointerfocusout", b)
          }
        }),
        selectButtonGroup: joint.ui.Widget.extend({
          render: function () {
            var b = joint.util.omit(this.options, "type", "group", "index");
            return this.selectButtonGroup = new joint.ui.SelectButtonGroup(b), this.selectButtonGroup.render().$el.appendTo(this.el), this
          },
          bindEvents: function () {
            this.selectButtonGroup.on("all", this.trigger, this)
          }
        })
      },
      joint.ui.widgets.zoomIn = joint.ui.widgets.button.extend({
        references: ["paperScroller"],
        options: {
          min: .2,
          max: 5,
          step: .2
        },
        pointerdown: function (b) {
          var c = this.options;
          this.getReferences().paperScroller.zoom(c.step, {
            max: c.max,
            grid: c.step
          }), joint.ui.widgets.button.prototype.pointerdown.call(this, b)
        }
      }),
      joint.ui.widgets.zoomOut = joint.ui.widgets.button.extend({
        references: ["paperScroller"],
        options: {
          min: .2,
          max: 5,
          step: .2
        },
        pointerdown: function (b) {
          var c = this.options;
          this.getReferences().paperScroller.zoom(-c.step, {
            min: c.min,
            grid: c.step
          }), joint.ui.widgets.button.prototype.pointerdown.call(this, b)
        }
      }),
      joint.ui.widgets.zoomToFit = joint.ui.widgets.button.extend({
        references: ["paperScroller"],
        options: {
          min: .2,
          max: 5,
          step: .2
        },
        pointerdown: function (b) {
          var c = this.options;
          this.getReferences().paperScroller.zoomToFit({
            padding: 20,
            scaleGrid: c.step,
            minScale: c.min,
            maxScale: c.max
          }), joint.ui.widgets.button.prototype.pointerdown.call(this, b)
        }
      }),
      joint.ui.widgets.zoomSlider = joint.ui.widgets.range.extend({
        references: ["paperScroller"],
        options: {
          min: 20,
          max: 500,
          step: 20,
          value: 100,
          unit: " %"
        },
        bindEvents: function () {
          this.on("change", function (a) {
            this.getReferences().paperScroller.zoom(a / 100, {
              absolute: !0,
              grid: this.options.step / 100
            })
          }, this), this.getReferences().paperScroller.options.paper.on("scale", function (a) {
            this.setValue(Math.floor(100 * a))
          }, this)
        }
      }),
      joint.ui.widgets.undo = joint.ui.widgets.button.extend({
        references: ["commandManager"],
        pointerclick: function () {
          this.getReferences().commandManager.undo()
        }
      }),
      joint.ui.widgets.redo = joint.ui.widgets.button.extend({
        references: ["commandManager"],
        pointerclick: function () {
          this.getReferences().commandManager.redo()
        }
      }),
      joint.ui.widgets.fullscreen = joint.ui.widgets.button.extend({
        onRender: function () {
          var a = this.target = $(this.options.target)[0];
          a && !$.contains(window.top.document, a) && this.$el.hide()
        },
        pointerclick: function () {
          joint.util.toggleFullScreen(this.target)
        }
      })
  }(joint);
// ui.Stencil
!function (joint, util) {
  var c = {
    options: function () {
      return {
        columnWidth: this.options.width / 2 - 10,
        columns: 2,
        rowHeight: 40,
        resizeToFit: !0,
        dy: 4,
        dx: 8
      }
    },
    layoutGroup: function (graph, group) {
      if (group = group || {}, !joint.layout.GridLayout)
        throw new Error("joint.ui.Stencil: joint.layout.GridLayout is not available.");
      joint.layout.GridLayout.layout(graph, util.assign({}, this.options.layout, group.layout)) // layout(graph,this.options.layout)
    }
  };
  joint.ui.Stencil = joint.mvc.View.extend({
    className: "stencil",
    events: {
      "click .btn-expand": "openGroups",
      "click .btn-collapse": "closeGroups",
      "click .groups-toggle > .group-label": "openGroups",
      "click .group > .group-label": "onGroupLabelClick",
      "touchstart .group > .group-label": "onGroupLabelClick",
      "input .search": "onSearch",
      "focusin .search": "pointerFocusIn",
      "focusout .search": "pointerFocusOut"
    },
    options: {
      width: 200, // 240
      height: 800,
      label: "功能模块",
      groups: null, // App.config.stencil.groups
      groupsToggleButtons: !1, // true
      dropAnimation: !1, //true
      search: null, //'*': ['type', 'attrs/text/text', 'attrs/.label/text']
      layout: null, // true
      snaplines: null, // this.snaplines
      scaleClones: !1, // true
      dragStartClone: function (a) {
        return a.clone()
      }, // function...
      dragEndClone: function (a) {

        return a.clone()
      },
      layoutGroup: null,
      paperOptions: null
      //paper: this.paperScroller

    },
    init: function () {
      this.setPaper(this.options.paperScroller || this.options.paper),
        this.graphs = {},
        this.papers = {},
        this.$groups = {},
        util.bindAll(this, "onDrag", "onDragEnd", "onDropEnd"),
        $(document.body).on("mousemove.stencil touchmove.stencil", this.onDrag),
        $(window).on("mouseup.stencil touchend.stencil", this.onDragEnd),

        // 从上次被调用后，延迟200ms调用this.onSearch方法
        this.onSearch = util.debounce(this.onSearch, 200),
        this.delegateEvents(),
        this.initializeLayout()
    },

    // 初始layoutGroup和options.layout
    initializeLayout: function () {
      var a = this.options.layout; // true
      a && (
        util.isFunction(a) ? this.layoutGroup = a : (
          this.layoutGroup = c.layoutGroup.bind(this), // c.layoutGroup 函数
            this.options.layout = util.isObject(a) ? a : {}, //{}
            util.defaults(this.options.layout, c.options.call(this))) // this.options.layout = c.options
      )
    },

    // 根据paperOpt设置this.options.paperScroller/paper/graph
    setPaper: function (paperOpt) {
      var c = this.options;
      if (paperOpt instanceof joint.dia.Paper)
        c.paperScroller = null,
          c.paper = paperOpt,
          c.graph = paperOpt.model;
      else {
        // "function" == typeof joint.ui.PaperScroller 为true
        if (!("function" == typeof joint.ui.PaperScroller && paperOpt instanceof joint.ui.PaperScroller))
          throw new Error("Stencil: paper required");
        c.paperScroller = paperOpt,
          c.paper = paperOpt.options.paper,
          c.graph = paperOpt.options.paper.model
      }
    },

    // <div class="content"></div>
    renderContent: function () {
      return $("<div/>").addClass("content")
    },

    // <div class="stencil-paper-drag"></div>
    renderPaperDrag: function () {
      return $("<div/>").addClass("stencil-paper-drag")
    },

    /* <div class="search-wrap">
                  <input class="search" type="search" placeholder="search">
               </div>
            */
    renderSearch: function () {
      return $("<div/>").addClass("search-wrap").append($("<input/>", {
        type: "search",
        placeholder: "search"
      }).addClass("search"))
    },

    /* <div class="groups-toggle">
                    <label class="group-label">this.options.label即Functions</label>
                    <button class="btn btn-expand">+</button>
                    <button class="btn btn-collapse">-</button>
               </div>
            */
    renderToggleAll: function () {
      return [$("<div/>").addClass("groups-toggle").append($("<label/>").addClass("group-label").html(this.options.label)).append($("<button/>", {
        text: "+"
      }).addClass("btn btn-expand")).append($("<button/>", {
        text: "-"
      }).addClass("btn btn-collapse"))]
    },

    // <div class="elements"></div>
    renderElementsContainer: function () {
      return $("<div/>").addClass("elements")
    },

    /*
            <div class="group closed" data-name=group.name>
                   <h3 class="group-label">group.label</label>
                   <div class="elements"></div>
              </div>
           */
    renderGroup: function (group) {
      group = group || {};
      var groupEl = $("<div/>").addClass("group").attr("data-name", group.name).toggleClass("closed", !!group.closed),
        label = $("<h3/>").addClass("group-label").html(group.label || group.name),
        container = this.renderElementsContainer();
      return groupEl.append(label, container)
    },
    render: function () {
      var c = this.options;
      this.$content = this.renderContent(),
        this.$paperDrag = this.renderPaperDrag(),
        this.$el.empty().append(this.$paperDrag, this.$content),
      c.search && this.$el.addClass("searchable").prepend(this.renderSearch()),
      c.groupsToggleButtons && this.$el.addClass("collapsible").prepend(this.renderToggleAll());

      /* <div class="searchable collapsible">
                     <div class="groups-toggle">
                        <label class="group-label">this.options.label即Functions</label>
                        <button class="btn btn-expand">+</button>
                        <button class="btn btn-collapse">-</button>
                    </div>
                    <div class="search-wrap">
                      <input class="search" type="search" placeholder="search">
                   </div>
                   <div class="stencil-paper-drag"></div>
                   <div class="content"></div>
                  </div>
               */
      var d = util.defaults({
          interactive: !1,
          preventDefaultBlankAction: !1
        }, c.paperOptions), // d: {interactive:false, preventDefaultBlankAction:false }
        groupNames = Object.keys(c.groups || {});
      if (groupNames.length > 0) {
        // 对groups按group的index排序
        var sortedGroups = util.sortBy(groupNames, function (groupName) {
          return this[groupName].index
        }.bind(c.groups));
        // 每个group对应一个graph和paper，存入this.$groups,graphs和papers数组
        sortedGroups.forEach(function (groupName) {
          var group = this.options.groups[groupName],
            g = this.$groups[groupName] = this.renderGroup({
              name: groupName,
              label: group.label,
              closed: group.closed
            }).appendTo(this.$content),
            /* <div class="content">
                                 <div class="group" data-name=groupName>
                                     <h3 class="group-label">group.label</h3>
                                     <div class="elements"></div>
                                 </div>
                             </div>
                             */
            graph = new joint.dia.Graph,
            i = util.assign({}, d, group.paperOptions, {
              el: g.find(".elements"), // <div class="elements"></div>
              model: graph,
              width: group.width || c.width,
              height: group.height || c.height
            }),
            paper = new joint.dia.Paper(i);
          this.graphs[groupName] = graph,
            this.papers[groupName] = paper
        }, this)
      } else {
        var g = this.renderElementsContainer().appendTo(this.$content),
          graph = new joint.dia.Graph,
          paper = new joint.dia.Paper(util.assign(d, {
            el: g,
            model: graph,
            width: c.width,
            height: c.height
          }));
        // <div class="content">
        //      <div class="elements"></div>
        // </div>
        this.graphs.__default__ = graph,
          this.papers.__default__ = paper
      }
      return this._graphDrag = new joint.dia.Graph,
        this._paperDrag = new joint.dia.Paper({
          el: this.$paperDrag,
          width: 1,
          height: 1,
          model: this._graphDrag
        }),
        this.startListening(), this
    },
    // 对每个group对应的paper，监听cell:pointerdown事件，触发onDragStart回调
    startListening: function () {
      this.stopListening(),
        util.forIn(this.papers, function (a) {
          this.listenTo(a, "cell:pointerdown", this.onDragStart)
        }.bind(this))
    },
    // a: App.config.stencil.shapes对象
    load: function (shapes, c) {
      Array.isArray(shapes) ? this.loadGroup(shapes, c) : util.isObject(shapes) && util.forIn(this.options.groups, function (group, groupName) {
        shapes[groupName] && this.loadGroup(shapes[groupName], groupName)
      }.bind(this))
    },
    loadGroup: function (shapeCollection, groupName) {
      var graph = this.getGraph(groupName);
      // 用该方法一次性添加多个cells
      graph.resetCells(shapeCollection);
      var height = this.options.height; //800
      if (groupName && (height = this.getGroup(groupName).height), this.isLayoutEnabled() && this.layoutGroup(graph, this.getGroup(groupName)), !height) {
        var paper = this.getPaper(groupName);
        paper.fitToContent({
          minWidth: paper.options.width,
          gridHeight: 1,
          padding: this.options.paperPadding || 10
        })
      }
    },
    isLayoutEnabled: function () {
      return !!this.options.layout
    },
    getGraph: function (groupName) {
      var graph = this.graphs[groupName || "__default__"];
      if (!graph) throw new Error("Stencil: group " + groupName + " does not exist.");
      return graph
    },
    getPaper: function (groupName) {
      return this.papers[groupName || "__default__"]
    },
    // a:cellView, b:lientX, c:clientY
    preparePaperForDragging: function (cellView, clientX, clientY) {
      // 新的paper和graph对象，在render中创建
      // d:paper, e:graph, f:cloneCell, g:padding,j:cloneView
      var paper = this._paperDrag,
        graph = this._graphDrag;
      // 将<div class="stencil-paper-drag joint-paper joint-theme-material dragging">...</div>加入到<body></body>中
      paper.$el.addClass("dragging").appendTo(document.body);

      // i:scale h:snaplines
      var cloneCell = this.options.dragStartClone(cellView.model).position(0, 0),
        padding = 5,
        snaplines = this.options.snaplines;
      if (snaplines && (padding += snaplines.options.distance), snaplines || this.options.scaleClones) {
        var scale = this.options.paper.scale();
        paper.scale(scale.sx, scale.sy), padding *= Math.max(scale.sx, scale.sy)
      } else
        paper.scale(1, 1);
      // 清除所有_clone相关的对象
      this.clearClone(),
        // 停止元素上当前正在运行的动画
      this.options.dropAnimation && this._paperDrag.$el.stop(!0, !0),
        graph.resetCells([cloneCell.position(0, 0)]);
      var cloneView = cloneCell.findView(paper);
      cloneView.stopListening(),
        paper.fitToContent({
          padding: padding,
          allowNewOrigin: "any"
        });
      var bbox = cloneView.getBBox(),
        l = this._cloneGeometryBBox = cloneView.getBBox({
          useModelGeometry: !0
        });
      // 返回两个origin的差值的坐标
      this._cloneViewDeltaOrigin = l.origin().difference(bbox.origin()),
        this._cloneBBox = cloneCell.getBBox(),
        this._clone = cloneCell,
        this._cloneView = cloneView,
        this._paperDragPadding = padding,
        this._paperDragInitialOffset = this.setPaperDragOffset(clientX, clientY)
    },

    setPaperDragOffset: function (clientX, clientY) {
      var scrollTop = document.body.scrollTop || document.documentElement.scrollTop,
        deltaOrigin = this._cloneViewDeltaOrigin,
        bbox = this._cloneGeometryBBox,
        padding = this._paperDragPadding || 5,
        g = {
          left: clientX - deltaOrigin.x - bbox.width / 2 - padding,
          top: clientY - deltaOrigin.y - bbox.height / 2 - padding + scrollTop
        };
      // offset(coordinates),Get the current coordinates of the first element, or set the coordinates of every element,
      // in the set of matched elements
      return this._paperDrag.$el.offset(g), g
    },
    // 获得放置clone的local左上角位置
    // 将client位置转换为local位置，再减去cloneBBox的一半的宽高（center变为左上角）, 返回local位置
    setCloneLocalPosition: function (clientX, clientY) {
      var c = this.options.paper.clientToLocalPoint({x: clientX, y: clientY}),
        cloneBBox = this._cloneBBox;
      return c.x -= cloneBBox.width / 2, c.y -= cloneBBox.height / 2, this._clone.set("position", c), c
    },
    onDragStart: function (cellView, evt) {
      evt.preventDefault(),
        this.options.graph.startBatch("stencil-drag"),
        this.$el.addClass("dragging"),
        this.preparePaperForDragging(cellView, evt.clientX, evt.clientY);
      var localPosition = this.setCloneLocalPosition(evt.clientX, evt.clientY),
        cloneView = this._cloneView,
        snaplines = this.options.snaplines;
      snaplines && (
        snaplines.captureCursorOffset(this._cloneView, evt, localPosition.x, localPosition.y),
          cloneView.listenTo(this._clone, "change:position", this.onCloneSnapped.bind(this))
      )
    },
    onCloneSnapped: function (element, newPosition, opt) {
      if (opt.snapped) {
        var d = this._cloneBBox;
        element.position(d.x + opt.tx, d.y + opt.ty, {silent: !0}),
          this._cloneView.translate(),
          element.set("position", newPosition, {silent: !0}),
          this._cloneSnapOffset = {x: opt.tx, y: opt.ty}
      }
      else
        this._cloneSnapOffset = null
    },
    onDrag: function (evt) {
      // c: cloneView， d: clientX, e:clientY
      var cloneView = this._cloneView;
      if (cloneView) {
        evt.preventDefault(),
          evt = util.normalizeEvent(evt);
        var clientX = evt.clientX,
          clientY = evt.clientY;
        this.setPaperDragOffset(clientX, clientY);
        var localPosition = this.setCloneLocalPosition(clientX, clientY),
          embeddingMode = this.options.paper.options.embeddingMode,
          snaplines = this.options.snaplines,
          i = (embeddingMode || snaplines) && this.insideValidArea({
            x: clientX,
            y: clientY
          });
        embeddingMode && (i ? cloneView.processEmbedding({paper: this.options.paper}) : cloneView.clearEmbedding()),
        snaplines && (i ? snaplines.snapWhileMoving(cloneView, evt, localPosition.x, localPosition.y) : snaplines.hide())
      }
    },
    onDragEnd: function (evt) {
      // c:cloneCell,d:cloneView，e:cloneBox
      var cloneCell = this._clone;
      if (cloneCell) {
        evt = util.normalizeEvent(evt);
        var cloneView = this._cloneView,
          cloneBox = this._cloneBBox,
          f = this._cloneSnapOffset,
          g = cloneBox.x,
          h = cloneBox.y;
        f && (g += f.x, h += f.y),
          cloneCell.position(g, h, {silent: !0});
        // clone of cloneCell
        var i = this.options.dragEndClone(cloneCell),
          j = this.drop(evt, i);
        j ? this.onDropEnd(cloneCell) : this.onDropInvalid(evt, i),
        this.options.paper.options.embeddingMode && cloneView && cloneView.finalizeEmbedding({
          model: i,
          paper: this.options.paper
        }),
          this.options.graph.stopBatch("stencil-drag")
      }
    },
    onDropEnd: function (cloneCell) {

      window.postMessage("onDropEnd", 'http://127.0.0.1:8080');

      this._clone === cloneCell && (this.clearClone(),
        this.$el.append(this._paperDrag.$el),
        this.$el.removeClass("dragging"),
        this._paperDrag.$el.removeClass("dragging"))
    },
    clearClone: function () {
      this._clone && (
        this._clone.remove(),
          this._clone = null,
          this._cloneView = null,
          this._cloneSnapOffset = null,
          this._paperDragInitialOffset = null,
          this._paperDragPadding = null
      )
    },
    onDropInvalid: function (evt, c) {
      // d: cloneCell
      var cloneCell = this._clone;
      if (cloneCell) {
        evt = util.normalizeEvent(evt),
          c = c || this.options.dragEndClone(cloneCell),
          this.trigger("drop:invalid", evt, c);
        var dropAnimation = this.options.dropAnimation;
        if (dropAnimation) {
          var duration = util.isObject(dropAnimation) ? dropAnimation.duration : 150,
            easing = util.isObject(dropAnimation) ? dropAnimation.easing : "swing";
          this._cloneView = null,
            this._paperDrag.$el.animate(this._paperDragInitialOffset, duration, easing, this.onDropEnd.bind(this, cloneCell))
        } else
          this.onDropEnd(cloneCell)
      }
    },
    // 看该点是否在paper/paperScroller或this.$el的可drop的范围内
    insideValidArea: function (clientPoint) {
      // c:paper，d:paperScroller
      var b, paper = this.options.paper,
        paperScroller = this.options.paperScroller,
        e = this.getDropArea(this.$el);

      // for dialog to edit subgraph
      // if($(document.body).find('.joint-dialog').length) {
      //     var dialog = $(document.body).find('.joint-dialog');
      //     paper = dialog
      // }

      if (paperScroller)
        if (paperScroller.options.autoResizePaper)
          b = this.getDropArea(paperScroller.$el);
        else {
          var f = this.getDropArea(paperScroller.$el),
            g = this.getDropArea(paper.$el);
          b = g.intersect(f)
        }
      else b = this.getDropArea(paper.$el);
      return !(!b || !b.containsPoint(clientPoint) || e.containsPoint(clientPoint))
    },
    getDropArea: function (paperEl) {
      var b = paperEl.offset(),
        scrollTop = document.body.scrollTop || document.documentElement.scrollTop,
        scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
      return g.rect({
        x: b.left + parseInt(paperEl.css("border-left-width"), 10) - scrollLeft,
        y: b.top + parseInt(paperEl.css("border-top-width"), 10) - scrollTop,
        width: paperEl.innerWidth(),
        height: paperEl.innerHeight()
      })
    },
    drop: function (evt, cell) {
      // c:paper,d:graph，e:clientPos
      var paper = this.options.paper,
        graph = this.options.graph,
        clientPos = {
          x: evt.clientX,
          y: evt.clientY
        };
      if (this.insideValidArea(clientPos)) {
        // h:bbox，f:localPoint
        var localPoint = paper.clientToLocalPoint(clientPos),
          bbox = cell.getBBox();
        localPoint.x += bbox.x - bbox.width / 2,
          localPoint.y += bbox.y - bbox.height / 2;
        var i = this._cloneSnapOffset ? 1 : paper.options.gridSize;
        return cell.set("position", {
          x: g.snapToGrid(localPoint.x, i),
          y: g.snapToGrid(localPoint.y, i)
        }),
          cell.unset("z"),
          graph.addCell(cell, {
            stencil: this.cid
          }),
          !0
      }
      return !1
    },
    // c: searchValue，d:searchItems,如"type"，"attrs/text/text"，"attrs/.label/text"
    filter: function (searchValue, searchItems) {
      // 严格大小写
      var e = searchValue.toLowerCase() == searchValue,
        // g:groupName，h:paper,i: filtedCells
        f = Object.keys(this.papers).reduce(function (f, groupName) {
          var paper = this.papers[groupName],
            // a:cell
            filtedCells = paper.model.get("cells").filter(function (cell) {
              // f: cellView
              var cellView = paper.findViewByModel(cell),
                g = !searchValue || Object.keys(searchItems).some(function (f) {
                  // g: searchItem
                  var searchItem = searchItems[f];
                  if ("*" != f && cell.get("type") != f) return !1;
                  var h = searchItem.some(function (d) {
                    //f:attrVal
                    var attrVal = util.getByPath(cell.attributes, d, "/");
                    return void 0 !== attrVal && null !== attrVal &&
                      (attrVal = attrVal.toString(), e && (attrVal = attrVal.toLowerCase()), attrVal.indexOf(searchValue) >= 0)
                  });
                  return h
                });
              return V(cellView.el).toggleClass("unmatched", !g), g
            }, this),
            j = !util.isEmpty(filtedCells),
            k = (new joint.dia.Graph).resetCells(filtedCells);
          return this.trigger("filter", k, g, searchValue),
          this.isLayoutEnabled() && this.layoutGroup(k, this.getGroup(g)),
          this.$groups[g] && this.$groups[g].toggleClass("unmatched", !j),
            paper.fitToContent({gridWidth: 1, gridHeight: 1, padding: this.options.paperPadding || 10}),
          f || j
        }.bind(this), !1);
      this.$el.toggleClass("not-found", !f)
    },
    getGroup: function (groupName) {
      return this.options.groups && this.options.groups[groupName] || {}
    },
    onSearch: function (evt) {
      this.filter(evt.target.value, this.options.search)
    },
    pointerFocusIn: function () {
      this.$el.addClass("is-focused")
    },
    pointerFocusOut: function () {
      this.$el.removeClass("is-focused")
    },
    onGroupLabelClick: function (a) {
      if ("touchstart" === a.type)
        this._groupLabelClicked = !0;
      else if (this._groupLabelClicked && "click" === a.type)
        return void(this._groupLabelClicked = !1);
      var b = $(a.target).closest(".group");
      this.toggleGroup(b.data("name"))
    },
    toggleGroup: function (a) {
      this.$('.group[data-name="' + a + '"]').toggleClass("closed")
    },
    closeGroup: function (a) {
      this.$('.group[data-name="' + a + '"]').addClass("closed")
    },
    openGroup: function (a) {
      this.$('.group[data-name="' + a + '"]').removeClass("closed")
    },
    isGroupOpen: function (a) {
      return !this.$('.group[data-name="' + a + '"]').hasClass("closed")
    },
    closeGroups: function () {
      this.$(".group").addClass("closed")
    },
    openGroups: function () {
      this.$(".group").removeClass("closed")
    },
    onRemove: function () {
      util.invoke(this.papers, "remove"),
        this.papers = {},
      this._paperDrag && (this._paperDrag.remove(), this._paperDrag = null),
        $(document.body).off(".stencil", this.onDrag).off(".stencil", this.onDragEnd),
        $(window).off(".stencil", this.onDragEnd)
    }
  })
}(joint, joint.util);

//ui.Inspector
// a joint, b joint.util,there is b still not found
!function (joint, util) {
  "use strict";
  joint.ui.Inspector = joint.mvc.View.extend({
    className: "inspector",
    options: {
      cellView: void 0,
      cell: void 0,
      live: !0,
      validateInput: function (a, b, c) {
        // HTML5为所有表单元素添加了一个JS属性：input.validity(有效性)，用于表单验证
        return !a.validity || a.validity.valid
      },
      renderFieldContent: void 0,
      operators: {},
      multiOpenGroups: !0,
      stateKey: function (a) {
        return a.id
      }
    },
    // options添加了传入的config.inspector中cell的type对应的inputs,groups属性，以及新添加的
    // restoreGroupsState,storeGroupsState属性，cell为传入的cell对象
    events: {
      "change [data-attribute]:not([data-custom-field])": "onChangeInput",
      "click .list-item-label": "onListItemLabelClick",
      "click .group-label": "onGroupLabelClick",
      "click .btn-list-add": "addListItem",
      "click .btn-list-del": "deleteListItem",
      "click .btn-command-add": "addCommandItem",
      "click .btn-command-del": "deleteCommandItem",
      "mousedown .field": "pointerdown",
      "touchstart .field": "pointerdown",
      "focusin .field": "pointerfocusin",
      "focusout .field": "pointerfocusout"
    },
    HTMLEntities: {
      lt: "<",
      gt: ">",
      amp: "&",
      nbsp: " ",
      quot: '"',
      cent: "Â¢",
      pound: "Â£",
      euro: "â‚¬",
      yen: "Â¥",
      copy: "Â©",
      reg: "Â®"
    },
    init: function () {
      // c:groups
      var groups = this.options.groups = this.options.groups || {};
      joint.util.bindAll(this, "stopBatchCommand", "pointerup", "onContentEditableBlur", "replaceHTMLEntity"),
        this.widgets = {},
        this._attributeKeysInUse = [],
        this.flatAttributes = this.flattenInputs(this.options.inputs),
        this._when = {},
        this._bound = {};
      var d = Object.keys(this.flatAttributes).map(function (a) {
        var b = this.flatAttributes[a];
        if (b.when) {
          var c = {
            expression: b.when,
            path: a
          };
          this.extractExpressionPaths(c.expression).forEach(function (a) {
            (this._when[a] || (this._when[a] = [])).push(c)
          }, this)
        }
        return this.needsResolving(b) && (this._bound[a] = b.options),
          b.path = a,
          b
      }, this);
      for (var e in groups) {
        var f = groups[e];
        f && groups.hasOwnProperty(e) && this.extractExpressionPaths(f.when).forEach(function (a) {
          this._when[a] || (this._when[a] = [])
        }, this)
      }
      var g = util.sortBy(d, "index"); // g为数组，各个参数按inspector中定义的index进行排序
      this.groupedFlatAttributes = util.sortBy(g, function (a) {
        var b = this.options.groups[a.group];
        return b && b.index || Number.MAX_VALUE
      }.bind(this)),
        this.listenTo(this.getModel(), "all", this.onCellChange, this)
    },
    cacheInputs: function () {
      var a = {};
      // this.$("[data-attribute]"), 类数组对象，如[input.number, input.number, input.number . . .]
      Array.from(this.$("[data-attribute]")).forEach(function (b) {
        var c = $(b), // [input.number]
          d = c.attr("data-attribute"); // 每个[input.number]的data-attribute属性，如params/pose/y
        a[d] = c
      }, this),
        // key: data-attribute, value: [input.number]对象
        this._byPath = a,
        // 返回一个不重复的数组
        this._attributeKeysInUse = this.getAttributeKeysInUse()
    },
    // 更新group的可见性
    updateGroupsVisibility: function () {
      for (var a = this.$groups, b = 0, c = a.length; b < c; b++) {
        var d = $(a[b]), //[div.group]
          e = d.attr("data-name"), //pose
          f = this.options.groups[e], //{label: "Pose",index:1}
          // 找到[div.group]下面的子元素（有field，但没有hidden类），[div.field.number-field, div.field.number-field...]，共6个元素
          g = 0 === d.find("> .field:not(.hidden)").length;
        //g为false，移除“empty”类
        d.toggleClass("empty", g);
        var h = !(!f || !f.when || this.isExpressionValid(f.when));
        //h为false，移除“hidden”类
        d.toggleClass("hidden", h)
      }
    },
    flattenInputs: function (b) {
      return joint.util.flattenObject(b, "/", function (a) {
        return "string" == typeof a.type
      })
    },
    getModel: function () {
      return this.options.cell || this.options.cellView.model
    },
    //a:evtName，b:cell
    onCellChange: function (evtName, b, c, d) {
      if (d = d || {}, d.inspector != this.cid)
        switch (evtName) {
          case "remove":
            this.remove();
            break;
          case "change:position":
            this.updateInputPosition();
            break;
          case "change:size":
            this.updateInputSize();
            break;
          case "change:angle":
            this.updateInputAngle();
            break;
          case "change:source":
          case "change:target":
          case "change:vertices":
            break;
          default:
            var e = "change:";
            if (evtName.slice(0, e.length) === e) {
              var f = evtName.slice(e.length);
              this._attributeKeysInUse.includes(f) && this.render({
                refresh: !0
              })
            }
        }
    },
    render: function (a) {
      var b = a && a.refresh;
      b && this.options.storeGroupsState && this.storeGroupsState(),
        this.$el.empty(),
        this.removeWidgets();
      // c:knownGroup, d:groupEl,e:groupEls
      var knownGroup, groupEl, groupEls = [];
      // 依次渲染每个group
      return this.groupedFlatAttributes.forEach(function (flatAttr) {
        // a:flatAttr
        if (knownGroup !== flatAttr.group) {
          // f:group
          var group = this.options.groups[flatAttr.group];
          groupEl = this.renderGroup({
            name: flatAttr.group,
            label: group && group.label,
            tooltip: group && group.tooltip
          }),
          b || (group && group.closed ? this.closeGroup(groupEl, {init: !0}) : this.openGroup(groupEl, {init: !0})),
            groupEls.push(groupEl)
        }
        this.renderTemplate(groupEl, flatAttr, flatAttr.path),
          knownGroup = flatAttr.group
      }, this),
        this.$document = $(this.el.ownerDocument),
        //eg，2 groups, [div.group],[div.group]
        this.$groups = $(groupEls),
        this.$el.append(groupEls),
        /*<div class="joint-inspector joint-theme-material">
            <div class="group" data-name="pose"><h3 class="group-label">Pose</h3><div data-field="params/pose/x" class="field number-field"><label>X</label><div class="input-wrapper"><input type="number" min="-3.14" max="3.14" step="0.02" class="number" data-type="number" data-attribute="params/pose/x"></div></div><div data-field="params/pose/y" class="field number-field"><label>Y</label><div class="input-wrapper"><input type="number" min="-3.14" max="3.14" step="0.02" class="number" data-type="number" data-attribute="params/pose/y"></div></div>
            <div data-field="params/pose/z" class="field number-field"><label>Z</label><div class="input-wrapper"><input type="number" min="-3.14" max="3.14" step="0.02" class="number" data-type="number" data-attribute="params/pose/z"></div></div><div data-field="params/pose/rx" class="field number-field"><label>RX</label><div class="input-wrapper"><input type="number" min="-3.14" max="3.14" step="0.02" class="number" data-type="number" data-attribute="params/pose/rx"></div></div><div data-field="params/pose/ry" class="field number-field"><label>RY</label><div class="input-wrapper"><input type="number" min="-3.14" max="3.14" step="0.02" class="number" data-type="number" data-attribute="params/pose/ry"></div></div><div data-field="params/pose/rz" class="field number-field"><label>RZ</label><div class="input-wrapper"><input type="number" min="-3.14" max="3.14" step="0.02" class="number" data-type="number" data-attribute="params/pose/rz"></div></div></div>
            <div class="group" data-name="parameters"><h3 class="group-label">Parameters</h3><div data-field="params/speed" class="field number-field"><label>Speed</label><div class="input-wrapper"><input type="number" min="-3.14" max="3.14" step="0.02" class="number" data-type="number" data-attribute="params/speed"></div></div><div data-field="params/acc" class="field number-field"><label>Acc</label><div class="input-wrapper"><input type="number" min="-3.14" max="3.14" step="0.02" class="number" data-type="number" data-attribute="params/acc"></div></div><div data-field="params/rad" class="field number-field"><label>Rad</label><div class="input-wrapper"><input type="number" min="-3.14" max="3.14" step="0.02" class="number" data-type="number" data-attribute="params/rad"></div></div><div data-field="params/psi" class="field number-field"><label>Psi</label><div class="input-wrapper"><input type="number" min="-3.14" max="3.14" step="0.02" class="number" data-type="number" data-attribute="params/psi"></div></div></div></div>
            */
      b && this.options.restoreGroupsState && this.restoreGroupsState(),
        this.afterRender(),
        this.updateCell(),
        this
    },
    getAttributeKeysInUse: function () {
      // 取_byPath的key的最前面部分，如params/pose/y,即为params,a为数组["params","params",....]
      var a = Object.keys(this._byPath).map(function (a) {
          return a.substring(0, a.indexOf("/")) || a
        }),
        c = util.toArray(this._bound),//[]
        d = Object.keys(this._when);//[]
      // a c d 连接以后的数组，去掉重复项，前例只剩下[“params"]
      return util.uniq([].concat(a, c, d))
    },
    // b: paramPath,params/pose/x, c:paramObj,{type:"number",min:..,max:...}，在cell.attributes中获得paramPath如params/pose/x处的属性值
    getCellAttributeValue: function (paramPath, paramObj) {
      //d:cell（无inputs，groups属性），e为属性值
      var cell = this.getModel(),
        // e:attrValue ,在attributes属性中找paramPath如 params/pose/x处的属性值
        attrValue = joint.util.getByPath(cell.attributes, paramPath, "/");
      if (paramObj = paramObj || this.flatAttributes[paramPath], !paramObj)
        return attrValue;
      if (void 0 === attrValue && void 0 !== paramObj.defaultValue && (attrValue = paramObj.defaultValue), paramObj.valueRegExp) {
        if (void 0 === attrValue) throw new Error("Inspector: defaultValue must be present when valueRegExp is used.");
        var f = attrValue.match(new RegExp(paramObj.valueRegExp));
        attrValue = f && f[2]
      }
      return attrValue
    },

    resolvableTypes: ["select", "select-box", "select-button-group"],
    // b的type是resolvableTypes的一种，且b.options是String,才needs resolving
    needsResolving: function (b) {
      return !!b && this.resolvableTypes.indexOf(b.type) > -1 && joint.util.isString(b.options)
    },
    // 如果c的type是resolvableTypes的一种，则解析绑定，否则忽略
    resolveBindings: function (c) {
      if (this.resolvableTypes.indexOf(c.type) > -1) {
        var d = c.options || [];
        joint.util.isString(d) && (d = joint.util.getByPath(this.getModel().attributes, d, "/") || []),
        joint.util.isObject(d[0]) || (d = util.toArray(d).map(function (a) {
          return {
            value: a,
            content: a
          }
        })),
          c.items = d
      }
    },
    //查看this._bound是否为空，为空则直接略过
    updateBindings: function (dataAttr) {
      var c = Object.keys(this._bound).reduce(function (a, c) {
        var d = this._bound[c];
        return 0 === dataAttr.indexOf(d) && a.push(c), a
      }.bind(this), []);
      joint.util.isEmpty(c) || (c.forEach(function (a) {
          this.renderTemplate(null, this.flatAttributes[a], a, {replace: !0})
        }
        , this), this.afterRender())
    },

    //c:paramObj,{type:"number",min:..,max:...}，d: paramPath,params/pose/x, e:value for paramPath
    renderFieldContent: function (paramObj, paramPath, value) {
      var f;
      if (joint.util.isFunction(this.options.renderFieldContent) && (f = this.options.renderFieldContent(paramObj, paramPath, value)))
        return $(f).attr({
          "data-attribute": paramPath,
          "data-type": paramObj.type,
          "data-custom-field": !0
        });
      var g, h, i, j;
      switch (paramObj.type) {
        case "select-box":
          h = joint.util.toArray(paramObj.items).findIndex(function (b) {
            return void 0 === b.value && b.content === value || !!joint.util.isEqual(b.value, value)
          });
          var k = joint.util.assign(
            {theme: this.options.theme},
            joint.util.omit(paramObj, "type", "group", "index", "selectBoxOptionsClass", "options"),
            {
              options: paramObj.items,
              selected: h,
              selectBoxOptionsClass: [
                joint.util.addClassNamePrefix("inspector-select-box-options"),
                paramObj.selectBoxOptionsClass
              ].filter(function (a) {
                return !!a
              }).join(" ")
            }
          );
          g = new joint.ui.SelectBox(k),
            g.$el.attr({"data-attribute": paramPath, "data-type": paramObj.type}),
            g.render(),
            j = $("<label/>", {html: paramObj.label || paramPath}),
            f = $("<div/>").append(j, g.el),
            paramObj.previewMode ? (
              i = g.selection,
                g.on("options:mouseout close", function () {
                  g.selection = i,
                    this.processInput(g.$el, {previewCancel: !0, dry: !0})
                }, this),
                g.on("option:hover", function (a, b) {
                  g.selection = a,
                    this.processInput(g.$el, {dry: !0})
                }, this),
                g.on("option:select", function (a, b) {
                  var c = void 0 === i ? void 0 : g.getSelectionValue(i),
                    d = g.getSelectionValue(a),
                    value = c === d;
                  this.processInput(g.$el, {previewDone: !0, dry: value, originalValue: c}),
                    i = a
                }, this)
            ) : g.on("option:select", function (a, b) {
              this.processInput(g.$el)
            }, this),
            this.widgets[paramPath] = g;
          break;
        case "select-button-group":
          paramObj.multi ? (
            h = [],
              joint.util.toArray(paramObj.items).forEach(function (b, c) {
                var d = void 0 === b.value ? b.content : b.value,
                  f = joint.util.toArray(value).find(function (b) {
                    return joint.util.isEqual(d, b)
                  });
                f && h.push(c)
              })
          ) : h = joint.util.toArray(paramObj.items).findIndex(function (b) {
            return !!joint.util.isEqual(b.value, value) || void 0 === b.value && b.content === value
          });
          var m = joint.util.assign(
            {theme: this.options.theme},
            joint.util.omit(paramObj, "type", "group", "index", "options"), {
              options: paramObj.items,
              selected: h
            }
          );
          g = new joint.ui.SelectButtonGroup(m),
            g.$el.attr({"data-attribute": paramPath, "data-type": paramObj.type}),
            g.render(),
            j = $("<label/>", {html: paramObj.label || paramPath}),
            f = $("<div/>").append(j, g.el),
            paramObj.previewMode ? (
              i = g.selection,
                g.on("mouseout", function () {
                  g.selection = i,
                    this.processInput(g.$el, {previewCancel: !0, dry: !0})
                }, this),
                g.on("option:hover", function (a, d) {
                  paramObj.multi ? g.selection = util.uniq(g.selection.concat([a])) : g.selection = a,
                    this.processInput(g.$el, {dry: !0})
                }, this),
                g.on("option:select", function (b, c) {
                  var d = void 0 === i ? void 0 : g.getSelectionValue(i),
                    e = g.getSelectionValue(b),
                    f = joint.util.isEqual(d, e);
                  this.processInput(g.$el, {previewDone: !0, dry: f, originalValue: d}),
                    i = b
                }, this)
            ) : g.on("option:select", function (a, b) {
              this.processInput(g.$el)
            }, this),
            this.widgets[dparamPath] = g;
          break;
        default:
          f = this.renderOwnFieldContent({
            options: paramObj,
            type: paramObj.type,
            label: paramObj.label || paramPath,
            attribute: paramPath,
            value: value
          })
      }
      return f
    },
    // 返回 <div class="group">
    //     <h3 class="group-label">a.label</h3>
    // </div> ,data-name为a.name
    renderGroup: function (a) {
      a = a || {};
      var b = $("<div/>").addClass("group").attr("data-name", a.name),
        c = $("<h3/>").addClass("group-label").text(a.label || a.name),
        tooltip = $("<label/>").addClass("group-tooltip").html(a.tooltip);
      return b.append(c, tooltip)
    },
    renderOwnFieldContent: function (b) {
      var c, d, e, f, g, h, i, j;
      // j: <label>“Y"</label>
      switch (j = $("<label/>").text(b.label), b.type) {
        case "number":
          d = $("<input/>", {
            type: "number",
            min: b.options.min,
            max: b.options.max,
            step: b.options.step
          }).val(b.value),
            c = [j, $("<div/>").addClass("input-wrapper").append(d)];
          // <label> Y </label>
          // <div class="input-wrapper">
          //      <input type="number" m.../>
          // </div>
          break;
        case "range":
          j.addClass("with-output"),
            f = $("<output/>").text(b.value),
            g = $("<span/>").addClass("units").text(b.options.unit),
            d = $("<input/>", {
              type: "range",
              name: b.type,
              min: b.options.min,
              max: b.options.max,
              step: b.options.step
            }).val(b.value),
            d.on("change input", function () {
              f.text(d.val())
            }),
            c = [j, f, g, d];
          // <label class="with-output"></label>
          // <output>b.value</output>
          // <span class="units">b.options.unit</span>
          // <input type="range" min="-3.14" max="3.14" step="0.02" value="2"/>
          break;
        case "textarea":
          d = $("<textarea/>").text(b.value),
            c = [j, $("<div/>").addClass("input-wrapper").append(d)];
          break;
        case "content-editable":
          var k = joint.util.isString(b.value) ? b.value.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;") : "";
          d = $("<div/>").prop("contenteditable", !0).css("display", "inline-block").html(k).on("blur", this.onContentEditableBlur),
            c = [j, $("<div/>").addClass("input-wrapper").append(d)];
          break;
        case "select":
          var l = b.options.items;
          d = $("<select/>"),
          b.options.multiple && d.prop({
            size: b.options.size || l.length,
            multiple: !0
          });
          var m = function (c) {
            return b.options.multiple ? joint.util.toArray(b.value).find(function (b) {
              return joint.util.isEqual(c, b)
            }) : joint.util.isEqual(c, b.value)
          };
          joint.util.toArray(l).forEach(function (a) {
            var b = $("<option/>", {value: a.value}).text(a.content);
            m(a.value) && b.attr("selected", "selected"), d.append(b)
          }),
            c = [j, d];
          break;
        case "toggle":
          h = $("<span><i/></span>"),
            d = $("<input/>", {type: "checkbox"}).prop("checked", !!b.value),
            e = $("<div/>").addClass(b.type),
            c = [j, e.append(d, h)];
          break;
        case "color":
          d = $("<input/>", {type: "color"}).val(b.value),
            c = [j, d];
          break;
        case "text":
          d = $("<input/>", {type: "text"}).val(b.value),
            c = [j, $("<div/>").addClass("input-wrapper").append(d)];
          break;
        case "object":
          d = $("<div/>"),
            i = $("<div/>").addClass("object-properties"),
            c = [j, d.append(i)];
          break;
        case "list":
          h = $("<button/>").addClass("btn-list-add").text(b.options.addButtonLabel || "+"),
            i = $("<div/>").addClass("list-items"),
            d = $("<div/>"),
            c = [d.append(h, i)];
          break;
        // <div>
        //      <button class="btn-list-add">+</button>
        //      <div class="list-items"></div>
        //      <div></div>
        // </div>
        default:
          break;
      }
      return d && d.addClass(b.type).attr({"data-type": b.type, "data-attribute": b.attribute}),
        $.fn.append.apply($("<div>"), c).children()
      // <label> Y </label>
      // <div class="input-wrapper">
      //     <input class="number" ... data-type="number" data-attribute="params/pose/y"/>
      // </div> ，返回[label,div]
    },
    //content-editable的“blur”事件的callback,触发target的change事件，转到onChangeInput事件回调
    onContentEditableBlur: function (evt) {
      var b = $("<input/>", {
        disabled: !0,
        tabIndex: -1,
        style: {
          width: "1px",
          height: "1px",
          border: "none",
          margin: 0,
          padding: 0
        }
      }).appendTo(this.$el);
      b.focus(),
        b[0].setSelectionRange(0, 0),
        // 当元素失去焦点时触发 blur 事件
        b.blur().remove(),
        $(evt.target).trigger("change")
    },
    replaceHTMLEntity: function (a, b) {
      return this.HTMLEntities[b] || ""
    },
    renderObjectProperty: function (a) {
      a = a || {};
      var b = $("<div/>", {"data-property": a.property, "class": "object-property"});
      return b
    },
    renderListItem: function (a) {
      a = a || {};
      var b = $("<button/>").addClass("btn-list-del").text(a.options.removeButtonLabel || "x"),
        c = $("<div/>", {"data-index": a.index, "class": "list-item"}),
        d = $("<label/>").addClass("list-item-label").text(a.options.label + " " + a.index),
        e = $("<div/>").addClass("list-item-title").append(d, b);
      return c.append(e)
    },
    // {path: paramPath,如params/pose/x, type: paramObj.type,如number,range}
    renderFieldContainer: function (a) {
      a = a || {};
      var b = $("<div/>", {
        "data-field": a.path,
        "class": "field " + a.type + "-field"
      });
      return b
    },
    // c-groupEl,d-paramObj,e-paramPath
    renderTemplate: function (groupEl, paramObj, paramPath, f) {
      groupEl = groupEl || this.$el,
        f = f || {},
        this.resolveBindings(paramObj);
      // g：[div.field.number-field],fieldContainer, i:fieldContent
      var fieldContainer = this.renderFieldContainer({
        path: paramPath,
        type: paramObj.type
      });
      paramObj.when && !this.isExpressionValid(paramObj.when) && (
        fieldContainer.addClass("hidden"),
        paramObj.when.otherwise && paramObj.when.otherwise.unset && this.unsetProperty(paramPath)
      );
      // h:attrValue
      var attrValue = this.getCellAttributeValue(paramPath, paramObj),
        fieldContent = this.renderFieldContent(paramObj, paramPath, attrValue);

      if (fieldContainer.append(fieldContent), joint.util.setAttributesBySelector(fieldContainer, paramObj.attrs), "list" === paramObj.type)
      // b:index, c:listItem
        joint.util.toArray(attrValue).forEach(function (a, index) {
          var listItem = this.renderListItem({index: index, options: paramObj});
          this.renderTemplate(listItem, paramObj.item, paramPath + "/" + index),
            fieldContent.children(".list-items").append(listItem)
        }, this);
      else if ("object" === paramObj.type) {
        paramObj.flatAttributes = this.flattenInputs(paramObj.properties);
        var j = Object.keys(paramObj.flatAttributes).map(function (a) {
          var b = this[a];
          return b.path = a,
            b
        }, paramObj.flatAttributes);
        j = util.sortBy(j, function (a) {
          return a.index
        }),
          j.forEach(function (a) {
            // b: objectProperty
            var objectProperty = this.renderObjectProperty({property: a.path});
            this.renderTemplate(objectProperty, a, paramPath + "/" + a.path),
              fieldContent.children(".object-properties").append(objectProperty)
          }, this)
      }
      f.replace ? groupEl.find('[data-field="' + paramPath + '"]').replaceWith(fieldContainer) : groupEl.append(fieldContainer)
      // groupEl:
      // <div class="group">
      // <div class="field data-field>
      // [label,div.input-wrapper]
      // </div>
      // </div>
    },
    updateInputPosition: function () {
      var a = this._byPath["position/x"],
        b = this._byPath["position/y"],
        c = this.getModel().get("position");
      a && a.val(c.x), b && b.val(c.y)
    },
    updateInputSize: function () {
      var a = this._byPath["size/width"],
        b = this._byPath["size/height"],
        c = this.getModel().get("size");
      a && a.val(c.width), b && b.val(c.height)
    },
    updateInputAngle: function () {
      var a = this._byPath.angle,
        b = this.getModel().get("angle");
      a && a.val(b)
    },
    // b: input DOM元素
    validateInput: function (dataType, el, dataAttr) {
      switch (dataType) {
        case "select-box":
        // case "color-palette":
        case "select-button-group":
          return !0;
        default:
          return this.options.validateInput(el, dataAttr, dataType)
      }
    },
    onChangeInput: function (evt) {
      this.processInput($(evt.target))
      // $(evt.target)如[input.number]
    },
    processInput: function (input, b) {
      var c = input.attr("data-attribute"), // params/pose/y
        d = input.attr("data-type"); // number
      // 验证输入的有效性
      if (this.validateInput(d, input[0], c)) {
        this.options.live && this.updateCell(input, c, b);
        var e = this.getFieldValue(input[0], d),
          f = this.parse(d, e, input[0]);
        this.trigger("change:" + c, f, input[0], b)
      }
    },
    // this._when中没有dataAttr，则不执行，直接退出
    updateDependants: function (dataAttr) {
      joint.util.toArray(this._when[dataAttr]).forEach(function (a) {
        var b = this._byPath[a.path],
          c = b.closest(".field"),
          d = c.hasClass("hidden"),
          e = this.isExpressionValid(a.expression);
        c.toggleClass("hidden", !e),
        a.expression.otherwise && a.expression.otherwise.unset && this.options.live && (
          e ? d && this.updateCell(b, a.path) : (
            this.unsetProperty(a.path),
              this.renderTemplate(null, this.flatAttributes[a.path], a.path, {replace: !0}),
              this.afterRender()
          )
        )
      }, this)
    },
    unsetProperty: function (b, c) {
      var d = this.getModel(),
        e = b.split("/"),
        f = e[0],
        g = e.slice(1).join("/");
      if (c = c || {}, c.inspector = this.cid, c["inspector_" + this.cid] = !0, "attrs" == b)
        d.removeAttr(g, c);
      else if (b == f)
        d.unset(f, c);
      else {
        var h = joint.util.merge({},
          d.get(f)),
          i = joint.util.unsetByPath(h, g, "/");
        d.set(f, i, c)
      }
    },
    getOptions: function (input) {
      if (0 !== input.length) {
        var dataAttr = input.attr("data-attribute"), //params/pose/y
          c = this.flatAttributes[dataAttr]; // {type:"number",...}
        if (!c) {
          var d = input.parent().closest("[data-attribute]"),
            e = d.attr("data-attribute");
          c = this.getOptions(d);
          var f = dataAttr.replace(e + "/", ""),
            g = c;
          c = g.item || g.flatAttributes[f], c.parent = g
        }
        return c
      }
    },
    updateCell: function (input, dataAttr, d) {
      var e = this.getModel(),
        f = {};
      input ? f[dataAttr] = input : f = this._byPath,
        this.startBatchCommand();
      var g = {},
        h = {};
      // f{ params/pose/y: [input.number]}
      joint.util.forIn(f, function (input, dataAttr) {
        // 如果input的第一个有类“field"的父元素没有"hidden"类
        if (!input.closest(".field").hasClass("hidden")) {
          var d, f, dataType = input.attr("data-type");
          switch (dataType) {
            case "list":
              f = this.findParentListByPath(dataAttr),
                f ? (d = dataAttr.substr(f.length + 1), joint.util.setByPath(g[f], d, [], "/")) : g[dataAttr] = [];
              break;
            case "object":
              break;
            default:
              if (!this.validateInput(dataType, input[0], dataAttr)) return;
              var fieldValue = this.getFieldValue(input[0], dataType),
                // 对number、range的值parseFloat，对toggle返回bool值，其他不变
                parseValue = this.parse(dataType, fieldValue, input[0]),
                // return {type:"number" min:xxx ...}, 即dataAttr对应的value
                l = this.getOptions(input);
              if (l.valueRegExp) {
                var m = joint.util.getByPath(e.attributes, dataAttr, "/") || l.defaultValue;
                parseValue = m.replace(new RegExp(l.valueRegExp), "$1" + parseValue + "$3")
              }
              if (f = this.findParentListByPath(dataAttr), f && g[f])
                return d = dataAttr.substr(f.length + 1), void joint.util.setByPath(g[f], d, parseValue, "/");
              h[dataAttr] = parseValue
          }
        }
      }.bind(this)),
        // h: { dataAttr: parseValue},如{ params/pose/x: 1.06}
        joint.util.forIn(h, function (parseValue, dataAttr) {
          // 用parseValue值设置属性dataAttr
          this.setProperty(dataAttr, parseValue, d),
            this.updateBindings(dataAttr),
            this.updateDependants(dataAttr)
        }.bind(this)),
        joint.util.forIn(g, function (b, c) {
          this.setProperty(c, b, joint.util.assign({
            rewrite: !0
          }, d)),
            this.updateBindings(c),
            this.updateDependants(c)
        }.bind(this)),
        this.updateGroupsVisibility(),
        this.stopBatchCommand()
    },
    findParentListByPath: function (dataAttr) {
      // e=0,f = "params",g = undefined时，e=1,c="pose",f="params/pose", g=undefined
      // e=1,f="params/pose", g=undefined时，e=2,c="x", f="params/pose/x", g= {type:"number",min:xxx...}，退出
      for (var b, c, d = dataAttr.split("/"), e = 0, f = d[e], g = this.flatAttributes[f];
           e < d.length - 1 && (!g || "list" !== g.type);)
        g && "object" === g.type && (b = g.properties),
          c = d[++e],
          f += "/" + c,
          g = b ? b[c] : this.flatAttributes[f];
      return f !== dataAttr ? f : null
    },
    // 返回input的实际输入值
    getFieldValue: function (input, dataType) {
      if (joint.util.isFunction(this.options.getFieldValue)) {
        var d = this.options.getFieldValue(input, dataType);
        if (d) return d.value
      }
      var e = $(input);
      switch (dataType) {
        case "select-box":
        // case "color-palette":
        case "select-button-group":
          var f = e.attr("data-attribute"),
            g = this.widgets[f];
          return g ? g.getSelectionValue() : joint.dia.Cell.prototype.prop.call(this.getModel(), f);
        case "content-editable":
          return e.html().replace(/<br(\s*)\/*>/gi, "\n").replace(/<[p|div]\s/gi, "\n$0").replace(/(<([^>]+)>)/gi, "").replace(/&(\w+);/gi, this.replaceHTMLEntity).replace(/\n$/, "");
        default:
          return e.val()
      }
    },
    setProperty: function (dataAttr, value, d) {
      d = d || {}, // d={}
        d.inspector = this.cid;
      var e = joint.dia.Cell.prototype.prop,
        f = this.getModel();
      d.previewDone && e.call(f, dataAttr, d.originalValue, {
        rewrite: !0,
        silent: !0
      }),
        //joint.dia.Cell.prototype.prop.call(this.getModel(), dataAttr, joint.util.clone(value), d)
        void 0 === value ? joint.dia.Cell.prototype.removeProp.call(f, dataAttr, d) : e.call(f, dataAttr, joint.util.clone(value), d)
    },
    parse: function (dataType, fieldValue, input) {
      switch (dataType) {
        case "number":
        case "range":
          fieldValue = parseFloat(fieldValue);
          break;
        case "toggle":
          fieldValue = input.checked
      }
      return fieldValue
    },
    startBatchCommand: function () {
      // this.inBatch为true
      this.inBatch || (this.inBatch = !0,
        //startBatch(name, data),触发batch:start事件，data为传入的数据
        this.getModel().startBatch("inspector", {
          cid: this.cid
        }))
    },
    stopBatchCommand: function () {
      this.inBatch && (this.getModel().stopBatch("inspector", {
        cid: this.cid
      }), this.inBatch = !1)
    },
    afterRender: function () {
      this.cacheInputs(), this.updateGroupsVisibility(), this.trigger("render")
    },
    addListItem: function (evt) {
      //b:addButton,c:list,d: dataAttribute，f:lastListItem,g:dataIndex,h:newIndex，i:newListItem
      var addButton = $(evt.target),
        list = addButton.closest("[data-attribute]"),
        dataAttribute = list.attr("data-attribute"),
        e = this.getOptions(list),
        listItems = list.children(".list-items").children(".list-item"),
        lastListItem = listItems.last(),
        dataIndex = 0 === lastListItem.length ? -1 : parseInt(lastListItem.attr("data-index"), 10),
        newIndex = dataIndex + 1,
        newListItem = this.renderListItem({
          index: newIndex,
          options: e
        });
      this.renderTemplate(newListItem, e.item, dataAttribute + "/" + newIndex);

      for (var b = 0; b < listItems.length; b++) {
        this.closeListItem(listItems[b]);
      }
      addButton.parent().children(".list-items").append(newListItem),
        newListItem.find("input:first").focus(),
        this.afterRender(),
      this.options.live && this.updateCell();
    },
    deleteListItem: function (evt) {
      var b = $(evt.target).closest(".list-item");
      b.nextAll(".list-item").each(function () {
        var a = parseInt($(this).attr("data-index"), 10),
          b = a - 1;
        $(this).find("[data-field]").each(function () {
          $(this).attr("data-field", $(this).attr("data-field").replace("/" + a, "/" + b))
        }), $(this).find("[data-attribute]").each(function () {
          $(this).attr("data-attribute", $(this).attr("data-attribute").replace("/" + a, "/" + b))
        }), $(this).attr("data-index", b)
      }), b.remove(), this.afterRender(), this.options.live && this.updateCell()
    },
    bindDocumentEvents: function () {
      // ".joint-event-ns-view131"
      var a = this.getEventNamespace();
      // 对该namespace的"mouseup.joint-event-ns-view131 touchend.joint-event-ns-view131"事件，绑定pointerup callback
      this.$document.on("mouseup" + a + " touchend" + a, this.pointerup)
    },
    unbindDocumentEvents: function () {
      this.$document.off(this.getEventNamespace())
    },
    pointerdown: function (evt) {
      this.bindDocumentEvents(),
        this.startBatchCommand(),
        this._$activeField = $(evt.currentTarget).addClass("is-in-action")
    },
    pointerup: function () {
      this.unbindDocumentEvents(),
        this.stopBatchCommand(),
      this._$activeField && (this._$activeField.removeClass("is-in-action"), this._$activeField = null)
    },
    pointerfocusin: function (evt) {
      evt.stopPropagation(), $(evt.currentTarget).addClass("is-focused")
    },
    pointerfocusout: function (evt) {
      evt.stopPropagation(), $(evt.currentTarget).removeClass("is-focused")
    },
    onRemove: function () {
      this.unbindDocumentEvents(),
        this.removeWidgets(),
      this === this.constructor.instance && (this.constructor.instance = null)
    },
    removeWidgets: function () {
      var widgets = this.widgets;
      for (var b in widgets) widgets[b].remove();
      this.widgets = {}
    },
    onListItemLabelClick: function (evt) {
      evt.preventDefault();
      var b = $(evt.target).closest(".list-item");
      this.toggleListItem(b)
    },
    //根据是否有"closed"类来调用openGroup/closeGroup
    toggleListItem: function (b) {
      var c = joint.util.isNumber(b) ? this.$('.list-item[data-index="' + b + '"]') : $(b);
      c.hasClass("closed") ? this.openListItem(c) : this.closeListItem(c)
    },
    closeListItem: function (b, c) {
      c = c || {};
      var d = joint.util.isNumber(b) ? this.$('.list-item[data-index="' + b + '"]') : $(b);
      !c.init && d.hasClass("closed") || (d.addClass("closed"), this.trigger("list-item:close", d.data("index"), c))
    },
    // b: [div.group], c:{init:true}
    openListItem: function (b, c) {
      c = c || {};
      var d = joint.util.isNumber(b) ? this.$('.list-item[data-index="' + b + '"]') : $(b);
      // d.data("name") 即data-name属性值
      (c.init || d.hasClass("closed")) && (d.removeClass("closed"),
        this.trigger("list-item:open", d.data("index"), c))
    },
    onGroupLabelClick: function (evt) {
      evt.preventDefault(),
      this.options.multiOpenGroups || this.closeGroups();
      var b = $(evt.target).closest(".group");
      this.toggleGroup(b)
    },
    //根据是否有"closed"类来调用openGroup/closeGroup
    toggleGroup: function (b) {
      var c = joint.util.isString(b) ? this.$('.group[data-name="' + b + '"]') : $(b);
      c.hasClass("closed") ? this.openGroup(c) : this.closeGroup(c)
    },
    closeGroup: function (b, c) {
      c = c || {};
      var d = joint.util.isString(b) ? this.$('.group[data-name="' + b + '"]') : $(b);
      !c.init && d.hasClass("closed") || (d.addClass("closed"), this.trigger("group:close", d.data("name"), c))
    },
    // b: [div.group], c:{init:true}
    openGroup: function (b, c) {
      c = c || {};
      var d = joint.util.isString(b) ? this.$('.group[data-name="' + b + '"]') : $(b);
      // d.data("name") 即data-name属性值
      (c.init || d.hasClass("closed")) && (d.removeClass("closed"),
        this.trigger("group:open", d.data("name"), c))
    },
    // 依次对this.$groups里的group调用openGroup/closeGroup
    closeGroups: function () {
      for (var a = 0, b = this.$groups.length; a < b; a++) this.closeGroup(this.$groups[a])
    },
    openGroups: function () {
      for (var a = 0, b = this.$groups.length; a < b; a++) this.openGroup(this.$groups[a])
    },
    COMPOSITE_OPERATORS: ["not", "and", "or", "nor"],
    PRIMITIVE_OPERATORS: ["eq", "ne", "regex", "text", "lt", "lte", "gt", "gte", "in", "nin", "equal"],
    _isComposite: function (a) {
      return util.intersection(this.COMPOSITE_OPERATORS, Object.keys(a)).length > 0
    },
    _isPrimitive: function (a) {
      var c = Object.keys(this.options.operators).concat(this.PRIMITIVE_OPERATORS);
      return util.intersection(c, Object.keys(a)).length > 0
    },
    _evalCustomPrimitive: function (a, b, c) {
      return !!this.options.operators[a].apply(this, [this.getModel(), b].concat(c))
    },
    _evalPrimitive: function (b) {
      return Object.keys(b).reduce(function (c, d) {
        var e = b[d];
        return Object.keys(e).reduce(function (b, c) {
          var f = e[c],
            g = this.getCellAttributeValue(c);
          if (joint.util.isFunction(this.options.operators[d])) return this._evalCustomPrimitive(d, g, f);
          switch (d) {
            case "eq":
              return f == g;
            case "ne":
              return f != g;
            case "regex":
              return new RegExp(f).test(g);
            case "text":
              return !f || joint.util.isString(g) && g.toLowerCase().indexOf(f) > -1;
            case "lt":
              return g < f;
            case "lte":
              return g <= f;
            case "gt":
              return g > f;
            case "gte":
              return g >= f;
            case "in":
              return Array.isArray(f) && f.includes(g);
            case "nin":
              return Array.isArray(f) && !f.includes(g);
            case "equal":
              return joint.util.isEqual(f, g);
            default:
              return b
          }
        }.bind(this), !1)
      }.bind(this), !1)
    },
    _evalExpression: function (a) {
      return this._isPrimitive(a) ? this._evalPrimitive(a) : Object.keys(a).reduce(function (c, d) {
        var e = a[d];
        if ("not" == d) return !this._evalExpression(e);
        var f = util.toArray(e).map(this._evalExpression, this);
        switch (d) {
          case "and":
            return f.every(function (a) {
              return !!a
            });
          case "or":
            return f.some(function (a) {
              return !!a
            });
          case "nor":
            return !f.some(function (a) {
              return !!a
            });
          default:
            return c
        }
      }.bind(this), !1)
    },
    _extractVariables: function (a) {
      return Array.isArray(a) || this._isComposite(a) ? util.toArray(a).reduce(function (a, b) {
        return a.concat(this._extractVariables(b))
      }.bind(this), []) : util.toArray(a).reduce(function (a, b) {
        return Object.keys(b)
      }, [])
    },
    isExpressionValid: function (b) {
      return b = joint.util.omit(b, "otherwise", "dependencies"), this._evalExpression(b)
    },
    extractExpressionPaths: function (a) {
      var c = a && a.dependencies || [];
      return a = util.omit(a, "otherwise", "dependencies"), util.uniq(this._extractVariables(a).concat(c))
    },
    // 获取this.getModel().id
    getGroupsStateKey: function () {
      if (joint.util.isFunction(this.options.stateKey))
        return this.options.stateKey(this.getModel());
      throw new Error("Inspector: Option stateKey must be a function")
    },
    storeGroupsState: function () {
      var c = this.getGroupsStateKey(),
        d = util.toArray(this.$(".group.closed"));
      joint.ui.Inspector.groupStates[c] = d.map(function (a) {
        return $(a).attr("data-name")
      })
    },
    getGroupsState: function () {
      return joint.ui.Inspector.groupStates[this.getGroupsStateKey()]
    },
    restoreGroupsState: function () {
      var b = function (b, c) {
          joint.util.forIn(c.options.groups, function (a, c) {
            b(a, c) ? this.closeGroup(c) : this.openGroup(c)
          }.bind(c))
        },
        c = this.getGroupsStateKey();
      joint.ui.Inspector.groupStates[c] ? b(function (b, d) {
        return joint.ui.Inspector.groupStates[c].includes(d)
      }, this) : b(function (a) {
        return a.closed
      }, this)
    },

    storeListState: function () {

    },
    restoreListState: function () {

    }
  }, {
    groupStates: {},
    instance: null,
    // b:containerSelector
    create: function (containerSelector, c) {
      c = c || {},
        joint.util.defaults(c, {
          restoreGroupsState: !0,
          storeGroupsState: !0
        });
      // d:cell
      var cell = c.cell || c.cellView.model,
        e = this.instance;
      return e && e.options.cell === cell || (
        e && e.el.parentNode && (c.storeGroupsState && e.storeGroupsState(), e.updateCell(), e.remove()),
          e = new this(c).render(),
          this.instance = e,
          $(containerSelector).html(e.el),
        c.restoreGroupsState && e.restoreGroupsState()
      ), e
    },
    close: function () {
      var a = this.instance;
      a && a.remove()
    }
  })
}(joint, joint.util);

joint.ui.FreeTransform = joint.mvc.View.extend({
  className: "free-transform",
  events: {
    "mousedown .resize": "startResizing",
    "mousedown .rotate": "startRotating",
    "touchstart .resize": "startResizing",
    "touchstart .rotate": "startRotating"
  },
  DIRECTIONS: ["nw", "n", "ne", "e", "se", "s", "sw", "w"],
  POSITIONS: ["top-left", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left"],
  options: {
    cellView: void 0,
    rotateAngleGrid: 15,
    preserveAspectRatio: !1,
    minWidth: 0,
    minHeight: 0,
    maxWidth: 1 / 0,
    maxHeight: 1 / 0,
    allowOrthogonalResize: !0,
    allowRotation: !0,
    clearAll: !0,
    clearOnBlankPointerdown: !0
  },
  init: function () {
    var a = this.options;
    a.cellView && joint.util.defaults(a, {
      cell: a.cellView.model,
      paper: a.cellView.paper,
      graph: a.cellView.paper.model
    }),
      joint.util.bindAll(this, "update", "remove", "pointerup", "pointermove");
    // b: paper, c:graph
    var paper = a.paper,
      graph = a.graph;
    a.clearAll && this.constructor.clear(paper),
      $(document.body).on("mousemove touchmove", this.pointermove),
      $(document).on("mouseup touchend", this.pointerup),
      this.listenTo(graph, "all", this.update),
      this.listenTo(paper, "scale translate", this.update),
      this.listenTo(graph, "reset", this.remove),
      this.listenTo(a.cell, "remove", this.remove),
    a.clearOnBlankPointerdown && this.listenTo(paper, "blank:pointerdown", this.remove),
      paper.$el.append(this.el),
      this.constructor.registerInstanceToPaper(this, paper)
  },
  renderHandles: function () {
    var a = $("<div/>").prop("draggable", !1),
      b = a.clone().addClass("rotate"),
      c = this.POSITIONS.map(function (b) {
        return a.clone().addClass("resize").attr("data-position", b)
      });
    this.$el.empty().append(c, b)
  },
  render: function () {
    this.renderHandles(),
      this.$el.attr("data-type", this.options.cell.get("type")),
      this.$el.toggleClass("no-orthogonal-resize", this.options.preserveAspectRatio || !this.options.allowOrthogonalResize),
      this.$el.toggleClass("no-rotation", !this.options.allowRotation),
      this.update()
  },
  update: function () {
    // a:matrix, b: bbox
    var matrix = this.options.paper.matrix(),
      bbox = this.options.cell.getBBox();
    bbox.x *= matrix.a, bbox.x += matrix.e, bbox.y *= matrix.d, bbox.y += matrix.f, bbox.width *= matrix.a, bbox.height *= matrix.d;
    var c = g.normalizeAngle(this.options.cell.get("angle") || 0),
      d = "rotate(" + c + "deg)";
    this.$el.css({
      width: bbox.width + 4,
      height: bbox.height + 4,
      left: bbox.x - 3,
      top: bbox.y - 3,
      transform: d,
      "-webkit-transform": d,
      "-ms-transform": d
    });
    var e = Math.floor(c * (this.DIRECTIONS.length / 360));
    if (e != this._previousDirectionsShift) {
      var f = this.DIRECTIONS.slice(e).concat(this.DIRECTIONS.slice(0, e));
      this.$(".resize").removeClass(this.DIRECTIONS.join(" ")).each(function (a, b) {
        $(b).addClass(f[a])
      }), this._previousDirectionsShift = e
    }
  },
  calculateTrueDirection: function (a) {
    var b = this.options.cell,
      c = g.normalizeAngle(b.get("angle")),
      d = this.POSITIONS.indexOf(a);
    return d += Math.floor(c * (this.POSITIONS.length / 360)), d %= this.POSITIONS.length, this.POSITIONS[d]
  },
  startResizing: function (a) {
    a.stopPropagation(),
      this.options.graph.startBatch("free-transform", {
        freeTransform: this.cid
      });
    var b = $(a.target).data("position"),
      c = this.calculateTrueDirection(b),
      d = 0,
      e = 0;
    b.split("-").forEach(function (a) {
      d = {
        left: -1,
        right: 1
      }[a] || d, e = {
        top: -1,
        bottom: 1
      }[a] || e
    });
    var f = this.toValidResizeDirection(b),
      h = {
        "top-right": "bottomLeft",
        "top-left": "corner",
        "bottom-left": "topRight",
        "bottom-right": "origin"
      }[f];
    this._initial = {
      angle: g.normalizeAngle(this.options.cell.get("angle") || 0),
      resizeX: d,
      resizeY: e,
      selector: h,
      direction: f,
      relativeDirection: b,
      trueDirection: c
    }, this._action = "resize", this.startOp(a.target)
  },
  toValidResizeDirection: function (a) {
    return {
      top: "top-left",
      bottom: "bottom-right",
      left: "bottom-left",
      right: "top-right"
    }[a] || a
  },
  startRotating: function (a) {
    a.stopPropagation(), this.options.graph.startBatch("free-transform", {
      freeTransform: this.cid
    });
    var b = this.options.cell.getBBox().center(),
      c = this.options.paper.snapToGrid({
        x: a.clientX,
        y: a.clientY
      });
    this._initial = {
      centerRotation: b,
      modelAngle: g.normalizeAngle(this.options.cell.get("angle") || 0),
      startAngle: g.point(c).theta(b)
    }, this._action = "rotate", this.startOp(a.target)
  },
  // a: evt
  pointermove: function (evt) {
    if (this._action) {
      evt = joint.util.normalizeEvent(evt);
      var b = this.options,
        c = b.paper.snapToGrid({
          x: evt.clientX,
          y: evt.clientY
        }),
        // d:gridSize, e:cell， f:initialOpts
        gridSize = b.paper.options.gridSize,
        cell = b.cell,
        initialOpts = this._initial;
      switch (this._action) {
        // h: bbox
        case "resize":
          var bbox = cell.getBBox(),
            i = g.point(c).rotate(bbox.center(), initialOpts.angle),
            j = i.difference(bbox[initialOpts.selector]()),
            k = initialOpts.resizeX ? j.x * initialOpts.resizeX : bbox.width,
            l = initialOpts.resizeY ? j.y * initialOpts.resizeY : bbox.height;
          if (k = g.snapToGrid(k, gridSize),
              l = g.snapToGrid(l, gridSize),
              k = Math.max(k, b.minWidth || gridSize),
              l = Math.max(l, b.minHeight || gridSize),
              k = Math.min(k, b.maxWidth),
              l = Math.min(l, b.maxHeight),
              b.preserveAspectRatio) {
            var m = bbox.width * l / bbox.height,
              n = bbox.height * k / bbox.width;
            m > k ? l = n : k = m
          }
          bbox.width == k && bbox.height == l || cell.resize(k, l, {
            freeTransform: this.cid,
            direction: initialOpts.direction,
            relativeDirection: initialOpts.relativeDirection,
            trueDirection: initialOpts.trueDirection,
            ui: !0,
            minWidth: b.minWidth,
            minHeight: b.minHeight,
            maxWidth: b.maxWidth,
            maxHeight: b.maxHeight,
            preserveAspectRatio: b.preserveAspectRatio
          });
          break;
        case "rotate":
          var o = initialOpts.startAngle - g.point(c).theta(initialOpts.centerRotation);
          cell.rotate(g.snapToGrid(initialOpts.modelAngle + o, b.rotateAngleGrid), !0)
      }
    }
  },
  pointerup: function (evt) {
    this._action && (this.stopOp(), this.options.graph.stopBatch("free-transform", {
      freeTransform: this.cid
    }), this._action = null, this._initial = null)
  },
  onRemove: function () {
    $(document.body).off("mousemove touchmove", this.pointermove),
      $(document).off("mouseup touchend", this.pointerup),
      joint.ui.FreeTransform.unregisterInstanceFromPaper(this, this.options.paper)
  },
  startOp: function (a) {
    a && ($(a).addClass("in-operation"), this._elementOp = a), this.$el.addClass("in-operation")
  },
  stopOp: function () {
    this._elementOp && ($(this._elementOp).removeClass("in-operation"), this._elementOp = null), this.$el.removeClass("in-operation")
  }
}, {
  instancesByPaper: {},
  clear: function (a) {
    a.trigger("freetransform:create"), this.removeInstancesForPaper(a)
  },
  removeInstancesForPaper: function (a) {
    joint.util.invoke(this.getInstancesForPaper(a), "remove")
  },
  getInstancesForPaper: function (a) {
    return this.instancesByPaper[a.cid] || {}
  },
  registerInstanceToPaper: function (a, b) {
    this.instancesByPaper[b.cid] || (this.instancesByPaper[b.cid] = {}), this.instancesByPaper[b.cid][a.cid] = a
  },
  unregisterInstanceFromPaper: function (a, b) {
    this.instancesByPaper[b.cid] && (this.instancesByPaper[b.cid][a.cid] = null)
  }
});

joint.ui.Tooltip = joint.mvc.View.extend({
  className: "tooltip",
  options: {
    left: void 0,
    right: void 0,
    top: void 0,
    bottom: void 0,
    position: void 0,
    positionSelector: void 0,
    direction: "auto",
    minResizedWidth: 100,
    padding: 0,
    rootTarget: null,
    target: null,
    trigger: "hover",
    viewport: {
      selector: null,
      padding: 0
    },
    dataAttributePrefix: "tooltip",
    template: '<div class="tooltip-arrow"/><div class="tooltip-arrow-mask"/><div class="tooltip-content"/>'
  },
  init: function () {
    this.eventNamespace = ("." + this.className + this.cid).replace(/ /g, "_"), this.settings = {};
    var a = this.options.trigger.split(" ");
    joint.util.bindAll(this, "render", "hide", "show", "toggle", "isVisible", "position"), this.options.rootTarget ? (this.$rootTarget = $(this.options.rootTarget), a.forEach(function (a) {
      switch (a) {
        case "click":
          this.$rootTarget.on("click" + this.eventNamespace, this.options.target, this.toggle);
          break;
        case "hover":
          this.$rootTarget.on("mouseover" + this.eventNamespace, this.options.target, this.render);
          break;
        case "focus":
          this.$rootTarget.on("focusin" + this.eventNamespace, this.options.target, this.render)
      }
    }, this)) : (this.$target = $(this.options.target), a.forEach(function (a) {
      switch (a) {
        case "click":
          this.$target.on("click" + this.eventNamespace, this.toggle);
          break;
        case "hover":
          this.$target.on("mouseover" + this.eventNamespace, this.render);
          break;
        case "focus":
          this.$target.on("focusin" + this.eventNamespace, this.render)
      }
    }, this)), this.$el.append(this.options.template)
  },
  onRemove: function () {
    this.options.rootTarget ? this.$rootTarget.off(this.eventNamespace) : this.$target.off(this.eventNamespace)
  },
  hide: function () {
    var a = this.settings;
    a && (this.unbindHideActions(a.currentTarget), this.$el.removeClass(a.className), this.$el.remove())
  },
  show: function (a) {
    this.render(a || {
      target: this.options.target
    })
  },
  toggle: function (a) {
    this.isVisible() ? this.hide() : this.show(a)
  },
  isVisible: function () {
    return document.body.contains(this.el)
  },
  render: function (a) {
    var b = void 0 !== a.x && void 0 !== a.y ? a : null,
      c = $(a.target).closest(this.options.target)[0],
      d = this.settings = this.getTooltipSettings(c);
    d.currentTarget = c, this.bindHideActions(c);
    var e;
    e = b ? {
      x: b.x,
      y: b.y,
      width: 1,
      height: 1
    } : joint.util.getElementBBox(c), this.$(".tooltip-content").html(d.content), this.$el.hide(), this.$el.removeClass("left right top bottom"), this.$el.addClass(d.className), $(document.body).append(this.$el);
    var f = this.$("img");
    f.length ? f.on("load", function () {
      this.position(e), this.$el.addClass("rendered")
    }.bind(this)) : (this.position(e), this.$el.addClass("rendered"))
  },
  getTooltipSettings: function (a) {
    var b = this.loadDefinitionFromElementData(a);
    return this.evaluateOptions(a, b)
  },
  unbindHideActions: function (a) {
    var b = this.eventNamespace + ".remove";
    $(a).off(b), clearInterval(this.interval)
  },
  bindHideOnRemoveTarget: function (a) {
    clearInterval(this.interval), this.interval = setInterval(function () {
      $.contains(document, a) || (clearInterval(this.interval), this.hide())
    }.bind(this), 500)
  },
  bindHideActions: function (a) {
    var b = this.settings,
      c = $(a),
      d = this.eventNamespace + ".remove";
    this.bindHideOnRemoveTarget(a), this.options.trigger.split(" ").forEach(function (a) {
      var e = {
          hover: ["mouseout", "mousedown"],
          focus: ["focusout"]
        },
        f = e[a] || [];
      b.hideTrigger && (f = b.hideTrigger.split(" ") || []), f.forEach(function (a) {
        c.on(a + d, this.hide)
      }, this)
    }, this)
  },
  evaluateOptions: function (a, b) {
    b = b || {};
    var c = joint.util.assign({}, b, this.options);
    return joint.util.forIn(c, function (d, e) {
      var f = joint.util.isFunction(d) ? d(a) : d;
      c[e] = void 0 === f || null === f ? b[e] : f
    }), this.normalizePosition(c), c
  },
  loadDefinitionFromElementData: function (a) {
    if (!a) return {};
    var b = function (a) {
        return "left" === a || "bottom" === a || "top" === a || "right" === a
      },
      c = this.getAllAttrs(a, "data-" + this.options.dataAttributePrefix),
      d = {};
    return joint.util.forIn(c, function (a, c) {
      "" === c && (c = "content"), b(c) || (d[c] = a)
    }), d
  },
  getAllAttrs: function (a, b) {
    for (var c = b || "", d = a.attributes, e = {}, f = 0, g = d.length; f < g; f++) {
      var h = d[f];
      if (h && h.name.startsWith(c)) {
        var i = joint.util.camelCase(h.name.slice(c.length));
        e[i] = h.value
      }
    }
    return e
  },
  normalizePosition: function (a) {
    var b = a.left || a.right || a.top || a.bottom;
    !a.position && b && (a.left && (a.position = "left"), a.right && (a.position = "right"), a.top && (a.position = "top"), a.bottom && (a.position = "bottom")), !a.positionSelector && b && (a.positionSelector = b)
  },
  position: function (a) {
    var b = this.settings;
    this.$el.show(), this.$el.css("width", "auto");
    var c = this.getViewportViewBBox(),
      d = this.getTooltipBBox(a, c),
      e = {};
    "left" === b.position || "right" === b.position ? e.top = a.y + a.height / 2 - d.y : "top" === b.position || "bottom" === b.position ? e.left = a.x + a.width / 2 - d.x : e.top = a.y + a.height / 2 - d.y, this.$el.css({
      left: d.x,
      top: d.y,
      width: d.width || "auto"
    });
    var f = this.$(".tooltip-arrow, .tooltip-arrow-mask");
    f.removeAttr("style"), f.css(e), b.direction && "off" !== b.direction && this.$el.addClass("auto" === b.direction ? b.position || "left" : b.direction)
  },
  getViewportViewBBox: function () {
    var a = this.settings,
      b = a.viewport.selector ? $(a.currentTarget).closest(a.viewport.selector) : "html",
      c = joint.util.getElementBBox(b),
      d = $(window);
    a.viewport.selector || (c.width = d.width() + d.scrollLeft(), c.height = d.height() + d.scrollTop());
    var e = a.viewport.padding || 0;
    return c.x += e, c.y += e, c.width -= 2 * e, c.height -= 2 * e, c
  },
  getPosition: function (a, b, c, d) {
    var e = this.settings,
      f = e.position || "left",
      g = e.padding,
      h = Math.min(e.minResizedWidth, c.width + g),
      i = {
        left: function (f) {
          var i = {
            x: a.x + a.width + g,
            y: b.y + b.height / 2 - c.height / 2
          };
          if (f) {
            var j = d.x + d.width - i.x;
            if (j > h && j < c.width + g && (i.width = j), j < h) return e.position = "right", this.right(!1)
          }
          return i
        },
        right: function (f) {
          var i = {
            x: a.x - c.width - g,
            y: b.y + b.height / 2 - c.height / 2
          };
          if (f) {
            var j = a.x - g - d.x;
            if (j > h && j < c.width + g && (i.width = j, i.x = d.x), j < h) return e.position = "left", this.left(!1)
          }
          return i
        },
        top: function (f) {
          var h = {
            x: b.x + b.width / 2 - c.width / 2,
            y: a.y + a.height + g
          };
          if (f) {
            var i = d.y + d.height - (a.y + a.height + g);
            if (i < c.height) return e.position = "bottom", this.bottom(!1)
          }
          return h
        },
        bottom: function (f) {
          var h = {
            x: b.x + b.width / 2 - c.width / 2,
            y: a.y - c.height - g
          };
          if (f) {
            var i = a.y - g - d.y;
            if (i < c.height) return e.position = "top", this.top(!1)
          }
          return h
        }
      };
    return i[f](h > 0)
  },
  getTooltipBBox: function (a, b) {
    var c, d, e = this.measureTooltipElement();
    c = $(this.settings.positionSelector), d = c[0] ? joint.util.getElementBBox(c[0]) : a;
    var f = this.getPosition(d, a, e, b);
    f.y < b.y ? f.y = b.y : f.y + e.height > b.y + b.height && (f.y = b.y + b.height - e.height);
    var g = f.width || e.width;
    return f.x < b.x ? f.x = b.x : f.x + g > b.x + b.width && (f.x = b.x + b.width - g), f
  },
  measureTooltipElement: function () {
    var a = this.$el.clone().appendTo($("body")).css({
        left: -1e3,
        top: -500
      }),
      b = {
        width: a.outerWidth(),
        height: a.outerHeight()
      };
    return a.remove(), b
  }
});

joint.ui.Snaplines = joint.mvc.View.extend({
  options: {
    paper: void 0,
    distance: 10
  },
  className: "snaplines",
  init: function () {
    joint.util.bindAll(this, "hide"), this.$horizontal = $("<div>").addClass("snapline horizontal").appendTo(this.el), this.$vertical = $("<div>").addClass("snapline vertical").appendTo(this.el), this.$el.hide().appendTo(this.options.paper.el), this.startListening()
  },
  startListening: function () {
    this.stopListening(),
      this.listenTo(this.options.paper, "cell:pointerdown", this.captureCursorOffset),
      this.listenTo(this.options.paper, "cell:pointermove", this.snapWhileMoving),
      this.listenTo(this.options.paper.model, "batch:stop", this.onBatchStop),
      $(document).on("mouseup touchend", this.hide),
      this.filterTypes = {}, this.filterCells = {}, this.filterFunction = void 0,
      Array.isArray(this.options.filter) ? this.options.filter.forEach(function (a) {
        joint.util.isString(a) ? this.filterTypes[a] = !0 : this.filterCells[a.id] = !0
      }, this) : joint.util.isFunction(this.options.filter) && (this.filterFunction = this.options.filter)
  },
  onBatchStop: function (a) {
    a = a || {}, "resize" === a.batchName && this.snapWhileResizing(a.cell, a)
  },
  // 获得鼠标的位移值，localPosition - cell.position
  captureCursorOffset: function (cellView, evt, localX, localY) {
    if (this.canElementMove(cellView)) {
      var position = cellView.model.get("position");
      this._cursorOffset = {
        x: localX - position.x,
        y: localY - position.y
      }
    }
  },
  snapWhileResizing: function (a, b) {
    if (b.ui && !b.snapped && b.direction && b.trueDirection) {
      var c = this.options.paper.findViewByModel(a);
      if (c && c.model.isElement()) {
        var d = a.getBBox(),
          e = d.bbox(a.get("angle")),
          f = e.origin(),
          h = e.corner(),
          i = g.normalizeAngle(a.get("angle")),
          j = this.options.distance,
          k = null,
          l = null,
          m = {
            vertical: 0,
            horizontal: 0
          },
          n = b.direction,
          o = b.trueDirection,
          p = b.relativeDirection;
        if (o.indexOf("right") !== -1 ? m.vertical = h.x : m.vertical = f.x, o.indexOf("bottom") !== -1 ? m.horizontal = h.y : m.horizontal = f.y, this.options.paper.model.getElements().find(function (b) {
            if (b.id === a.id || b.isEmbeddedIn(a) || this.filterTypes[b.get("type")] || this.filterCells[b.id] || this.filterFunction && this.filterFunction(b)) return !1;
            var c = b.getBBox().bbox(b.get("angle")),
              d = c.origin(),
              e = c.corner(),
              f = {
                vertical: [d.x, e.x],
                horizontal: [d.y, e.y]
              };
            return joint.util.forIn(f, function (a, b) {
              a = a.map(function (a) {
                return {
                  position: a,
                  distance: Math.abs(a - m[b])
                }
              }), a = a.filter(function (a) {
                return a.distance < j
              }), a = joint.util.sortBy(a, function (a) {
                return a.distance
              }), f[b] = a
            }), null === k && f.vertical.length > 0 && (k = f.vertical[0].position), null === l && f.horizontal.length > 0 && (l = f.horizontal[0].position), joint.util.isNumber(k) && joint.util.isNumber(l)
          }, this), this.hide(), joint.util.isNumber(k) || joint.util.isNumber(l)) {
          var q = 0;
          joint.util.isNumber(k) && (q = o.indexOf("right") !== -1 ? k - e.corner().x : e.origin().x - k);
          var r = 0;
          joint.util.isNumber(l) && (r = o.indexOf("bottom") !== -1 ? l - e.corner().y : e.origin().y - l);
          var s = 0,
            t = 0,
            u = !(i % 90);
          if (u) 90 === i || 270 === i ? (s = r, t = q) : (s = q, t = r);
          else {
            var v;
            v = i >= 0 && i < 90 ? 1 : i >= 90 && i < 180 ? 4 : i >= 180 && i < 270 ? 3 : 2, l && k && (r > q ? (r = 0, l = null) : (q = 0, k = null));
            var w = g.toRad(i % 90);
            q && (s = 3 === v ? q / Math.cos(w) : q / Math.sin(w)), r && (t = 3 === v ? r / Math.cos(w) : r / Math.sin(w));
            var x = 1 === v || 3 === v;
            switch (p) {
              case "top":
              case "bottom":
                t = r ? r / (x ? Math.cos(w) : Math.sin(w)) : q / (x ? Math.sin(w) : Math.cos(w));
                break;
              case "left":
              case "right":
                s = q ? q / (x ? Math.cos(w) : Math.sin(w)) : r / (x ? Math.sin(w) : Math.cos(w))
            }
          }
          switch (p) {
            case "top":
            case "bottom":
              s = 0;
              break;
            case "left":
            case "right":
              t = 0
          }
          var y = this.options.paper.options.gridSize,
            z = Math.max(d.width + s, y),
            A = Math.max(d.height + t, y);
          b.minWidth && b.minWidth > y && (z = Math.max(z, b.minWidth)), b.minHeight && b.minHeight > y && (A = Math.max(A, b.minHeight)), b.maxWidth && (z = Math.min(z, b.maxWidth)), b.maxHeight && (A = Math.min(A, b.maxHeight)), b.preserveAspectRatio && (s > t ? A = z * (d.height / d.width) : z = A * (d.width / d.height)), z === d.width && A === d.height || a.resize(z, A, {
            snaplines: this.cid,
            restrictedArea: this.options.paper.getRestrictedArea(c),
            direction: n,
            relativeDirection: p,
            trueDirection: o,
            snapped: !0
          });
          var B = a.getBBox().bbox(i),
            C = 1;
          k && Math.abs(B.x - k) > C && Math.abs(B.width + B.x - k) > C && (k = null), l && Math.abs(B.y - l) > C && Math.abs(B.height + B.y - l) > C && (l = null), this.show({
            vertical: k,
            horizontal: l
          })
        }
      }
    }
  },
  canElementMove: function (cellView) {
    return cellView && cellView.model.isElement() && cellView.can("elementMove")
  },
  // cloneView, evt, localPosition.x, localPosition.y
  snapWhileMoving: function (cloneView, evt, localX, localY) {
    if (this.canElementMove(cloneView)) {
      // e: cell
      var cell = cloneView.model,
        f = cell.get("position"),
        h = cell.get("size"),
        i = g.rect(joint.util.assign({
          x: localX - this._cursorOffset.x,
          y: localY - this._cursorOffset.y
        }, h)),
        j = i.center(),
        k = i.bbox(cell.get("angle")),
        l = k.origin(),
        m = k.corner(),
        n = this.options.distance,
        o = null,
        p = null,
        q = 0,
        r = 0;
      if (this.options.paper.model.getElements().find(function (element) {
          if (element === cell || element.isEmbeddedIn(cell) || this.filterTypes[element.get("type")] || this.filterCells[element.id] || this.filterFunction && this.filterFunction(element)) return !1;
          var b = element.getBBox().bbox(element.get("angle")),
            // c:center, d:origin, f: corner
            center = b.center(),
            origin = b.origin(),
            corner = b.corner();
          return null === o && (Math.abs(center.x - j.x) < n ? (o = center.x, q = .5) : Math.abs(origin.x - l.x) < n ? o = origin.x : Math.abs(origin.x - m.x) < n ? (o = origin.x, q = 1) : Math.abs(corner.x - m.x) < n ? (o = corner.x, q = 1) : Math.abs(corner.x - l.x) < n && (o = corner.x)),
          null === p && (Math.abs(center.y - j.y) < n ? (p = center.y, r = .5) : Math.abs(origin.y - l.y) < n ? p = origin.y : Math.abs(origin.y - m.y) < n ? (p = origin.y, r = 1) : Math.abs(corner.y - m.y) < n ? (p = corner.y, r = 1) : Math.abs(corner.y - l.y) < n && (p = corner.y)),
          joint.util.isNumber(o) && joint.util.isNumber(p)
        }, this),
          this.hide(),
        joint.util.isNumber(o) || joint.util.isNumber(p)
      ) {
        joint.util.isNumber(o) && (k.x = o - q * k.width), joint.util.isNumber(p) && (k.y = p - r * k.height);
        var s = k.center(),
          t = s.x - i.width / 2,
          u = s.y - i.height / 2;
        cell.translate(t - f.x, u - f.y, {
          restrictedArea: this.options.paper.getRestrictedArea(cloneView),
          snapped: !0
        }), this.show({
          vertical: o,
          horizontal: p
        })
      }
    }
  },
  show: function (a) {
    a = a || {};
    var b = this.options.paper.matrix();
    a.horizontal ? this.$horizontal.css("top", a.horizontal * b.d + b.f).show() : this.$horizontal.hide(), a.vertical ? this.$vertical.css("left", a.vertical * b.a + b.e).show() : this.$vertical.hide(), this.$el.show()
  },
  hide: function () {
    this.$el.hide()
  },
  onRemove: function () {
    $(document).off("mouseup", this.hide)
  }
});

//handle key event
!function (joint, Backbone, c) {
  "use strict";
  //d:keyboard
  var keyboard = function () {
    joint.util.bindAll(this, "handleKey"), this.parser = new e, this.enable()
  };
  joint.util.assign(keyboard.prototype, Backbone.Events),
    keyboard.prototype.on = function (a, c, d) {
      return Backbone.Events.on.call(this, this.normalizeEvent(a), c, d), this
    },
    keyboard.prototype.off = function (a, c, d) {
      var e = a ? this.normalizeEvent(a) : null;
      return Backbone.Events.off.call(this, e, c, d), this
    },
    keyboard.prototype.normalizeEvent = function (a) {
      if ("object" == typeof a) {
        for (var b = Object.keys(a), c = {}, d = 0, e = b.length; d < e; d++) {
          var f = b[d];
          c[this.normalizeEvent(f)] = a[f]
        }
        return c
      }
      return this.normalizeShortcut(a)
    },
    keyboard.prototype.normalizeShortcut = function (a) {
      if ("all" === a.toLowerCase()) return a;
      for (var b = this.parser.toEventObjectList(a), c = [], d = 0; d < b.length; d++) c.push(this.hash(b[d]));
      return c.join(" ")
    },
    keyboard.prototype.enable = function () {
      window.addEventListener ? (document.addEventListener("keydown", this.handleKey, !1), document.addEventListener("keypress", this.handleKey, !1), document.addEventListener("keyup", this.handleKey, !1)) : window.attachEvent && (document.attachEvent("keydown", this.handleKey, !1), document.attachEvent("keypress", this.handleKey, !1), document.attachEvent("keyup", this.handleKey, !1))
    },
    keyboard.prototype.disable = function () {
      window.removeEventListener ? (document.removeEventListener("keydown", this.handleKey, !1), document.removeEventListener("keypress", this.handleKey, !1), document.removeEventListener("keyup", this.handleKey, !1)) : window.detachEvent && (document.detachEvent("keydown", this.handleKey, !1), document.detachEvent("keypress", this.handleKey, !1), document.detachEvent("keyup", this.handleKey, !1))
    },
    keyboard.prototype.isActive = function (a, b) {
      return this.isModifierActive(a, b)
    },
    keyboard.prototype.isModifierActive = function (a, b) {
      for (var c = this.parser.toEventObjectList(a), d = 0; d < c.length; d++)
        if (c[d].modifiersCompare(b)) return !0;
      return !1
    },
    keyboard.prototype.hash = function (a) {
      var b = function (a) {
          return a ? 1 : 0
        },
        c = [a.type, ":", a.which, b(a.shiftKey), b(a.ctrlKey), b(a.altKey), b(a.metaKey)];
      return c.join("")
    },
    keyboard.prototype.handleKey = function (a) {
      if (!this.isUnsupportedElement(a)) {
        var c = l.fromNative(a);
        Backbone.Events.trigger.call(this, this.hash(c), a)
      }
    },
    keyboard.prototype.isUnsupportedElement = function (a) {
      var b = a.target || a.srcElement;
      if (b) {
        var c = b.tagName.toUpperCase();
        return "INPUT" === c || "SELECT" === c || "TEXTAREA" === c || b.isContentEditable
      }
      return !1
    };
  var e = function () {
  };
  e.prototype = {
    constructor: e,
    parseEventString: function (a) {
      a = a || "";
      var b, c, d = a.split("+"),
        f = new l(0);
      for (c = 0; c < d.length; c++) {
        b = d[c];
        var g = this.getModifierPropertyName(b);
        g && (f[g] = !0), 1 !== d.length && void 0 !== g || (f.which = e.getCode(b))
      }
      return f
    },
    toEventObjectList: function (a) {
      var b = a.replace(/\s*\+\s*/gi, "+").split(" ");
      return b.map(this.composeEventObject, this)
    },
    composeEventObject: function (a) {
      var b = a.split(":"),
        c = j.KEYDOWN,
        d = b[0];
      if (b.length > 1 && (d = b[1], c = b[0]), k.indexOf(c) === -1) throw a + ": invalid shortcut definition";
      var e = this.parseEventString(d);
      return c === j.KEYUP && g[e.which] && (e[g[e.which]] = !1), e.setType(c)
    },
    getModifierPropertyName: function (a) {
      var b = f[a];
      return g[b]
    }
  },
    e.getCode = function (a) {
      return i[a] || a.toUpperCase().charCodeAt(0)
    };
  var f = {
      shift: 16,
      alt: 18,
      option: 18,
      ctrl: 17,
      control: 17,
      command: 91,
      meta: 91
    },
    g = {
      16: "shiftKey",
      18: "altKey",
      17: "ctrlKey",
      91: "metaKey"
    },
    h = {
      226: "\\",
      57392: "ctrl",
      63289: "num",
      59: ";",
      61: "=",
      173: "-"
    },
    i = {
      backspace: 8,
      tab: 9,
      shift: 16,
      ctrl: 17,
      alt: 18,
      meta: 91,
      clear: 12,
      enter: 13,
      "return": 13,
      esc: 27,
      escape: 27,
      capslock: 20,
      space: 32,
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      del: 46,
      "delete": 46,
      home: 36,
      end: 35,
      insert: 45,
      ins: 45,
      pageup: 33,
      pagedown: 34,
      plus: 187,
      minus: 189,
      "-": 189,
      ",": 188,
      ".": 190,
      "/": 191,
      "`": 192,
      "=": 187,
      ";": 186,
      "'": 222,
      "[": 219,
      "]": 221,
      "\\": 220,
      F1: 112,
      F2: 113,
      F3: 114,
      F4: 115,
      F5: 116,
      F6: 117,
      F7: 118,
      F8: 119,
      F9: 120,
      F10: 121,
      F11: 122,
      F12: 123
    },
    j = {
      KEYPRESS: "keypress",
      KEYDOWN: "keydown",
      KEYUP: "keyup"
    },
    k = [j.KEYPRESS, j.KEYDOWN, j.KEYUP],
    l = function (a, b, c, d, e, f) {
      this.which = a, this.shiftKey = b || !1, this.ctrlKey = c || !1, this.altKey = d || !1, this.metaKey = e || !1, this.type = f || j.KEYDOWN
    };
  l.fromNative = function (a) {
    var b = a.which;
    a.type === j.KEYPRESS && (b = String.fromCharCode(a.which).toUpperCase().charCodeAt(0)), h[b] && (b = e.getCode(h[b]));
    var c = new l(b, a.shiftKey, a.ctrlKey, a.altKey, a.metaKey, a.type);
    return a.type === j.KEYUP && g[b] && (c[g[b]] = !1), c
  },
    l.prototype.modifiersCompare = function (a) {
      return !(this.shiftKey && this.shiftKey !== a.shiftKey || this.ctrlKey && this.ctrlKey !== a.ctrlKey || this.altKey && this.altKey !== a.altKey || this.metaKey && this.metaKey !== a.metaKey)
    },
    l.prototype.setType = function (a) {
      return this.type = a, this
    },
    joint.ui.Keyboard = keyboard
}(joint, Backbone, _);

joint.ui.SelectBox = joint.mvc.View.extend({
  className: "select-box",
  events: {
    "click .select-box-selection": "onToggle"
  },
  options: {
    options: [],
    width: void 0,
    openPolicy: "auto",
    target: null,
    keyboardNavigation: !0,
    selected: void 0,
    selectBoxOptionsClass: void 0,
    disabled: !1
  },
  init: function () {
    this.options.target = this.options.target || document.body, joint.util.bindAll(this, "onOutsideClick", "onOptionSelect"), $(document).on("click.selectBox", this.onOutsideClick), this.$el.data("view", this), void 0 === this.options.selected ? this.selection = joint.util.toArray(this.options.options).find(function (a) {
      return a.selected === !0
    }) || this.options.options[0] : this.selection = this.options.options[this.options.selected]
  },
  render: function () {
    return this.$el.empty(), this.$selection = null, this.renderSelection(this.selection), this.options.width && this.$el.css("width", this.options.width), this.options.disabled && this.disable(), this.$el.append(this.$options), this
  },
  renderOptions: function () {
    this.removeOptions();
    var a = this.options,
      b = {
        selectBoxView: this,
        parentClassName: joint.util.result(this, "className") || null,
        extraClassName: joint.util.result(a, "selectBoxOptionsClass") || null,
        options: a.options
      };
    a.width && (b.width = a.width), a.theme && (b.theme = a.theme);
    var c = this.optionsView = new this.constructor.OptionsView(b);
    c.render(), this.listenTo(c, "option:select", this.onOptionSelect),
      this.listenTo(c, "option:hover", this.onOptionHover),
      this.listenTo(c, "options:mouseout", this.onOptionsMouseOut),
      this.$options = c.$el, this.$optionsArrow = c.$arrow, this.$target = $(a.target)
  },
  onOptionHover: function (a, b) {
    this.trigger("option:hover", a, b)
  },
  onOptionsMouseOut: function (a) {
    this.trigger("options:mouseout", a)
  },
  onOptionSelect: function (a, b) {
    this.select(a, b)
  },
  removeOptions: function () {
    this.optionsView && (this.stopListening(this.optionsView), this.optionsView.remove(), this.optionsView = null)
  },
  renderSelection: function (a) {
    if (this.$selection || (this.$selection = $("<div/>", {
        "class": "select-box-selection"
      }), this.$el.append(this.$selection)), this.$selection.empty(), a) {
      var b = this.constructor.OptionsView.prototype.renderOptionContent.call(void 0, a);
      this.$selection.append(b)
    } else if (this.options.placeholder) {
      var c = $("<div/>", {
        "class": "select-box-placeholder",
        html: this.options.placeholder
      });
      this.$selection.append(c)
    }
  },
  onToggle: function (a) {
    this.toggle()
  },
  onOutsideClick: function (a) {
    !this.el.contains(a.target) && this.$el.hasClass("opened") && this.close()
  },
  getSelection: function () {
    return this.selection
  },
  getSelectionValue: function (a) {
    return a = a || this.selection, a && (void 0 === a.value ? a.content : a.value)
  },
  getSelectionIndex: function () {
    return joint.util.toArray(this.options.options).findIndex(function (a) {
      return a === this.selection
    })
  },
  select: function (a, b) {
    this.selection = this.options.options[a], this.renderSelection(this.selection), this.trigger("option:select", this.selection, a, b), this.close()
  },
  selectByValue: function (a, b) {
    for (var c = this.options.options || [], d = 0; d < c.length; d++) {
      var e = c[d];
      if (void 0 === e.value && e.content === a) return this.select(d, b);
      if (void 0 !== e.value && joint.util.isEqual(e.value, a)) return this.select(d, b)
    }
  },
  isOpen: function () {
    return this.$el.hasClass("opened")
  },
  toggle: function () {
    this.isOpen() ? this.close() : this.open()
  },
  position: function () {
    var a = this.$(".select-box-selection"),
      b = a.outerHeight(),
      c = a.offset(),
      d = c.left,
      e = c.top,
      f = this.$options.outerHeight(),
      g = {
        left: 0,
        top: 0
      };
    this.options.target !== document.body ? (g = this.$target.offset(), g.width = this.$target.outerWidth(), g.height = this.$target.outerHeight(), g.left -= this.$target.scrollLeft(), g.top -= this.$target.scrollTop()) : (g.width = $(window).width(), g.height = $(window).height());
    var h = d,
      i = "auto",
      j = this.options.openPolicy;
    switch ("selected" !== j || this.selection || (j = "auto"), j) {
      case "above":
        i = e - f;
        break;
      case "coverAbove":
        i = e - f + b;
        break;
      case "below":
        i = e + b;
        break;
      case "coverBelow":
        i = e;
        break;
      case "selected":
        var k = this.$options.find(".selected").position();
        i = e - k.top;
        break;
      default:
        var l = e - this.$target.scrollTop() + f > g.top + g.height;
        i = l ? e - f + b : e
    }
    h -= g.left, i -= g.top, this.$options.css({
      left: h,
      top: i
    })
  },
  open: function () {
    this.isDisabled() || (this.renderOptions(), this.$options.appendTo(this.options.target), this.$options.addClass("rendered"), this.position(), this.$el.addClass("opened"), this.respectWindowBoundaries(), this.alignOptionsArrow())
  },
  respectWindowBoundaries: function () {
    var a = this.calculateElOverflow(this.$options),
      b = {
        left: 0,
        top: 0
      };
    this.$options.outerWidth() <= this.$target.innerWidth() && (a.left && a.right || (a.left ? b.left = a.left : a.right && (b.left = -a.right))), this.$options.outerHeight() <= this.$target.innerHeight() && (a.top && a.bottom || (a.top ? b.top = a.top : a.bottom && (b.top = -a.bottom))), this.$options.css({
      left: "+=" + b.left,
      top: "+=" + b.top
    })
  },
  alignOptionsArrow: function () {
    var a = this.$el[0].getBoundingClientRect(),
      b = this.$options[0].getBoundingClientRect(),
      c = a.left + a.width / 2;
    c -= b.left, c -= this.$optionsArrow.outerWidth() / 2, this.$optionsArrow.css({
      left: c
    })
  },
  close: function () {
    this.removeOptions(), this.$el.removeClass("opened"), this.trigger("close")
  },
  onRemove: function () {
    this.removeOptions(), $(document).off(".selectBox", this.onOutsideClick)
  },
  isDisabled: function () {
    return this.$el.hasClass("disabled")
  },
  enable: function () {
    this.$el.removeClass("disabled")
  },
  disable: function () {
    this.close(), this.$el.addClass("disabled")
  },
  onSetTheme: function (a, b) {
    this.$options && (a && this.$options.removeClass(this.themeClassNamePrefix + a), this.$options.addClass(this.themeClassNamePrefix + b))
  },
  calculateElOverflow: function (a, b) {
    b || (b = window), a instanceof $ && (a = a[0]), b instanceof $ && (b = b[0]);
    var c, d = {},
      e = a.getBoundingClientRect();
    if (b === window) {
      var f = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        g = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      c = {
        width: f,
        height: g,
        left: 0,
        top: 0,
        right: f,
        bottom: g
      }
    } else c = b.getBoundingClientRect();
    return ["left", "top"].forEach(function (a) {
      d[a] = Math.min(0, e[a] - c[a])
    }), ["right", "bottom"].forEach(function (a) {
      d[a] = Math.min(0, c[a] - e[a])
    }), joint.util.forIn(d, function (a, b) {
      d[b] = Math.abs(Math.round(a))
    }), d
  }
}, {
  OptionsView: joint.mvc.View.extend({
    events: {
      "mouseover .select-box-option": "onOptionHover",
      "click .select-box-option": "onOptionClick"
    },
    className: function () {
      var a = ["select-box-options"],
        b = this.options.parentClassName;
      return b && a.push(b), a.join(" ")
    },
    init: function () {
      joint.util.bindAll(this, "onMouseout", "onKeydown"), $(document).on({
        "keydown.selectBoxOptions": this.onKeydown,
        "mouseleave.selectBoxOptions mouseout.selectBoxOptions": this.onMouseout
      })
    },
    render: function () {
      var a = this.options.extraClassName;
      return a && this.$el.addClass(a), this.options.width && this.$el.css("width", this.options.width), joint.util.toArray(this.options.options).forEach(function (a, b) {
        var c = this.renderOption(a, b);
        this.options.selectBoxView.selection === a && c.addClass("selected hover"), this.$el.append(c)
      }, this), this.$arrow = $("<div/>").addClass("select-box-options-arrow").appendTo(this.$el), this
    },
    renderOption: function (a, b) {
      var c = this.renderOptionContent(a);
      return c.addClass("select-box-option"), c.data("index", b), c
    },
    renderOptionContent: function (a) {
      var b = $("<div/>", {
        "class": "select-box-option-content",
        html: a.content
      });
      return a.icon && b.prepend($("<img/>", {
        "class": "select-box-option-icon",
        src: a.icon
      })), b
    },
    select: function (a, b) {
      this.trigger("option:select", a, b)
    },
    hover: function (a) {
      var b = this.options.options[a];
      this.markOptionHover(a), this.trigger("option:hover", b, a)
    },
    onOptionClick: function (a) {
      var b = this.getOptionIndex(a.target);
      this.select(b, {
        ui: !0
      })
    },
    onOptionHover: function (a) {
      var b = this.getOptionIndex(a.target);
      this.hover(b)
    },
    onMouseout: function (a) {
      this.trigger("options:mouseout", a)
    },
    onKeydown: function (a) {
      var b = this.options.selectBoxView;
      if (b.options.keyboardNavigation && b.isOpen()) {
        var c;
        switch (a.which) {
          case 39:
          case 40:
            c = 1;
            break;
          case 38:
          case 37:
            c = -1;
            break;
          case 13:
            var d = this.getOptionHoverIndex();
            return void(d >= 0 && this.select(d));
          case 27:
            return b.close();
          default:
            return
        }
        a.preventDefault();
        var e = this.getOptionHoverIndex(),
          f = e + c,
          g = this.options.options;
        f < 0 && (f = g.length - 1), f >= g.length && (f = 0), this.hover(f)
      }
    },
    onRemove: function () {
      $(document).off(".selectBoxOptions")
    },
    markOptionHover: function (a) {
      this.$el.find(".hover").removeClass("hover"), $(this.$el.find(".select-box-option")[a]).addClass("hover")
    },
    getOptionHoverIndex: function () {
      return this.$el.find(".select-box-option.hover").index()
    },
    getOptionIndex: function (a) {
      return $(a).closest(".select-box-option").data("index")
    }
  })
});

joint.layout = joint.layout || {},
  joint.layout.GridLayout = {
    //a: graph ,b:{columnWidth: 110, columns: 2, rowHeight: 80, resizeToFit: true, dy: 10,resizeToFit:true,rowHeight:80}
    layout: function (a, layout) {
      // c:graph
      var graph;
      graph = a instanceof joint.dia.Graph ? a : (new joint.dia.Graph).resetCells(a, {
        dry: !0
      }),
        a = null,
        layout = layout || {};
      // e: columns，d:elements, g:dx, h:dy，k:marginX, l:marginY
      var elements = graph.getElements(),
        columns = layout.columns || 1, // 2
        // 大于或等于其数字参数的最小整数
        f = Math.ceil(elements.length / columns), // 3
        dx = layout.dx || 0, //10
        dy = layout.dy || 0, //10
        i = void 0 === layout.centre || layout.centre !== !1, //true
        j = !!layout.resizeToFit, // true
        marginX = layout.marginX || 0, //0
        marginY = layout.marginY || 0, //0
        m = [],
        n = layout.columnWidth; // 110
      if ("compact" === n)
        for (var o = 0; o < columns; o++) {
          var p = this._elementsAtColumn(elements, o, columns);
          m.push(this._maxDim(p, "width") + dx)
        } else {
        n && !joint.util.isString(n) || (n = this._maxDim(elements, "width") + dx);
        for (var q = 0; q < columns; q++)
          m.push(n)                // "customs"group m=[110,110]
      }
      var r = this._accumulate(m, marginX), // r=[0,110,220]
        s = [],
        t = layout.rowHeight; // 80
      if ("compact" === t)
        for (var u = 0; u < f; u++) {
          var v = this._elementsAtRow(elements, u, columns);
          s.push(this._maxDim(v, "height") + dy)
        } else {
        t && !joint.util.isString(t) || (t = this._maxDim(elements, "height") + dy);
        for (var w = 0; w < f; w++) s.push(t) // s=[80,80,80]
      }
      var x = this._accumulate(s, marginY); // x = [0,80,160,240]
      graph.startBatch("layout"),
        elements.forEach(function (element, index) {
          // p:size
          var d = index % columns,
            f = Math.floor(index / columns),
            k = m[d], //110
            l = s[f], //80
            n = 0,
            o = 0,
            size = element.get("size"); //width:5,height:3
          // resizeToFit 改变cell的高/宽尺寸来适应size中设置的宽高比
          if (j) {
            var q = k - 2 * dx, // 110-2*10 =90 ,x
              t = l - 2 * dy, // 80-2*10 = 60 ,y
              u = size.height * (size.width ? q / size.width : 1), // x = y*(h/w) ,u= q*(h/w),54
              v = size.width * (size.height ? t / size.height : 1); // y = x*(w/h),v= t*(w/h) ,100
            u > l ? q = v : t = u, size = {
              width: q, //90
              height: t //54 ,按宽度不变，改变高度=宽度*（3/5）
            }, element.set("size", size, layout)
          }
          // n=(100-90)/2=10,o=(80-54)/2=13
          i && (n = (k - size.width) / 2, o = (l - size.height) / 2),
            element.position(r[d] + dx + n, x[f] + dy + o, layout)
          // r =[0 110 220] x=[0 80 160 240]，最后一个数用不到
          // (20,23),(130,23),(20,103),(130,103),(20,183)
        }),
        graph.stopBatch("layout")
    },
    _maxDim: function (a, b) {
      return a.reduce(function (a, c) {
        return Math.max(c.get("size")[b], a)
      }, 0)
    },
    _elementsAtRow: function (a, b, c) {
      for (var d = [], e = c * b, f = e + c; e < f; e++) d.push(a[e]);
      return d
    },
    _elementsAtColumn: function (a, b, c) {
      for (var d = [], e = b, f = a.length; e < f; e += c) d.push(a[e]);
      return d
    },
    // a:[110,110],margin:0
    _accumulate: function (a, margin) {
      // array.reduce(function(total, currentValue, currentIndex, arr), initialValue) 1)a=[0],b=110,c=0 2)a=[0 110],b=110,c=1 3)a=[0,110,110,220]
      return a.reduce(function (a, b, c) {
        return a.push(a[c] + b), a
      }, [margin || 0])
    }
  };

joint.ui.Dialog = joint.mvc.View.extend({
  className: "dialog",
  events: {
    "click .bg": "action",
    "click .btn-close": "action",
    "click .controls button": "action",
    "mousedown .titlebar": "onDragStart",
    "touchstart .titlebar": "onDragStart"
  },
  options: {
    draggable: !1,
    closeButtonContent: "&times;",
    closeButton: !0,
    inlined: !1,
    modal: 0
  },
  init: function () {
    joint.util.bindAll(this, "onDrag", "onDragEnd")
  },
  render: function () {
    var a = $("<div/>", {
        "class": "bg",
        "data-action": "close"
      }),
      b = $("<div/>", {
        "class": "fg"
      }),
      c = $("<div/>", {
        "class": "titlebar"
      }),
      d = $("<div/>", {
        "class": "body"
      }),
      e = $("<button/>", {
        "class": "btn-close",
        "data-action": "close",
        html: this.options.closeButtonContent
      }),
      f = $("<div/>", {
        "class": "controls"
      });
    return this.$el.toggleClass("draggable", !!this.options.draggable), this.options.type && this.$el.attr("data-type", this.options.type), this.options.inlined && this.$el.addClass("inlined"), this.options.modal && this.$el.addClass("modal"), this.options.width && b.width(this.options.width), this.options.title ? c.append(this.options.title) : c.addClass("empty"), this.options.content && d.append(this.options.content), this.options.buttons && this.options.buttons.reverse().forEach(function (a) {
      var b = $("<button/>", {
        "class": "control-button",
        html: a.content,
        "data-action": a.action
      });
      a.position && b.addClass(a.position), f.append(b)
    }), b.append(c, d, f), this.options.closeButton && b.append(e), this.$el.empty().append(a, b), this
  },
  open: function (a) {
    return this.delegateEvents(), this.on("action:close", this.close, this), $(document.body).on({
      "mousemove.dialog touchmove.dialog": this.onDrag,
      "mouseup.dialog touchend.dialog": this.onDragEnd
    }), $(a || document.body).append(this.render().el), this.$el.addClass("rendered"), this
  },
  close: function () {
    return this.remove(), this
  },
  onRemove: function () {
    $(document.body).off(".dialog", this.onDrag).off(".dialog", this.onDragStart)
  },
  action: function (a) {
    var b = $(a.target).closest("[data-action]"),
      c = b.attr("data-action");
    c && this.trigger("action:" + c)
  },
  onDragStart: function (evt) {
    this.options.draggable && (evt = joint.util.normalizeEvent(evt), this._dx = evt.clientX, this._dy = evt.clientY, this._dragging = !0)
  },
  onDrag: function (evt) {
    if (this._dragging) {
      evt = joint.util.normalizeEvent(evt);
      var b = this.$(".fg"),
        c = b.offset();
      b.css({
        top: c.top + (evt.clientY - this._dy),
        left: c.left + (evt.clientX - this._dx),
        margin: 0
      }), this._dx = evt.clientX, this._dy = evt.clientY
    }
  },
  onDragEnd: function () {
    this._dragging = !1
  }
});
joint.ui.FlashMessage = joint.ui.Dialog.extend({
  className: joint.ui.Dialog.prototype.className + " flash-message",
  options: joint.util.merge({}, joint.ui.Dialog.prototype.options, {
    closeButton: !0,
    modal: !1,
    cascade: !0,
    closeAnimation: {
      delay: 2e3,
      duration: 200,
      easing: "swing",
      properties: {
        opacity: 0
      }
    },
    openAnimation: {
      duration: 200,
      easing: "swing",
      properties: {
        opacity: 1
      }
    }
  }),
  init: function () {
    joint.util.bindAll(this, "startCloseAnimation"), joint.ui.Dialog.prototype.init.apply(this, arguments), this.on("close:animation:complete", this.close, this)
  },
  open: function () {
    joint.ui.Dialog.prototype.open.apply(this, arguments);
    var a = this.$(".fg");
    return this._foregroundHeight = a.height(), this.addToCascade(), a.css("height", 0), this.startOpenAnimation(), this.options.closeAnimation && this.options.closeAnimation.delay && setTimeout(this.startCloseAnimation, this.options.closeAnimation.delay), this
  },
  close: function () {
    return joint.ui.Dialog.prototype.close.apply(this, arguments), this.removeFromCascade(), this
  },
  addToCascade: function () {
    if (this.options.cascade) {
      var a = this.constructor.top;
      this.$(".fg").css("top", a), this.constructor.top += this._foregroundHeight + this.constructor.padding
    }
    this.constructor.opened.push(this)
  },
  removeFromCascade: function () {
    if (this.options.cascade) {
      for (var a = this.constructor.opened, b = !1, c = 0; c < a.length; c++) {
        var d = a[c];
        if (d.options.cascade && b) {
          var e = parseInt(d.$(".fg").css("top"), 10);
          d.$(".fg").css("top", e - this._foregroundHeight - this.constructor.padding)
        }
        d === this && (b = !0)
      }
      b && (this.constructor.top -= this._foregroundHeight + this.constructor.padding)
    }
    this.constructor.opened = joint.util.without(this.constructor.opened, this)
  },
  startCloseAnimation: function () {
    this.$(".fg").animate(this.options.closeAnimation.properties, joint.util.assign({
      complete: function () {
        this.trigger("close:animation:complete")
      }.bind(this)
    }, this.options.closeAnimation))
  },
  startOpenAnimation: function () {
    var a = this.$(".fg");
    a.animate(joint.util.assign({}, this.options.openAnimation.properties, {
      height: this._foregroundHeight
    }), joint.util.assign({
      complete: function () {
        this.trigger("open:animation:complete")
      }.bind(this)
    }, this.options.openAnimation))
  }
}, {
  top: 20,
  padding: 15,
  opened: [],
  open: function (a, b, c) {
    return c = c || {}, new joint.ui.FlashMessage(joint.util.assign({
      title: b,
      type: "info",
      content: a
    }, c)).open(c.target)
  },
  close: function () {
    joint.util.invoke(this.opened, "close")
  }
});

joint.dia.Link.define('app.Link', {
  router: {
    name: 'normal'
  },
  connector: {
    name: 'normal'
  },
  attrs: {
    '.tool-options': {
      'data-tooltip-class-name': 'small',
      'data-tooltip': 'Click to open Inspector for this link',
      'data-tooltip-position': 'left'
    },
    '.marker-source': {
      d: 'M 10 0 L 0 5 L 10 10 z',
      stroke: 'transparent',
      fill: '#222138',
      transform: 'scale(0.001)'
    },
    '.marker-target': {
      d: 'M 10 0 L 0 5 L 10 10 z',
      stroke: 'transparent',
      fill: '#222138',
      transform: 'scale(0.7)'
    },
    '.connection': {
      stroke: '#222138',
      strokeDasharray: '0',
      strokeWidth: 2,
      fill: 'none'
    },
    '.connection-wrap': {
      fill: 'none'
    }
  }
});

export {joint};
