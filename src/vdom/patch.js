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
      return oldVnode.el.parentNode.replaceChild(createElm(vnode),  oldVnode.el)
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
    console.log("o", oldVnode, vnode, oldVnode.el)
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

function updateProperties (vnode, oldProps={}) {
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
