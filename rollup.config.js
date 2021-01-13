import babel from 'rollup-plugin-babel'
import serve from 'rollup-plugin-serve'

export default {
  input: './src/index.js', // 以哪个文件作为打包入口
  output: {
    format: 'umd', // 统一模块规范
    file: 'dist/umd/vue.js', // 出口路径
    name: 'Vue', // 指定打包后全局变量的名字
    sourcemap: true  // es6 => es5 开启源码调式 可以找到源代码报错位置
  },
  plugin: [ // 使用的插件
    babel({
      exclude: 'node_modules/**'
    }),
    serve({
      port: 3000,
      contentBase: '',
      openPage: '/watch.html', // 默认打开html的路径
  
    })
  ]
  
}
