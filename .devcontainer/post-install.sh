#!/bin/bash
set -e

echo "🚀 Setting up FilmVault development environment..."

# 安装 Rust
if ! command -v rustc &> /dev/null; then
  echo "📦 Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source $HOME/.cargo/env
else
  echo "✅ Rust already installed"
fi

# 安装 Tauri 所需的系统依赖
echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# 安装 npm 依赖
echo "📦 Installing Node.js dependencies..."
npm install

# 验证安装
echo ""
echo "✅ Setup complete!"
echo ""
echo "Rust version:"
rustc --version
echo ""
echo "Node version:"
node --version
echo ""
echo "🎉 Ready to develop FilmVault!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run tauri:dev' to start the development server"
echo ""
