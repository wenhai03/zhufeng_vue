import {mergeOptions} from "../util"

export default function initExtend (Vue) {
  let cid = 0
  // 核心就是创建一个子类继承我们的父类
  Vue.extend = function(extendOptions) {
    // 如果对象相同 应该复用构造函数  （缓存）
    const Super = this
    const Sub = function VueComponent(options ) {
      this._init(options)
    }
    Sub.cid = cid++
    // 子类要继承父类原型上的方法 原型继承
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    
    Sub.options = mergeOptions(
      Super.options,
      extendOptions,
    )
    Sub.components = Super.components
    
    return Sub
  }
}

/*
*
* 组件的渲染流程
* 1.调用Vue.component
* 2.内部用的是Vue.extend 就是产生一个子类来继承父类
* 3.等会创建子类实例时候会调用父类的 _init方法，在$mount即可
* 4.组件的初始化就是 new 这个组件的构造函数并且调用 $mount 方法
*
* */
