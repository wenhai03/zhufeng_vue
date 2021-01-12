// Vue的核心代码 只是Vue的一个声明
import {initMixin} from './init'
import {lifecycleMixin} from "./lifecycle"
import {renderMixin} from "./vdom/index"

// 用Vue 的构造函数 创建组件
function Vue(options) {
  this._init(options) // 组件初始化的入口
}

initMixin(Vue) // init方法
lifecycleMixin(Vue) // _update
renderMixin(Vue) // _render

// 初始方法
export default Vue
