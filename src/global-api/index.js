import {mergeOptions} from "../util"
import initExtend from "./extend"

export function initGlobalApi(Vue) {
  Vue.options = {}  // Vue.components  Vue.directive
  Vue.mixin = function (mixin) {
    // 合并对象 (先考虑生命周期)  不考虑其他的合并 data computed watcher
    this.options = mergeOptions(this.options, mixin)
    
    // console.log(this.options) // this.options = {created: [a, b]}
  }
  Vue.options._base = Vue  // _base 最终Vue的构造函数 保留在options对象中
  Vue.options.components = {} // 全局组件
  
  initExtend(Vue)
  
  Vue.component = function (id, definition) {
    // Vue.extend
    definition.name = definition.name || id
    // 根据当前组件对象 生成了一个子类的构造函数
    // 用的时候的 new definition().$mount()
    definition = this.options._base.extend(definition)  // 永远是父类
    // Vue.component 注册组件 等价于 Vue.options.components[id] = definition
    Vue.options.components[id] = definition
  }
  
}
