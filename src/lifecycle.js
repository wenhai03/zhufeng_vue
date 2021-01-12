import {patch} from "./vdom/patch.js"

export function lifecycleMixin (Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this
    patch(vm.$el, vnode)
    
  }
}

export function mountComponent (vm, el) {
  // 调用render方法去渲染 el 属性
  
  // 先调用render方法创建虚拟节点，在续集节点渲染到页面上
  vm._update(vm._render())
}
