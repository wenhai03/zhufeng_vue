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
    arrayProtoMethods[method] = function (...args) {  // this就是observer里的value
      // 当调用数组我们劫持后的7个方法 页面应该更新
      // 我要知道数组对应哪个dep
      const result = oldArrayProtoMethods[method].apply(this, args);
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
      ob.dep.notify();
      // console.log('数组方法被调用了')
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

  const LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'update',
    'beforeDestroy',
    'destroy',
  ];

  const strats = {};
  strats.data = function (parentVal, childValue) {
    // 这里应该有合并 data 的策略
    return childValue
  };
  strats.computed = function () {};
  strats.watch = function () {};
  function mergeHook(parentVal, childValue) { // 生命周期的合并
    if (childValue) {
      if (parentVal) {
        return parentVal.concat(childValue)  // 爸爸和儿子进行拼接
      } else {
        return [childValue] // 儿子需要转化成数组
      }
    } else {
      return parentVal // 不合并了 采用父亲的
    }

  }
  LIFECYCLE_HOOKS.forEach(hook => {
    strats[hook] = mergeHook;
  });

  function mergeOptions(parent, child) {
    // 遍历父亲，可能是父亲有 儿子没有
    const options = {};
    
    for (let key in parent) {
      mergeField(key);
    }
    
    // 儿子有父亲没有
    for (const key in child) { // 将儿子多的赋予到父亲上
      if (!parent.hasOwnProperty(key)) {
        mergeField(key);
      }
    }
    
    function mergeField(key) { // 合并字段
      // 根据key 不同的策略来进行合并
      if (strats[key]) {
        options[key] = strats[key](parent[key], child[key]);
      } else {
        // todo默认合并
        options[key] = child[key];
      }
    }
    
    return options
  }

  let id = 0;

  class Dep {
    constructor () {
      this.subs = [];
      this.id = id++;
    }
    depend() {
      // 我们希望 watcher 可以存放dep
      // 实现双向记忆的，让watcher记住dep 的同时，让dep也记住watcher
      Dep.target.addDep(this);
      // this.subs.push(Dep.target)
    }
    addSub(watcher) {
      this.subs.push(watcher);
    }
    
    notify () {
      this.subs.forEach(watcher => watcher.update());
    }
  }

  Dep.target = null; // 静态属性 就一份
  function pushTarget(watcher){
    Dep.target = watcher; // 保留watcher
  }
  function popTarget(){
    Dep.target = null;  // 将变量删除掉
  }

  // 多对多的关系 一个属性一个dep是用来收集watcher的
  // dep可以查查多个watcher
  // 一个watcher可以对应多个dep

  class Observer {
    constructor (value) {
      this.dep = new Dep();  // value = {}  value = []
      // 使用defineProperty重新定义属性
      // 判断一个对象是否被观测过看他有没有 __ob__这个属性
      defineProperty(value, '__ob__', this);
      
      if (Array.isArray(value)) {
        // 我希望调用push unshift splice reverse pop
        // 函数劫持 切片编程
        value.__proto__ = arrayProtoMethods;
        // 观测数组中的对象类型，对象变化也要做一些事
        this.observeArray(value); // 数组中普通类型是不做类型观测的
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
      
      keys.forEach(key => {
        defineReactive(data, key, data[key]);
      });
    }
    
  }

  // 封装 继承
  function defineReactive (data, key, value) {
    // 获取到数组对应的dep
    let childDep = observe(value); // 如果是对象类型再进行观测(递归)
    let dep = new Dep(); // 每个属性都有一个dep
    
    // 当页面取值时 说明这个值用来渲染了，将这个watcher和这个属性对应起来
    Object.defineProperty(data, key, {
      get () { // 依赖收集
        if (Dep.target) {
          dep.depend();
          if (childDep) { // 可能是数组可能是对象
            // 默认给数组增加了一个dep属性，当对数组这个对象取值的时候
            childDep.dep.depend(); // 数组存起来了这个渲染watcher
          }
        }
        
        return value
      },
      set (newValue) { // 依赖更新
        if (newValue === value) return
        observe(newValue); // 如果用户将值改成对象继续监控
        value = newValue;
        dep.notify();
      }
    });
  }

  function observe (data) {
    // typeof null 也是 object
    // 不能不是对象 并且不是null
    if (typeof data !== 'object' || data == null) {
      return
    }
    if (data.__ob__) {
      return data
    }
    return new Observer(data)
    
    // 只观测存在的属性 data: {a: 1, b: 2}
    // 数组中更改索引和长度 无法被监控
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

  function initData (vm) { // 数据的初始化操作
    let data = vm.$options. data; // 用户传递的data
    // vm._data保存用户的所有data
    vm._data = data = typeof data === 'function' ? data.call(vm) : data;
    
    for (let key in data) {
      proxy(vm, '_data', key);
    }
    observe(data); // 让这个对象重新定义 set 和 get
    
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
     // html模板 => render函数  (ast是用来描述代码的)
    // 1.需要将html代码转化成 ast 语法树 可以用ast树来描述语言本身
    
    // 前端必须要掌握的数据结构 (树)
    let ast = parseHTML(template);
    
    // 2.优化静态节点
    
    // 3.通过这课树 重新的生成代码
    let code = generate(ast);
    // console.log(code)
    
    // 4.将字符串变成函数 限制取值范围 通过with来进行取值 稍后调用render函数就可以通过改变this 让这个函数内部取到结果
    let render = new Function(`with(this){return ${code}}`);
    // console.log(render)
    return render
    
  }

  function patch (oldVnode, vnode) {
    
    // oldVnode => id#app   vnode 我们根据模板产生的虚拟dom
    
    // 将虚拟节点转化成真实节点
    // console.log(oldVnode, vnode)
    let el = createElm(vnode); // 产生真实的dom
    let parentElm = oldVnode.parentNode; // 获取老的app的父亲 => body
    parentElm.insertBefore(el, oldVnode.nextSibling); // 当前的真实元素插入到app的后面
    parentElm.removeChild(oldVnode); // 删除老的节点
    
    // let el = createElm(vnode)
    return el
  }

  function createElm (vnode) {
    let {tag, children, key, data, text} = vnode;
    if (typeof tag == 'string') { // 创建元素 放到vnode上
      vnode.el = document.createElement(tag);
      
      // 只有元素才有属性
      updateProperties(vnode);
      
      children.forEach(child => { // 遍历儿子 将儿子渲染后的结果扔到父亲中
        vnode.el.appendChild(createElm(child));
      });
    } else { // 创建文件 放到vnode.el上
      vnode.el = document.createTextNode(text);
    }
    return vnode.el
  }

  function updateProperties (vnode) {
    let el = vnode.el;
    let newProps = vnode.data || {};
    for (let key in newProps) {
      if (key === 'style') {
        for (let styleName in newProps.style) {
          el.style[styleName] = newProps.style[styleName];
        }
      } else if (key === 'class') {
        el.className = newProps.class;
      } else {
        el.setAttribute(key, newProps[key]);
      }
    }
    
  }

  let id$1 = 0;

  class Watcher {  // vm.$watch
    // vm实例
    // exprOrFn   vm._update(vm._render())
    constructor(vm, exprOrFn, cb, options) {
      this.vm = vm;
      this.exprOrFn = exprOrFn;
      this.cb = cb;
      this.options = options;
      this.id = id$1++; // watcher的唯一标识
      this.deps = []; // watcher记录有多少dep依赖他
      this.depsId = new Set();
      if (typeof exprOrFn === 'function') {
        this.getter = exprOrFn;
      }
      
      this.get(); // 默认会调用get方法
    }
    addDep(dep) {
      let id = dep.id;
      if (!this.depsId.has(id)) {
        this.deps.push(dep);
        this.depsId.add(id);
        dep.addSub(this);
      }
    }
    
    get(){
      // Dep.target = watcher
      pushTarget(this); // 当前watcher实例
      this.getter();  // 调用exprOrFn 渲染页面 取值（执行了get方法）render方法  with(vm){_v(msg)}
      popTarget();
    }
    update() {
      this.get(); // 重新渲染
    }
  }

  // 在数据劫持的时候 定义defineProperty的时候 已经给每个属性都增加了一个dep

  // 1.是想把这个渲染watcher放到了Dep.target属性上
  // 2.开始渲染，取值会调用get方法，需要让这个属性的dep 存储当前的watcher
  // 3.页面上所需要的属性都会将这个watcher存在增加的dep中
  // 4.等会属性更新了，就重新调用渲染逻辑，通知自己存储的watcher来更新

  function lifecycleMixin (Vue) {
    Vue.prototype._update = function (vnode) {
      const vm = this;
      // 用新创建的元素 替换老的vm.$el
      vm.$el = patch(vm.$el, vnode);
    };
  }

  function mountComponent (vm, el) {
    // 调用render方法去渲染 el 属性
    // 先调用render方法创建虚拟节点，在续集节点渲染到页面上
    vm.$el = el;
    callHook(vm, 'beforeMount');
    
    // 初始化就会创建watcher
    let updateComponent = () => {
      vm._update(vm._render());  // 渲染、更新
    };
    // 这个watcher是用于渲染的 目前没有任何功能 updateComponent()
    
    new Watcher(vm, updateComponent, () => {
      callHook(vm, 'beforeUpdate');
    }, true);  // 渲染watcher 只是个名字
    
    callHook(vm, 'mounted');
  }

  function callHook(vm, hook) {
    const handlers = vm.$options[hook]; // vm.$options.created = [a1, a2, a3]
    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i].call(vm); // 更改生命周期中的this
      }
    }
  }

  // 在原型上添加一个init方法
  function initMixin (Vue) {
    // 全局组件和局部组件的区别
    Vue.prototype._init = function (options) {
      // 数据的劫持
      const vm = this; // vue中使用 this.$options 指代的就是用户传递的属性
      // 需要将用户自定义的options和全局的option合并
      vm.$options = mergeOptions(vm.constructor.options, options);
      callHook(vm, 'beforeCreate');
      // 初始化状态
      initState(vm);
      callHook(vm, 'created');
      // 如果当前有el属性说明要渲染模板
      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };
    // 1.render  2.template  3.外部template  (el存在的时候)
    Vue.prototype.$mount = function (el) {
      // 挂载操作
      const vm = this;
      const options = vm.$options;
      el = document.querySelector(el);
      vm.$el = el;
      
      if (!options.render) {
        let template = options.template;
        if (!template && el) {
          template = el.outerHTML;
        }
        // template => render方法 编译原理 将模板编译成render函数
        // 1.处理模板变为sat树 2.标记静态节点 3.codegen => return 字符串 4.new Function + with (render 函数)
        const render = compileToFunctions(template);
        options.render = render;
      }
      // 需要挂载这个组件
      mountComponent(vm, el);
    };
  }

  function renderMixin (Vue) { // 用对象来描述dom结构
    
    Vue.prototype._c = function () { // 创建虚拟dom元素
      return createElement(...arguments)
    };
    // 1.当结果是对象时 会对这个对象取值
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
      // console.log(vnode)
      return vnode
    };
  }

  // _c('div', {}, 1,2,3,4,5)
  function createElement (tag, data = {}, ...children) {
    return vnode(tag, data, data.key, children)
  }

  function createTextVnode (text) {
    return vnode(undefined, undefined, undefined, undefined, text)
  }

  // 用来产生虚拟dom，操作真实dom浪费性能
  function vnode (tag, data, key, children, text) {
    return {
      tag,
      data,
      key,
      children,
      text
    }
  }

  function initGlobalApi(Vue) {
    Vue.options = {};  // Vue.components  Vue.directive
    Vue.mixin = function (mixin) {
      // 合并对象 (先考虑生命周期)  不考虑其他的合并 data computed watcher
      this.options = mergeOptions(this.options, mixin);
      
      // console.log(this.options) // this.options = {created: [a, b]}
    };
    
    // Vue.options, options
    // 用户 new Vue({created() {}})
  }

  // Vue的核心代码 只是Vue的一个声明

  // 用Vue 的构造函数 创建组件
  function Vue(options) {
    this._init(options); // 组件初始化的入口
  }

  // 原型方法
  initMixin(Vue); // init方法
  lifecycleMixin(Vue); // _update
  renderMixin(Vue); // _render


  // 静态方法 Vue.component Vue.directive Vue.extend  Vue.mixin ...
  initGlobalApi(Vue);

  return Vue;

})));
//# sourceMappingURL=vue.js.map
