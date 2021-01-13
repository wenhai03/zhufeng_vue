// 拿到数组原型上的方法 (原来的方法)
let oldArrayProtoMethods = Array.prototype

// 继承一下
export let arrayProtoMethods = Object.create(oldArrayProtoMethods)

let methods = [
  'push',
  'pop',
  'unshift',
  'shift',
  'reverse',
  'splice',
  'sort'
]

methods.forEach(method => {
  arrayProtoMethods[method] = function (...args) {  // this就是observer里的value
    // 当调用数组我们劫持后的7个方法 页面应该更新
    // 我要知道数组对应哪个dep
    const result = oldArrayProtoMethods[method].call(this, args)
    let inserted
    let ob = this.__ob__
    switch (method) {
      case 'push':
      case 'unshift': // 这两个方法都是追加 追加的内容可能是对象类型，应该再次进行劫持
        inserted = args
        break
      case 'splice': // vue.$set原理
        inserted = args.slice(2) // arr.splice(0, 1, {a: 1})
      default:
        break;
    }
    if (inserted) {
      // 给数组新增的值也要进行观测
      ob.observeArray(inserted)
    }
    ob.dep.notify() // 通知数组更新
    return result
  }
})
