// Vue的核心代码 只是Vue的一个声明
import {initMixin} from './init'
import {lifecycleMixin} from "./lifecycle"
import {renderMixin} from "./vdom/index"
import {initGlobalApi} from "./global-api/index.js"
import {stateMixin} from "./state"

// 用Vue 的构造函数 创建组件
function Vue(options) {
  this._init(options) // 组件初始化的入口
}

// 原型方法
initMixin(Vue) // init方法
lifecycleMixin(Vue) // _update
renderMixin(Vue) // _render
stateMixin(Vue)

// 静态方法 Vue.component Vue.directive Vue.extend  Vue.mixin ...
initGlobalApi(Vue)
// 初始方法

// 为了看到diff的整个流程 创建两个虚拟节点来进行对比操作
import {compileToFunctions} from './compiler/index'
import {createElm, patch} from './vdom/patch'
let vm1 = new Vue({data: {name: 'zf'}})
let render1 = compileToFunctions(`<div id="a" style="color: red" class="a">
<li style="background: orange" key="A">A</li>
<li style="background: yellow" key="B">B</li>
<li style="background: pink" key="C">C</li>
<li style="background: green" key="D">D</li>
</div>`)
let vnode1 = render1.call(vm1)

document.body.appendChild(createElm(vnode1))

let vm2 = new Vue({data: {name: 'jw'}})
let render2 = compileToFunctions(`<div id="b" style="color: blue;" class="b">
<li style="background: purple" key="E">E</li>
<li style="background: orange" key="A">A</li>
<li style="background: yellow" key="B">B</li>
<li style="background: pink" key="C">C</li>
<li style="background: green" key="D">D</li>
</div>`)
let vnode2 = render2.call(vm2)

// 用新的虚拟节点对比老的虚拟节点，找到差异 去更新老的dom元素

setTimeout(() => {
  patch(vnode1, vnode2) // 传入新的节点
}, 1000)

export default Vue
