// Vue的核心代码 只是Vue的一个声明
import {initMixin} from './init'
import {lifecycleMixin} from "./lifecycle"
import {renderMixin} from "./vdom/index"
import {initGlobalApi} from "./global-api/index.js"
import {stateMixin} from "./state"

// 用Vue 的构造函数 创建组件
function Vue(options) {
  this._init(options) // 组件初始化的入口
}

// 原型方法
initMixin(Vue) // init方法
lifecycleMixin(Vue) // _update
renderMixin(Vue) // _render
stateMixin(Vue)

// 静态方法 Vue.component Vue.directive Vue.extend  Vue.mixin ...
initGlobalApi(Vue)
// 初始方法
export default Vue
