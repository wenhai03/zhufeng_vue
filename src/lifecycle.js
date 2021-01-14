import {patch} from "./vdom/patch.js"
import Watcher from "./observer/watcher"

export function lifecycleMixin (Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this
    // 用新创建的元素 替换老的vm.$el
    vm.$el = patch(vm.$el, vnode)
    const prevVnode = vm._vnode // 如果第一次 _vnode不存在
    if (!prevVnode) {
      console.log('11 -> ')
      // 这里需要区分一下 到底是首次渲染还是更新
      // 用新创建的元素 替换老的vm.$el
      vm.$el = patch(vm.$el, vnode)
    } else {
      console.log('22 -> ')
      // 拿上一次的vnode 和本次作对比
      vm.$el = patch(prevVnode, vnode)
    }
    vm._vnode = vnode // 保存第一次的vnode
  }
}

export function mountComponent (vm, el) {
  // 调用render方法去渲染 el 属性
  // 先调用render方法创建虚拟节点，在续集节点渲染到页面上
  vm.$el = el
  callHook(vm, 'beforeMount')
  
  // 初始化就会创建watcher
  let updateComponent = () => {
    vm._update(vm._render())  // 渲染、更新
  }
  // 这个watcher是用于渲染的 目前没有任何功能 updateComponent()
  
  let watcher = new Watcher(vm, updateComponent, () => {
    callHook(vm, 'updated')
  }, true)  // 渲染watcher 只是个名字
  
  callHook(vm, 'mounted')
}

export function callHook(vm, hook) {
  const handlers = vm.$options[hook] // vm.$options.created = [a1, a2, a3]
  if (handlers) {
    for (let i = 0; i < handlers.length; i++) {
      handlers[i].call(vm) // 更改生命周期中的this
    }
  }
}
