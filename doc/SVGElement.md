EventTarget <--- Node  <--- Element <--- SVGElement <--- SVGGraphicsElement <--- SVGSVGElement

# EventTarget
是由可以接收事件并可能有侦听器的对象实现的接口，Element，document，window是最常见的event targets.

# Node 
许多DOM API对象类型继承的接口，允许对这些不同类型进行类似处理。
以下接口全部从Node继承其方法和属性：Docuement,Element,characterData(Text,Comment等继承)......

1. 从EventTarget继承的属性：
- childNodes,返回一个NodeList
- firstChild/lastChild，第一个/最后一个子节点
- nextSibling/previousSibling，后/前一个兄弟节点
- nodeName，返回包含Node名称的DOMString，如audio,#text,#document
- nodeType，返回表示节点类型的无符号短整型，1-ELEMENT_NODE,......
- nodeValue，返回/设置当前节点的值
- parentNode,返回当前节点的父节点
- textContent，返回/设置元素及其所有后代的文本内容

2. 继承的方法
- appendChild，添加到该节点，作为最后一个子节点
- cloneNode,clone一个节点，及其（可选的）所有内容
- contains，节点是否是给定节点的后代
- hasChildNodes
- insertBefore
- removeChild
- replaceChild


# Element
是Document中所有对象继承的最普通的基类，它只有各种元素共有的方法和属性，更具体的类继承自Element，如HTMLElement接口是HTML元素的基本接口，SVGElement接口
是所有SVG元素的基础。

Element从其父接口Node，以及Node的父接口EventTarget的扩展继承属性，实现了ParentNode，ChildNode，...和Animatable的属性

属性： 
- attributes，返回包含相应HTML元素的指定属性的NamedNodeMap对象（Attr对象的集合）
- id,DOMString，表示元素ID
- clientWidth/clientHeight，元素内部（inner）宽/高度，包含content,padding，不包含边框大小
- scrollLeft/scrollTop，该元素的显示（可见）的内容与该元素实际内容的距离。
  元素会从scrollLeft/scrollTop的位置显示该元素的内容，位于对象最left/top端和窗口中可见内容的最left/top端之间的距离，及当前scrollLeft/scrollTop的距离
- scrollWidth/scrollHeight，对象可滚动的总宽/高度
- offsetLeft/offsetTop,当前对象与父元素之间的距离（不包含父元素的边框）
- offsetWidth/offsetHeight,元素自身的宽/高，包含元素边框及边框内部的内容，也会把滚动条的宽/高计算在内
- innerHTML,DOMString，表示元素内容的标记
- tagName，返回给定元素的标签名称的字符串String

方法：
element.xxx()
- animate，在元素上创建和运行动画，返回创建的Animation对象实例
- closest,返回当前元素的最接近的祖先元素，要与参数中给出的selector匹配的最近祖先（从当前元素开始，沿DOM树向上遍历，直到找到匹配的selector为止）
- getAttribute，从当前节点中检索指定attr的值，将其作为object返回
- getBoundingClientRect,返回元素的大小，及其相对于viewport的位置
- getClientRects，返回矩形的合集，指示client中每行文本的边界矩形的矩形的集合
- hasAttribute
- hasAttributeNS，指示元素是否在指定的namespace中具有指定属性
- removeAttributeNS,从当前节点中删除具有指定名称和namespace的属性
- setAttributeNS，用指定的名称和namespace设置属性值
- querySelector，返回第一个与指定的selector字符串相对应的node
- querySelectorAll，返回与元素相关的selector匹配的node的NodeList

- EventTarget.dispatchEvent，将事件分派给DOM中的此节点，并返回一个Boolean，指示是否没有handler取消该事件

# SVGElement
所有与SVG语言中的元素相对应的SVG DOM接口，都来自于SVGElement接口。
1. 属性
- id,id属性，DOMString
- xmlbase,xml:base属性，DOMString
- ownerSVGElement,指向最近的祖先<svg>元素的一个SVGSVGElement，如果给定的元素是最外层<svg>元素，返回null
- viewportElement,建立了当前viewport的SVGElement，通常是最近的祖先<svg>元素

2. 方法
SVGElement完全继承了Element的方法，未添加其他方法。

# SVGSVGElement
该接口提供了对<svg>元素属性，以及操作它们的方法的访问。还包括各种常用的工具方法，如matrix操作，控制可视化渲染设备重绘时间的能力。

属性：
- perserveAspectRatio,指示是否强制统一缩放（希望图形拉伸非均匀地适应占据整个viewport，或为了保持图形的高宽比，希望使用均匀缩放）


方法：
- createSVGPoint()，在任何文档树之外创建一个SVGPoint对象，初始化为用户坐标系中的点（0,0）
- createSVGMatrix()，在任何文档树之外创建一个SVGMatrix对象，初始化为单位矩阵
- createSVGTransform()，在任何文档树之外创建一个SVGTransform对象，初始化为单位b变换矩阵

## SVGGraphicsElement
该接口表示直接将图形渲染到一个group中的SVG元素

方法：
 - getBBox(),返回表示当前元素的计算的边界框的DOMRect
 - getCTM()，返回一个DOMMatrix，表示将当前元素的坐标系转换为SVG viewport坐标系的矩阵
 - getScreenCTM()，返回一个DOMMatrix，表示将当前元素的坐标系转换为SVG文档fragment的SVG viewport的坐标系的矩阵
 
 
