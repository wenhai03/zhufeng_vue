import {parseHTML} from "./parse"
import {generate} from "./generate"


export function compileToFunctions (template) {
  // console.log('template', template)
  // html模板 => render函数  (ast是用来描述代码的)
  // 1.需要将html代码转化成 ast 语法树 可以用ast树来描述语言本身
  
  // 前端必须要掌握的数据结构 (树)
  let ast = parseHTML(template)
  
  // 2.优化静态节点
  
  // 3.通过这课树 重新的生成代码
  let code = generate(ast)
  console.log(code)
  
}
