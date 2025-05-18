# 贡献指南

感谢您考虑为微信读书MCP Server项目做出贡献！这份文档提供了一些指导，帮助您更有效地参与项目开发。

## 开发环境设置

1. 确保安装了Node.js 16.x或更高版本
2. Fork并克隆仓库
   ```bash
   git clone https://github.com/your-username/mcp-server-weread.git
   cd mcp-server-weread
   ```
3. 安装依赖
   ```bash
   npm install
   ```
4. 配置开发环境
   - 创建`.env`文件，并添加必要的微信读书Cookie
   - 可选：配置Cookie Cloud相关参数

## 项目结构

- `src/` - 源代码目录
  - `index.ts` - 主入口文件，包含MCP服务器逻辑
  - `WeReadApi.ts` - 微信读书API封装
  - `CacheManager.ts` - 缓存管理器
- `build/` - 构建输出目录
- `.env` - 环境变量配置文件（需自行创建）

## 开发工作流程

1. 创建一个新的分支进行开发
   ```bash
   git checkout -b feature/your-new-feature
   ```

2. 使用以下命令进行监视构建（在修改代码时自动重新构建）
   ```bash
   npm run watch
   ```

3. 测试你的更改
   - 使用MCP Inspector进行本地测试：
     ```bash
     npm run inspector
     ```
   - 或直接运行服务器：
     ```bash
     npm start
     ```

4. 提交代码并推送到你的Fork
   ```bash
   git add .
   git commit -m "Add feature: your new feature"
   git push origin feature/your-new-feature
   ```

5. 创建Pull Request

## API实现注意事项

1. 确保API调用符合refapi.md中的规范
2. 处理API限流和错误情况
3. 提供有用的错误信息，便于调试
4. 实现智能缓存以减少不必要的API调用

## 工具实现指南

实现新工具时，需要考虑以下几点：

1. 在index.ts的ListToolsRequestSchema处理程序中注册工具
2. 提供清晰的工具描述和参数定义
3. 在CallToolRequestSchema处理程序中实现工具逻辑
4. 遵循现有的错误处理和响应格式

## 测试

当前项目没有自动化测试套件。贡献者应通过手动测试确保功能正常：

1. 测试正常流程
2. 测试边缘情况
3. 测试错误处理

## 提交指南

- 在提交前，确保代码通过TypeScript检查
- 使用有意义的提交信息
- 如果解决了Issue，在提交信息中引用Issue编号

## 代码风格

- 遵循项目现有的代码风格
- 使用有意义的变量名和函数名
- 添加必要的注释，尤其是对于复杂逻辑
- 确保类型定义完整

感谢您的贡献！ 