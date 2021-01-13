
let id = 0
class Dep{
  constructor(){
    this.subs = []
    this.id = id++
  }
  depend() {
    // 我们希望 watcher 可以存放dep
    // 实现双向记忆的，让watcher记住dep 的同时，让dep也记住watcher
    Dep.target.addDep(this)
    // this.subs.push(Dep.target)
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}

Dep.target = null // 静态属性 就一份
export function pushTarget(watcher){
  Dep.target = watcher // 保留watcher
}
export function popTarget(){
  Dep.target = null  // 将变量删除掉
}

export default Dep

// 多对多的关系 一个属性一个dep是用来收集watcher的
// dep可以查查多个watcher
// 一个watcher可以对应多个dep
