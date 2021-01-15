import {observe} from "./observer/index"
import {nextTick, proxy} from "./util"
import Watcher from "./observer/watcher"

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
  let watch = vm.$options.watch
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {  // 数组
      handler.forEach(handle => {
        createWatcher(vm, key, handle)
      })
    } else {
      createWatcher(vm, key, handler) // 字符串 对象 数组
      
    }
  }
}

function createWatcher(vm, exprOrFn, handler, options) {  // options可以用来标识 是用户watcher
  if (typeof handler === 'object') {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler] // 将实例的方法作为handler
  }
  // key handler用户传入的选项
  return vm.$watch(exprOrFn, handler, options)
}

function initComputed (vm) {
  const computed = vm.$options.computed
  // 1.需要watcher 2.还需要通过defineProperty 3.dirty
  const watchers = vm._computedWathcers = {}
  
  for (let key in computed) {
    const userDef = computed[key] // 取出对于你的值来
    const getter = typeof userDef === 'function' ? userDef : userDef.get // watcher使用的
    // defineReactive()
    defineComputed(vm, key, userDef)
  }
  
  
  console.log('computed', computed)
}
const sharedPropertyDefinition = {}
function defineComputed(target, key, userDef) {  // 这样写是没缓存的
  if (typeof userDef == 'function') {
    sharedPropertyDefinition.get = userDef
  } else {
    sharedPropertyDefinition.get = userDef.get  // 需要加缓存
    sharedPropertyDefinition.set = userDef.set
  }
  
  Object.defineProperty(target, key,sharedPropertyDefinition)

}

function initProps (vm) {

}

function initMethod (vm) {

}

export function stateMixin(Vue) {
  Vue.prototype.$nextTick = function (cb) {
    nextTick(cb)
  }
  Vue.prototype.$watch = function (exprOrFn, cb, options){
    
    // 数据应该依赖这个watcher 数据变化后应该让watcher重新执行
    let watcher = new Watcher(this, exprOrFn, cb, {...options, user: true})
    if (options.immediate) {
      cb() // 如果是immediate应该立即执行
    }
  }
}
