**可缩放的矢量图形**（**Scalable Vector Graphics，SVG**），是一种用于描述基于二维的矢量图形的，基于XML的标记语言。本质上，SVG 相对于图像，就好比HTML相对于文本。

SVG 图像及其相关行为被定义于 [XML](https://developer.mozilla.org/zh-CN/docs/XML_%E4%BB%8B%E7%BB%8D) 文本文件之中，这意味着可以对它们进行搜索、索引、编写脚本以及压缩。此外，这也意味着可以使用任何文本编辑器和绘图软件来创建和编辑它们。

- SVG的元素和属性必须按标准格式书写，因为XML是区分大小写的（这一点和html不同）
- SVG里的属性值必须用引号引起来，就算是数值也必须这样做。

## SVG命名空间
`<svg xmlns="http://www.w3.org/2000/svg"></svg>`

xmlns，即XML命名空间，指定命名空间可以让浏览器精准解析。

SVG标签，如果没有指定xmlns，在浏览器打开时，会直接以XML文档树渲染；加上SVG专属命名空间，才会以SVG渲染，显示SVG图形。

### foreignObject
< foreignObject> ，可以在其中使用具有其他xmlns的XML元素。
```javascript
<svg xmlns="http://www.ws.org/2000/svg">
  <foreignObject width="120" height="50">
    <body xmlns="http://www.w3.org/1999/xhtml">
      <p>文字</p>
    </body>
  </foreignObject>
</svg>
```

借助forengnObject，可在SVG内部嵌入XHTML元素，body及其子标签都按XHTML标准渲染，实现了SVG和XHTML的混用。

一般用作：
- SVG内的文本自动换行
- 将DOM元素变成图片，用canvas.drawImage()将图片放在画布上，用canvas.toDataURI()转换成png或jpg图片

### viewport
表示SVG可见区域的大小。

SVG的坐标系：**左上角为（0,0）,x向右增大，y向下增大**

### 元素类型
#### path
```javascript
// open 开放路径
<<path d="M 100,50 200,150 100,100" fill="none" stroke="black"/>
// closed 闭合路径
<path d="M 100,50 200,150 100,100 z" fill="none" stroke="black"/>
e.g.
<path d="M 100 200 Q 200,400 300,200" fill="none" stroke="blue" />
<path d="M 100 200 L 200,400 300,200" fill="none" stroke="red"/>
```
- M x y ,将pen移到到坐标点（100,200）
- 再将pen沿着直线/曲线移动到（200,400），再移动到点（300,200） 
  L，直线，linearly
  Q，二次贝塞尔曲线，quadratically
  C，三次贝塞尔曲线，cubically
  A，椭圆弧,elliptic arc
- stroke,stroke-width,stroke-linecap,stroke-dasharray，设置线条样式
- z，将z加到path的最后,则两个端点会自动连起来，形成闭合路径

**< line >, < rect >, < circle >和< ellipse >元素可以看作用path绘制的对象的特例**
  
#### line
```javascript
<line x1="0" y1="100" x2="20" y1="150" stroke="red"/>
```
- x1,y1,端点
- x2,y2，端点
- stroke-width，线宽
- stroke，线条颜色
- stoke-dasharray，用于创建虚线，如`stroke-dasharray="5,5" stroke-dasharray="10,10"
stroke-dasharray="20,10,5,5,5,10"`，代表长短间隔
- stroke-linecap，如'round'，使线的末端rounded，而不是flat

#### rect
```javascript
<rect x="5" y="60" height="30" width="50" fill="#f88" stroke="black" stroke-width="2"/>
```
- x,y，起始点的坐标
- width,height， 宽高
- fill，填充色，可以应用Gradients, masks, patterns, and various filters，没有填充为”none”
- stroke,stroke-width,stroke-linecap,stroke-dasharray，设置border或edge的线条的样式

#### circle
ellipse的特殊情形
```javascript
<circle cx="140" cy="110" r="60" fill="none" stroke="#579" stroke-width="30" stroke-dasharray="3,5,8,13"/> 
// 要设置空心圆 ，只需要设置stroke color，且设置fill="none"
```
- cx,cy，圆心位置
- r,半径
- fill，填充色，可以应用Gradients, masks, patterns, and various filters，没有填充为”none”
- stroke,stroke-width,stroke-linecap,stroke-dasharray，设置border或edge的线条的样式

#### ellipse
比circle多了
- rx，左右半径
- ry，上下半径

#### text
```javascript
<text x="0" y="100" font-family=”Ariel” font-size="80" fill="red"> Doing text</text>
```
#### image
```javascript
<image xlink:href="filename" x="100" y="100" width="150" height="200" />
```
在< svg > tag中常常加入 xmlns:xlink=http://www.w3.org/1999/xlink
这样能使所有如xlink：href =“url（#r）”这些以“xlink”开头的复合属性的XML定义在整个文档中被正确解释。
  ```html
  <image xmlns:xlink=http://www.w3.org/1999/xlink xlink:href="myfile.svg" x="10" y="10" width="100" height="100" />  
  // <svg>中已有的话，该句就可省略
  <image xlink:href="myfile.svg" x="10" y="10" width="100" height="100" />  
  ```
  
默认情况下，位图图像会伸展以填充所提供的矩形。
可以保留图像的宽高比。
图像可能重叠。

#### opacity属性
opacity = p, 0<p<1，默认为1，全不透明
```javascript
<path d="M100 100 A300,30 0 0,0 200,150 " fill="#880" stroke="yellow" stroke-width="5" opacity="0.5" />
```

### < g > —— grouping
把元素放在一起，以便它们可以共享一组共同的转换或其他属性
```javascript
<g transform = translate(-120,0)>
  <rect x="100" y="100" width="100" height="20" fill="#888" />
  <rect x="100" y="160" width="100" height="20" fill="#888" />
  <ellipse cx="150" cy="140" rx="30" ry="100" fill="#bbb" />
  <rect x="100" y="130" width="100" height="20" fill="#888" />
</g>
```
  
### use
SVG允许定义图形对象以备后用，建议尽可能在< defs >元素内定义引用的元素，在< defs >元素内创建的对象不会立即渲染，相反，将它们视为为将来使用而创建的模板或宏。在< defs >元素中定义这些元素可以提高SVG内容的可理解性，从而提高可访问性。
  
可以使用< use >元素在viewport中的任何位置呈现这些元素。
  ```javascript
  <svg>
    <defs>
      <g id="shape">
        <rect x="50" y="50" width="50" height="50" />
        <circle cx="50" cy="50" r="50" />
      </g>
    </defs>
    <use xlink:href="#shape" x="50" y="50" />
    <use xlink:href="#shape" x="200" y="50" />
 </svg>
  ```
  
  
  
### transform
```javascript
transform(a,b,c,d,e,f)
// 对应
x1 = ax+cy+e
y1 = bx+dy+f
// 对应2x3矩阵
a c e
b d f
// 或3x3矩阵
a c e 
b d f
0 0 1

```
#### 操作
- transform = "translate(dx,dy)", dx, dy表示x和y轴上当前位置的变化
- transform="scale(2.5)”, 由于缩放操作将所有（x，y）坐标乘以缩放系数，因此物体通常会在扩展或缩小时看起来远离或朝向原点移动，为了保持一个对象或多或少还维持在原位，因此必须将scale与translate相结合
transform="scale(.55) translate(29, -16)”，**操作顺序是从右向左，先translate，再scale**
- transform="rotate(r, cx, cy)", (cx, cy) 为旋转的中心，顺时针旋转r度
1. 位移： 
```javascript
translate(e,f)
// a=1,b=1, 对应于方程
x1 = x+e
y1 = y+f
// 用transform表示
transform(1,0,0,1,e,f)
```

2. 缩放： 
```javascript
scale(a,d)
// 对应于方程
x1 = ax
y1 = dy
// 用transform表示
transform(a,0,0,d,0,0)
```

3. 旋转： 
```javascript
rotate()
// 对应于方程
x1 = cosA*x-sinA*y
y1 = sinA*X+cosA*y
// 用transform表示
transform(cosA,sinA,-sinA,cosA,0,0)
```

getScreenCTM()
返回一个SVGMatrix来表示元素的坐标所做过的变换

`var M = svgCircle.getScreenCTM()`
CTM定义了viewport坐标系到用户坐标系的转换
CTM的逆定义了用从用户坐标系到viewport坐标系的转换
即：
用户坐标系 = M * viewport坐标系，M对应的就是CTM



