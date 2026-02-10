# FilmVault 开发指南

详细的本地开发环境设置和开发指南。

## 前置要求

- **Node.js** 18+
- **Rust 工具链**
- **Visual Studio Build Tools**（Windows）

### 安装 Rust

```bash
# Windows
winget install Rustlang.Rustup

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

验证安装：
```bash
rustc --version
cargo --version
```

## 启动开发环境

### Windows

**方法 1: 使用 Visual Studio Developer Command Prompt（推荐）**

1. 打开 "Developer Command Prompt for VS"
2. 导航到项目目录
3. 运行：
   ```cmd
   npm install
   npm run tauri:dev
   ```

**方法 2: 使用 PowerShell**

1. 打开 PowerShell
2. 设置环境变量：
   ```powershell
   # 设置 VS Build Tools 环境（路径根据实际安装位置调整）
   & "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

   # 添加 Rust 到 PATH
   $env:PATH += ";$env:USERPROFILE\.cargo\bin"
   ```
3. 运行项目：
   ```powershell
   cd D:\project\film_vault
   npm run tauri:dev
   ```

### macOS / Linux

```bash
npm install
npm run tauri:dev
```

## 常用开发命令

```bash
# 启动开发服务器
npm run tauri:dev

# 代码检查
npm run lint

# 构建生产版本
npm run tauri:build

# 仅启动 Next.js 开发服务器（不启动 Tauri）
npm run dev

# TypeScript 类型检查
npx tsc --noEmit
```

## 热重载说明

- **前端代码** (React/Next.js): 修改后自动重载（几乎即时）
- **Rust 代码** (后端): 修改后会自动重新编译（需等待 30-60 秒）

## 数据库位置

- **Windows**: `%APPDATA%\com.filmvault.app\film_vault.db`
- **macOS**: `~/Library/Application Support/com.filmvault.app/film_vault.db`
- **Linux**: `~/.config/com.filmvault.app/film_vault.db`

## 常见问题

### `link.exe not found`

**原因**: 未正确加载 VS Build Tools 环境变量（Windows）

**解决方案**: 在 Developer Command Prompt 中运行，或手动调用 `vcvars64.bat`

### 端口 3000 被占用

```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束进程
taskkill /PID <PID> /F
```

### Rust 命令找不到

**解决方案**: 将 Rust 添加到系统 PATH：
```powershell
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "User") + ";$env:USERPROFILE\.cargo\bin",
    "User"
)
```

### 数据库锁定错误

关闭所有 FilmVault 应用实例后，删除数据库文件重新启动。

### PowerShell 脚本无法运行

```powershell
# 临时允许脚本运行
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### 图片无法显示

FilmVault 使用 Rust 后端命令读取图片并转换为 base64 data URL。这种方式不需要特殊的文件系统权限配置。

## 开发工作流

### 典型开发流程

1. **打开终端** - 使用 Developer Command Prompt 或 PowerShell
2. **启动开发** - `npm run tauri:dev`
3. **开发功能** - 修改代码，利用热重载
4. **测试功能** - 在应用中测试
5. **代码检查** - `npm run lint`
6. **构建测试** - `npm run tauri:build`

### 提交代码前检查

```bash
# 代码格式检查
npm run lint

# TypeScript 类型检查
npx tsc --noEmit

# 手动测试核心功能
```
