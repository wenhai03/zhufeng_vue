import {observe} from "./observer/index"
import {nextTick, proxy} from "./util"

export function initState (vm) {
  const opts = vm.$options
  // vue的数据来源 属性 方法 数据 计算属性 watch
  if (opts.props) {
    initProps(vm)
  }
  if (opts.methods) {
    initMethod(vm)
  }
  if (opts.data) {
    initData(vm)
  }
  if (opts.computed) {
    initComputed(vm)
  }
  if (opts.watch) {
    initWatch(vm)
  }
}

function initData (vm) { // 数据的初始化操作
  let data = vm.$options. data // 用户传递的data
  // vm._data保存用户的所有data
  vm._data = data = typeof data === 'function' ? data.call(vm) : data
  
  for (let key in data) {
    proxy(vm, '_data', key)
  }
  observe(data) // 让这个对象重新定义 set 和 get
  
}

function initWatch (vm) {

}

function initComputed (vm) {

}


function initProps (vm) {

}

function initMethod (vm) {

}

export function stateMixin(Vue) {
  Vue.prototype.$nextTick = function (cb) {
    nextTick(cb)
  }
}
