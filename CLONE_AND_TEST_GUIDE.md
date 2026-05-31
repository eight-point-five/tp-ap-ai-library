# BookWise 本地克隆与测试手册

本文档面向第一次拿到项目的同学，目标是在一台新电脑上完成克隆、安装、导入演示数据并启动系统。

## 1. 需要提前安装的软件

请先确认电脑已经安装：

- Git
- Node.js 20 或更高版本
- Docker Desktop
- VS Code 或其他代码编辑器

Windows PowerShell 中可以用下面命令检查：

```powershell
git --version
node -v
npm -v
docker version
```

如果 `docker version` 只有 `Client` 没有 `Server`，说明 Docker Desktop 还没有启动。请先打开 Docker Desktop，等它显示 Running。

## 2. 克隆项目

建议把项目放到一个没有特殊权限限制的目录，例如 `D:\Projects`。

```powershell
cd D:\
mkdir Projects
cd Projects
git clone git@github.com:eight-point-five/tp-ap-ai-library.git
cd tp-ap-ai-library
```

如果 SSH 克隆失败，可以先检查 GitHub SSH：

```powershell
ssh -T git@github.com
```

如果还没有配置 SSH Key，也可以临时改用 HTTPS 克隆：

```powershell
git clone https://github.com/eight-point-five/tp-ap-ai-library.git
```

## 3. 创建本地环境变量

项目根目录中已经提供了环境变量模板。第一次运行需要复制一份：

```powershell
copy .env.local.example .env.local
```

默认配置已经适配本地 Docker PostgreSQL：

```env
DATABASE_URL=postgresql://library_user:library_pass@127.0.0.1:5432/library_db
NEXT_PUBLIC_API_ENDPOINT=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

本地演示不强制配置 ImageKit、Upstash、QStash、Resend。校园卡上传会保存到本地 `public/uploads`，图片和 PDF 都可以上传。

## 4. 安装依赖

因为原项目的 ESLint 依赖存在 peer dependency 冲突，安装时请使用：

```powershell
npm.cmd install --legacy-peer-deps
```

不要使用 `npm audit fix --force`，它可能升级破坏项目依赖。

## 5. 启动数据库

先确保 Docker Desktop 已经启动，然后在项目根目录执行：

```powershell
docker compose up -d
```

检查容器是否启动：

```powershell
docker ps
```

正常情况下应该能看到 `tp_ap_ai_library_pg` 正在运行。

## 6. 初始化数据库与导入演示数据

第一次运行，或者需要重置为最新演示数据时，执行：

```powershell
npm.cmd run team-demo:setup
```

这个脚本会做这些事：

- 创建 `.env.local`，如果还不存在
- 启动 PostgreSQL 容器
- 安装依赖，如果 `node_modules` 不存在
- 执行数据库迁移
- 导入 `test-data` 中的最新演示数据

注意：`team-demo:setup` 会刷新演示数据，可能覆盖你本地新注册的测试账号。日常启动请用 `team-demo:dev`。

## 7. 启动系统

日常启动使用：

```powershell
npm.cmd run team-demo:dev
```

启动成功后浏览器打开：

```text
http://localhost:3000
```

如果端口被占用，先关闭旧的 `npm run dev` 窗口，或者在旧窗口按 `Ctrl + C`。

## 8. 演示账号

导入演示数据后可使用以下账号：

```text
初始管理员 1：admin@library.local / Admin123!
初始管理员 2：sysadmin@library.local / Admin123!
低风险用户：low1@library.local / Demo123!
中风险用户：medium1@library.local / Demo123!
高风险用户：high1@library.local / Demo123!
```

初始管理员账号受保护，不能被其他管理员封禁。新注册并审批通过的管理员账号，可以被其他管理员封禁，但不能封禁初始管理员。

## 9. 推荐测试路线

### 9.1 普通用户借书

1. 打开 `http://localhost:3000/sign-in`
2. 使用 `low1@library.local / Demo123!` 登录
3. 在首页搜索或选择一本书
4. 点击 `Borrow Book`
5. 进入 `My Profile` 查看真实借阅记录

### 9.2 管理员查看风险监控

1. 使用 `admin@library.local / Admin123!` 登录
2. 打开 `http://localhost:3000/admin/risk-dashboard`
3. 查看风险用户、风险事件和自然语言查询
4. 可以尝试查询：

```text
查询高风险用户
查询最近7天异常风险事件
查询被封禁账号
查询24小时内借书超过5次的用户
```

### 9.3 多模态图书检索

1. 普通用户打开首页，或管理员打开 `http://localhost:3000/admin/books`
2. 使用书名、作者、ISBN 做基础查询
3. 如果需要大模型模糊查询，可配置豆包或千问 API Key
4. 配置后可用描述或图片辅助查找图书

没有配置大模型时，系统会使用本地规则回退检索。

### 9.4 注册与账号审批

1. 打开 `http://localhost:3000/sign-up`
2. 注册普通用户或管理员账号
3. 上传校园卡图片或 PDF
4. 注册后账号状态为 `PENDING`
5. 使用初始管理员登录
6. 打开 `http://localhost:3000/admin/account-requests`
7. 查看校园卡材料，点击 `通过` 或 `拒绝`

审批通过后，新账号才能登录。

### 9.5 管理员封禁测试

1. 注册一个管理员账号
2. 用初始管理员审批通过
3. 在 `http://localhost:3000/admin/users` 找到该新管理员
4. 点击 `封禁账号`
5. 尝试用该新管理员登录，应登录失败
6. 初始管理员账号不会显示封禁按钮，也不能被接口封禁

## 10. 常用命令

启动数据库：

```powershell
docker compose up -d
```

停止数据库：

```powershell
docker compose down
```

重新导入演示数据：

```powershell
npm.cmd run team-demo:setup
```

日常启动：

```powershell
npm.cmd run team-demo:dev
```

数据库迁移：

```powershell
npm.cmd run db:migrate
```

类型检查：

```powershell
npx.cmd tsc --noEmit --incremental false
```

## 11. 常见问题

### 11.1 npm install 依赖冲突

如果看到 `ERESOLVE could not resolve`，使用：

```powershell
npm.cmd install --legacy-peer-deps
```

### 11.2 Docker 连接失败

如果看到：

```text
failed to connect to the docker API
```

请先启动 Docker Desktop，等待它显示 Running，然后重新执行：

```powershell
docker compose up -d
```

### 11.3 数据库连接失败

如果看到：

```text
connect ECONNREFUSED 127.0.0.1:5432
```

说明 PostgreSQL 容器没有启动。执行：

```powershell
docker compose up -d
docker ps
```

### 11.4 校园卡上传失败

当前版本校园卡上传不依赖 ImageKit。请确认：

- 上传的是图片或 PDF
- 文件小于 20MB
- 重新启动过开发服务

上传后的本地文件会保存到：

```text
public/uploads/ids
```

该目录已被 `.gitignore` 忽略，不会提交到仓库。

### 11.5 新注册账号无法登录

这是正常流程。新注册账号默认是 `PENDING`，必须由管理员在账号申请页审批通过后才能登录。

## 12. 更新本地代码

如果团队成员已经推送了新代码，本地更新：

```powershell
git status
git pull origin main
npm.cmd install --legacy-peer-deps
npm.cmd run db:migrate
npm.cmd run team-demo:dev
```

如果本地有未提交改动，请先提交或暂存，避免 pull 时冲突。
