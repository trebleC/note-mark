#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目配置
REPO_URL="https://github.com/trebleC/note-mark.git"
PROJECT_NAME="note-mark"
IMAGE_NAME="note-mark"
IMAGE_TAG="latest"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Note-Mark 项目构建脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. 克隆项目
echo -e "\n${GREEN}[1/3] 克隆项目...${NC}"
if [ -d "$PROJECT_NAME" ]; then
  echo -e "${BLUE}项目目录已存在，拉取最新代码...${NC}"
  cd $PROJECT_NAME
  git pull origin main || git pull origin master
else
  echo -e "${BLUE}克隆项目仓库...${NC}"
  git clone $REPO_URL
  cd $PROJECT_NAME
fi

# 2. 检查 Docker 是否运行
echo -e "\n${GREEN}[2/3] 检查 Docker 环境...${NC}"
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}错误: Docker 未运行，请先启动 Docker Desktop${NC}"
  exit 1
fi
echo -e "${BLUE}Docker 运行正常${NC}"

# 3. 构建 Docker 镜像
echo -e "\n${GREEN}[3/3] 构建 Docker 镜像...${NC}"
echo -e "${BLUE}镜像名称: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

# 检查构建结果
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}========================================${NC}"
  echo -e "${GREEN}✓ 构建成功！${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo -e "\n镜像信息:"
  docker images | grep ${IMAGE_NAME}
  
  echo -e "\n${BLUE}运行容器命令:${NC}"
  echo -e "  docker run -d --name ${PROJECT_NAME} -p 6090:3000 --env-file .env.local ${IMAGE_NAME}:${IMAGE_TAG}"
  
  echo -e "\n${BLUE}查看日志命令:${NC}"
  echo -e "  docker logs -f ${PROJECT_NAME}"
  
  echo -e "\n${BLUE}停止容器命令:${NC}"
  echo -e "  docker stop ${PROJECT_NAME} && docker rm ${PROJECT_NAME}"
else
  echo -e "\n${RED}========================================${NC}"
  echo -e "${RED}✗ 构建失败！${NC}"
  echo -e "${RED}========================================${NC}"
  exit 1
fi
