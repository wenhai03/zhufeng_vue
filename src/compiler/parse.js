const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/

const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`) // 开始标签部分，不包含开始标签的结尾。如 <div class="className" ></div>，匹配的是 '<div class="className"'
const startTagClose = /^\s*(\/?)>/ // 开始标签的结尾部分。如 <div class="className" ></div>，匹配的是 ' >'
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`) // '</div><p></p>' 匹配结果为 </div>


export function parseHTML (html) {
  function createASTEElement(tagName, attrs) {
    return {
      tag: tagName, // 标签名
      type: 1, // 元素类型
      children: [], // 孩子列表
      attrs, // 属性集合
      parent: null // 父元素
    }
  }
  let root;
  let currentParent
  let stack = []
  function start(tagName, attrs) {
    // console.log(tagName, attrs, '---开始标签----')
    let element = createASTEElement(tagName, attrs)
    if (!root) {
      root = element
    }
    currentParent = element // 当前解析的标签 保存起来
    stack.push(element)
  }
  function end(tagName) {  // 在结尾标签处 创建父子关系
    let element = stack.pop() // 取出栈中的最后一个
    currentParent = stack[stack.length - 1] //
    if (currentParent) { // 在闭合时可以知道这个标签的父亲是谁
      element.parent = currentParent
      currentParent.children.push(element)
    }
  }
  function chars(text) {
    // console.log(text, '---文本标签----')
    text = text.replace(/\s/g, '')
    if (text) {
      currentParent.children.push({
        type: 3,
        text
      })
    }
  }
  
  
  function parseStartTag () {
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1],
        attrs: []
      }
      advance (start[0].length) // 删除开始标签
      let end;
      let attr;
      // 不是结尾标签 能匹配到属性
      while(!(end=html.match(startTagClose)) && (attr=html.match(attribute))) {
        match.attrs.push({name: attr[1], value: attr[3] || attr[4] || attr[5]})
        advance(attr[0].length)  // 去掉当前属性
      }
      if (end) { // >
        advance(end[0].length)
        return match
      }
    }
  }
  
  function advance (n) {
    html = html.substring(n)
  }
  
  while (html){ // 只要html不为空字符串就一直解析
    let textEnd = html.indexOf('<')
    if (Number(textEnd) === 0) {
      // 肯定是标签
      const startTagMatch = parseStartTag() // 开始标签匹配的结果 处理开始
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue
      }
      const endTagMatch = html.match(endTag)
      if (endTagMatch) { // 处理结束标签
        advance(endTagMatch[0].length)
        end(endTagMatch[1]) // 将结束标签传入
        continue
      }
    }
    let text
    if (textEnd > 0) { // 是文本
      text = html.substring(0, textEnd)
    }
    if (text) { // 处理文本
      advance(text.length)
      chars(text)
    }
  }
  
  return root
}
