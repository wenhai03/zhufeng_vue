export function proxy (vm, data, key) {
  Object.defineProperty(vm, key, {
    get () {
      return vm[data][key] // vm._data.a
    },
    set (newValue) {
      vm[data][key] = newValue
    }
  })
}

export function defineProperty (target, key, value) {
  Object.defineProperty(target, '__ob__', {
    enumerable: false, // 不能被枚举，不能被循环出来
    configurable: false,
    value: value
  })
}

export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'update',
  'beforeDestroy',
  'destroy',
]

const strats = {}
strats.components = function (parentVal, childVal) {
  const res = Object.create(parentVal)  // res.__proto__ = parentVal
  if (childVal) {
    for (let key in childVal) {
      res[key] = childVal[key]
    }
  }
  return res
}
strats.data = function (parentVal, childVal) {
  // 这里应该有合并 data 的策略
  return childVal
}
// strats.computed = function () {}
// strats.watch = function () {}

function mergeHook (parentVal, childValue) { // 生命周期的合并
  if (childValue) {
    if (parentVal) {
      return parentVal.concat(childValue)  // 爸爸和儿子进行拼接
    } else {
      return [childValue] // 儿子需要转化成数组
    }
  } else {
    return parentVal // 不合并了 采用父亲的
  }
  
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})

export function mergeOptions (parent, child) {
  // 遍历父亲，可能是父亲有 儿子没有
  const options = {}
  
  for (let key in parent) {
    mergeField(key)
  }
  
  // 儿子有父亲没有
  for (const key in child) { // 将儿子多的赋予到父亲上
    if (!parent.hasOwnProperty(key)) {
      mergeField(key)
    }
  }
  
  function mergeField (key) { // 合并字段
    // 根据key 不同的策略来进行合并
    if (strats[key]) {
      options[key] = strats[key](parent[key], child[key])
    } else {
      // todo默认合并
      if (child[key]) {
        options[key] = child[key]
      } else {
        options[key] = parent[key]
      }
    }
  }
  
  return options
}

const callbacks = []
let pending = false

function flushCallbacks () {
  while (callbacks.length){
    let cb = callbacks.pop()
    cb()
  } // 让nextTick中传入的方法依次执行
  pending = false  // 标识已经执行完毕
}

let timerFunc
if (Promise) {
  timerFunc = () => {
    Promise.resolve().then(flushCallbacks)  // 异步处理更新
  }
} else if (MutationObserver) {
  let observe = new MutationObserver(flushCallbacks)
  let textNode = document.createTextNode(1) // 先创建一个文本节点
  observe.observe(textNode, {characterData: true}) // 观测文本节点中的内容
  timerFunc = () => {
    textNode.textContent = 2 // 文本的内容改成2
  }
} else if (setImmediate) {
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks)
  }
}

export function nextTick (cb) { // 因为内部会调用nextTick 用户也会调用，但是异步只需要一次
  callbacks.push(cb)
  if (!pending) {
    // vue3里的nextTick原理就是Promise.then 没有做兼容性处理
    timerFunc() // 这个方法是异步方法，做了兼容处理
    pending = true
  }
}

function makeMap(str) {
  const mapping = {}
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    mapping[list[i]] = true
  }
  return (key) => { // 判断这个标签名是不是原生标签
    return mapping[key]
  }
}

export const isReservedTag = makeMap(
  'a,div,img,image,text,span,p,button,input,textarea,ul,li'
)
