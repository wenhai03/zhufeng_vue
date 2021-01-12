import {mergeOptions} from "../util"

export function initGlobalApi(Vue) {
  Vue.options = {}  // Vue.components  Vue.directive
  Vue.mixin = function (mixin) {
    // 合并对象 (先考虑生命周期)  不考虑其他的合并 data computed watcher
    this.options = mergeOptions(this.options, mixin)
    
    // console.log(this.options) // this.options = {created: [a, b]}
  }
  
  // Vue.options, options
  // 用户 new Vue({created() {}})
}
