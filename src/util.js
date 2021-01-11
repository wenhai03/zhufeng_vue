export function proxy (vm, data, key) {
  Object.defineProperty(vm, key, {
    get () {
      return vm[data][key] // vm._data.a
    },
    set(newValue){
      vm[data][key] = newValue
    }
  })
}

export function defineProperty(target, key, value) {
  Object.defineProperty(target, '__ob__', {
    enumerable: false, // 不能被枚举，不能被循环出来
    configurable: false,
    value: value
  })
}
