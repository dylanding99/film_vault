# ExifTool Binary for FilmVault

请根据你的开发平台下载 ExifTool 并放置在此目录中。

⚠️ **重要**: Tauri v2 要求外部二进制文件使用平台特定的命名格式。

## 下载地址

**官方主页**: https://exiftool.org/

## Windows 特殊说明

**注意**: 新版 ExifTool (v13.0+) 是 Perl 打包版本，需要额外的 DLL 文件。

### 下载和设置

1. 下载完整版 ExifTool：
   - 访问 https://exiftool.org/
   - 下载 Windows 64-bit 版本（例如 `exiftool-13.49_64.zip`）

2. 解压 ZIP 文件

3. 复制以下文件到 `src-tauri\binaries\` 目录：
   ```
   从下载的目录复制:
   ├── exiftool.exe                           → src-tauri\binaries\
   └── exiftool_files/                        → src-tauri\binaries\exiftool_files\
       ├── perl532.dll
       ├── libgcc_s_seh-1.dll
       ├── libstdc++-6.dll
       ├── libwinpthread-1.dll
       ├── liblzma-5__.dll
       └── ... (其他所有文件)
   ```

4. 创建平台特定的副本：
   ```powershell
   cd src-tauri\binaries
   Copy-Item exiftool.exe exiftool-x86_64-pc-windows-msvc.exe
   ```

5. 为开发模式复制文件（每次清理 build 后需要重新执行）：
   ```powershell
   cd src-tauri
   mkdir -p target\debug
   Copy-Item -Recurse binaries\exiftool_files target\debug\
   ```

   或者创建一个脚本 `setup-exiftool.ps1`:
   ```powershell
   # setup-exiftool.ps1
   $binaryDir = "src-tauri\binaries"
   $targetDir = "src-tauri\target\debug"

   New-Item -ItemType Directory -Force -Path "$targetDir\exiftool_files" | Out-Null
   Copy-Item -Recurse -Force "$binaryDir\exiftool_files\*" "$targetDir\exiftool_files\"
   Write-Host "ExifTool files copied successfully!"
   ```

6. 运行设置脚本：
   ```powershell
   .\setup-exiftool.ps1
   ```

### 最终目录结构

```
src-tauri/
├── binaries/
│   ├── README.md
│   ├── exiftool.exe                           (原始文件)
│   ├── exiftool-x86_64-pc-windows-msvc.exe    (平台特定副本)
│   └── exiftool_files/                        (Perl 运行时文件)
│       ├── perl532.dll
│       ├── libgcc_s_seh-1.dll
│       ├── libstdc++-6.dll
│       ├── libwinpthread-1.dll
│       ├── liblzma-5__.dll
│       └── ...
└── target/debug/
    └── exiftool_files/                        (开发模式需要)
        └── ... (同上)
```

## macOS / Linux

macOS 和 Linux 版本通常是独立的可执行文件，不需要额外的 DLL 文件：

### macOS (ARM64 / x86_64)

```bash
# 下载
wget https://exiftool.org/exiftool-13.49.dmg
# 或者在 macOS 上使用 Homebrew:
brew install exiftool

# 复制到项目目录
cp /usr/local/bin/exiftool src-tauri/binaries/
chmod +x src-tauri/binaries/exiftool
cp src-tauri/binaries/exiftool src-tauri/binaries/exiftool-aarch64-apple-darwin
```

### Linux (x86_64)

```bash
# 下载
wget https://exiftool.org/exiftool-13.49.tar.gz
tar -xzf exiftool-13.49.tar.gz

# 复制到项目目录
cp exiftool-13.49/exiftool src-tauri/binaries/
chmod +x src-tauri/binaries/exiftool
cp src-tauri/binaries/exiftool src-tauri/binaries/exiftool-x86_64-unknown-linux-gnu
```

## 验证

Windows 上验证：
```powershell
cd src-tauri\binaries
.\exiftool-x86_64-pc-windows-msvc.exe -ver
# 应该输出: 13.49
```

## 注意事项

- **文件名必须包含平台三元组**: `exiftool-{target-triple}.{ext}`
- **Windows 需要完整的 exiftool_files 目录**: 包含所有 Perl DLL 文件
- **开发模式**: 每次清理 build 后需要重新复制 exiftool_files 到 target/debug
- **生产环境**: Tauri 会自动将 binaries 目录打包到应用中

## 常见平台三元组

| 平台 | 架构 | 目标三元组 |
|------|------|-----------|
| Windows | x86_64 | `x86_64-pc-windows-msvc` |
| macOS | Intel | `x86_64-apple-darwin` |
| macOS | Apple Silicon | `aarch64-apple-darwin` |
| Linux | x86_64 | `x86_64-unknown-linux-gnu` |

## 测试

安装 ExifTool 后，运行开发模式测试：

```bash
npm run tauri:dev
```

如果配置正确，应用启动时不会报错，EXIF 功能将正常工作。
