(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  // 拿到数组原型上的方法 (原来的方法)
  let oldArrayProtoMethods = Array.prototype;

  // 继承一下
  let arrayProtoMethods = Object.create(oldArrayProtoMethods);

  let methods = [
    'push',
    'pop',
    'unshift',
    'shift',
    'reverse',
    'splice',
    'sort'
  ];

  methods.forEach(method => {
    arrayProtoMethods[method] = function (...args) {
      // this就是observe里的value
      const result = oldArrayProtoMethods[method].call(this, args);
      let inserted;
      let ob = this.__ob__;
      switch (method) {
        case 'push':
        case 'unshift': // 这两个方法都是追加 追加的内容可能是对象类型，应该再次进行劫持
          inserted = args;
          break
        case 'splice': // vue.$set原理
          inserted = args.slice(2); // arr.splice(0, 1, {a: 1})
      }
      if (inserted) {
        // 给数组新增的值也要进行观测
        ob.observeArray(inserted);
      }
      
      console.log('数组方法被调用了');
      return result
    };
  });

  function proxy (vm, data, key) {
    Object.defineProperty(vm, key, {
      get () {
        return vm[data][key] // vm._data.a
      },
      set(newValue){
        vm[data][key] = newValue;
      }
    });
  }

  function defineProperty(target, key, value) {
    Object.defineProperty(target, '__ob__', {
      enumerable: false, // 不能被枚举，不能被循环出来
      configurable: false,
      value: value
    });
  }

  class Observer {
    constructor (value) {
      // 使用defineProperty重新定义属性
      
      // 判断一个对象是否被观测过看他有没有 __ob__这个属性
      defineProperty(value, '__ob__', this);
      
      if (Array.isArray(value)) {
        // 我希望调用push unshift splice reverse pop
        // 函数劫持 切片编程
        value.__proto__ = arrayProtoMethods;
        // 观测数组中的对象类型，对象变化也要做一些事
        this.observeArray(value );
      } else {
        this.walk(value);
      }
    }
    
    observeArray (value) {
      value.forEach(item => {
        observe(item); // 观测数组中的对象类型
      });
    }
    walk (data) {
      let keys = Object.keys(data); // 获取对象的key
    
      keys.forEach(key  => {
        defineReactive(data, key, data[key]);
      });
    }

  }

  // 封装 继承
  function defineReactive (data, key, value) {
    observe(value); // 如果是对象类型再进行观测(递归)
    Object.defineProperty(data, key,{
      get () {
        console.log('用户获取值了');
        return value
      },
      set (newValue) {
        console.log('用户设置值了');
        if (newValue === value) return
        observe(newValue); // 如果用户将值改成对象继续监控
        value = newValue;
      }
    });
  }

  function observe(data){
    // typeof null 也是 object
    // 不能不是对象 并且不是null
    if (typeof data !== 'object' || data == null) {
      return
    }
    if (data.__ob__) {
      return data
    }
    return new Observer(data)
    
  }

  function initData (vm) {
    // 数据初始化工作
    let data = vm.$options. data; // 用户传递的data
    vm._data = data = typeof data === 'function' ? data.call(vm) : data;
    // 对象劫持 用户改变了数据 我希望可以得到通知 => 刷新页面
    // MVVM模式 数据变化可以驱动视图变化
    // Object.defineProperty() 给属性增加get和set方法
    
    
    // 当我去vm上取属性时，帮我将属性的取值代理到vm._data上
    for (let key in data) {
      proxy(vm, '_data', key);
    }
    observe(data); // 响应式原理
    
  }

  function initState (vm) {
    const opts = vm.$options;
    // vue的数据来源 属性 方法 数据 计算属性 watch
    if (opts.props) ;
    if (opts.methods) ;
    if (opts.data) {
      initData(vm);
    }
    if (opts.computed) ;
    if (opts.watch) ;
  }

  const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`;
  const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 开始标签部分，不包含开始标签的结尾。如 <div class="className" ></div>，匹配的是 '<div class="className"'
  const startTagClose = /^\s*(\/?)>/; // 开始标签的结尾部分。如 <div class="className" ></div>，匹配的是 ' >'
  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // '</div><p></p>' 匹配结果为 </div>


  function parseHTML (html) {
    function createASTEElement(tagName, attrs) {
      return {
        tag: tagName, // 标签名
        type: 1, // 元素类型
        children: [], // 孩子列表
        attrs, // 属性集合
        parent: null // 父元素
      }
    }
    let root;
    let currentParent;
    let stack = [];
    function start(tagName, attrs) {
      // console.log(tagName, attrs, '---开始标签----')
      let element = createASTEElement(tagName, attrs);
      if (!root) {
        root = element;
      }
      currentParent = element; // 当前解析的标签 保存起来
      stack.push(element);
    }
    function end(tagName) {  // 在结尾标签处 创建父子关系
      let element = stack.pop(); // 取出栈中的最后一个
      currentParent = stack[stack.length - 1]; //
      if (currentParent) { // 在闭合时可以知道这个标签的父亲是谁
        element.parent = currentParent;
        currentParent.children.push(element);
      }
    }
    function chars(text) {
      // console.log(text, '---文本标签----')
      text = text.replace(/\s/g, '');
      if (text) {
        currentParent.children.push({
          type: 3,
          text
        });
      }
    }
    
    
    function parseStartTag () {
      const start = html.match(startTagOpen);
      if (start) {
        const match = {
          tagName: start[1],
          attrs: []
        };
        advance (start[0].length); // 删除开始标签
        let end;
        let attr;
        // 不是结尾标签 能匹配到属性
        while(!(end=html.match(startTagClose)) && (attr=html.match(attribute))) {
          match.attrs.push({name: attr[1], value: attr[3] || attr[4] || attr[5]});
          advance(attr[0].length);  // 去掉当前属性
        }
        if (end) { // >
          advance(end[0].length);
          return match
        }
      }
    }
    
    function advance (n) {
      html = html.substring(n);
    }
    
    while (html){ // 只要html不为空字符串就一直解析
      let textEnd = html.indexOf('<');
      if (Number(textEnd) === 0) {
        // 肯定是标签
        const startTagMatch = parseStartTag(); // 开始标签匹配的结果 处理开始
        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue
        }
        const endTagMatch = html.match(endTag);
        if (endTagMatch) { // 处理结束标签
          advance(endTagMatch[0].length);
          end(endTagMatch[1]); // 将结束标签传入
          continue
        }
      }
      let text;
      if (textEnd > 0) { // 是文本
        text = html.substring(0, textEnd);
      }
      if (text) { // 处理文本
        advance(text.length);
        chars(text);
      }
    }
    
    return root
  }

  // 编写 <div id="app" style="color: red">hello {{name}} <span>hello</span></div>

  /*
    结果：
    render() {
      return _c('div', {id: 'app', style: {color: 'red'}}, _v('hello' + _s(name), _c('span', null, _v('hello'))))
    }
    */

  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

  // 语法层面的转义
  function genProps (attrs) { // id "app"   style "color: red"
    // console.log('attrs -> ', attrs)
    let str = '';
    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i];
      if (attr.name === 'style') { // 对样式进行特殊处理
        let obj = {};
        attr.value.split(';').forEach(item => {
          let [key, value] = item.split(':');
          obj[key] = value;
        });
        attr.value = obj;
      }
      str += `${attr.name}:${JSON.stringify(attr.value)},`;
    }
    
    return `{${str.slice(0, -1)}}`
  }

  function gen (node) {
    if (Number(node.type) === 1) {
      return generate(node) // 生成元素节点的字符串
    } else {
      let text = node.text; // 获取文本
      if (!defaultTagRE.test(text)) {
        // 如果是普通文本 不带{{}}
        return `_v(${JSON.stringify(text)})` // _v(hello)
      }
      let tokens = []; // 存放每一段的代码
      // 如果正则是全局模式 需要每次使用前置为0
      let lastIndex = defaultTagRE.lastIndex = 0;
      let match, index; // 每次匹配到的结果
      while (match = defaultTagRE.exec(text)) {
        index = match.index;
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        tokens.push(`_s(${match[1].trim()})`);
        lastIndex = index + match[0].length;
      }
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }
      return `_v(${tokens.join('+')})`
    }
  }

  function getChildren (el) {
    const children = el.children;
    if (children) { // 将所有转化后的儿子用逗号拼接起来
      return children.map(child => gen(child)).join(',')
    }
  }

  function generate (el) {
    let children = getChildren(el); // 儿子的生成
    let code = `_c('${el.tag}', ${
    el.attrs.length ? `${genProps(el.attrs)}` : 'undefined'
  }${
    children ? `, ${children}` : ''
  })`;
    return code
  }

  function compileToFunctions (template) {
    // console.log('template', template)
    // html模板 => render函数  (ast是用来描述代码的)
    // 1.需要将html代码转化成 ast 语法树 可以用ast树来描述语言本身
    
    // 前端必须要掌握的数据结构 (树)
    let ast = parseHTML(template);
    
    // 2.优化静态节点
    
    // 3.通过这课树 重新的生成代码
    let code = generate(ast);
    console.log(code);
    
    // 4.将字符串变成函数 限制取值范围 通过with来进行取值 稍后调用render函数就可以通过改变this 让这个函数内部取到结果
    let render = new Function(`with(this){return ${code}}`);
    // console.log(render)
    return render
    
  }

  function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
    
    };
  }

  function mountComponent(vm, el) {
    // 调用render方法去渲染 el 属性
    
    // 先调用render方法创建虚拟节点，在续集节点渲染到页面上
    vm._update(vm._render());
  }

  // 在原型上添加一个init方法
  function initMixin(Vue) {
    // 初始化流程
    Vue.prototype._init = function (options) {
      
      // 数据的劫持
      const vm = this; // vue中使用 this.$options 指代的就是用户传递的属性
      vm.$options = options;
      
      // 初始化状态
      initState(vm);
      
      // 如果当前有el属性说明要渲染模板
      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };
    
    Vue.prototype.$mount = function (el){
      // 挂载操作
      const vm = this;
      const options = vm.$options;
      el = document.querySelector(el);
      
      if (!options.render) {
        // 没有render 将template转化成render方法
        let template = options.template;
        if (!template && el) {
          template = el.outerHTML;
        }
        // 编译原理 将模板编译成render函数
        const render = compileToFunctions(template);
        options.render = render;
      }
      // 渲染时候用的都是这个render方法
      
      // 需要挂载这个组件
      mountComponent(vm);
    };
  }

  function renderMixin(Vue) { // 用对象来描述dom结构
    
    Vue.prototype._c = function () { // 创建虚拟dom元素
      return createElement(...arguments)
    };
    Vue.prototype._s = function (val) { // stringify
      return val == null ? '' : (typeof val == 'object') ? JSON.stringify(val) : val
    };
    Vue.prototype._v = function (text) { // 创建虚拟dom文本元素
      return createTextVnode(text)
    };
    
    Vue.prototype._render = function () {  // _render = render
      const vm = this;
      const render = vm.$options.render;
      let vnode = render.call(vm);
      console.log(vnode);
      return vnode
    };
  }

  // _c('div', {}, 1,2,3,4,5)
  function createElement(tag, data={}, ...children) {
    return vnode(tag, data, data.key, children)
  }

  function createTextVnode(text) {
    return vnode(undefined, undefined, undefined, undefined, text)
  }
  // 用来产生虚拟dom的
  function vnode(tag, data, key, children, text) {
    return {
      tag,
      data,
      key,
      children,
      text
    }
  }

  // Vue的核心代码 只是Vue的一个声明

  function Vue(options) {
    // 进行Vue的初始化操作
    this._init(options);
  }

  // 通过引入文件的方式 给Vue原型上添加方法
  initMixin(Vue);
  lifecycleMixin(Vue); // 混合生命周期 渲染
  renderMixin(Vue);

  return Vue;

})));
//# sourceMappingURL=vue.js.map
