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

  class Observer {
    constructor (value) {
      // 使用defineProperty重新定义属性
      
      // 判断一个对象是否被观测过看他有没有 __ob__这个属性
      Object.defineProperty(value, '__ob__', {
        enumerable: false, // 不能被枚举，不能被循环出来
        configurable: false,
        value: this
      });
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
    let data = vm.$options.data; // 用户传递的data
    vm._data = data = typeof data === 'function' ? data.call(vm) : data;
    // 对象劫持 用户改变了数据 我希望可以得到通知 => 刷新页面
    // MVVM模式 数据变化可以驱动视图变化
    // Object.defineProperty() 给属性增加get和set方法
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

  // 在原型上添加一个init方法
  function initMixin(Vue) {
    // 初始化流程
    Vue.prototype._init = function (options) {
      
      // 数据的劫持
      const vm = this; // vue中使用 this.$options 指代的就是用户传递的属性
      vm.$options = options;
      
      // 初始化状态
      initState(vm); // 分割代码
    };
  }

  // Vue的核心代码 只是Vue的一个声明

  function Vue(options) {
    // 进行Vue的初始化操作
    this._init(options);
  }

  // 通过引入文件的方式 给Vue原型上添加方法
  initMixin(Vue);

  return Vue;

})));
//# sourceMappingURL=vue.js.map
