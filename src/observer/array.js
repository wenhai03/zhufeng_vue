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
  arrayProtoMethods[method] = function (...args) {
    // this就是observe里的value
    const result = oldArrayProtoMethods[method].apply(this, args)
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
    ob.dep.notify()
    // console.log('数组方法被调用了')
    return result
  }
})
