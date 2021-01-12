export function patch(oldVnode, vnode) {
  // 将虚拟节点转化成真实节点
  console.log(oldVnode, vnode)
  let el = createElm(vnode) // 产生真实的dom
  let parentElm = oldVnode.parentNode // 获取老的app的父亲 => body
  parentElm.insertBefore(el, oldVnode.nextSibling) // 当前的真实元素插入到app的后面
  parentElm.removeChild(oldVnode) // 删除老的节点
  
  // let el = createElm(vnode)
}

function createElm(vnode) {
  let {tag, children, key, data, text} = vnode
  if (typeof tag == 'string') { // 创建元素 放到vnode上
    vnode.el = document.createElement(tag)
    children.forEach(child  => { // 遍历儿子 将儿子渲染后的结果扔到父亲中
      vnode.el.appendChild(createElm(child))
    })
  } else { // 创建文件 放到vnode.el上
    vnode.el = document.createTextNode(text)
  }
  
  return vnode.el
}
