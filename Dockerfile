# 多阶段构建 - Stage 1: 构建阶段
FROM node:20-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖（包括 devDependencies）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# Stage 2: 生产阶段
FROM node:20-alpine AS production

# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 从构建阶段复制编译后的文件
COPY --from=builder /app/dist ./dist

# 暴露端口（根据你的应用端口调整）
EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"]