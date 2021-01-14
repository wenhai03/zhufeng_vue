export function patch (oldVnode, vnode) {
  // 默认初始化时 是直接用虚拟节点创建出真实节点来 替换掉老节点
  if (oldVnode.nodeType === 1) {
    let el = createElm(vnode) // 产生真实的dom
    let parentElm = oldVnode.parentNode // 获取老的app的父亲 => body
    parentElm.insertBefore(el, oldVnode.nextSibling) // 当前的真实元素插入到app的后面
    parentElm.removeChild(oldVnode) // 删除老的节点
    
    // let el = createElm(vnode)
    return el
  } else {
    // 在更新的时候 拿老的虚拟节点 和 新的虚拟节点做对比，将不同的地方更新真实的dom
    // 更新功能
    // 拿当前节点 整个
    
    // 1.比较两个元素的标签，标签不一样直接替换即可
    if (oldVnode.tag !== vnode.tag) {
      // 老的dom元素
      return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
    }
    
    // 2.有种可能是标签一样 <div>1</div>  <div>2</div>
    // 文本节点的虚拟节点tag 都是undefined
    if (!oldVnode.tag) { // 文本的对比
      if (oldVnode.text !== vnode.text) {
        return oldVnode.el.textContent = vnode.text
      }
    }
    
    // 3.标签一样 并且需要开始比对标签的属性 和 儿子
    // 标签一个直接复用即可
    let el = vnode.el = oldVnode.el // 复用老节点
    
    // 更新属性，用心的虚拟节点的属性和老的比较，去更新节点
    // 新老属性的对比
    updateProperties(vnode, oldVnode.data)
    // 比较孩子
    
    let oldChildren = oldVnode.children || []
    let newChildren = vnode.children || []
    if (oldChildren.length > 0 && newChildren.length > 0) {
      // 老的有儿子 新的也有儿子  diff算法
      updateChildren(oldChildren, newChildren, el)
    } else if (oldChildren.length > 0) {  // 新的没有
      el.innerHTML = ''
    } else if (newChildren.length > 0) { // 老的没有
      for (let i = 0; i < newChildren.length; i++) {
        let child = newChildren[i]
        // 浏览器有性能优化 不用子在搞文档碎片
        el.appendChild(createElm(child))
      }
    }
    // 儿子比较分为以下几种情况
    // 老的有儿子 新的没有儿子
    // 老的没儿子 新的有儿子
  }
}

function isSameVnode (oldVnode, newVnode) {
  return (oldVnode.tag === newVnode.tag) && (oldVnode.key === newVnode.key)
}

// 儿子见的比较
function updateChildren (oldChildren, newChildren, parent) {
  let oldStartIndex = 0  // 老的索引
  let oldStartVnode = oldChildren[0] // 老的索引指向的节点
  let oldEndIndex = oldChildren.length - 1
  let oldEndVnode = oldChildren[oldEndIndex]
  
  let newStartIndex = 0  // 新的索引
  let newStartVnode = newChildren[0] // 新的索引指向的节点
  let newEndIndex = newChildren.length - 1
  let newEndVnode = newChildren[newEndIndex]
  
  // vue中的diff算法做了很多优化
  // DOM中操作有很多常见的逻辑 把节点插入到当前儿子的头部，尾部，儿子倒叙正序
  // vue2中采用的是双指针的方式
  
  // 在尾部添加
  
  // 我要做一个循环 同时循环老的和新的，哪个先结束 循环就停止 将多余的删除或者添加进去
  // 比较水先循环停止
  function makeIndexByKey(children) {
    let map = {}
    children.forEach((item, index) => {
      if (item.key) {
        map[item.key] = index // {A: 0, B: 1, C: 2, D: 3}
      }
    })
    
    return map
  }
  
  let map = makeIndexByKey(oldChildren)
  console.log('map -> ', map)
  
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (!oldStartVnode) { // 指针指向了null 跳过这次的处理
      oldStartVnode = oldChildren[++oldStartIndex]
    } else if (!oldEndVnode) {
      oldEndVnode = oldChildren[--oldEndIndex]
    } else if (isSameVnode(oldStartVnode, newStartVnode)) { // 如果两个人是同一个元素，对比儿子
      patch(oldStartVnode, newStartVnode) // 更新属性和再去递归更新子节点
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {
      patch(oldEndVnode, newEndVnode)
      oldEndVnode = oldChildren[--oldEndIndex]
      newEndVnode = newChildren[--newEndIndex]
    } else if (isSameVnode(oldStartVnode, newEndVnode)) { // 老的尾部和新的头部比较
      // 将当前元素插入到尾部的 下一个元素的前面
      patch(oldStartVnode, newEndVnode)
      parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
      oldStartVnode = oldChildren[++oldStartIndex]
      newEndVnode = newChildren[--newEndIndex]
    }else if (isSameVnode(oldEndVnode, newStartVnode)) {
      patch(oldEndVnode, newStartVnode)
      parent.insertBefore(oldEndVnode.el, oldStartVnode.el.nextSibling)
      oldEndVnode = oldChildren[--oldEndIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else {
      // 儿子之间没有关系，暴力对比
      let moveIndex = map[newStartVnode.key] // 拿到开头的虚拟节点的key 去老的中找
      
      if (moveIndex === undefined) {
        parent.insertBefore(createElm(newStartVnode), oldStartVnode.el)
      } else {
        let moveVnode = oldChildren[moveIndex] // 这个老的虚拟节点需要移动
        oldChildren[moveIndex] = null
        parent.insertBefore(moveVnode.el, oldStartVnode.el)
        patch(moveVnode, newStartVnode) // 比较属性和儿子
      }
      newStartVnode = newChildren[++newStartIndex] // 用新的不停的去老的里面找
    }
    
    // 为什么要有key，循环的时候为什么不能用index作为key
    
  }
  if (newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      // 将新的多余插入进去即可，可能是向前添加，还有可能是向后添加
      // parent.appendChild(createElm(newChildren[i]))
      
      // 向后插入 ele = null
      // 向前插入 ele 就是当前项是谁前面插入
      let ele = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex].el
      parent.insertBefore(createElm(newChildren[i]), ele)
    }
  }
  
  // 老的节点还没处理的，说明这些老节点是不需要的节点，如果这个里面有null说明这个节点已经被处理过了，跳过即可
  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex ; i++) {
      let child = oldChildren[i];
      if (child != undefined) {
        parent.removeChild(child.el)
      }
    }
  }
  
}

export function createElm (vnode) {
  let {tag, children, key, data, text} = vnode
  if (typeof tag == 'string') { // 创建元素 放到vnode上
    vnode.el = document.createElement(tag)
    
    // 只有元素才有属性
    updateProperties(vnode)
    
    children.forEach(child => { // 遍历儿子 将儿子渲染后的结果扔到父亲中
      vnode.el.appendChild(createElm(child))
    })
  } else { // 创建文件 放到vnode.el上
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

function updateProperties (vnode, oldProps = {}) {
  let newProps = vnode.data || {}
  let el = vnode.el
  
  // 老的有新的没有 需要删除属性
  for (let key in oldProps) {
    if (!newProps[key]) {
      el.removeAttribute(key) // 移除真实dom的属性
    }
  }
  // 样式处理 老的 style={color: red} 新的 style={background:red}
  let newStyle = newProps.style || {}
  let oldStyle = oldProps.style || {}
  // 老的样式中有 新的没有 删除老的样式
  for (let key in oldStyle) {
    if (!newStyle[key]) {
      el.style[key] = ''
    }
  }
  
  // 新的有 那就直接用心的去做更新即可
  for (let key in newProps) {
    if (key === 'style') {
      for (let styleName in newProps.style) {
        el.style[styleName] = newProps.style[styleName]
      }
    } else if (key === 'class') {
      el.className = newProps.class
    } else {
      el.setAttribute(key, newProps[key])
    }
  }
}
