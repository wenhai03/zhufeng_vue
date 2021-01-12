import {initState} from './state'
import {compileToFunctions} from "./compiler/index"
import {mountComponent} from "./lifecycle"

// 在原型上添加一个init方法
export function initMixin (Vue) {
  // 初始化流程
  Vue.prototype._init = function (options) {
    // 数据的劫持
    const vm = this // vue中使用 this.$options 指代的就是用户传递的属性
    vm.$options = options
    // 初始化状态
    initState(vm)
    
    // 如果当前有el属性说明要渲染模板
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
  // 1.render  2.template  3.外部template  (el存在的时候)
  Vue.prototype.$mount = function (el) {
    // 挂载操作
    const vm = this
    const options = vm.$options
    el = document.querySelector(el)
    vm.$el = el
    
    if (!options.render) {
      let template = options.template
      if (!template && el) {
        template = el.outerHTML
      }
      // template => render方法 编译原理 将模板编译成render函数
      // 1.处理模板变为sat树 2.标记静态节点 3.codegen => return 字符串 4.new Function + with (render 函数)
      const render = compileToFunctions(template)
      options.render = render
    }
    // 需要挂载这个组件
    mountComponent(vm, el)
  }
}
