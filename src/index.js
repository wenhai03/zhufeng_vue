// Vue的核心代码 只是Vue的一个声明
import {initMixin} from './init'
import {lifecycleMixin} from "./lifecycle"
import {renderMixin} from "./vdom/index"

function Vue(options) {
  // 进行Vue的初始化操作
  this._init(options)
}

// 通过引入文件的方式 给Vue原型上添加方法
initMixin(Vue)
lifecycleMixin(Vue) // 混合生命周期 渲染
renderMixin(Vue)

export default Vue
