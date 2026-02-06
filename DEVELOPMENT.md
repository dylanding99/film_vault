# 本地开发环境设置指南

## 环境状态

✅ **Rust 工具链**: 已安装 (v1.93.0)
✅ **Node.js**: 已安装 (v22.14.0)
✅ **Visual Studio Build Tools**: 已安装
✅ **项目依赖**: 已安装

## 🚀 启动开发环境

### 方法 1: 使用 Visual Studio Developer Command Prompt（推荐）

1. **打开 Visual Studio Developer Command Prompt**
   - 按 `Win` 键，搜索 "Developer Command Prompt for VS"
   - 或找到开始菜单中的 "Visual Studio 2022" 文件夹
   - 运行 "Developer Command Prompt for VS 2022"

2. **导航到项目目录**
   ```cmd
   cd /d D:\project\film_vault
   ```

3. **验证环境**
   ```cmd
   # 检查 VS 编译器
   cl

   # 检查 Rust
   C:\Users\dylan\.cargo\bin\rustc.exe --version

   # 检查 Node.js
   node --version
   ```

4. **启动开发服务器**
   ```cmd
   npm run tauri:dev
   ```

### 方法 2: 使用 PowerShell

1. **打开 PowerShell**

2. **手动设置环境变量**
   ```powershell
   # 设置 VS Build Tools 环境
   & "D:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

   # 添加 Rust 到 PATH
   $env:PATH += ";C:\Users\dylan\.cargo\bin"
   ```

3. **导航到项目并启动**
   ```powershell
   cd D:\project\film_vault
   npm run tauri:dev
   ```

### 方法 3: 每次启动时设置（自动）

创建一个 PowerShell 配置文件脚本，在每次打开终端时自动设置环境：

1. **创建启动脚本** `init-dev.ps1`:
   ```powershell
   # VS Build Tools 环境初始化脚本
   $vsDevCmd = "D:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

   if (Test-Path $vsDevCmd) {
       cmd /c "`"$vsDevCmd`" && set" | ForEach-Object {
           if ($_ -match "(.*?)=(.*)") {
               [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
           }
       }
       Write-Host "Visual Studio Build Tools environment loaded." -ForegroundColor Green
   } else {
       Write-Host "Warning: VS Build Tools not found at $vsDevCmd" -ForegroundColor Yellow
   }

   # 添加 Rust 到 PATH
   $rustPath = "C:\Users\dylan\.cargo\bin"
   if ($env:PATH -notlike "*$rustPath*") {
       $env:PATH += ";$rustPath"
       Write-Host "Rust added to PATH." -ForegroundColor Green
   }

   Write-Host "Development environment ready!" -ForegroundColor Cyan
   ```

2. **使用方式**:
   ```powershell
   # 在 PowerShell 中运行
   .\init-dev.ps1
   npm run tauri:dev
   ```

## 首次运行说明

第一次运行 `npm run tauri:dev` 时：
- Rust 需要编译项目（约 5-15 分钟）
- 后续编译会使用缓存，速度会快很多（约 30-60 秒）
- 编译成功后会自动打开应用窗口

**首次编译输出示例**：
```
Compiling film_vault v0.1.0
Finished dev [unoptimized + debuginfo] target(s) in 8m 23s
```

## 常用开发命令

```bash
# 启动开发环境
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

**示例**：
```bash
# 修改前端组件 - 自动重载
# 编辑 src/app/page.tsx
# 保存后浏览器自动刷新 ✅

# 修改后端代码 - 自动重新编译
# 编辑 src-tauri/src/database.rs
# 保存后自动重新编译 Rust 代码 ⏳
```

## Visual Studio Build Tools 路径

你的 VS Build Tools 安装在：
```
D:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools
```

**关键文件**：
- vcvars64.bat: `D:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat`
- cl.exe: `D:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Tools\MSVC\14.50.35717\bin\Hostx64\x64\cl.exe`

如果需要重新安装或修复，请确保安装了以下组件：
- ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
- ✅ Windows 11 SDK（或 Windows 10 SDK）

## Rust 工具链路径

Rust 安装在：
```
C:\Users\dylan\.cargo\bin
```

**关键可执行文件**：
- rustc.exe: `C:\Users\dylan\.cargo\bin\rustc.exe`
- cargo.exe: `C:\Users\dylan\.cargo\bin\cargo.exe`

## 永久配置环境变量（可选）

为了避免每次都要设置环境变量，你可以将 Rust 添加到系统 PATH：

### 通过系统设置添加

1. 按 `Win + R`，输入 `sysdm.cpl`，回车
2. 点击 "高级" 选项卡
3. 点击 "环境变量"
4. 在 "用户变量" 中找到 `Path`
5. 点击 "编辑"
6. 点击 "新建"，添加：`C:\Users\dylan\.cargo\bin`
7. 点击 "确定" 保存

### 通过 PowerShell 添加

```powershell
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "User") + ";C:\Users\dylan\.cargo\bin",
    "User"
)
```

**注意**：VS Build Tools 的环境变量建议每次打开终端时手动加载，而不是添加到系统 PATH。

## 可能遇到的问题

### 问题 1: `link.exe not found`

**原因**: 未正确加载 VS Build Tools 环境变量

**解决方案**:
```cmd
# 确保在 Developer Command Prompt 中运行
# 或手动调用 vcvars64.bat
call "D:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
```

### 问题 2: 端口 3000 被占用

**解决方案**:
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束进程（将 PID 替换为实际进程 ID）
taskkill /PID <PID> /F
```

### 问题 3: 编译时间过长

**说明**: 首次编译是正常的，Rust 需要编译所有依赖

**解决方案**: 耐心等待，后续编译会使用缓存

### 问题 4: 数据库锁定错误

**错误信息**: `database is locked`

**解决方案**:
```powershell
# 关闭所有 FilmVault 应用实例
Remove-Item "$env:APPDATA\com.filmvault.app\film_vault.db"
```

### 问题 5: Rust 命令找不到

**错误信息**: `'rustc' is not recognized as an internal or external command`

**解决方案**:
```powershell
# 使用完整路径
"C:\Users\dylan\.cargo\bin\rustc.exe" --version

# 或添加到 PATH（见上文"永久配置环境变量"）
```

### 问题 6: PowerShell 脚本无法运行

**错误信息**: `cannot be loaded because running scripts is disabled on this system`

**解决方案**:
```powershell
# 临时允许脚本运行
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 永久允许（需要管理员权限）
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 问题 7: 图片无法显示

**错误信息**: `net::ERR_CONNECTION_REFUSED` 或 `net::ERR_UNKNOWN_URL_SCHEME`

**原因**: Tauri v2 中本地文件系统访问需要特殊处理

**解决方案**: FilmVault 使用 Rust 后端命令读取图片并转换为 base64 data URL

**实现细节**:
1. **Rust 后端命令** (`src-tauri/src/commands/rolls.rs`):
   ```rust
   #[tauri::command]
   pub async fn read_image_as_base64(path: String) -> Result<String, String> {
       // Reads file, encodes to base64, returns data:image/webp;base64,... URL
   }
   ```

2. **前端调用** (`src/lib/utils.ts`):
   ```typescript
   export async function pathToAssetUrl(path: string): Promise<string> {
     const dataUrl = await invoke<string>('read_image_as_base64', { path });
     return dataUrl;
   }
   ```

3. **依赖要求**:
   - `src-tauri/Cargo.toml`: `base64 = "0.22"`
   - `package.json`: `@tauri-apps/api` (用于 invoke)

这种方式不需要任何特殊的文件系统权限配置，因为所有文件读取都在 Rust 后端完成。

## 数据库位置

SQLite 数据库位于：
```
%APPDATA%\com.filmvault.app\film_vault.db
```

即：
```
C:\Users\dylan\AppData\Roaming\com.filmvault.app\film_vault.db
```

**查看数据库**:
```powershell
# 打开数据库目录
explorer.exe $env:APPDATA\com.filmvault.app
```

## GitHub Codespaces 配置

项目保留了 `.devcontainer` 配置。

**建议**：保留该配置，因为：
- ✅ 不影响本地开发
- ✅ 未来需要云端演示或开发时可快速启用
- ✅ 对其他协作者有价值

**如需删除**:
```bash
rm -rf .devcontainer
```

## 开发工作流

### 典型开发流程

1. **打开终端** - 使用 Developer Command Prompt 或 PowerShell
2. **设置环境** - 运行 `init-dev.ps1` 或手动加载环境变量
3. **启动开发** - `npm run tauri:dev`
4. **开发功能** - 修改代码，利用热重载
5. **测试功能** - 在应用中测试
6. **代码检查** - `npm run lint`
7. **构建测试** - `npm run tauri:build`

### 提交代码前检查

```bash
# 1. 代码格式检查
npm run lint

# 2. TypeScript 类型检查
npx tsc --noEmit

# 3. 手动测试核心功能
#    - 导入文件夹
#    - 查看胶卷列表
#    - 编辑元数据
#    - 查看照片
```

## 获取帮助

如果遇到问题：

1. **检查前置要求**
   - Rust 是否正确安装
   - VS Build Tools 是否正确安装
   - Node.js 版本是否为 18+

2. **确认运行环境**
   - 使用 PowerShell 或 VS Developer Command Prompt
   - 避免使用普通 CMD（除非已设置环境变量）

3. **重启终端/计算机**
   - 环境变量更改可能需要重启终端
   - 某些问题可以通过重启解决

4. **查看编译日志**
   - 编译日志位置：`src-tauri/target/debug/`
   - 查找具体错误信息

5. **检查杀毒软件**
   - Windows Defender 或其他安全软件可能阻止编译
   - 将项目目录添加到排除列表

## 项目文档

- **README.md** - 项目概述和快速开始
- **DEVELOPMENT.md** - 详细开发文档和架构说明
- **CLAUDE.md** - AI 辅助开发指南（供 Claude Code 使用）

## 下一步

环境设置完成后，你可以：

1. ✅ 启动开发服务器：`npm run tauri:dev`
2. 📚 阅读 DEVELOPMENT.md 了解项目架构
3. 🚀 开始开发新功能
4. 📝 查看 src-tauri/src/commands/ 了解后端命令
5. 🎨 查看 src/components/ 了解前端组件

---

**最后更新**: 2026-02-06
**环境**: Windows + Visual Studio Build Tools + Rust + Node.js
